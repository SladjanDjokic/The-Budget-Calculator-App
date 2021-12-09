import isVarName from 'is-var-name';

const findVar = (str) => {
	let lastVar = '';
	for (let i = 1; i < str.length; i++) {
		let potential = str.substr(1, i + 1);
		if (isVarName(potential)) {
			lastVar = potential;
		} else {
			return lastVar;
		}
	}
	return lastVar;
};

const get = (fn, variable) => {
	if (!fn) {
		return;
	}
	var arr = fn.toString().split(variable);
	arr.splice(0, 1);
	var body = [];
	for (let i in arr) {
		let varaible = findVar(arr[i]);
		if (body.includes(varaible)) continue;
		body.push(varaible);
	}
	body.push('token');
	return body;
};

const getBody = (fn) => {
	return get(fn, 'req.body');
};

const getQuery = (fn) => {
	return get(fn, 'req.query');
};

const mockArgs = (Constructor, name) => {
	return {
		name,
		table_name: name,
		db: {},
		app: {
			get: function (url, fn) {
				docs[url] = {
					method: 'GET',
					query: getQuery(Constructor.prototype[fn.name.replace('bound', '').replace(' ', '')])
				};
			},
			post: function (url, fn, arg3) {
				docs[url] = {
					method: 'POST'
				};
				if (arg3) {
					return;
				}
				docs[url].body = getBody(Constructor.prototype[fn.name.replace('bound', '').replace(' ', '')]);
			},
			put: function (url, fn, arg3) {
				docs[url] = {
					method: 'PUT'
				};
				if (arg3) {
					return;
				}
				docs[url].body = getBody(Constructor.prototype[fn.name.replace('bound', '').replace(' ', '')]);
			},
			delete: function (url, fn, arg3) {
				docs[url] = {
					method: 'DELETE'
				};
				if (arg3) {
					return;
				}
				docs[url].body = getBody(Constructor.prototype[fn.name.replace('bound', '').replace(' ', '')]);
			},
			patch: function (url, fn, arg3) {
				docs[url] = {
					method: 'PATCH'
				};
				if (arg3) {
					return;
				}
				docs[url].body = getBody(Constructor.prototype[fn.name.replace('bound', '').replace(' ', '')]);
			}
		}
	};
};

const add = (Constructor, name) => {
	let api = new Constructor(mockArgs(Constructor, name));
};

const update = (url, value) => {
	docs[url] = value;
};

let docs = {};

const getDocs = function () {
	return docs;
};

const getForTable = function (table_name) {
	let tableDocs = {};
	for (let i in docs) {
		if (i.indexOf('api/v1/' + table_name + '/') > 0) {
			tableDocs[i] = docs[i];
		}
	}
	return tableDocs;
};

export default {
	getDocs,
	update,
	getForTable,
	add
};
