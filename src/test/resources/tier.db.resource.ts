import { TierToCreate } from '../../services/tier/tier.service';

const adminUserId = 1;

const tierToCreate: TierToCreate = {
	name: 'TEST TIER',
	threshold: 200
};

export default {
	adminUserId,
	tierToCreate
};
