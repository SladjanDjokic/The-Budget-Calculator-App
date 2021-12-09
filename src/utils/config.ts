import logger from './logger';
import fs from 'fs';
import path from 'path';
import { JsonDecoder, Err } from 'ts.data.json';
import Nodemailer, { NodemailerConfig } from '../integrations/email/implementations/nodemailer';

interface IConfig {
	database: {
		host: string;
		port: number;
		user: string;
		password: string;
		database: string;
		timezone: string;
		multipleStatements: boolean;
	};
	application: {
		port: number;
	};
	rateLimiter: {
		enabled: boolean;
		points: number;
		duration: number;
		blockDuration: number;
	};
	agendaDb: {
		host: string;
		port: number;
		collection: string;
		user: string;
		password: string;
	};
	mailgun: {
		apiKey: string;
		domain: string;
		replyEmails: {
			DEFAULT: string;
			RESERVATION: string;
			SUPPORT: string;
		};
		enabled?: boolean;
	};
	smtp?: Array<NodemailerConfig>;
	redis: {
		port: number;
		host: string;
		password: string;
	};
	storage: {
		defaultBucketId: string;
		s3: {
			accessKeyId: string;
			secretAccessKey: string;
		};
		imageKit: {
			baseUrl: string;
		};
	};

	underMaintenance?: boolean;
	enableAgenda: boolean;
	isProduction: boolean;
	isLocalHost?: boolean;
}

const configValidation = JsonDecoder.object<IConfig>(
	{
		agendaDb: JsonDecoder.object(
			{
				host: JsonDecoder.string,
				port: JsonDecoder.number,
				collection: JsonDecoder.string,
				user: JsonDecoder.string,
				password: JsonDecoder.string
			},
			'agendaDb'
		),
		storage: JsonDecoder.object(
			{
				defaultBucketId: JsonDecoder.string,
				s3: JsonDecoder.object(
					{
						accessKeyId: JsonDecoder.string,
						secretAccessKey: JsonDecoder.string
					},
					's3'
				),
				imageKit: JsonDecoder.object(
					{
						baseUrl: JsonDecoder.string
					},
					'imageKit'
				)
			},
			'storage'
		),
		mailgun: JsonDecoder.object(
			{
				apiKey: JsonDecoder.string,
				domain: JsonDecoder.string,
				replyEmails: JsonDecoder.object(
					{
						DEFAULT: JsonDecoder.string,
						RESERVATION: JsonDecoder.string,
						SUPPORT: JsonDecoder.string
					},
					'replyEmails'
				)
			},
			'mailgun'
		),
		smtp: JsonDecoder.optional(Nodemailer.configDecoder),
		rateLimiter: JsonDecoder.object(
			{
				blockDuration: JsonDecoder.number,
				duration: JsonDecoder.number,
				enabled: JsonDecoder.boolean,
				points: JsonDecoder.number
			},
			'rateLimiter'
		),
		redis: JsonDecoder.object(
			{
				host: JsonDecoder.string,
				password: JsonDecoder.string,
				port: JsonDecoder.number
			},
			'redis'
		),
		application: JsonDecoder.object(
			{
				port: JsonDecoder.number
			},
			'application'
		),
		database: JsonDecoder.object(
			{
				host: JsonDecoder.string,
				port: JsonDecoder.number,
				user: JsonDecoder.string,
				password: JsonDecoder.string,
				database: JsonDecoder.string,
				timezone: JsonDecoder.string,
				multipleStatements: JsonDecoder.boolean
			},
			''
		),
		enableAgenda: JsonDecoder.boolean,
		underMaintenance: JsonDecoder.optional(JsonDecoder.boolean),
		isProduction: JsonDecoder.boolean,
		isLocalHost: JsonDecoder.optional(JsonDecoder.boolean)
	},
	'config'
);

class Config {
	data: IConfig;

	constructor() {
		try {
			const configJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));
			let result = configValidation.decode(configJson);
			if (this.isError(result)) throw new Error(result.error);
			this.data = configJson;
			if (!this.data.isProduction && configJson.sandbox) {
				for (let i in configJson.sandbox) {
					this.data[i] = { ...this.data[i], ...configJson.sandbox[i] };
				}
			}
		} catch (e) {
			logger.error('Could not parse config file. Exiting', e);
			throw new Error(e);
		}
	}

	isError(arg: any): arg is Err<IConfig> {
		return !!arg.error;
	}
}

const config = new Config();
export default config.data;
