import chai from 'chai';
import { ObjectUtils } from '../../../utils/utils';
import ReservationSystemProvider from '../../../integrations/reservationSystem/reservationSystemProvider';
import { ISabre } from '../../../integrations/sabre/Sabre.interface';
import Sabre from '../../../integrations/sabre/Sabre';
import sabreResource from '../../resources/sabre.integration.resource';
import dbSingleton from '../../../database/dbSingleton';
import SabreReservationSystem from '../../../integrations/reservationSystem/sabre/sabre.reservationSystem';
import DestinationTableMock from '../../../database/mocks/destination.db.mock';
import AccommodationTableMock from '../../../database/mocks/accommodation.db.mock';
import DestinationTaxTableMock from '../../../database/mocks/destinationTax.db.mock';
import ReservationTableMock from '../../../database/mocks/reservation.db.mock';
import UserPaymentMethodTableMock from '../../../database/mocks/userPaymentMethod.db.mock';
import UserAddressTableMock from '../../../database/mocks/userAddress.db.mock';
import UpsellPackageTableMock from '../../../database/mocks/upsellPackage.db.mock';
import RedisClientMock from '../../../integrations/redis/redisClientMock';
import RateTableMock from '../../../database/mocks/rate.db.mock';

describe('Sabre Authentication Integration', function () {
	let provider: ReservationSystemProvider;
	let sabreSystem: SabreReservationSystem;

	function initialize() {
		const destinationTable = new DestinationTableMock([], new AccommodationTableMock([]));
		const accommodationTable = new AccommodationTableMock([]);
		const paymentMethodTable = new UserPaymentMethodTableMock({});
		const addressTable = new UserAddressTableMock();
		const upsellPackageTable = new UpsellPackageTableMock([]);
		const redisClient = new RedisClientMock();
		sabreSystem = new SabreReservationSystem(
			new ReservationTableMock(
				{},
				destinationTable,
				accommodationTable,
				paymentMethodTable,
				addressTable,
				upsellPackageTable
			),
			accommodationTable,
			destinationTable,
			new DestinationTaxTableMock(),
			upsellPackageTable,
			new RateTableMock(),
			redisClient
		);
		provider = new ReservationSystemProvider(dbSingleton.get().serviceKey, {
			sabre: sabreSystem
		});
	}

	before(async function () {});
	describe('Sabre Authentication', function () {
		beforeEach(initialize);
		it('should receive Sabre connector and serviceDetails', async function () {
			const { system, companyDetails } = await provider.get(sabreResource.companyId);
			const { connector, serviceDetails } = system['getConnectorAndDetails'](companyDetails);
			chai.expect(connector).to.exist;
			chai.expect(serviceDetails).to.be.an('object');
			chai.expect(serviceDetails.username).to.exist;
			chai.expect(serviceDetails.password).to.exist;
			chai.expect(serviceDetails.baseUrl).to.exist;
			chai.expect(serviceDetails.apiVersion).to.exist;
		});
		it('should get a Sabre Access token', async function () {
			const { companyDetails } = await provider.get(sabreResource.companyId);
			let serviceDetails: ISabre.ServiceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
			let connector = new Sabre(serviceDetails);
			const sabreAccessToken = await connector['getSabreAccessToken']();
			chai.expect(sabreAccessToken).to.exist;
			chai.expect(sabreAccessToken).to.be.a('string');
		});
		it('should fail to get a Sabre Access Token', async function () {
			const { companyDetails } = await provider.get(sabreResource.companyId);
			let serviceDetails: ISabre.ServiceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
			serviceDetails.username = 'TESTUSERNAME';
			let connector = new Sabre(serviceDetails);
			try {
				await connector['getSabreAccessToken']();
			} catch (e) {
				chai.expect(e.err).to.equal('SERVICE_UNAVAILABLE');
				chai.expect(e.msg).to.include('ERR.SHS-SECUTIL.TOKEN.CREATE.INVALID_USERNAME_OR_PASSWORD');
			}
		});
	});
});
