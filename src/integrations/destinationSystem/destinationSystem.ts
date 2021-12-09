export default abstract class DestinationSystem {
	constructor() {}
	abstract getAccommodationList(companyDetails: RedSky.IntegrationCompanyDetails): Promise<any>;
	abstract getDestinationList(companyDetails: RedSky.IntegrationCompanyDetails): Promise<any>;
	abstract syncDestinationList(
		companyDetails: RedSky.IntegrationCompanyDetails
	): Promise<ExternalToLocalDestinationIdMap>;
	abstract syncAccommodationTypes(
		companyDetails: RedSky.IntegrationCompanyDetails,
		localDestination: Model.Destination
	): Promise<any>;
	abstract syncAccommodationList(
		companyDetails: RedSky.IntegrationCompanyDetails,
		localDestination: Model.Destination
	): Promise<any>;
}

export type ExternalToLocalDestinationIdMap = {
	[key: string]: number;
};
