import Database from '../database/database';

export interface GeneralSocketArguments {
	db: Database;
	name?: string;
	io: SocketIO.Server;
}

export interface GeneralSocketData {
	token: string;
	user: Model.User;
	error?: any;
}

export default class GeneralSocket<T extends GeneralSocketData> {
	name: string;
	io: SocketIO.Server;

	constructor(args: GeneralSocketArguments) {
		this.name = args.name;
		this.io = args.io;

		this.sendToRoomIncludingSelf = this.sendToRoomIncludingSelf.bind(this);
	}

	subscribe(socket: SocketIO.Socket) {
		socket.on(this.name, (data: T) => {
			this.validateData(data);
			this.sendToRoomIncludingSelf('/', data);
		});
	}

	sendToRoomIncludingSelf(room: string, data: T, messageType: string | null = null) {
		const msgType = messageType || this.name;
		data = this.sanitizeData(data);
		this.io.in(room).emit(msgType, data);
	}

	sendToRoomExceptSelf(room: string, data: T, messageType: string | null = null) {
		const msgType = messageType || this.name;
		data = this.sanitizeData(data);
		this.io.to(room).emit(msgType, data);
	}

	sanitizeData(data: T) {
		delete data.token;
		delete data.user;
		return data;
	}

	validateData(data: T) {
		return true;
	}

	isInRoom(socket: SocketIO.Socket, roomName: string) {
		return !!socket.rooms[roomName];
	}
}
