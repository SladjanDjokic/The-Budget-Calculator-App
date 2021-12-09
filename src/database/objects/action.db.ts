import IActionTable, { BrandAndLocationAction } from '../interfaces/IActionTable';
import Table from '../Table';
import { ObjectUtils } from '../../utils/utils';

export default class Action extends Table implements IActionTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getById(actionId: number, companyId?: number): Promise<Api.Action.Res.Get> {
		return this.db.queryOne(
			`${Action.actionSelectQuery}
			${Action.actionFromClause}
			WHERE
				\`action\`.id=? AND ${Table.buildCompanyIdQuery(companyId, this.tableName)}
			GROUP BY \`action\`.id;`,
			[actionId, companyId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Action.Res.Get>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let allObjects = await this.db.runQuery(
			`${Action.actionSelectQuery}
			${Action.actionFromClause}
			 WHERE
			 	${companyIdQueryString} AND
			 	${pageQuery.filterQuery}
			 GROUP BY \`action\`.\`id\`
			 	${pageQuery.sortQuery}
			 LIMIT ?
			 OFFSET ?;
			 SELECT Count(\`action\`.\`id\`) as total ${Action.actionFromClause} WHERE ${companyIdQueryString} AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async getDetailsById(actionId: number, companyId?: number): Promise<Api.Action.Res.Details> {
		return this.db.queryOne(
			`${Action.actionSelectQuery}, 
			campaignDetails.campaigns
			${Action.actionFromClause}
				JOIN (
					SELECT
						campaignAction.actionId,
						campaign.campaigns
					FROM campaignAction
						JOIN (
							SELECT
								campaign.id,
								CONCAT('[',
									GROUP_CONCAT(
										CONCAT(
											'{"id":',campaign.id,',
											"segmentId":',IFNULL(segmentId,0),
											',"name":"',name,
											'","description":"',IFNULL(description,''),
											'","createdOn":"',campaign.createdOn,
											'","modifiedOn":"',modifiedOn,
											'","isActive":',campaign.isActive,
											',"maxReward":',maxReward,
											',"type":"',type,
											'","startOn":"',IFNULL(startOn,''),
											'","endOn":"',IFNULL(endOn,''),
											'","pointValueMultiplier":',pointValueMultiplier,
											',"campaignActionId":',cA.id,
											',"actionCount":',cA.actionCount,'}'
										)
									), 
								']') AS campaigns
							FROM campaign
								JOIN campaignAction cA ON campaign.id = cA.campaignId
							GROUP BY campaign.id
					) AS campaign ON campaignAction.campaignId = campaign.id
				GROUP BY actionId
			) campaignDetails ON campaignDetails.actionId = action.id
			WHERE action.id=? AND (action.companyId=? OR action.companyId=0);`,
			[actionId, companyId]
		);
	}

	async getBrandAndLocationActions(companyId: number): Promise<BrandAndLocationAction[]> {
		return await this.db.runQuery(
			`SELECT action.id, action.name, action.pointValue, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',brand.id,',"name":"',brand.name,'","externalId":"',brand.externalId,'","metaData":',brand.metaData,',"locations":',IFNULL(brandDetails.locations,'[]'),'}')),']') brandDetails
             FROM action
                      JOIN brand ON action.brandId = brand.id
                      LEFT JOIN (
                 SELECT aL.id, IFNULL(CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',aL.id,',"name":"',IFNULL(aL.name,''),'","isActive":',aL.isActive,',"externalId":"',aL.externalId,'","metaData":',aL.metaData,'}')),']'), '[]') locations
                 from brandLocation aL
                 GROUP BY aL.id
             ) brandDetails on action.brandLocationId = brandDetails.id
             WHERE (action.companyId=?
                 OR action.companyId=0)
               AND action.isActive=1
             GROUP BY action.id;`,
			[companyId]
		);
	}

	private static actionFromClause: string = `
	FROM \`action\`
		LEFT JOIN brand	ON \`action\`.brandId=brand.id
		LEFT JOIN \`brandLocation\` ON \`action\`.brandLocationId=\`brandLocation\`.\`id\``;

	private static actionSelectQuery: string = `
	SELECT
		\`action\`.\`id\`,
		\`action\`.\`name\`,
		\`action\`.\`description\`,
		\`action\`.\`createdOn\`,
		\`action\`.\`modifiedOn\`,
		\`action\`.\`isActive\`,
		\`action\`.\`type\`,
		\`action\`.\`pointValue\`,
		GROUP_CONCAT(
			CONCAT('{',
				'"id":',brand.\`id\`,',',
				'"name":"',brand.\`name\`,'",',
				'"squareLogoUrl":"',IFNULL(brand.\`squareLogoUrl\`,''),'",',
				'"wideLogoUrl":"',IFNULL(brand.\`wideLogoUrl\`,''),'",',
				'"website":"',IFNULL(brand.\`website\`,''),'",',
				'"description":"',IFNULL(brand.\`description\`,''),'",',
				'"externalId":"',IFNULL(brand.\`externalId\`,''),'",',
				'"metaData":',IFNULL(brand.\`metaData\`,'{}'),',',
				'"createdOn":"',brand.\`createdOn\`,'",',
				'"modifiedOn":"',brand.\`modifiedOn\`,'"',
			'}')
		) AS brand,
		GROUP_CONCAT(
			CONCAT('{',
				'"id":',brandLocation.id,',',
				'"name":"',IFNULL(brandLocation.name,''),'",',
				'"address1":"',IFNULL(brandLocation.address1,''),'",',
				'"address2":"',IFNULL(brandLocation.address2,''),'",',
				'"city":"',IFNULL(brandLocation.city,''),'",',
				'"state":"',IFNULL(brandLocation.state,''),'",',
				'"country":"',IFNULL(brandLocation.externalId,''),'",',
				'"zip":"',IFNULL(brandLocation.zip,''),'",',
				'"externalId":"',IFNULL(brandLocation.externalId,''),'",',
				'"isActive":',brandLocation.isActive,',',
				'"metaData":',IFNULL(brandLocation.metaData,'{}'),
			'}')
		) AS brandLocation`;
}

export const action = (dbArgs) => {
	dbArgs.tableName = 'action';
	return new Action(dbArgs);
};
