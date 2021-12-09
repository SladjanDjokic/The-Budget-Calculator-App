import Table from '../Table';

export default class UserPoint extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getByUserId(userId: number): Promise<Model.UserPoint[]> {
		return this.db.runQuery('SELECT * FROM userPoint WHERE userId=?;', [userId]);
	}

	getPendingByReservationId(reservationId: number): Promise<Model.UserPoint> {
		return this.db.queryOne("SELECT * FROM userPoint WHERE reservationId=? AND `status`='PENDING' LIMIT 1;", [
			reservationId
		]);
	}

	getByReservationId(reservationId: number): Promise<Model.UserPoint> {
		return this.db.queryOne(
			"SELECT * FROM userPoint WHERE reservationId=? AND `status` IN ('PENDING', 'REDEEMED') LIMIT 1;",
			[reservationId]
		);
	}

	getVerbosePointsByUserId(userId: number): Promise<Api.UserPoint.Res.Verbose[]> {
		return this.db.runQuery(
			`SELECT userPoint.*, COALESCE(pointAction.name, pointOrder.name, pointReservation.name, pointReward.name, pointCampaign.name, IF(userPoint.status = 'REVOKED' OR userPoint.status = 'REDEEMED', 'POINT DEBIT', 'POINT CREDIT')) title, pointReservation.arrivalDate, pointReservation.departureDate, COALESCE(pointReservation.media, pointReward.media) media
			FROM userPoint
			    LEFT JOIN (SELECT userAction.id, a.name FROM userAction JOIN campaignAction ON userAction.campaignActionId = campaignAction.id JOIN action a ON campaignAction.actionId = a.id) pointAction ON userPoint.userActionId = pointAction.id
			    LEFT JOIN (SELECT id, 'Purchase Order' name FROM orders) pointOrder ON userPoint.orderId = pointOrder.id
			    LEFT JOIN (
			        SELECT reservation.id, d.name, reservation.arrivalDate, reservation.departureDate, media
			        FROM reservation
			            JOIN destination d ON reservation.destinationId = d.id
			            LEFT JOIN (
			                SELECT mediaMap.destinationId,
			                       CONCAT('[',
			                              GROUP_CONCAT(
			                                      CONCAT(
			                                              '{"id":',id,
			                                              ',"uploaderId":', uploaderId,
			                                              ',"type":"', type,
			                                              '","urls":', urls,
			                                              ',"title":"', IFNULL(title,''),
			                                              '","description":"', IFNULL(description,''),
			                                              '","isPrimary":', isPrimary, '}'
			                                          )
			                                  ),
			                              ']') AS media
			                FROM media
			                         JOIN mediaMap ON mediaMap.mediaId=media.id
			            ) AS destinationMedia
			                          ON destinationMedia.destinationId=d.id
			            GROUP BY reservation.id
			        ) pointReservation ON userPoint.reservationId = pointReservation.id
			    LEFT JOIN (
			        SELECT rewardVoucher.id, r.name, media
			        FROM rewardVoucher
			                 JOIN reward r ON rewardVoucher.rewardId = r.id
			                 LEFT JOIN(
			            SELECT mediaMap.rewardId,
			                   CONCAT(
			                           '[',
			                           GROUP_CONCAT(
			                                   CONCAT(
			                                           '{"id":', id,
			                                           ',"uploaderId":', uploaderId,
			                                           ',"type":"', type,
			                                           '","urls":', urls,
			                                           ',"title":"', IFNULL(title, ''),
			                                           '","description":"', IFNULL(description, ''),
			                                           '","isPrimary":', isPrimary, '}'
			                                       )
			                               ),
			                           ']'
			                       ) media
			            FROM media
			                     JOIN mediaMap ON mediaMap.mediaId = media.id
			            GROUP BY mediaMap.mediaId
			        ) rewardMedia ON rewardMedia.rewardId = r.id
			        GROUP BY rewardVoucher.id
			    ) pointReward on userPoint.rewardVoucherId = pointReward.id
			    LEFT JOIN (SELECT campaignAction.id, c.name from campaignAction JOIN campaign c on campaignAction.campaignId = c.id) pointCampaign on userPoint.campaignActionId = pointCampaign.id
			WHERE userPoint.userId=?;`,
			[userId]
		);
	}
}

export const userPoint = (dbArgs) => {
	dbArgs.tableName = 'userPoint';
	return new UserPoint(dbArgs);
};
