import { VaultDetails } from '../../integrations/paymentSystem/Payment.class';
import ITable from '../ITable';

export interface Create extends VaultDetails {
	userId: number;
	userAddressId?: number;
}

export interface UserPaymentMethodToUpdate extends Api.Payment.Req.Update {
	metaData?: string;
}

export interface Properties {
	userId: number;
	token?: string;
	nameOnCard?: string;
	type?: string;
	last4?: number;
	expirationMonth?: number;
	expirationYear?: number;
	systemProvider?: string;
}

export default interface IUserPaymentMethodTable extends ITable {
	create(tableObj: Create): Promise<Model.UserPaymentMethod>;
	update(userPaymentMethodId: number, paymentObj: UserPaymentMethodToUpdate): Promise<Model.UserPaymentMethod>;
	getByProperties({ userId, ...properties }: Properties): Promise<Model.UserPaymentMethod[]>;
}
