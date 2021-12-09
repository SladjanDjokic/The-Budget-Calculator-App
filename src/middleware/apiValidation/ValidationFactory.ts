import { Validation } from './Validation';
import { ApiMethod } from '../../@types/expressCustom';
import fs from 'fs';
import path from 'path';

class ValidationFactory {
	private validations: { [key: string]: Validation } = {};
	create() {
		fs.readdirSync(path.join(__dirname, 'validators')).forEach(async (validationFile) => {
			// The following try / catch block fixes an issue when looking for the map file giving an exception thrown
			try {
				let TaskImport = await import(path.join(__dirname, 'validators', validationFile));
				new TaskImport.default();
			} catch (e) {}
		});
	}

	register(validation: Validation, validationName: string) {
		this.validations[validationName] = validation;
	}

	get<T extends Validation>(method: ApiMethod, name: string, path: string): T | null {
		if (!this.validations[name]) return null;
		path = `${method}:${path}`;
		const validationClass = this.validations[name];
		return validationClass[path];
	}
}

const validationFactory = new ValidationFactory();
export default validationFactory;
