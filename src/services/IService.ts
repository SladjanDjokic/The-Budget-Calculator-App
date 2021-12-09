import { Service } from './Service';
import { ServiceName } from './serviceFactory';

export default interface IService {
	start: (services: Partial<Record<ServiceName, Service>>) => void;
}
