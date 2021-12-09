import IService from '../IService';
import RsPagedResponseData = RedSky.RsPagedResponseData;

export interface UserPointCreate extends Omit<Api.UserPoint.Req.Create, 'award'> {
	status: Model.UserPointStatusTypes;
	campaignId?: number;
	campaignActionId?: number;
	orderId?: number;
	rewardVoucherId?: number;
	reservationId?: number;
}

export default interface IUserPointService extends IService {
	create: (pointObj: UserPointCreate) => Promise<Model.UserPoint>;
	createAndCalculateMultiplier: (pointObj: UserPointCreate) => Promise<Model.UserPoint>;
	getById: (userPointId: number) => Promise<Model.UserPoint>;
	getManyByIds: (userPointIdList: number[]) => Promise<Model.UserPoint[]>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<RsPagedResponseData<Model.UserPoint[]>>;
	getByUserId: (userId: number) => Promise<Model.UserPoint[]>;
	getVerbosePointDetails: (userId: number) => Promise<Api.UserPoint.Res.Verbose[]>;
	awardPoints: (reservationId: number) => Promise<Model.UserPoint>;
	revokePendingReservationPoints: (reservationId: number) => Promise<Model.UserPoint>;
	cancelPendingReservationPoints: (reservationId: number) => Promise<Model.UserPoint>;
}
