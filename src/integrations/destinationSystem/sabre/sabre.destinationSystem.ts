import DestinationSystem, { ExternalToLocalDestinationIdMap } from '../destinationSystem';
import { DateUtils, ObjectUtils, StringUtils } from '../../../utils/utils';
import Sabre from '../../sabre/Sabre';
import { ISabre } from '../../sabre/Sabre.interface';
import IAccommodationTable from '../../../database/interfaces/IAccommodationTable';
import IAccommodationTypeTable from '../../../database/interfaces/IAccommodationTypeTable';
import IDestinationTable from '../../../database/interfaces/IDestinationTable';
import IDestinationPolicyTable from '../../../database/interfaces/IDestinationPolicyTable';
import IDestinationTaxTable from '../../../database/interfaces/IDestinationTaxTable';
import { ServiceKeyAndDetails } from '../../../database/interfaces/IServiceKeyTable';
import IUpsellPackageTable from '../../../database/interfaces/IUpsellPackageTable';

const AttributeToPolicyMap: Record<string, Model.DestinationPolicyType> = {
	'Check-In Time': 'CheckIn',
	'Check-Out Time': 'CheckOut',
	'Cancellation Policy': 'Cancellation',
	'Guarantee Policy': 'Guarantee'
};

interface LocalDestinationAddress {
	address1: string;
	address2?: string;
	city: string;
	state: string;
	zip: string;
	country: string;
	latitude?: number;
	longitude?: number;
}

export default class SabreDestinationSystem extends DestinationSystem {
	constructor(
		private readonly accommodationTable: IAccommodationTable,
		private readonly accommodationTypeTable: IAccommodationTypeTable,
		private readonly destinationTable: IDestinationTable,
		private readonly destinationPolicyTable: IDestinationPolicyTable,
		private readonly destinationTaxTable: IDestinationTaxTable
	) {
		super();
	}

	private getConnectorAndDetails(companyDetails) {
		let serviceDetails: ISabre.DestinationServiceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
		let connector = new Sabre(serviceDetails);
		return { connector, serviceDetails };
	}

	async getAccommodationList(companyDetails: RedSky.IntegrationCompanyDetails) {
		const { connector } = this.getConnectorAndDetails(companyDetails);
		//ToDo: Need to add in search query string
		const availableSabreHotels = await connector.getHotelAvailability('');
		return availableSabreHotels;
	}

	async getAccommodationTypes(companyDetails: RedSky.IntegrationCompanyDetails, hotelId: string) {
		const { connector } = this.getConnectorAndDetails(companyDetails);
		const sabreAccommodationTypes: ISabre.AccommodationType.Res.ForHotel = await connector.getRoomTypesForHotel(
			hotelId
		);
		return sabreAccommodationTypes;
	}

	async getDestinationList(companyDetails: RedSky.IntegrationCompanyDetails): Promise<ISabre.Model.Destination[]> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(companyDetails);
		const availableHotels = [];
		for (let chainId of serviceDetails.chainIds) {
			const availableSabreHotels: ISabre.Destination.Res.HotelList = await connector.getHotelList(chainId);
			for (let hotel of availableSabreHotels?.hotelList) {
				availableHotels.push(hotel);
			}
		}
		return availableHotels;
	}

	async syncDestinationList(companyDetails: RedSky.IntegrationCompanyDetails) {
		const availableHotels: ISabre.Model.Destination[] = await this.getDestinationList(companyDetails);
		const formattedDestinations = SabreDestinationSystem.formatSabreToLocalDestinations(
			companyDetails.id,
			availableHotels
		);
		const destinationIds = await this.writeDestinationToLocalDb(companyDetails.id, formattedDestinations);
		const formattedPolicies = SabreDestinationSystem.formatSabreAttributesToLocalPolicies(
			companyDetails.id,
			availableHotels,
			destinationIds
		);
		if (!!formattedPolicies.length) {
			await this.writePoliciesToLocalDb(companyDetails.id, formattedPolicies);
		}
		await this.syncDestinationTaxes(companyDetails, destinationIds);
		return destinationIds;
	}

	async syncAccommodationTypes(
		companyDetails: RedSky.IntegrationCompanyDetails,
		localDestination: Model.Destination
	) {
		const { connector } = this.getConnectorAndDetails(companyDetails);
		const sabreAccommodationTypes: ISabre.AccommodationType.Res.ForHotel = await connector.getRoomTypesForHotel(
			localDestination.externalSystemId
		);
		const localDestinationAccommodationTypes: Model.AccommodationType[] = await this.accommodationTypeTable.getAllForDestination(
			localDestination.id,
			companyDetails.id
		);
		for (let type of sabreAccommodationTypes.roomTypes) {
			const localAccommodation: boolean | Model.AccommodationType = this.doesAccommodationTypeExist(
				type,
				localDestinationAccommodationTypes
			);
			if (!localAccommodation) await this.createAccommodationType(localDestination, type);
			else
				await this.updateAccommodationType(
					localAccommodation as Model.AccommodationType,
					type,
					companyDetails.id
				);
		}
		return sabreAccommodationTypes.roomTypes;
	}

	async syncAccommodationList(
		companyDetails: RedSky.IntegrationCompanyDetails
	): Promise<ISabre.Accommodation.Res.SyncSabreAccommodationList> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(companyDetails);
		const localDestinations: Model.Destination[] = await this.destinationTable.getForCompany(companyDetails.id);
		const sabreRoomList: ISabre.Accommodation.Res.SyncSabreAccommodationList = {};
		for (let chainId of serviceDetails.chainIds) {
			// Once we get more than 1 hotel in Sabre, we can test this and see if we can refactor and pass through more than 1 hotel
			for (let localDestination of localDestinations) {
				const sabreAccommodations: ISabre.Accommodation.Res.ForHotel = await connector.getRoomsForHotel(
					chainId,
					localDestination.externalSystemId
				);
				sabreRoomList[localDestination.id] = sabreAccommodations.roomList;
			}
		}
		await this.createOrUpdateAccommodations(companyDetails.id, sabreRoomList);
		return sabreRoomList;
	}

	async destinationSearch(
		companyDetails: RedSky.IntegrationCompanyDetails,
		searchDetails: ISabre.Destination.Req.AccommodationSearch
	) {
		const { connector } = this.getConnectorAndDetails(companyDetails);
	}

	async getHotelById(companyDetails: RedSky.IntegrationCompanyDetails, hotelId: number) {
		const { connector } = this.getConnectorAndDetails(companyDetails);
		return await connector.getHotelById(hotelId);
	}

	private async syncDestinationTaxes(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationIdMap: ExternalToLocalDestinationIdMap
	): Promise<void> {
		const taxes = await this.getTaxesForDestinations(companyDetails, destinationIdMap);
		await this.processTaxes(companyDetails.id, taxes);
	}

	private async writePoliciesToLocalDb(
		companyId: number,
		formattedPolicies: Model.DestinationPolicy[]
	): Promise<void> {
		const localPolicies = await this.destinationPolicyTable.getForCompany(companyId);
		const policiesToCreate = SabreDestinationSystem.getPoliciesToCreate(formattedPolicies, localPolicies);
		const policiesToUpdate = SabreDestinationSystem.getPoliciesToUpdate(formattedPolicies, localPolicies);
		const policiesToDelete = SabreDestinationSystem.getPoliciesToDelete(formattedPolicies, localPolicies);
		for (let policy of policiesToCreate) {
			await this.destinationPolicyTable.create(policy, companyId);
		}
		for (let policy of policiesToUpdate) {
			await this.destinationPolicyTable.updatePolicy(policy);
		}
		for (let policy of policiesToDelete) {
			await this.destinationPolicyTable.deletePolicy(policy);
		}
	}

	private async writeDestinationToLocalDb(
		companyId: number,
		formattedDestinations: Partial<Model.Destination>[]
	): Promise<ExternalToLocalDestinationIdMap> {
		const localDestinations: Model.Destination[] = await this.destinationTable.getForCompany(companyId);
		const newDestinations = this.getNewDestinations(localDestinations, formattedDestinations);
		const destinationsToUpdate = this.getDestinationsToUpdate(localDestinations, formattedDestinations);
		const destinationIds: ExternalToLocalDestinationIdMap = {};
		for (let destination of newDestinations) {
			const insertedDestination = await this.destinationTable.create(destination);
			destinationIds[destination.externalSystemId] = insertedDestination.id;
		}
		for (let destination of destinationsToUpdate) {
			await this.destinationTable.update(destination.id, destination, companyId);
			destinationIds[destination.externalSystemId] = destination.id;
		}
		return destinationIds;
	}

	private async createAccommodationType(localDestination: Model.Destination, type: ISabre.Model.AccommodationType) {
		const objToCreate = {
			companyId: localDestination.companyId,
			destinationId: localDestination.id,
			code: type.code,
			name: StringUtils.removeLineEndings(type.name),
			isActive: type.isActive === 'False' ? 0 : 1,
			type: 'HOTEL',
			metaData: JSON.stringify(type),
			externalSystemId: type.code
		};
		await this.accommodationTypeTable.create(objToCreate);
	}

	private async updateAccommodationType(
		localAccommodation: Model.AccommodationType,
		type: ISabre.Model.AccommodationType,
		companyId: number
	) {
		const objToCreate = {
			name: type.name,
			isActive: type.isActive === 'False' ? 0 : 1,
			type: 'HOTEL',
			metaData: JSON.stringify(type),
			modifiedOn: DateUtils.dbNow()
		};
		await this.accommodationTypeTable.update(localAccommodation.id, objToCreate, companyId);
	}

	private async createOrUpdateAccommodations(
		companyId: number,
		sabreRoomList: ISabre.Accommodation.Res.SyncSabreAccommodationList
	) {
		const localAccommodations: Model.Accommodation[] = await this.accommodationTable.allForCompany(companyId);
		const localAccommodationTypes: Model.AccommodationType[] = await this.accommodationTypeTable.forCompany(
			companyId
		);
		for (let i in sabreRoomList) {
			for (let sabreRoom of sabreRoomList[i]) {
				const localAccommodationToUpdate: boolean | Model.Accommodation = this.getLocalAccommodationByCode(
					localAccommodations,
					sabreRoom.Code
				);
				if (!localAccommodationToUpdate) {
					const formattedAccommodationToCreate = this.formatSabreToLocalAccommodationCreate(
						companyId,
						(i as unknown) as number,
						sabreRoom,
						localAccommodationTypes
					);
					await this.accommodationTable.create(formattedAccommodationToCreate);
					continue;
				}
				await this.formattedAndUpdateAccommodation(localAccommodationToUpdate, sabreRoom);
			}
		}
	}

	private async getTaxesForDestinations(
		companyDetails: ServiceKeyAndDetails,
		destinationIdMap: ExternalToLocalDestinationIdMap
	) {
		const { connector } = this.getConnectorAndDetails(companyDetails);
		const taxes: Model.DestinationTax[] = [];
		for (let sabreId in destinationIdMap) {
			const destinationTaxes = await connector.getDestinationTaxes(sabreId);
			const dedupedTaxes = ObjectUtils.dedupe(destinationTaxes.Taxes, 'Code');
			for (let tax of dedupedTaxes) {
				taxes.push({
					code: tax.Code,
					name: tax.Name,
					destinationId: destinationIdMap[sabreId],
					companyId: companyDetails.id
				});
			}
		}
		return taxes;
	}

	private async processTaxes(companyId: number, sabreTaxes: Model.DestinationTax[]): Promise<void> {
		const spireTaxes: Model.DestinationTax[] = await this.destinationTaxTable.getForCompany(companyId);
		const taxesToDelete = spireTaxes.filter(
			(tax) =>
				!sabreTaxes.some(
					(t) => t.destinationId === tax.destinationId && StringUtils.areEqualInsensitive(t.code, tax.code)
				)
		);
		const taxesToUpdate = sabreTaxes.filter((tax) =>
			spireTaxes.some(
				(t) =>
					t.destinationId === tax.destinationId &&
					StringUtils.areEqualInsensitive(t.code, tax.code) &&
					!StringUtils.areEqualInsensitive(t.name, tax.name)
			)
		);
		const taxesToCreate = sabreTaxes.filter(
			(tax) =>
				!spireTaxes.some(
					(t) => t.destinationId === tax.destinationId && StringUtils.areEqualInsensitive(t.code, tax.code)
				)
		);
		await this.destinationTaxTable.deleteTaxes(taxesToDelete, companyId);
		await this.destinationTaxTable.updateTaxes(taxesToUpdate, companyId);
		await this.destinationTaxTable.create(taxesToCreate);
	}

	private async formattedAndUpdateAccommodation(
		localAccommodationToUpdate: Model.Accommodation,
		sabreRoom: ISabre.Model.Room
	) {
		const dataObj = {
			name: sabreRoom.Name || localAccommodationToUpdate.name,
			code: sabreRoom.Code || localAccommodationToUpdate.code,
			shortDescription:
				StringUtils.removeLineEndings(sabreRoom.Details.Description) ||
				StringUtils.removeLineEndings(localAccommodationToUpdate.shortDescription),
			longDescription:
				StringUtils.removeLineEndings(sabreRoom.Details.DetailedDescription) ||
				StringUtils.removeLineEndings(localAccommodationToUpdate.longDescription),
			status: sabreRoom.Active ? 'ACTIVE' : ('INACTIVE' as Model.AccommodationStatusType),
			maxOccupantCount:
				sabreRoom.Details.GuestLimit?.GuestLimitTotal || localAccommodationToUpdate.maxOccupantCount,
			maxSleeps: sabreRoom.Details.GuestLimit?.Value || localAccommodationToUpdate.maxSleeps,
			metaData: JSON.stringify(sabreRoom),
			externalSystemId: sabreRoom.Code,
			roomClass: (sabreRoom.Details.Class?.Description ||
				localAccommodationToUpdate.roomClass) as Model.AccommodationRoomClassType,
			bedDetails: this.formatBedDetails(sabreRoom.Details.Bedding),
			extraBeds: sabreRoom.Details.ExtraBed?.Allowed ? 1 : 0 || 0,
			extraBedPriceCents:
				sabreRoom.Details?.ExtraBed?.Cost * 100 || localAccommodationToUpdate.extraBedPriceCents || 0,
			adaCompliant: this.getAdaCompliance(sabreRoom, localAccommodationToUpdate),
			size: this.formatSize(sabreRoom)
		};
		await this.accommodationTable.updateInternal(localAccommodationToUpdate.id, dataObj);
	}

	private getLocalAccommodationByCode(localAccommodations: Model.Accommodation[], code: string) {
		for (let accommodation of localAccommodations) {
			if (accommodation.code.toLowerCase() === code.toLowerCase()) return accommodation;
		}
		return false;
	}

	private formatSabreToLocalAccommodationCreate(
		companyId: number,
		destinationId: number,
		sabreRoom: ISabre.Model.Room,
		localAccommodationTypes: Model.AccommodationType[]
	) {
		return {
			companyId,
			destinationId,
			accommodationTypeId: this.getAccommodationTypeId(localAccommodationTypes, sabreRoom),
			name: sabreRoom.Name,
			code: sabreRoom.Code,
			shortDescription: StringUtils.removeLineEndings(sabreRoom.Details.Description),
			longDescription: StringUtils.removeLineEndings(sabreRoom.Details.DetailedDescription),
			status: sabreRoom.Active ? 'ACTIVE' : 'INACTIVE',
			managementCompany: 'SABRE',
			maxOccupantCount: sabreRoom.Details.GuestLimit?.GuestLimitTotal,
			maxSleeps: sabreRoom.Details.GuestLimit?.Value,
			metaData: JSON.stringify(sabreRoom),
			externalSystemId: sabreRoom.Code,
			roomClass: sabreRoom.Details.Class?.Description,
			bedDetails: this.formatBedDetails(sabreRoom.Details.Bedding),
			extraBeds: sabreRoom.Details.ExtraBed?.Allowed ? 1 : 0 || 0,
			extraBedPriceCents: sabreRoom.Details?.ExtraBed?.Cost * 100 || 0,
			adaCompliant: this.getAdaCompliance(sabreRoom),
			size: this.formatSize(sabreRoom)
		};
	}

	private getAccommodationTypeId(localAccommodationTypes: Model.AccommodationType[], sabreRoom: ISabre.Model.Room) {
		for (let type of localAccommodationTypes) {
			if (sabreRoom.Code.toLowerCase() === type.code.toLowerCase()) return type.id;
		}
	}

	private formatBedDetails(sabreBeddingDetails: ISabre.Model.Bedding[]): Model.AccommodationBedDetails[] {
		const formattedBedding = [];
		for (let details of sabreBeddingDetails) {
			formattedBedding.push({
				type: details.Type,
				isPrimary: details.IsPrimary ? 1 : 0,
				qty: details.Quantity,
				description: StringUtils.removeLineEndings(details.Description)
			});
		}
		return formattedBedding;
	}

	private getNewDestinations(
		localDestinations: Model.Destination[],
		formattedDestinations: Partial<Model.Destination>[]
	): Partial<Model.Destination>[] {
		return formattedDestinations.filter((destination) => {
			for (let local of localDestinations) {
				if (local.externalSystemId === destination.externalSystemId) return;
			}
			return destination;
		});
	}

	private getDestinationsToUpdate(
		localDestinations: Model.Destination[],
		formattedDestinations: Partial<Model.Destination>[]
	): Partial<Model.Destination>[] {
		const updatedDestinations = [];
		for (let local of localDestinations) {
			let formattedDestination = formattedDestinations.filter((destination) => {
				return local.code === destination.code;
			})[0];
			if (local?.description) formattedDestination.description = StringUtils.removeLineEndings(local.description);
			updatedDestinations.push({ ...formattedDestination, id: local.id });
		}
		return updatedDestinations;
	}

	private doesAccommodationTypeExist(
		type: ISabre.Model.AccommodationType,
		localAccommodationTypes: Model.AccommodationType[]
	): boolean | Model.AccommodationType {
		for (let localType of localAccommodationTypes) {
			if (localType.code === type.code) return localType;
		}
		return false;
	}

	private formatSize(sabreRoom: ISabre.Model.Room): string {
		if (!('Size' in sabreRoom.Details)) return null;
		const accommodationSize = {};
		for (let index in sabreRoom.Details.Size) {
			accommodationSize[index.toLowerCase()] = sabreRoom.Details.Size[index];
		}
		return JSON.stringify(accommodationSize);
	}

	private static formatSabreToLocalDestinations(
		companyId: number,
		availableHotels: ISabre.Model.Destination[]
	): Partial<Model.Destination>[] {
		return availableHotels.map((hotel) => {
			return {
				companyId,
				name: StringUtils.removeLineEndings(hotel.Name),
				description: ObjectUtils.isArrayWithData(hotel.Descriptions)
					? StringUtils.removeLineEndings(hotel.Descriptions[0]?.Description)
					: null,
				code: hotel.Code,
				status: hotel.Status,
				chainId: hotel.ChainList.find((c) => c.Primary)?.ID,
				metaData: JSON.stringify(hotel),
				externalSystemId: hotel.ID,
				modifiedOn: DateUtils.dbNow(),
				...SabreDestinationSystem.getHotelLocationDetails(hotel)
			};
		});
	}

	private static getPoliciesToCreate(
		formattedPolicies: Model.DestinationPolicy[],
		localPolicies: Model.DestinationPolicy[]
	): Model.DestinationPolicy[] {
		return formattedPolicies.filter((formatted) => {
			return !localPolicies.some(
				(local) =>
					formatted.companyId === local.companyId &&
					formatted.destinationId === local.destinationId &&
					formatted.policyType === local.policyType
			);
		});
	}

	private static getPoliciesToUpdate(
		formattedPolicies: Model.DestinationPolicy[],
		localPolicies: Model.DestinationPolicy[]
	): Model.DestinationPolicy[] {
		return formattedPolicies.filter((formatted) => {
			return localPolicies.some(
				(local) =>
					formatted.companyId === local.companyId &&
					formatted.destinationId === local.destinationId &&
					formatted.policyType === local.policyType &&
					formatted.value != local.value
			);
		});
	}

	private static getPoliciesToDelete(
		formattedPolicies: Model.DestinationPolicy[],
		localPolicies: Model.DestinationPolicy[]
	): Model.DestinationPolicy[] {
		return localPolicies.filter((local) => {
			return !!!formattedPolicies.some(
				(formatted) =>
					formatted.companyId === local.companyId &&
					formatted.destinationId === local.destinationId &&
					formatted.policyType === local.policyType
			);
		});
	}

	private static formatSabreAttributesToLocalPolicies(
		companyId: number,
		sabreDestinations: ISabre.Model.Destination[],
		destinationIds: ExternalToLocalDestinationIdMap
	): Model.DestinationPolicy[] {
		const policies = sabreDestinations.reduce(function (
			accumulator: Model.DestinationPolicy[],
			destination: ISabre.Model.Destination
		): Model.DestinationPolicy[] {
			const applicableAttributes = destination.Attributes.filter(
				(a) => a.Category === 'LocalPolicies' && !!AttributeToPolicyMap[a.Name]
			);
			const destinationPolicies: Model.DestinationPolicy[] = applicableAttributes.map(function (
				a
			): Model.DestinationPolicy {
				return {
					destinationId: destinationIds[destination.ID],
					companyId,
					policyType: AttributeToPolicyMap[a.Name],
					value: a.Value,
					modifiedOn: null
				};
			});
			return accumulator.concat(destinationPolicies);
		},
		[]);
		return policies;
	}

	private static getHotelLocationDetails(hotel: ISabre.Model.Destination): LocalDestinationAddress {
		const address: LocalDestinationAddress = {
			address1: ObjectUtils.isArrayWithData(hotel?.Location.Address.AddressLine)
				? hotel?.Location?.Address?.AddressLine.shift()
				: '',
			address2: ObjectUtils.isArrayWithData(hotel?.Location.Address.AddressLine)
				? hotel?.Location?.Address?.AddressLine.join(' ')
				: '',
			city: hotel?.Location?.Address?.City || '',
			state: hotel?.Location?.Address?.StateProv?.Code || '',
			zip: hotel?.Location?.Address?.PostalCode || '',
			country: hotel?.Location?.Address?.CountryName?.Code || ''
		};
		if (hotel.Location.Latitude) address.latitude = hotel.Location.Latitude;
		if (hotel.Location.Longitude) address.longitude = hotel.Location.Longitude;
		return address;
	}

	private getAdaCompliance(sabreRoom: ISabre.Model.Room, localAccommodationToUpdate?: Model.Accommodation): 0 | 1 {
		if ('AdaCompliant' in sabreRoom.Details) {
			return sabreRoom.Details.AdaCompliant ? 1 : 0;
		} else if ('AdaComplaint' in sabreRoom.Details) {
			return sabreRoom.Details.AdaComplaint ? 1 : 0;
		} else if (localAccommodationToUpdate) {
			return localAccommodationToUpdate.adaCompliant;
		} else return 0;
	}
}
