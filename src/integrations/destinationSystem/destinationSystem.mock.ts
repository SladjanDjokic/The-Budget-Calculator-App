import DestinationSystem from './destinationSystem';

export default class DestinationSystemMock implements DestinationSystem {
	getAccommodationList(companyDetails: RedSky.IntegrationCompanyDetails): Promise<any> {
		throw new Error('Method not implemented.');
	}
	getDestinationList(companyDetails: RedSky.IntegrationCompanyDetails): Promise<any> {
		throw new Error('Method not implemented.');
	}
	syncDestinationList(companyDetails: RedSky.IntegrationCompanyDetails): Promise<any> {
		throw new Error('Method not implemented.');
	}
	syncAccommodationTypes(
		companyDetails: RedSky.IntegrationCompanyDetails,
		localDestination: Model.Destination
	): Promise<any> {
		throw new Error('Method not implemented.');
	}
	syncAccommodationList(
		companyDetails: RedSky.IntegrationCompanyDetails,
		localDestination: Model.Destination
	): Promise<any> {
		throw new Error('Method not implemented.');
	}
}
