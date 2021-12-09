import { CreateLayout } from '../../database/objects/accommodationLayout.db';
import { MediaCreate } from '../../services/media/media.service';
import { CreateAccommodationCategory } from '../../database/objects/accommodationCategory.db';
const companyId = 1;
const accommodationId = 1;
const accommodationCategoryId = 150;

const createLayout: CreateLayout = {
	companyId,
	accommodationId,
	title: 'Test Layout',
	mediaId: 0
};

const createMedia: MediaCreate = {
	companyId,
	uploaderId: 1,
	type: 'image',
	urls: {
		thumb: 'FakeURL',
		small: 'FakeURL',
		large: 'FakeURL',
		imageKit: 'FakeURL'
	},
	storageDetails: [
		{
			storageType: 'backblaze',
			fileId: 'FakeFileId',
			filePath: 'FakeFilePath'
		}
	]
};

const updateLayout: Omit<Api.AccommodationLayout.Req.Update, 'id'> = {
	title: 'Updated Test Layout',
	mediaId: 0
};

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 1
};

const sort: RedSky.SortQuery = {
	field: 'id',
	order: 'ASC'
};

const filter: RedSky.FilterQuery = {
	matchType: 'exact',
	searchTerm: []
};

const createCategory: CreateAccommodationCategory = {
	companyId,
	accommodationId,
	title: 'Test Category',
	description: 'Some really exciting things',
	features: []
};

const updateCategory: Omit<Api.AccommodationCategory.Req.Update, 'id'> = {
	title: 'Updated Test Category'
};

const accommodationResource = {
	companyId,
	accommodationId,
	accommodationCategoryId,
	createLayout,
	createMedia,
	updateLayout,
	pagination,
	sort,
	filter,
	createCategory,
	updateCategory
};

export default accommodationResource;
