/*****************************************
 * Example:
 * yarn table User
 *
 * This will create the api and database files for a db table.
 * Now just update permissions with the table and database.js
 *
 *****************************************/

import path from 'path';
import fs from 'fs';
import _ from 'lodash';

console.log(process.argv);
let table_name = process.argv[2];
let PascalCase = _.camelCase(table_name);
PascalCase = PascalCase[0].toUpperCase() + PascalCase.substr(1, PascalCase.length - 1);

let apiTemplate = `import GeneralAPI from "../GeneralAPI";

export default class ${PascalCase} extends GeneralAPI {
    constructor(api_args){
        super(api_args);
    }
}
`;

let dbTemplate = `import Table from "../table";

export default class ${PascalCase} extends Table {
    constructor(db_args){
        super(db_args);
    }
}

export const ${table_name} = db_args => {
    db_args.table_name = '${table_name}';
    return new ${PascalCase}(db_args);
}
`;

fs.writeFile(path.join(__dirname, '../api/' + table_name + '.ts'), apiTemplate, 'utf-8', (err) => {
	console.log(err);
});
fs.writeFile(path.join(__dirname, '../database/objects/' + table_name + '.ts'), dbTemplate, 'utf-8', (err) => {
	console.log(err);
});

console.log(` this.${table_name} = require('./objects/${table_name}.js')(db_args);`);
