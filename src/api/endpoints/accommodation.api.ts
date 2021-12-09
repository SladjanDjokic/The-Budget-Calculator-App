import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import AccommodationService from '../../services/accommodation/accommodation.service';
import publicUrl from '../../@decorators/publicUrl';
import roleAuthorization from '../../@decorators/roleAuthorization';
import { WebUtils } from '../../utils/utils';

export default class AccommodationApi extends GeneralApi {
	accommodationService: AccommodationService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.accommodationService = serviceFactory.get<AccommodationService>('AccommodationService');

		this.app.put(`${pre}`, this.update);
		this.app.get(`${pre}/details`, this.getDetails);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}/availability`, this.getAvailability);
		this.app.post(`${pre}/layout`, this.createLayout);
		this.app.put(`${pre}/layout`, this.updateLayout);
		this.app.get(`${pre}/layout`, this.getLayoutDetails);
		this.app.get(`${pre}/layout/paged`, this.getLayoutPaged);
		this.app.delete(`${pre}/layout`, this.deleteLayout);
		this.app.post(`${pre}/layout/room`, this.createLayoutRoom);
		this.app.put(`${pre}/layout/room`, this.updateLayoutRoom);
		this.app.get(`${pre}/layout/room`, this.getLayoutRoomDetails);
		this.app.get(`${pre}/layout/room/layout-id`, this.getRoomForLayout);
		this.app.delete(`${pre}/layout/room`, this.deleteLayoutRoom);
		this.app.post(`${pre}/category`, this.createCategory);
		this.app.get(`${pre}/category`, this.getCategoryDetails);
		this.app.get(`${pre}/category/accommodation-id`, this.getCategoryForAccommodation);
		this.app.get(`${pre}/category/destination-id`, this.getCategoryForDestination);
		this.app.put(`${pre}/category`, this.updateCategory);
		this.app.delete(`${pre}/category`, this.deleteCategory);
		this.app.post(`${pre}/amenity`, this.createAmenity);
		this.app.get(`${pre}/amenity`, this.getAllAmenities);
		this.app.put(`${pre}/amenity`, this.updateAmenity);
		this.app.delete(`${pre}/amenity`, this.deleteAmenity);
	}

	@boundMethod
	@roleAuthorization('admin')
	async update(req: RsRequest<Api.Accommodation.Req.Update>, res: RsResponse<Api.Accommodation.Res.Update>) {
		const result = await this.accommodationService.update(req.data.id, req.data, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/accommodation/details')
	async getDetails(req: RsRequest<Api.Accommodation.Req.Details>, res: RsResponse<Api.Accommodation.Res.Details>) {
		const details: Api.Accommodation.Res.Details = await this.accommodationService.getById(
			req.data.accommodationId,
			WebUtils.getCompanyId(req)
		);
		res.sendData(details);
	}

	@boundMethod
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Accommodation.Res.Details[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedResponse: RedSky.RsPagedResponseData<
			Api.Accommodation.Res.Details[]
		> = await this.accommodationService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedResponse.data, pagedResponse.total);
	}

	@boundMethod
	@publicUrl('GET', '/accommodation/availability')
	async getAvailability(
		req: RsRequest<Api.Accommodation.Req.Availability>,
		res: RsResponse<Api.Accommodation.Res.Availability[]>
	) {
		if (!req.data.pagination) {
			req.data.pagination = { page: 1, perPage: 10 };
		}
		let userId = 0;
		if (req.user) {
			userId = req.user.id;
		} else {
			userId = 0;
		}
		const result = await this.accommodationService.getAvailable(req.data, userId, WebUtils.getCompanyId(req));
		res.sendPaginated(result.data, result.total);
	}

	@boundMethod
	@roleAuthorization('admin')
	async createLayout(
		req: RsRequest<Api.AccommodationLayout.Req.Create>,
		res: RsResponse<Api.AccommodationLayout.Res.Create>
	) {
		const createdLayout: Api.AccommodationLayout.Details = await this.accommodationService.createLayout({
			companyId: WebUtils.getCompanyId(req),
			...req.data
		});
		res.sendData(createdLayout);
	}

	@boundMethod
	@roleAuthorization('admin')
	async updateLayout(
		req: RsRequest<Api.AccommodationLayout.Req.Update>,
		res: RsResponse<Api.AccommodationLayout.Res.Update>
	) {
		const updatedLayout: Api.AccommodationLayout.Details = await this.accommodationService.updateLayout(req.data);
		res.sendData(updatedLayout);
	}

	@boundMethod
	async getLayoutDetails(
		req: RsRequest<Api.AccommodationLayout.Req.Get>,
		res: RsResponse<Api.AccommodationLayout.Res.Get | Api.AccommodationLayout.Res.Get[]>
	) {
		let layoutDetail: Api.AccommodationLayout.Res.Get | Api.AccommodationLayout.Res.Get[];
		if (req.data.id) {
			layoutDetail = await this.accommodationService.getLayoutById(req.data.id, WebUtils.getCompanyId(req));
		} else if (req.data.ids) {
			layoutDetail = await this.accommodationService.getManyLayouts(req.data.ids, WebUtils.getCompanyId(req));
		}
		res.sendData(layoutDetail);
	}

	@boundMethod
	async getLayoutPaged(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.AccommodationLayout.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedResponse: RedSky.RsPagedResponseData<
			Api.AccommodationLayout.Res.Get[]
		> = await this.accommodationService.getLayoutByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedResponse.data, pagedResponse.total);
	}

	@boundMethod
	@roleAuthorization('admin')
	async deleteLayout(req: RsRequest<Api.AccommodationLayout.Req.Delete>, res: RsResponse<number>) {
		const deletedLayoutId: number = await this.accommodationService.deleteLayoutById(req.data.id);
		res.sendData(deletedLayoutId);
	}

	@boundMethod
	@roleAuthorization('admin')
	async createLayoutRoom(
		req: RsRequest<Api.AccommodationLayoutRoom.Req.Create>,
		res: RsResponse<Api.AccommodationLayoutRoom.Res.Create>
	) {
		const createdLayout: Api.AccommodationLayoutRoom.Res.Get = await this.accommodationService.createLayoutRoom({
			companyId: WebUtils.getCompanyId(req),
			...req.data
		});
		res.sendData(createdLayout);
	}

	@boundMethod
	@roleAuthorization('admin')
	async updateLayoutRoom(
		req: RsRequest<Api.AccommodationLayoutRoom.Req.Update>,
		res: RsResponse<Api.AccommodationLayoutRoom.Res.Update>
	) {
		const updatedLayout: Api.AccommodationLayoutRoom.Res.Update = await this.accommodationService.updateLayoutRoom(
			req.data.id,
			req.data
		);
		res.sendData(updatedLayout);
	}

	@boundMethod
	async getLayoutRoomDetails(
		req: RsRequest<Api.AccommodationLayoutRoom.Req.Get>,
		res: RsResponse<Api.AccommodationLayoutRoom.Res.Get | Api.AccommodationLayoutRoom.Res.Get[]>
	) {
		let layoutDetail: Api.AccommodationLayoutRoom.Res.Get = await this.accommodationService.getLayoutRoomById(
			req.data.id
		);
		res.sendData(layoutDetail);
	}

	@boundMethod
	async getRoomForLayout(
		req: RsRequest<Api.AccommodationLayoutRoom.Req.GetForLayout>,
		res: RsResponse<Api.AccommodationLayoutRoom.Res.Get[]>
	) {
		let layoutDetail: Api.AccommodationLayoutRoom.Res.GetForLayout[] = await this.accommodationService.getLayoutRoomsByLayoutId(
			req.data.accommodationLayoutId
		);
		res.sendData(layoutDetail);
	}

	@boundMethod
	@roleAuthorization('admin')
	async deleteLayoutRoom(req: RsRequest<Api.AccommodationLayoutRoom.Req.Delete>, res: RsResponse<number>) {
		const deletedLayoutId: number = await this.accommodationService.deleteLayoutRoomById(req.data.id);
		res.sendData(deletedLayoutId);
	}

	@boundMethod
	@roleAuthorization('admin')
	async createCategory(
		req: RsRequest<Api.AccommodationCategory.Req.Create>,
		res: RsResponse<Api.AccommodationCategory.Res.Create>
	) {
		const createdCategory: Api.AccommodationCategory.Res.Create = await this.accommodationService.createCategory({
			...req.data,
			companyId: WebUtils.getCompanyId(req)
		});
		res.sendData(createdCategory);
	}

	@boundMethod
	async getCategoryDetails(
		req: RsRequest<Api.AccommodationCategory.Req.Get>,
		res: RsResponse<Api.AccommodationCategory.Res.Get | Api.AccommodationCategory.Res.Get[]>
	) {
		let result: Api.AccommodationCategory.Res.Get | Api.AccommodationCategory.Res.Get[];
		if (req.data.id) {
			result = await this.accommodationService.getCategoryById(req.data.id, WebUtils.getCompanyId(req));
		} else if (req.data.ids) {
			result = await this.accommodationService.getManyCategoriesByIds(req.data.ids, WebUtils.getCompanyId(req));
		}
		res.sendData(result);
	}

	@boundMethod
	async getCategoryForAccommodation(
		req: RsRequest<Api.AccommodationCategory.Req.GetByAccommodation>,
		res: RsResponse<Api.AccommodationCategory.Res.Get[]>
	) {
		const accommodationCategories: Api.AccommodationCategory.Res.Get[] = await this.accommodationService.getCategoryForAccommodation(
			req.data.accommodationId
		);
		res.sendData(accommodationCategories);
	}

	@boundMethod
	async getCategoryForDestination(
		req: RsRequest<Api.AccommodationCategory.Req.GetByDestination>,
		res: RsResponse<Api.AccommodationCategory.Res.Get[]>
	) {
		const destinationCategories: Api.AccommodationCategory.Res.Get[] = await this.accommodationService.getCategoryForDestination(
			req.data.destinationId
		);
		res.sendData(destinationCategories);
	}

	@boundMethod
	@roleAuthorization('admin')
	async updateCategory(
		req: RsRequest<Api.AccommodationCategory.Req.Update>,
		res: RsResponse<Api.AccommodationCategory.Res.Update>
	) {
		const updatedCategory: Api.AccommodationCategory.Res.Update = await this.accommodationService.updateCategory(
			req.data.id,
			{
				companyId: WebUtils.getCompanyId(req),
				...req.data
			}
		);
		res.sendData(updatedCategory);
	}

	@boundMethod
	@roleAuthorization('admin')
	async deleteCategory(req: RsRequest<Api.AccommodationCategory.Req.Delete>, res: RsResponse<number>) {
		const deletedId: number = await this.accommodationService.deleteCategory(
			req.data.id,
			WebUtils.getCompanyId(req)
		);
		res.sendData(deletedId);
	}

	@boundMethod
	@roleAuthorization('admin')
	async createAmenity(req: RsRequest<Api.Amenity.Req.Create>, res: RsResponse<Api.Amenity.Res.Create>) {
		const createdAmenity: Api.Amenity.Res.Create = await this.accommodationService.createAmenity(req.data);
		res.sendData(createdAmenity);
	}

	@boundMethod
	@roleAuthorization('admin')
	async updateAmenity(req: RsRequest<Api.Amenity.Req.Update>, res: RsResponse<Api.Amenity.Res.Update>) {
		const updatedAmenity: Api.Amenity.Res.Update = await this.accommodationService.updateAmenity(req.data);
		res.sendData(updatedAmenity);
	}

	@boundMethod
	@publicUrl('GET', '/accommodation/amenity')
	async getAllAmenities(req: RsRequest<null>, res: RsResponse<Api.Amenity.Res.Get[]>) {
		const amenities: Api.Amenity.Res.Get[] = await this.accommodationService.getAllAmenities();
		res.sendData(amenities);
	}

	@boundMethod
	@roleAuthorization('admin')
	async deleteAmenity(req: RsRequest<Api.Amenity.Req.Delete>, res: RsResponse<Api.Amenity.Res.Delete>) {
		const id = await this.accommodationService.deleteAmenity(req.data.id);
		res.sendData({ id });
	}
}
