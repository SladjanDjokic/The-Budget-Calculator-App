import IEmailSystem, { EmailSendObj } from '../IEmailSystem';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { RsError } from '../../../utils/errors';
import { JsonDecoder } from 'ts.data.json';

export interface NodemailerConfig extends Pick<SMTPTransport.Options, 'host' | 'port' | 'secure'> {
	serviceName: Exclude<Model.EmailSystems, 'mailgun'>;
}

export default class Nodemailer implements IEmailSystem {
	private readonly transporter: nodemailer.Transporter;
	constructor({ serviceName, ...options }: NodemailerConfig) {
		this.transporter = nodemailer.createTransport(options);
		try {
			this.transporter.verify();
		} catch {
			throw new RsError('INTEGRATION_ERROR', `Invalid email config for ${serviceName}`);
		}
	}
	async send(data: EmailSendObj) {
		return this.transporter.sendMail(data);
	}
	public static readonly configDecoder = JsonDecoder.array(
		JsonDecoder.objectStrict<NodemailerConfig>(
			{
				serviceName: JsonDecoder.oneOf<NodemailerConfig['serviceName']>(
					[JsonDecoder.isExactly('mailhog')],
					'serviceName'
				),
				host: JsonDecoder.string,
				port: JsonDecoder.number,
				secure: JsonDecoder.boolean
			},
			'SMTP option'
		),
		'SMTP option array'
	);
}
