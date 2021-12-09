import bcrypt_nodejs from 'bcrypt-nodejs';
import { promisify } from 'util';

const comparePromise = promisify<string, string, boolean>(bcrypt_nodejs.compare);
const hashPromise = promisify<string, string, null, string>(bcrypt_nodejs.hash);
export default {
	compare: (data: string, hash: string): Promise<boolean> => comparePromise(data, hash),
	hash: (data: string, salt: string = null): Promise<string> => hashPromise(data, salt, null)
};
