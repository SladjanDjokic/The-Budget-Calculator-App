// sabreRefreshKeys

import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import cronTaskList from '../cronTaskList';
import DestinationService from '../../services/destination/destination.service';
import serviceFactory from '../../services/serviceFactory';
import Company from '../../database/objects/company.db';
import dbSingleton from '../../database/dbSingleton';
import { RedisUtils } from '../../utils/utils';
import ReservationService from '../../services/reservation/reservation.service';
import UpsellPackageService from '../../services/packages/packages.service';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';

const TASK_NAME = 'Destination Refresh Keys Sync';
interface KeyMap {
	[destinationId: number]: number[];
}

export default class DestinationRefreshKeySync extends CronTask {
	destinationService: DestinationService;
	reservationService: ReservationService;
	upsellPackageService: UpsellPackageService;
	companyTable: Company = dbSingleton.get().company;
	constructor() {
		super();

		this.destinationService = serviceFactory.get('DestinationService');
		this.reservationService = serviceFactory.get('ReservationService');
		this.upsellPackageService = serviceFactory.get('PackageService');

		agendaJs.define(AgendaJobNames.DESTINATION_REFRESH_KEYS_SYNC, { priority: 'high' }, this.runJob);
		agendaJs.every(AgendaIntervals['1_HOUR'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		const companies = await this.companyTable.getCompanyIds();
		const currentYear = new Date().getFullYear();
		const currentMonth = new Date().getMonth() + 1;
		let keyIndex = Date.now();
		for (const company of companies) {
			if (!company.id) continue;
			const companyDestinations: Model.Destination[] = await this.destinationService.getForCompany(company.id);
			let companyReservationKeys = (await this.reservationService.getAvailabilityRefreshKeys(company.id)) || {};
			let companyUpsellPackageKeys = (await this.upsellPackageService.getRefreshKeys(company.id)) || {};
			const destinationReservationKeyMap = this.buildKeyMap(companyReservationKeys);
			const destinationUpsellPackageKeyMap = this.buildKeyMap(companyUpsellPackageKeys);
			for (const localDestination of companyDestinations) {
				({ keySet: companyReservationKeys, keyIndex } = DestinationRefreshKeySync.checkKeys(
					companyReservationKeys,
					destinationReservationKeyMap,
					localDestination.id,
					keyIndex,
					currentMonth,
					currentYear
				));
				({ keySet: companyUpsellPackageKeys, keyIndex } = DestinationRefreshKeySync.checkKeys(
					companyUpsellPackageKeys,
					destinationUpsellPackageKeyMap,
					localDestination.id,
					keyIndex,
					currentMonth,
					currentYear
				));
				companyReservationKeys = this.cleanOldKeys(companyReservationKeys);
				companyUpsellPackageKeys = this.cleanOldKeys(companyUpsellPackageKeys);
			}
			await this.reservationService.updateRefreshKeys(company.id, companyReservationKeys);
			await this.upsellPackageService.updateRefreshKeys(company.id, companyUpsellPackageKeys);
		}
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}

	private buildKeyMap(keys: IReservationSystem.RefreshKeySet): KeyMap {
		const keyMap: KeyMap = {};
		for (let i in keys) {
			const reservationKey = keys[i];
			const { destinationId, month } = this.splitKey(reservationKey);
			if (!keyMap[destinationId]) keyMap[destinationId] = [];
			keyMap[destinationId].push(month);
		}
		return keyMap;
	}

	private splitKey(reservationKey: string) {
		const keyList: string[] = reservationKey.split('-');
		const destinationId = parseInt(keyList.shift());
		const month = parseInt(keyList[1]);
		const year = parseInt(keyList[0]);
		return { destinationId, year, month };
	}

	private static checkKeys(
		keySet: IReservationSystem.RefreshKeySet,
		destinationKeyMap: KeyMap,
		destinationId: number,
		keyIndex: number,
		currentMonth: number,
		currentYear: number
	) {
		if (!destinationKeyMap[destinationId]) {
			logger.info(`Create all months for destination: ${destinationId}`);
			for (let i = 1; i <= 12; i++) {
				keyIndex += 1;
				keySet = DestinationRefreshKeySync.updateKey(
					keySet,
					destinationId,
					currentMonth,
					currentYear,
					i,
					keyIndex
				);
			}
		} else {
			for (let i = 1; i <= 12; i++) {
				if (destinationKeyMap[destinationId].includes(i)) continue;
				keyIndex += 1;
				logger.info(`Create destination: ${destinationId} - month: ${i} refreshKey`);
				keySet = DestinationRefreshKeySync.updateKey(
					keySet,
					destinationId,
					currentMonth,
					currentYear,
					i,
					keyIndex
				);
			}
		}
		return { keySet, keyIndex };
	}

	private static updateKey(
		keySet: IReservationSystem.RefreshKeySet,
		destinationId: number,
		currentMonth: number,
		currentYear: number,
		monthMissing: number,
		keyIndex: number
	) {
		if (currentMonth > monthMissing) {
			keySet[keyIndex] = RedisUtils.generateRefreshKey(destinationId, currentYear + 1, monthMissing);
		} else {
			keySet[keyIndex] = RedisUtils.generateRefreshKey(destinationId, currentYear, monthMissing);
		}
		return keySet;
	}

	private cleanOldKeys(keys: IReservationSystem.RefreshKeySet) {
		for (let i in keys) {
			const reservationKey = keys[i];
			const blockArray = reservationKey.split('-');
			const destinationId = parseInt(blockArray.shift());
			const month = parseInt(blockArray[1]);
			const year = parseInt(blockArray[0]);
			if (this.reservationService.isValidReservationDate(month, year)) continue;
			delete keys[i];
		}
		return keys;
	}
}
