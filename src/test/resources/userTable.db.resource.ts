const companyId = 1;
const userId = 2;
const userRole: Model.UserRole = {
	id: 1,
	name: 'Test user role',
	accessScope: [
		{
			accessScope: 'TEST',
			read: 1,
			write: 0
		}
	],
	createdOn: 'now',
	modifiedOn: 'now',
	isAdmin: 1,
	isCustomer: 0
};
const userToCreate: Api.User.Req.Create = {
	firstName: 'Test',
	lastName: 'User',
	password: '',
	primaryEmail: 'email@delete.com',
	userRoleId: 1
};

const userTableResource = {
	companyId,
	userId,
	userRole,
	userToCreate
};

export default userTableResource;
