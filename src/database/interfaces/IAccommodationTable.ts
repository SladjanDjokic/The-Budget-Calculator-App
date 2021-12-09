import ITable from '../ITable';

export default interface IAccommodationTable extends ITable {
	getAvailableByIds(
		availableAccommodationIds: number[],
		propertyTypeIds?: number[],
		bedroomCount?: number,
		bathroomCount?: number
	): Api.Accommodation.Res.Availability[] | PromiseLike<Api.Accommodation.Res.Availability[]>;
	getAccommodationDetails(accommodationId: number, companyId?: number): Promise<Api.Accommodation.Res.Details>;
	allForCompany: (companyId: number) => Promise<Model.Accommodation[]>;
	getById: (accommodationId: number, companyId?: number) => Promise<Model.Accommodation>;
	/**
	 * Update Internal - Only for internal cron process sync (Sabre)
	 * @param accommodationId
	 * @param updateData
	 */
	updateInternal: (accommodationId: number, updateData: Partial<Model.Accommodation>) => Promise<void>;
	forExternalId: (externalId: string, destinationId: number, companyId?: number) => Promise<Model.Accommodation>;
}
