import Slack from 'slack-node';
import config from '../../utils/config';

const apiToken = 'xoxp-190873984691-358783839618-513521723062-9a8d97410c9cdb41e952d320abc850ba';
const slack = new Slack(apiToken);

let env = 'PRODUCTION';
if (!config.isProduction) {
	env = 'SANDBOX';
}

export const SEVERITY_CODES = {
	info: 'INFO',
	critical: 'CRIT',
	severityChannelMap: {
		INFO: '#ontrac-devops-info',
		CRIT: '#ontrac-devops-critical'
	}
};

// if using channelOverride make sure to prefix with #
export const send = (text: string, severity = 'INFO', channelOverride?) => {
	// Fail over check
	if (Object.keys(SEVERITY_CODES.severityChannelMap).includes(severity) == false) {
		severity = 'INFO';
	}

	let channel = SEVERITY_CODES.severityChannelMap[severity];
	channel = channelOverride ? channelOverride : channel;
	let textMessage = `[${env}] ${text}`;

	slack.api(
		'chat.postMessage',
		{
			text: textMessage,
			channel: channel
		},
		function (err, response) {
			if (err) console.error(err);
		}
	);
};
