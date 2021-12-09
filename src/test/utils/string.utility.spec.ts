import chai from 'chai';
import { StringUtils } from '../../utils/utils';
const expect = chai.expect;

describe('String Utilities', function () {
	describe('areEqualInsensitive', function () {
		it('should recognize equal strings', () => {
			const stringA = 'AAA',
				stringB = 'AAA';
			const result = StringUtils.areEqualInsensitive(stringA, stringB);
			expect(result).to.be.true;
		});
		it('should recognize unequal strings', () => {
			const stringA = 'AAA',
				stringB = 'BBB';
			const result = StringUtils.areEqualInsensitive(stringA, stringB);
			expect(result).to.be.false;
		});
		it('should ignore case', () => {
			const stringA = 'Aaa',
				stringB = 'aaA';
			const result = StringUtils.areEqualInsensitive(stringA, stringB);
			expect(result).to.be.true;
		});
		it('should recognize diacritics', () => {
			const stringA = 'AAA',
				stringB = 'AÁA';
			const result = StringUtils.areEqualInsensitive(stringA, stringB);
			expect(result).to.be.false;
		});
	});

	describe('Remove Line Endings', function () {
		it('should return a string with carriage return', function () {
			const invalidString = 'Hello\rWorld!';
			const result: string = StringUtils.removeLineEndings(invalidString);
			chai.expect(result).to.not.equal(invalidString);
			chai.expect(result).to.not.contain('\r');
		});
		it('should return a string with new line', function () {
			const invalidString = 'Hello\nWorld!';
			const result: string = StringUtils.removeLineEndings(invalidString);
			chai.expect(result).to.not.equal(invalidString);
			chai.expect(result).to.not.contain('\n');
		});
		it('should return a string with tab', function () {
			const invalidString = 'Hello\tWorld!';
			const result: string = StringUtils.removeLineEndings(invalidString);
			chai.expect(result).to.not.equal(invalidString);
			chai.expect(result).to.not.contain('\t');
		});
		it('should return a string with extra spaces', function () {
			const invalidString = 'Hello                  World!';
			const result: string = StringUtils.removeLineEndings(invalidString);
			chai.expect(result).to.not.equal(invalidString);
			chai.expect(result).to.not.equal(invalidString.split(' ').length);
			chai.expect(result.split(' ').length).to.equal(2);
		});
		it('should return a string with \r\n\t and additional spaces', function () {
			const invalidString = 'Hello    \r  \n    \t              World!\t\n\r';
			const result: string = StringUtils.removeLineEndings(invalidString);
			chai.expect(result).to.not.equal(invalidString);
			chai.expect(result).to.not.equal(invalidString.split(' ').length);
			chai.expect(result.split(' ').length).to.equal(2);
			chai.expect(result).to.not.contain('\r');
			chai.expect(result).to.not.contain('\n');
			chai.expect(result).to.not.contain('\t');
		});
	});
});
