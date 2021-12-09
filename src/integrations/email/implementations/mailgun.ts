import mailGunJs from 'mailgun-js';
import IEmailSystem, { EmailSendObj } from '../IEmailSystem';
type MailgunClient = mailGunJs.Mailgun;

export interface MailgunConfig {
	apiKey: string;
	domain: string;
}

export default class MailGun implements IEmailSystem {
	private readonly mailgunClient: MailgunClient;

	constructor(config: MailgunConfig) {
		this.mailgunClient = mailGunJs({
			apiKey: config.apiKey,
			domain: config.domain
		});
	}

	async send(data: EmailSendObj) {
		return this.mailgunClient.messages().send(data);
	}
}
