/**
 * This is a helper class for dealing with Objects and Arrays
 *
 *  METHODS
 *  -----------
 *  filter
 *  filter_date
 *  group
 *  search
 *  to_array
 *  to_obj
 *  copy
 *  sort
 *  sort_multi
 */
const objUtils = new (function () {
	/**
	 * Filters an object based on a specific property and value. Leaving the value empty
	 * will just check that the property exists on the object.
	 * @param dataset - The dataset to filter
	 * @param column - The column to filter against
	 * @param value - The value to compare with
	 * @returns {Array}
	 */
	this.filter = function (dataset, column, value) {
		let res = [];
		if (value) {
			for (let i in dataset) {
				if (dataset[i][column] && dataset[i][column] === value) res.push(dataset[i]);
			}
		} else {
			for (let i in dataset) {
				if (dataset[i][column]) res.push(dataset[i]);
			}
		}
		return res;
	};

	/**
	 * Filters an object based on a start and end date.
	 * @param dataset - The dataset to filter
	 * @param column - The column to filter against. (Numeric value)
	 * @param start_date - The start date of the filter. (Numeric value)
	 * @param end_date - The end date of the filter. (Numeric value)
	 * @returns {Array}
	 */
	this.filter_date = function (dataset, column, start_date, end_date) {
		let res = [];
		for (let i in dataset) {
			if (dataset[i][column] && dataset[i][column] > start_date && dataset[i][column] < end_date)
				res.push(dataset[i]);
		}
		return res;
	};

	/**
	 * Groups a dataset by a property.
	 * @param dataset - The dataset to group
	 * @param property - The property to group by
	 * @returns {Object}
	 */
	this.group = function (dataset, property) {
		let res = {};
		for (let i in dataset) {
			if (!res[dataset[i][property]]) res[dataset[i][property]] = [];

			res[dataset[i][property]].push(dataset[i]);
		}
		return res;
	};

	/**
	 * Search a property or list of properties within a dataset
	 * @param dataset - The dataset to search
	 * @param properties - The property/properties to search. Input string or array of strings.
	 * @param search - The string to search
	 * @returns {Array}
	 */
	this.search = function (dataset, properties, search) {
		if (Array.isArray(search)) return this.searchArr(dataset, properties, search);
		search = search.toLowerCase();
		if (typeof properties === 'string') properties = [properties];

		let res = [];
		for (let i in dataset) {
			for (let r in properties) {
				if (
					dataset[i][properties[r]] &&
					(dataset[i][properties[r]] + '').toLowerCase().indexOf(search) !== -1
				) {
					res.push(dataset[i]);
					break;
				}
			}
		}
		return res;
	};

	this.searchArr = (dataset, column, searchArr) => {
		let res = [];
		for (let i in dataset) {
			if (searchArr.includes(dataset[i][column] + '')) {
				res.push(dataset[i]);
			}
		}
		return res;
	};

	/**
	 * Converts an obj to an array.
	 * @param obj - The object to convert
	 * @returns {Array}
	 */
	this.to_array = function (obj) {
		let res = [];
		for (let i in obj) {
			res.push(obj[i]);
		}
		return res;
	};

	/**
	 * Converts an array to an object or resorts an object using a new key.
	 * @param array - The array or object to have mapped
	 * @param property - The property to use as the new key
	 * @returns {Object}
	 */
	this.to_obj = function (array, property) {
		let res = {};
		for (let i in array) {
			if (array[i] === null) continue;
			res[array[i][property]] = array[i];
		}
		return res;
	};

	/**
	 * Returns a deep copy of an object. This does not work with recursive objects or functions.
	 * @param obj - The object to copy
	 * @returns {Object}
	 */
	this.copy = function (obj) {
		try {
			return JSON.parse(JSON.stringify(obj));
		} catch (e) {
			console.error(e);
			return null;
		}
	};

	/**
	 * Updates an the properties of an object based on a new objects properties and values
	 * @param obj - The object to update
	 * @param newObj - The new object to use as the updates
	 * @returns {Object}
	 */
	this.update = function (obj, newObj) {
		for (let i in newObj) {
			obj[i] = newObj[i];
		}
		return obj;
	};

	/**
	 * Sorts an object or array based on a property and direction
	 * @param dataset - The dataset to sort
	 * @param property - The property to sort by
	 * @param reverse - Sort in reverse direction
	 */
	this.sort = function (dataset, property, reverse) {
		if (dataset.constructor !== Array) {
			dataset = objUtils.to_array(dataset);
		}

		dataset.sort(Sort(property, reverse));
		return dataset;
	};

	/**
	 * Sorts and object or array based on multi properties and direction
	 * @param dataset - The dataset to sort
	 * @param properties - The properties to sort. (Array or properties)
	 * @param reverse - Sort in reverse direction
	 */
	this.sort_multi = function (dataset, properties, reverse) {
		if (dataset.constructor !== Array) {
			dataset = objUtils.to_array(dataset);
		}

		dataset.sort(SortMultiple(properties, reverse));
		return dataset;
	};

	/**
	 * Determines if an object is empty or not
	 * @param dataset - The dataset to check
	 */
	this.is_empty = function (dataset) {
		for (let i in dataset) {
			return false;
		}
		return true;
	};

	/**
	 * Determines the number of element in the dataset
	 * @param dataset - The dataset to count
	 */
	this.count = function (dataset) {
		let count = 0;
		// eslint-disable-next-line
		for (let i in dataset) {
			count++;
		}
		return count;
	};

	this.isEmpty = function (obj) {
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) return false;
		}
		return true;
	};

	/***********************************************
	 *
	 *              Local Helper Methods
	 *
	 ***********************************************/

	function Sort(prop, rev) {
		let sortOrder = 1;
		if (rev) {
			sortOrder = -1;
		}
		return function (a, b) {
			let result = a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0;
			return result * sortOrder;
		};
	}

	function SortMultiple(properties, reverse) {
		/*
		 * save the arguments object as it will be overwritten
		 * note that arguments object is an array-like object
		 * consisting of the names of the properties to sort by
		 */
		let props = properties;
		return function (obj1, obj2) {
			let i = 0,
				result = 0,
				numberOfProperties = props.length;
			/* try getting a different result from 0 (equal)
			 * as long as we have extra properties to compare
			 */
			while (result === 0 && i < numberOfProperties) {
				result = Sort(props[i], reverse)(obj1, obj2);
				i++;
			}
			return result;
		};
	}
})();

export default objUtils;
