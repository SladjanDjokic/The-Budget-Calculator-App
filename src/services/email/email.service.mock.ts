import IEmailService, { EmailSendDelayed, EmailSendImmediate } from './IEmailService';
import { ServiceName } from '../serviceFactory';
import { Service } from '../Service';

export default class EmailServiceMock implements IEmailService {
	sendImmediateCalls: number = 0;
	async sendImmediate(emailData: EmailSendImmediate): Promise<void> {
		this.sendImmediateCalls++;
	}
	sendDelayed: (emailData: EmailSendDelayed) => Promise<void>;
	start(services: Partial<Record<ServiceName, Service>>): void {}
}
