import { Service } from '../Service';
import agenda from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import EmailLog from '../../database/objects/emailLog.db';
import { DateUtils } from '../../utils/utils';
import UserService from '../user/user.service';
import { ServiceName } from '../serviceFactory';
import Agenda from 'agenda';
import { boundMethod } from 'autobind-decorator';
import EmailTemplate from '../../database/objects/emailTemplate.db';
import config from '../../utils/config';
import logger from '../../utils/logger';
import IEmailService, {
	AgendaEmailData,
	EmailSendDelayed,
	EmailSendImmediate,
	EmailType,
	EmailMetaData,
	EmailReplyType
} from './IEmailService';
import IEmailSystem, { EmailSendObj } from '../../integrations/email/IEmailSystem';
import EmailSystemProvider from '../../integrations/email/emailSystemProvider';

export default class EmailService extends Service implements IEmailService {
	private userService: UserService;
	private replyEmails: { [key: string]: string };

	constructor(
		private readonly emailLogTable: EmailLog,
		private readonly emailTemplateTable: EmailTemplate,
		private readonly emailSystemProvider: EmailSystemProvider
	) {
		super();
		agenda.define(AgendaJobNames.EMAIL_JOB, { priority: 15, concurrency: 20 }, this.send);
		this.initReplyEmails();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.userService = services['UserService'] as UserService;
	}

	async sendDelayed(emailData: EmailSendDelayed) {
		let agendaEmailData = await this.getAgendaData(emailData);
		await agenda.schedule(emailData.sendOn, AgendaJobNames.EMAIL_JOB, agendaEmailData);
	}

	async sendImmediate(emailData: EmailSendImmediate) {
		let agendaEmailData = await this.getAgendaData(emailData);
		await agenda.now(AgendaJobNames.EMAIL_JOB, agendaEmailData);
	}

	@boundMethod
	private async send(job: Agenda.Job) {
		const data = job.attrs.data as AgendaEmailData;
		const sendObject = this.formatEmailSendObject(data);
		await this.emailSystemProvider.getSystem().send(sendObject);
		await this.logSentEmail(data);
	}

	async getTemplateById(templateId: number) {
		return await this.emailTemplateTable.getTemplateById(templateId);
	}

	async getTemplateByType(type: EmailType) {
		return await this.emailTemplateTable.getLatestTemplateByType(type);
	}

	private prepMessage(metaData: EmailMetaData, template: Model.EmailTemplate) {
		let body = template.html;
		let subject = template.subject;
		for (let i in metaData) {
			let find = `{{${i}}}`;
			let re = new RegExp(find, 'g');
			body = body.replace(re, metaData[i] || '');
			subject = subject.replace(re, metaData[i] || '');
		}
		return { body, subject };
	}

	private formatEmailSendObject(data: AgendaEmailData): EmailSendObj {
		return {
			to: data.sentToEmail,
			from: data.sentFromEmail,
			subject: data.subject,
			html: data.html
		};
	}

	private async getAgendaData(emailData: EmailSendDelayed | EmailSendImmediate): Promise<AgendaEmailData> {
		let template: Model.EmailTemplate = await this.emailTemplateTable.getLatestTemplateByType(
			emailData.templateType
		);
		let { body: html, subject } = this.prepMessage(emailData.metaData, template);
		let replyEmail = this.getReplyEmail(emailData.emailReplyType);
		let sentToEmail: string;
		if (emailData.recipientId) {
			let recipient: Api.User.Filtered = await this.userService.getById(emailData.recipientId);
			sentToEmail = recipient.primaryEmail;
		} else if (emailData.recipientEmail) {
			sentToEmail = emailData.recipientEmail;
		} else {
			throw new Error('Missing a recipient email or id');
		}

		return {
			html,
			subject,
			sentFromEmail: replyEmail,
			sentToEmail,
			recipientId: emailData.recipientId,
			initiatorId: emailData.initiatorId
		};
	}

	private getReplyEmail(replyType: EmailReplyType): string {
		if (this.replyEmails.hasOwnProperty(replyType)) {
			return this.replyEmails[replyType];
		} else {
			logger.error(`Email Service - Invalid Email Reply Type ${replyType}`);
			return this.replyEmails['DEFAULT'];
		}
	}

	private async logSentEmail(data: AgendaEmailData) {
		let logData = {
			initiatorId: data.initiatorId,
			recipientId: data.recipientId,
			sentToEmail: data.sentToEmail,
			sentFromEmail: data.sentFromEmail,
			sentOn: DateUtils.dbNow(),
			html: data.html,
			subject: data.subject
		};
		await this.emailLogTable.create(logData).catch(logger.error);
	}

	private initReplyEmails() {
		if (!config.mailgun || !config.mailgun.replyEmails) throw new Error('Missing mailgun reply types');
		if (!config.mailgun.replyEmails['DEFAULT'])
			throw new Error('Missing at least a default reply type for mailgun');
		this.replyEmails = config.mailgun.replyEmails;
	}
}
