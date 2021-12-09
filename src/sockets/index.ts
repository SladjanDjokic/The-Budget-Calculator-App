import { GeneralSocketArguments } from './GeneralSocket';

const fs = require('fs');
const path = require('path');
//const eventManager = require('./eventManager.js');

// Time to refresh with some offset so we are not adjusting same time if an entire node restarts about the same time
const REFRESH_SOCKET_TIME_INTERVAL = 15 * 1000 + 10 * 1000 * Math.random();

let socketTypes = {};
let activeSocketConnections = {};

setInterval(refreshActiveSocketTimes, REFRESH_SOCKET_TIME_INTERVAL);

function refreshActiveSocketTimes() {
	let socketsInEvents = [];
	for (let i in activeSocketConnections) {
		if (activeSocketConnections[i].event_id)
			socketsInEvents.push(activeSocketConnections[i].id + '_' + activeSocketConnections[i].event_id.toString());
	}

	//if (socketsInEvents.length > 0) eventManager.refreshSocketsInEvents(socketsInEvents).catch(console.error);
}

export default (args: GeneralSocketArguments) => {
	if (!fs.existsSync(path.join(__dirname, 'types'))) return;
	fs.readdirSync(path.join(__dirname, 'types')).forEach(includeAllFiles);
	args.io.on('connection', onNewConnection);
	args.io.use((socket, next) => {
		if (!socket.handshake.query.companyId) {
			return next(new Error('Missing company id'));
		}
		next();
	});

	function includeAllFiles(file: string) {
		let name = file.substr(0, file.indexOf('.'));
		args.name = name;
		let socketWrapper = require('./types/' + name);
		socketTypes[name] = new socketWrapper(args);
	}

	function onNewConnection(socket) {
		console.log('socket.io connection id:', socket.id, socket.event_id);

		activeSocketConnections[socket.id] = socket;
		socket.companyId = socket.handshake.query.companyId;
		wrapTryCatchSocketIo(socket);
		authSocketIo(socket);
		subscribeToSocketTypes(socket);

		socket.on('disconnect', () => {
			console.log('socket.io disconnect id:', socket.id);
			reportEventLeaveIfNecessary(socket);
			delete activeSocketConnections[socket.id];
		});
	}

	function reportEventLeaveIfNecessary(socket) {
		if (socket.event_id) {
			//console.log('Socket was still in event id:' + socket.event_id + ' sending out user leave message');
			//let user = eventManager.getUserInEvent(socket.event_id, socket.id);
			// if (!user) return;
			// args.io.in('event_' + socket.event_id).emit('event_user_leave', {
			// 	user_id: user.id,
			// 	username: user.username
			// });
			//eventManager.removeUserFromEvent(socket.event_id, socket.id).catch(console.error);
		}
	}

	function subscribeToSocketTypes(socket) {
		for (let name in socketTypes) {
			socketTypes[name].subscribe(socket);
		}
	}

	function wrapTryCatchSocketIo(socket) {
		socket.orginal_on = socket.on;
		socket.on = (...args) => {
			socket.orginal_on(args[0], (...payload) => {
				try {
					args[1](...payload);
				} catch (e) {
					console.error(e);
				}
			});
		};
	}

	function authSocketIo(socket) {
		let publicMessageTypes = [
			'event_chat',
			'join_event_room',
			'leave_event_room',
			'event_user_join',
			'event_user_leave'
		];
		socket.use(async (payload, next) => {
			try {
				payload[1].user = await args.db.user.authToken(payload[1].token);
				return next();
			} catch (e) {
				if (publicMessageTypes.includes(payload[0])) {
					let message = payload[1] || {};
					message.user = { name: 'Anonymous User' };
					message.name = 'Anonymous ' + message.name;
					payload[1] = message;
					return next();
				}
				return next(new Error('Unauthorized'));
			}
		});
	}

	return socketTypes;
};

export { socketTypes as sockets };
