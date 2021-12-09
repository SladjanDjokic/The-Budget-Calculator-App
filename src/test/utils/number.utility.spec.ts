import chai from 'chai';
import { NumberUtils } from '../../utils/utils';
const expect = chai.expect;

describe('Number utilities', () => {
	// I know there are some funky edge cases because of JS using floats for everything,
	// but I can't remember the ones I've seen.
	// If you see or know of some, put tests in here so we can handle for them

	describe('Convert dollars to cents', () => {
		it('should convert whole dollars', () => {
			const originalValue = 12;
			const result = NumberUtils.dollarsToCents(originalValue);
			expect(result).to.equal(1200);
		});
		it('should convert dollars and cents', () => {
			const originalValue = 12.34;
			const result = NumberUtils.dollarsToCents(originalValue);
			expect(result).to.equal(1234);
		});
		it('should truncate repeating decimals', () => {
			const originalValue = 1 / 3;
			const result = NumberUtils.dollarsToCents(originalValue);
			expect(result).to.equal(33);
		});
		it('should round up decimals', () => {
			const originalValue = 12.3456;
			const result = NumberUtils.dollarsToCents(originalValue);
			expect(result).to.equal(1235);
		});
	});
	describe('Convert cents to dollars', () => {
		const originalValue = 1234;
		const result = NumberUtils.centsToDollars(originalValue);
		expect(result).to.equal(12.34);
	});
	describe('Round', function () {
		let num: number, significance: number;
		beforeEach(() => {
			num = null;
			significance = null;
		});
		it('should leave 0 alone', function () {
			significance = 100;
			num = 0;
			const result = NumberUtils.round(num, significance);
			expect(result).to.equal(num);
		});
		it('should leave a multiple of the significance alone', function () {
			significance = 100;
			num = significance * 5;
			const result = NumberUtils.round(num, significance);
			expect(result).to.equal(num);
		});
		it('should round up an integer', function () {
			significance = 100;
			num = 1;
			const result = NumberUtils.round(num, significance);
			expect(result).to.equal(100);
		});
		it('should round up a float', function () {
			significance = 100;
			num = 100.5;
			const result = NumberUtils.round(num, significance);
			expect(result).to.equal(200);
		});
		it('should round to a higher absolute value', function () {
			significance = 100;
			num = -50;
			const result = NumberUtils.round(num, significance);
			expect(result).to.equal(-100);
		});
	});
});
