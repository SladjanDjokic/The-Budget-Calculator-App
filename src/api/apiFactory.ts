import Accommodation from './endpoints/accommodation.api';
import Action from './endpoints/action.api';
import Campaign from './endpoints/campaign.api';
import Company from './endpoints/company.api';
import Country from './endpoints/country.api';
import Customer from './endpoints/customer.api';
import Destination from './endpoints/destination.api';
import Reservation from './endpoints/reservation.api';
import Media from './endpoints/media.api';
import Order from './endpoints/order.api';
import Tier from './endpoints/tier.api';
import UserAddress from './endpoints/userAddress.api';
import UserPoint from './endpoints/userPoint.api';
import User from './endpoints/user.api';
import Reward from './endpoints/reward.api';
import Review from './endpoints/review.api';
import Feature from './endpoints/feature.api';
import Package from './endpoints/package.api';
import Vendor from './endpoints/vendor.api';
import Payment from './endpoints/payment.api';
import Transaction from './endpoints/transaction.api';
import Brand from './endpoints/brand.api';
import Region from './endpoints/region.api';
import Experience from './endpoints/experience.api';

const classes = {
	accommodation: Accommodation,
	action: Action,
	brand: Brand,
	campaign: Campaign,
	company: Company,
	country: Country,
	customer: Customer,
	destination: Destination,
	experience: Experience,
	feature: Feature,
	media: Media,
	region: Region,
	reservation: Reservation,
	order: Order,
	package: Package,
	payment: Payment,
	tier: Tier,
	transaction: Transaction,
	user: User,
	userAddress: UserAddress,
	userPoint: UserPoint,
	reward: Reward,
	review: Review,
	vendor: Vendor
};

export default function apiFactory(name) {
	return classes[name];
}
