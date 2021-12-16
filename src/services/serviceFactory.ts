import { Service } from './Service';
import dbSingleton from '../database/dbSingleton';
import Accommodation from './accommodation/accommodation.service';
import Action from './action/action.service';
import Destination from './destination/destination.service';
import Reservation from './reservation/reservation.service';
import SystemActionLog from './systemActionLog/systemActionLog.service';
import Tier from './tier/tier.service';
import UserAddress from './userAddress/userAddress.service';
import UserPoint from './userPoint/userPoint.service';
import User from './user/user.service';
import UserBusiness from './userBusiness/userBusiness.service';
import Media from './media/media.service';
import Email from './email/email.service';
import Company from './company/company.service';
import Payment from './payment/payment.service';
import Feature from './feature/feature.service';
import Package from './packages/packages.service';
import Reward from './reward/reward.service';
import Vendor from './vendor/vendor.service';
import redisClient from '../integrations/redis/client';
import DestinationSystemProvider from '../integrations/destinationSystem/destinationSystemProvider';
import SabreDestinationSystem from '../integrations/destinationSystem/sabre/sabre.destinationSystem';
import ReservationSystemProvider from '../integrations/reservationSystem/reservationSystemProvider';
import SabreReservationSystem from '../integrations/reservationSystem/sabre/sabre.reservationSystem';
import Campaign from './campaign/campaign.service';
import TriggerService from './trigger/trigger.service';
import AdyenPayment from '../integrations/paymentSystem/adyen/adyenPayment';
import PaymentSystemProvider from '../integrations/paymentSystem/PaymentSystemProvider';
import OffsiteLoyaltySystemProvider from '../integrations/offsiteLoyaltySystem/OffsiteLoyaltySystemProvider';
import FidelOffsiteLoyalty from '../integrations/offsiteLoyaltySystem/fidel/FidelOffsiteLoyalty';
import BrandService from './brand/brand.service';
import TransactionService from './transaction/transaction.service';
import ReviewService from './review/review.service';
import SpreedlyVault from '../integrations/vaultSystem/spreedly/spreedlyVault';
import VaultSystemProvider from '../integrations/vaultSystem/vaultSystemProvider';
import RegionService from './region/region.service';
import OrdersService from './order/orders.service';
import UserCompletedCampaignService from './userCompletedCampaign/userCompletedCampaign.service';
import ExperienceService from './experience/experience.service';
import MailGun from '../integrations/email/implementations/mailgun';
import EmailSystemProvider from '../integrations/email/emailSystemProvider';
import Nodemailer from '../integrations/email/implementations/nodemailer';
import Config from '../utils/config';
import IEmailSystem from '../integrations/email/IEmailSystem';

export type ServiceName =
	| 'AccommodationService'
	| 'ActionService'
	| 'BrandService'
	| 'CampaignService'
	| 'CompanyService'
	| 'DestinationService'
	| 'EmailService'
	| 'ExperienceService'
	| 'FeatureService'
	| 'UserService'
	| 'MediaService'
	| 'OrdersService'
	| 'PackageService'
	| 'PaymentService'
	| 'RegionService'
	| 'ReservationService'
	| 'SystemActionLogService'
	| 'TierService'
	| 'TriggerService'
	| 'TransactionService'
	| 'UserAddressService'
	| 'UserBusinessService'
	| 'UserCompletedCampaignService'
	| 'UserPointService'
	| 'ReviewService'
	| 'RewardService'
	| 'VendorService';

export type ServiceMap = {
	[key in ServiceName]: Service;
};

class ServiceFactory {
	private services: ServiceMap = {} as ServiceMap;

	create() {
		const destinationSystemProvider = this.createDestinationSystemProvider();
		const reservationSystemProvider = this.createReservationSystemProvider();
		const vaultSystemProvider = this.createVaultSystemProvider(reservationSystemProvider);
		const offsiteLoyaltySystemProvider = this.createOffsiteLoyaltySystemProvider();
		const emailSystemProvider = this.createEmailSystemProvider();

		this.services['CompanyService'] = new Company(
			dbSingleton.get().company,
			dbSingleton.get().companyVariables,
			redisClient
		);
		this.services['CampaignService'] = new Campaign(dbSingleton.get().campaign, dbSingleton.get().campaignAction);
		this.services['UserCompletedCampaignService'] = new UserCompletedCampaignService(
			dbSingleton.get().userCompletedCampaign
		);
		this.services['OrdersService'] = new OrdersService(dbSingleton.get().orders);
		this.services['MediaService'] = new Media();
		this.services['EmailService'] = new Email(
			dbSingleton.get().emailLog,
			dbSingleton.get().emailTemplate,
			emailSystemProvider
		);
		this.services['TierService'] = new Tier(
			dbSingleton.get().tier,
			dbSingleton.get().tierFeature,
			dbSingleton.get().tierMultiplier
		);
		this.services['UserService'] = new User(
			dbSingleton.get().user,
			dbSingleton.get().userAddress,
			dbSingleton.get().userPermission,
			dbSingleton.get().userCompletedCampaign,
			redisClient,
			dbSingleton.get().userAction
		);
		this.services['UserBusinessService'] = new UserBusiness(dbSingleton.get().userBusiness);
		this.services['UserPointService'] = new UserPoint(
			dbSingleton.get().userPoint,
			dbSingleton.get().user,
			dbSingleton.get().userPointAllocationRecord
		);
		this.services['AccommodationService'] = new Accommodation(
			destinationSystemProvider,
			redisClient,
			dbSingleton.get().accommodation,
			dbSingleton.get().accommodationType,
			dbSingleton.get().accommodationCategory,
			dbSingleton.get().accommodationLayout,
			dbSingleton.get().accommodationLayoutRoom,
			dbSingleton.get().amenity
		);
		this.services['ActionService'] = new Action(dbSingleton.get().action);
		this.services['BrandService'] = new BrandService(
			dbSingleton.get().brand,
			offsiteLoyaltySystemProvider,
			dbSingleton.get().serviceKey,
			dbSingleton.get().brandLocation
		);

		this.services['DestinationService'] = new Destination(
			dbSingleton.get().destination,
			destinationSystemProvider,
			redisClient
		);
		this.services['ExperienceService'] = new ExperienceService(
			dbSingleton.get().experience,
			dbSingleton.get().destinationExperience
		);
		this.services['FeatureService'] = new Feature(dbSingleton.get().feature);
		this.services['PaymentService'] = new Payment(
			vaultSystemProvider,
			offsiteLoyaltySystemProvider,
			dbSingleton.get().company,
			dbSingleton.get().userPaymentMethod,
			dbSingleton.get().serviceKey
		);
		this.services['PackageService'] = new Package(
			dbSingleton.get().upsellPackage,
			redisClient,
			reservationSystemProvider
		);
		this.services['UserAddressService'] = new UserAddress(dbSingleton.get().userAddress);
		this.services['RegionService'] = new RegionService(dbSingleton.get().region);
		this.services['ReservationService'] = new Reservation(
			dbSingleton.get().reservation,
			dbSingleton.get().destination,
			dbSingleton.get().accommodation,
			dbSingleton.get().upsellPackage,
			dbSingleton.get().rate,
			dbSingleton.get().user,
			dbSingleton.get().userPaymentMethod,
			dbSingleton.get().company,
			redisClient,
			reservationSystemProvider,
			vaultSystemProvider
		);
		this.services['SystemActionLogService'] = new SystemActionLog();

		this.services['TriggerService'] = new TriggerService();
		this.services['TransactionService'] = new TransactionService();
		this.services['VendorService'] = new Vendor(dbSingleton.get().vendor);
		this.services['ReviewService'] = new ReviewService(
			dbSingleton.get().review,
			dbSingleton.get().destination,
			dbSingleton.get().user,
			dbSingleton.get().reservation
		);
		this.services['RewardService'] = new Reward(
			dbSingleton.get().reward,
			dbSingleton.get().rewardCategory,
			dbSingleton.get().rewardCategoryMap,
			dbSingleton.get().rewardVoucher
		);
		for (let key in this.services) {
			this.services[key].start(this.services);
		}
	}

	private createDestinationSystemProvider(): DestinationSystemProvider {
		const destinationSystems = {
			sabre: new SabreDestinationSystem(
				dbSingleton.get().accommodation,
				dbSingleton.get().accommodationType,
				dbSingleton.get().destination,
				dbSingleton.get().destinationPolicy,
				dbSingleton.get().destinationTax
			)
		};
		return new DestinationSystemProvider(dbSingleton.get().serviceKey, destinationSystems);
	}

	private createReservationSystemProvider(): ReservationSystemProvider {
		const reservationSystems = {
			sabre: new SabreReservationSystem(
				dbSingleton.get().reservation,
				dbSingleton.get().accommodation,
				dbSingleton.get().destination,
				dbSingleton.get().destinationTax,
				dbSingleton.get().upsellPackage,
				dbSingleton.get().rate,
				redisClient
			)
		};
		return new ReservationSystemProvider(dbSingleton.get().serviceKey, reservationSystems);
	}

	private createPaymentSystemProvider() {
		const paymentSystems = {
			adyen: new AdyenPayment(),
			mock: null
		};
		return new PaymentSystemProvider(dbSingleton.get().serviceKey, paymentSystems);
	}

	private createVaultSystemProvider(reservationSystemProvider: ReservationSystemProvider) {
		const vaultSystems = {
			spreedly: new SpreedlyVault(
				dbSingleton.get().userAddress,
				dbSingleton.get().company,
				dbSingleton.get().userPaymentMethod,
				reservationSystemProvider
			)
		};
		return new VaultSystemProvider(dbSingleton.get().serviceKey, vaultSystems);
	}

	private createOffsiteLoyaltySystemProvider() {
		const offsiteLoyaltySystems = {
			fidel: new FidelOffsiteLoyalty(dbSingleton.get().userPaymentMethod)
		};
		return new OffsiteLoyaltySystemProvider(dbSingleton.get().serviceKey, offsiteLoyaltySystems);
	}

	private createEmailSystemProvider() {
		const availableEmailSystems: Partial<Record<Model.EmailSystems, IEmailSystem>> = {};
		Config.smtp.forEach((mailConfig) => {
			availableEmailSystems[mailConfig.serviceName] = new Nodemailer(mailConfig);
		});
		availableEmailSystems.mailgun = new MailGun(Config.mailgun);
		return new EmailSystemProvider(availableEmailSystems);
	}

	get<T extends Service>(name: ServiceName): T {
		return this.services[name] as T;
	}
}

let serviceFactory = new ServiceFactory();
export default serviceFactory;
