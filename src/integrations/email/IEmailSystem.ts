export default interface IEmailSystem {
	send: (data: EmailSendObj) => Promise<any>;
}

export interface EmailSendObj {
	from: string;
	to: string;
	subject: string;
	html: string;
}
