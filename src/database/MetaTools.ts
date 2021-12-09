import config from '../utils/config';
import { CustomPool } from '../@types/mysqlCustom';
import { PoolConfig } from 'mysql';

const connection_params: PoolConfig = config.database;

export default class MetaTools {
	db: any;
	db_connection_params: any;
	metadata_obj: {};
	metadata_calculated: boolean;

	constructor(connection: CustomPool, db_connection_params?: PoolConfig) {
		this.db = connection;
		this.db_connection_params = db_connection_params || connection_params;
		this.metadata_obj = {};
		this.metadata_calculated = false;
	}

	getType(db_type) {
		if (!db_type) {
			return null;
		}
		db_type = db_type.toLowerCase();
		if (db_type.indexOf('bigint') !== -1) {
			return 'int';
		} else if (db_type.indexOf('tinyint') !== -1) {
			return 'boolean';
		} else if (db_type.indexOf('int') !== -1) {
			return 'int';
		} else if (db_type.indexOf('float') !== -1 || db_type.indexOf('decimal') !== -1) {
			return 'float';
		} else if (db_type.indexOf('datetime') !== -1) {
			return 'datetime';
		} else if (db_type.indexOf('date') !== -1) {
			return 'date';
		} else if (db_type.indexOf('varchar') !== -1) {
			return 'string';
		} else if (db_type.indexOf('text') !== -1) {
			return 'text';
		} else {
			return null;
		}
	}

	getLength(db_type) {
		if (db_type.indexOf('varchar') !== -1) {
			var mts = db_type.match(/\(([^()]+)\)/g);
			return mts[0].replace('(', '').replace(')', '');
		}
	}

	format_response(data, meta) {
		let newMeta = {};
		for (let i in meta) {
			if (meta[i].type === 'date') {
				newMeta[i] = { type: 'date' };
			} else if (meta[i].type === 'datetime') {
				newMeta[i] = { type: 'datetime' };
			} else {
				//TODO comment out in production
				//newMeta[i] = {type: meta[i].type};
			}
		}
		return { data: data, metadata: newMeta };
	}

	FormatLabel(input) {
		let words = input.split('_');
		let label = '';
		for (let i in words) {
			if (words[i] !== 'id') {
				label += this.CapitalFirst(words[i]) + ' ';
			}
		}
		if (input === 'id') {
			return 'Key';
		}
		return label.substring(0, label.length - 1);
	}

	CapitalFirst(word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}

	async CalcAllMetadata() {
		if (this.metadata_calculated) return;
		this.metadata_calculated = true;
		let tables = await this.db.runQuery('show tables;');
		let promises = [];
		for (let i in tables) {
			let table_name = tables[i]['Tables_in_' + this.db_connection_params.database];
			promises.push(this.CalcMetadata(table_name));
		}
		let all = await Promise.all(promises);
		return all;
	}

	CalcMetadata(table_name) {
		return new Promise((resolve, reject) => {
			if (!this.metadata_obj[table_name] && table_name) {
				this.metadata_obj[table_name] = {};
			}
			this.db.fields(table_name, (err, fields) => {
				for (let j in fields) {
					this.metadata_obj[table_name][j] = {
						type: this.getType(fields[j].Type),
						db_type: fields[j].Type,
						label: this.FormatLabel(j)
					};
					let length = this.getLength(fields[j].Type);
					if (length) this.metadata_obj[table_name][j].length = length;
				}
				this.db.foreign(table_name, (err, foreign) => {
					let relation = 'many-related';
					if (Object.keys(foreign).length == 4) {
						relation = 'map';
					}
					for (let k in foreign) {
						// console.log(foreign[k].COLUMN_NAME);
						this.metadata_obj[table_name][foreign[k].COLUMN_NAME] = {
							type: 'related',
							model: foreign[k].REFERENCED_TABLE_NAME,
							label: this.FormatLabel(foreign[k].COLUMN_NAME),
							db_type: 'BIGINT(19)'
							// db_type: this.metadata_obj[tableName][foreign[k].COLUMN_NAME].db_type
						};
						if (!this.metadata_obj[foreign[k].REFERENCED_TABLE_NAME]) {
							this.metadata_obj[foreign[k].REFERENCED_TABLE_NAME] = {};
						}
						this.metadata_obj[foreign[k].REFERENCED_TABLE_NAME][
							table_name + '___' + foreign[k].COLUMN_NAME
						] = {
							type: relation,
							model: table_name,
							label: this.FormatLabel(table_name),
							field: foreign[k].COLUMN_NAME
						};
					}
					// if(db_obj[tableName]) {
					//     db_obj[tableName].metadata(() => {});
					// }
					if (resolve && this.metadata_obj[table_name]) {
						resolve(this.metadata_obj[table_name]);
					}
				});
			});
		});
	}

	async calc_all_metadata() {
		return await this.CalcAllMetadata();
	}

	async getMetadata(table_name) {
		if (this.metadata_obj[table_name]) {
			return this.metadata_obj[table_name];
		} else {
			return await this.CalcMetadata(table_name);
		}
	}

	all() {
		return this.metadata_obj;
	}
}
