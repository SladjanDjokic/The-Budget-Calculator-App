import IService from './IService';
import { ServiceName } from './serviceFactory';

export class Service implements IService {
	public start(services: Partial<Record<ServiceName, Service>>) {}
}
