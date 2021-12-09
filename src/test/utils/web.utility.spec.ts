import chai from 'chai';
import { WebUtils } from '../../utils/utils';
const expect = chai.expect;

describe('Web Utilities', function () {
	describe('Sanitize', function () {
		it('should remove listed fields', function () {
			type ToSanitize = {
				fieldOne: any;
				fieldTwo: any;
				fieldThree: any;
			};
			type ToBeRemoved = 'fieldOne' | 'fieldThree';
			type Disjunction = {
				fieldTwo: any;
			};
			const target: ToSanitize = {
				fieldOne: '',
				fieldTwo: 1,
				fieldThree: [{}]
			};
			const fieldsToSanitize: ToBeRemoved[] = ['fieldOne', 'fieldThree'];

			const result: Disjunction = WebUtils.sanitize(target, fieldsToSanitize);
			expect(result, 'Nothing returned').to.exist;
			expect(result).to.haveOwnProperty('fieldTwo');
			expect(result).not.to.haveOwnProperty('fieldOne');
			expect(result).not.to.haveOwnProperty('fieldThree');
		});
	});
});
