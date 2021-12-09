const fsExtra = require('fs-extra');
import logger from './logger';
import path from 'path';

if (!global.appRoot) global.appRoot = path.join(__dirname, '../');
const tempFolderPath = path.join(global.appRoot, 'tmp');
logger.info(`Clearing Temp Folder: ${tempFolderPath}`);
fsExtra.emptyDirSync(tempFolderPath);

export { tempFolderPath };
