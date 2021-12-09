import chai from 'chai';
import dbSingleton from '../../../database/dbSingleton';
import SabreReservationSystem from '../../../integrations/reservationSystem/sabre/sabre.reservationSystem';
import ReservationSystemProvider from '../../../integrations/reservationSystem/reservationSystemProvider';
import testResource from '../../resources/spreely.sabre.integration.resource';
import redisClient from '../../../integrations/redis/client';
import SpreedlyVault from '../../../integrations/vaultSystem/spreedly/spreedlyVault';
import VaultSystemProvider from '../../../integrations/vaultSystem/vaultSystemProvider';
const expect = chai.expect;

// Setting up a new reservation with a valid payment method for every test run
// is impractical right now. Unskip this to test changes, or if you come up with
// an efficient way to do it regularly.
describe.skip('Spreedly-Sabre Integration', function () {
	describe('Charge reservation', function () {
		let reservation: Api.Reservation.Res.Get;
		let userPaymentMethod: Model.UserPaymentMethod;
		let sabreReservationSystem: SabreReservationSystem;
		let spreedlyVaultSystem: SpreedlyVault;
		let vaultSystemProvider: VaultSystemProvider;
		let cardIsValid: boolean = false;
		before(async () => {
			const idQuery: {
				id: number;
			}[] = await dbSingleton.get().reservation.db.runQuery(
				`SELECT 
					reservation.id AS id
				FROM reservation
					INNER JOIN userPaymentMethod AS payment
						ON reservation.userPaymentMethodId=payment.id
				WHERE reservation.arrivalDate > CURRENT_TIMESTAMP 
					AND payment.systemProvider='spreedly'
					AND LOCATE('"storage_state":"redacted"',payment.metaData) = 0
					AND reservation.companyId=?
				LIMIT 1;`,
				[testResource.companyId]
			);
			expect(idQuery.length, 'No valid reservation to test against').to.equal(1);
			const reservationId = idQuery[0].id;
			reservation = await dbSingleton.get().reservation.getById(reservationId);
			userPaymentMethod = await dbSingleton.get().userPaymentMethod.getById(reservation.paymentMethod.id);
			sabreReservationSystem = new SabreReservationSystem(
				dbSingleton.get().reservation,
				dbSingleton.get().accommodation,
				dbSingleton.get().destination,
				dbSingleton.get().destinationTax,
				dbSingleton.get().upsellPackage,
				dbSingleton.get().rate,
				redisClient
			);
			const reservationSystemProvider = new ReservationSystemProvider(dbSingleton.get().serviceKey, {
				sabre: sabreReservationSystem
			});
			spreedlyVaultSystem = new SpreedlyVault(
				dbSingleton.get().userAddress,
				dbSingleton.get().company,
				dbSingleton.get().userPaymentMethod,
				reservationSystemProvider
			);
			vaultSystemProvider = new VaultSystemProvider(dbSingleton.get().serviceKey, {
				mock: null,
				spreedly: spreedlyVaultSystem
			});
		});
		it('should use valid test data', async function () {
			expect(reservation, 'No reservation to test').to.exist;
			expect(userPaymentMethod, 'No payment method').to.exist;
			const { companyDetails: vaultSystemDetails } = await vaultSystemProvider.get();
			expect(vaultSystemDetails.serviceKey, 'No service key').to.exist;
			cardIsValid = await spreedlyVaultSystem.isPaymentMethodValid(vaultSystemDetails, userPaymentMethod);
			expect(cardIsValid, 'Invalid card').to.be.true;
		});
	});
});
