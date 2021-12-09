import { EmailReplyType, EmailSendDelayed, EmailSendImmediate, EmailType } from '../../services/email/IEmailService';

let sendImmediate: EmailSendImmediate = {
	templateType: EmailType.WELCOME,
	recipientEmail: 'joshua.hintze@gmail.com',
	emailReplyType: EmailReplyType.DEFAULT,
	metaData: {}
};

let sendDelayed: EmailSendDelayed = {
	templateType: EmailType.WELCOME,
	recipientEmail: 'joshua.hintze@gmail.com',
	emailReplyType: EmailReplyType.DEFAULT,
	metaData: {},
	sendOn: new Date('January 1 2025')
};

let emailResource = {
	sendImmediate,
	sendDelayed
};
export default emailResource;
