import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import cronTaskList from '../cronTaskList';
import TierService from '../../services/tier/tier.service';
import serviceFactory from '../../services/serviceFactory';
import CompanyService from '../../services/company/company.service';
import UserService from '../../services/user/user.service';
import { UsersTierPoints } from '../../database/interfaces/IUserTable';
import { DateUtils, ObjectUtils } from '../../utils/utils';

const TASK_NAME = AgendaJobNames.SPIRE_USER_TIER_SYNC;

export default class SpireUserTierSync extends CronTask {
	companyService: CompanyService;
	tierService: TierService;
	userService: UserService;
	constructor() {
		super();

		this.companyService = serviceFactory.get<CompanyService>('CompanyService');
		this.tierService = serviceFactory.get<TierService>('TierService');
		this.userService = serviceFactory.get<UserService>('UserService');

		agendaJs.define(AgendaJobNames.SPIRE_USER_TIER_SYNC, this.runJob);
		agendaJs.every(AgendaIntervals['NIGHTLY'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		const tiers: Model.Tier[] = await this.tierService.getAll();
		if (!ObjectUtils.isArrayWithData(tiers)) return;
		const userTierPoints: UsersTierPoints[] = await this.userService.getUsersTierPoints();
		for (let userTierPoint of userTierPoints) {
			const usersTierPlacementId = this.getUsersTierPlacement(tiers, userTierPoint);
			if (usersTierPlacementId === userTierPoint.userTierId) continue;
			logger.info(`user ${userTierPoint.userId} is being placed in Tier ${usersTierPlacementId}`, {
				user: userTierPoint.userId,
				tierId: usersTierPlacementId
			});
			const tierExpiration = this.getSelectedTierExpirationDate(usersTierPlacementId, tiers);
			await this.userService.updateUserTier({
				userId: userTierPoint.userId,
				tierId: usersTierPlacementId,
				expiresOn: tierExpiration
			});
		}
		this.endTaskTimer();
	}

	private getUsersTierPlacement(companyTiers: Model.Tier[], user: UsersTierPoints): number {
		const lifeTimeTier: Model.Tier = this.getLifeTimeTier(companyTiers, user);
		const annualTier: Model.Tier = this.getAnnualTier(companyTiers, user);
		if (annualTier && annualTier.threshold > lifeTimeTier.threshold) return annualTier.id;
		if (!lifeTimeTier) return annualTier.id;
		return lifeTimeTier.id;
	}

	private getSelectedTierExpirationDate(userTierPlacementId: number, companyTiers: Model.Tier[]): string | null {
		for (let tier of companyTiers) {
			if (tier.id !== userTierPlacementId) continue;
			if (!tier.isAnnualRate) return null;
			const today = new Date();
			const yearExpiration = today.getUTCFullYear() + 2;
			return DateUtils.clientToServerDateTime(new Date(`${yearExpiration}-01-01`));
		}
		return null;
	}

	private getLifeTimeTier(companyTiers: Model.Tier[], user: UsersTierPoints): Model.Tier {
		let highestLifeTimeTier: Model.Tier;
		const lifeTimeTiers = companyTiers.filter((tier) => {
			return !tier.isAnnualRate && tier.isActive;
		});
		for (let tier of lifeTimeTiers) {
			if (
				(!highestLifeTimeTier || highestLifeTimeTier.threshold <= tier.threshold) &&
				user.lifeTimePoints >= tier.threshold
			)
				highestLifeTimeTier = tier;
		}
		return highestLifeTimeTier;
	}

	private getAnnualTier(companyTiers: Model.Tier[], user: UsersTierPoints): Model.Tier {
		let highestAnnualTier: Model.Tier;
		const annualTiers = companyTiers.filter((tier) => {
			return tier.isAnnualRate && tier.isActive;
		});
		const usersValidAnnualPoints = this.getUsersValidAnnualPoints(user);
		for (let tier of annualTiers) {
			if (
				(!highestAnnualTier || highestAnnualTier.threshold <= tier.threshold) &&
				usersValidAnnualPoints >= tier.threshold
			)
				highestAnnualTier = tier;
		}
		return highestAnnualTier;
	}

	private getUsersValidAnnualPoints(user: UsersTierPoints): number {
		const beginningOfCurrentYear = new Date(`${new Date().getUTCFullYear()}-01-01`);
		const invalidPointsStatus = ['PENDING', 'REVOKED', 'REDEEMED'];
		let usersValidAnnualPoints = 0;
		for (let userPoints of user.points) {
			let pointModifiedDate = new Date(userPoints.modifiedOn);
			if (invalidPointsStatus.includes(userPoints.status)) continue; // Don't include invalid point status
			if (pointModifiedDate.getTime() < beginningOfCurrentYear.getTime()) continue; // Don't include points from the previous year
			usersValidAnnualPoints += userPoints.pointAmount;
		}
		return usersValidAnnualPoints;
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
