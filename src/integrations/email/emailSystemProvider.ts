import config from '../../utils/config';
import IEmailSystem from './IEmailSystem';

export default class EmailSystemProvider {
	constructor(private readonly availableEmailSystems: Partial<Record<Model.EmailSystems, IEmailSystem>>) {}
	public getSystem(): IEmailSystem {
		if (config.isProduction) return this.availableEmailSystems['mailgun'];
		return this.availableEmailSystems['mailhog'];
	}
}
