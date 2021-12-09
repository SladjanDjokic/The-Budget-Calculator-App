import dbdiff from 'dbdiff';
import config from '../utils/config';
//@ts-ignore
let sand = config.sandbox.database;
let prod = config.database;
import fs from 'fs';
import path from 'path';
import open from 'open';
prod = getSingleConnection(prod);
sand = getSingleConnection(sand);
let conn1 = 'mysql://' + prod.user + ':' + prod.password + '@' + prod.host + '/' + prod.database + '';
let conn2 = 'mysql://' + sand.user + ':' + sand.password + '@' + sand.host + '/' + sand.database + '';
const FgRed = '\x1b[31m%s\x1b[0m';
const FgGreen = '\x1b[32m%s\x1b[0m';
let diff = new dbdiff.DbDiff();

console.log(conn1);
console.log(conn2);
diff.compare(conn1, conn2)
	.then(() => {
		migrationName(diff.commands(''), (name, number) => {
			checkForDuplicate(diff.commands(''), name, number, () => {
				createFile(diff.commands(''), name);
			});
		});
	})
	.catch((err) => {
		console.error(FgRed, err);
		process.exit(1);
	});

let createFile = (commands, name) => {
	fs.writeFile(path.join(__dirname, '../../src/database/migration/' + name), commands, (err) => {
		if (err) {
			process.exit(1);
		} else {
			console.log(
				'\x1b[36m',
				`Writing out migration file ${path.join(__dirname, '../../src/database/migration/' + name)}`
			);
			open(path.join(__dirname, '../../src/database/migration/' + name));
			process.exit(0);
		}
	});
};

let checkForDuplicate = (content, name, number, callback) => {
	fs.readdir(path.join(__dirname, '../../src/database/migration'), function (err, items) {
		let name = '';
		for (let i in items) {
			name = items[i];
		}
		readFile(name);
	});
	let readFile = (name) => {
		fs.readFile(path.join(__dirname, '../../src/database/migration/' + name), (err, data) => {
			if (data == content) {
				console.error(FgRed, 'THIS MIGRATION ALREADY EXISTS ' + name);
				process.exit(1);
			} else if (!content) {
				console.log(FgGreen, 'DATABASES ARE IN SYNC');
				process.exit(0);
			} else {
				callback();
			}
		});
	};
};

let migrationName = (commands, callback) => {
	let replace = [' ', '`', '"', "'", '/.', '-'];
	let cmd = commands;
	for (let i in replace) {
		cmd = cmd.replace(new RegExp(replace[i], 'g'), '_');
	}
	nextMigrationNumber((num) => {
		let name = num + '.do.' + cmd.substring(0, 20).toLowerCase() + '.sql';
		callback(name, num);
	});
};

let nextMigrationNumber = (callback) => {
	fs.readdir(path.join(__dirname, '../../src/database/migration'), function (err, items) {
		let num: any = 999;
		let max: any = 0;
		for (let i in items) {
			num = items[i].split('.')[0];
			if (parseInt(num) < max) continue;
			max = parseInt(num);
		}
		num = (parseInt(max) + 1 + '').padStart(3, '0');
		callback(num);
	});
};

function getSingleConnection(auth) {
	if (auth.host) return auth;
	if (auth[0]) return auth[0];
	throw new Error('cannot find connection');
}
