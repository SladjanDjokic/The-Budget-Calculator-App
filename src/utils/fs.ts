import fs from 'fs';
import { promisify } from 'util';

export default {
	writeFile: promisify(fs.writeFile),
	readFile: promisify(fs.readFile),
	exists: promisify(fs.exists),
	unlink: promisify(fs.unlink)
};
