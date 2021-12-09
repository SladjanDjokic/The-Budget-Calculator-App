import chai from 'chai';
import { ObjectUtils } from '../../utils/utils';
const expect = chai.expect;

describe('Object utilities', () => {
	describe('Deep clone an object', () => {
		it("should recreate an object's properties", () => {
			const originalObject = {
				firstProp: 10,
				secondProp: 'abc'
			};
			const copiedObject: typeof originalObject = ObjectUtils.deepClone(originalObject);
			expect(copiedObject).to.haveOwnProperty('firstProp', originalObject.firstProp);
			expect(copiedObject).to.haveOwnProperty('secondProp', originalObject.secondProp);
			expect(copiedObject).to.eql(originalObject);
		});
		it('should recreate nested objects', () => {
			const originalObject = {
				firstProp: 10,
				secondProp: 'abc',
				innerObject: {
					firstInnerProp: 987
				}
			};
			const copiedObject: typeof originalObject = ObjectUtils.deepClone(originalObject);
			expect(copiedObject).to.haveOwnProperty('firstProp', originalObject.firstProp);
			expect(copiedObject)
				.to.haveOwnProperty('innerObject')
				.with.ownProperty('firstInnerProp', originalObject.innerObject.firstInnerProp);
			expect(copiedObject).to.eql(originalObject);
		});
		it('should recreate an array', () => {
			const originalArray = [1, 3, 5];
			const copiedArray: typeof originalArray = ObjectUtils.deepClone(originalArray);
			expect(copiedArray).to.be.an('array').with.length(originalArray.length);
			expect(copiedArray).to.include.members(originalArray);
			expect(copiedArray).to.eql(originalArray);
		});
		it('should recreate an array of objects', () => {
			const originalArray = [{ firstProp: 1 }, { firstProp: 2 }, { firstProp: 3 }];
			const copiedArray: typeof originalArray = ObjectUtils.deepClone(originalArray);
			expect(copiedArray).to.be.an('array').with.length(originalArray.length);
			expect(copiedArray[0])
				.to.be.an('object')
				.with.ownProperty('firstProp')
				.that.equals(originalArray[0].firstProp);
			expect(copiedArray).to.deep.include.members(originalArray);
		});
		it('should recreate an array of arrays', () => {
			const originalArray = [[1, 3, 5], [4, 6], [99]];
			const copiedArray: typeof originalArray = ObjectUtils.deepClone(originalArray);
			expect(copiedArray).to.be.an('array').with.length(originalArray.length);
			for (let i = 0; i < originalArray.length; i++) {
				expect(copiedArray[i]).to.be.an('array').with.members(originalArray[i]);
			}
			expect(copiedArray).to.deep.include.members(originalArray);
		});
		it('should recreate an object property that is an array', () => {
			const originalObject = {
				firstProp: 10,
				arrayProp: [5, 10, 15]
			};
			const copiedObject: typeof originalObject = ObjectUtils.deepClone(originalObject);
			expect(copiedObject)
				.to.haveOwnProperty('arrayProp')
				.that.is.an('array')
				.with.members(originalObject.arrayProp);
			expect(copiedObject).to.eql(originalObject);
		});
		it('should recreate an object property that is an array of objects', () => {
			const originalObject = {
				firstProp: 10,
				arrayProp: [{ innerProp: 1 }, { innerProp: 2 }, { innerProp: 3 }]
			};
			const copiedObject: typeof originalObject = ObjectUtils.deepClone(originalObject);
			expect(copiedObject).to.haveOwnProperty('arrayProp').that.is.an('array');
			expect(copiedObject.arrayProp[0]).to.haveOwnProperty('innerProp', originalObject.arrayProp[0].innerProp);
			expect(copiedObject).to.eql(originalObject);
		});
	});
	describe('Compound key dedupe', () => {
		type MultikeyObject = {
			propString: string;
			propNumber: number;
			propBoolean: boolean;
		};
		it('should remove exact duplicates', () => {
			const originalArray: MultikeyObject[] = [
				{
					propString: 'string',
					propNumber: 1,
					propBoolean: true
				},
				{
					propString: 'string',
					propNumber: 1,
					propBoolean: true
				}
			];
			const result = ObjectUtils.multiPropDedupe(originalArray, 'propString', 'propNumber', 'propBoolean');
			expect(result.length).to.equal(1);
		});
		it('should not filter without any properties', () => {
			const originalArray: MultikeyObject[] = [
				{
					propString: 'string',
					propNumber: 1,
					propBoolean: true
				},
				{
					propString: 'string',
					propNumber: 1,
					propBoolean: true
				}
			];
			const result = ObjectUtils.multiPropDedupe(originalArray);
			expect(result.length).to.equal(originalArray.length);
		});
		it('should remove duplicates on one property', () => {
			const originalArray: MultikeyObject[] = [
				{
					propString: 'string',
					propNumber: 1,
					propBoolean: true
				},
				{
					propString: 'something completely different',
					propNumber: 1,
					propBoolean: false
				},
				{
					propString: 'yet another thing',
					propNumber: 1,
					propBoolean: true
				}
			];
			const result = ObjectUtils.multiPropDedupe(originalArray, 'propNumber');
			expect(result.length).to.equal(1);
		});
		it('should remove duplicates on multiple properties', () => {
			const originalArray: MultikeyObject[] = [
				{
					propString: 'string',
					propNumber: 1,
					propBoolean: true
				},
				{
					propString: 'something completely different',
					propNumber: 1,
					propBoolean: true
				},
				{
					propString: 'yet another thing',
					propNumber: 1,
					propBoolean: false
				}
			];
			const result = ObjectUtils.multiPropDedupe(originalArray, 'propNumber', 'propBoolean');
			expect(result.length).to.equal(2);
		});
	});
	describe('Prune an array in place', () => {
		it('should return the elements that don\t match', () => {
			const originalArray = [1, 2, 3, 4];
			const criterion = function (num: number) {
				return num % 2 === 0;
			};
			const removedElements = ObjectUtils.pruneInPlace(originalArray, criterion);
			expect(removedElements).to.have.lengthOf(2).and.members([1, 3]);
			expect(originalArray).to.have.lengthOf(2).and.members([2, 4]);
		});
	});
});
