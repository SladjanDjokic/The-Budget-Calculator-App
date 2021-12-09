class Utils {
	wrapAsync = (fn) => {
		return (req, res, next) => {
			// Make sure to `.catch()` any errors and pass them along to the `next()`
			// middleware in the chain, in this case the error handler.
			fn(req, res, next).catch(next);
		};
	};

	getDomain(url: string): string {
		if (!url) return '';
		// The Node URL class doesn't consider it a valid url without http or https. Add if needed
		if (url.indexOf('http') === -1) url = 'http://' + url;
		let hostname = new URL(url).hostname;
		//		if (hostname === 'localhost') return 'localhost';
		if (hostname.includes('ontrac')) {
			return hostname.split('.')[0];
		}
		// Remove all subdomains
		let hostnameSplit = hostname.split('.').slice(-2);
		return hostnameSplit.join('.');
	}

	client_to_server_date(dt) {
		return dt.toISOString().substring(0, 10);
	}

	client_to_server_datetime(dt) {
		return dt.toISOString().slice(0, 19).replace('T', ' ');
	}

	db_now() {
		return this.client_to_server_datetime(new Date());
	}

	generateColor() {
		return '#' + Math.random().toString(16).substr(-6);
	}

	generateCode(len) {
		let mask = '';
		let result = '';
		let length = len || 6;
		let chars = 'A#a';

		if (chars.indexOf('a') > -1) mask += 'abcdefghijkmnpqrstuvwxyz';
		if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKMNPQRSTUVWXYZ';
		if (chars.indexOf('#') > -1) mask += '23456789';

		for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
		return result;
	}

	createGuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0,
				v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	toQueryString(obj) {
		var str = [];
		for (let p in obj)
			if (obj.hasOwnProperty(p)) {
				str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
			}
		return '?' + str.join('&');
	}

	parseJSON(json) {
		try {
			return JSON.parse(json);
		} catch (e) {
			return json || {};
		}
	}

	formatMoney(n, c?: any, d?: any, t?: any) {
		n = parseFloat(<any>(n / 100));
		var c = isNaN((c = Math.abs(c))) ? 2 : c,
			d = d == undefined ? '.' : d,
			t = t == undefined ? ',' : t,
			s = n < 0 ? '-' : '',
			i = <any>String(parseInt((n = Math.abs(Number(n) || 0).toFixed(c)))),
			j = (j = i.length) > 3 ? j % 3 : 0;

		let value =
			s +
			(j ? i.substr(0, j) + t : '') +
			i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
			(c
				? d +
				  Math.abs(n - i)
						.toFixed(c)
						.slice(2)
				: '');
		return '$' + value;
	}

	variantHTML(product, price_cents) {
		return `    <div style="
    display: flex;
    margin-left: 90px;
    margin-right: 30px;
"><img alt="dress"
       src="${product.image_url}"
       class="" style="
    display: inline-block;
    max-width: 150px;
    max-height: 150px;
">
        <div style="
    padding: 10px;
    min-width: 110px; 
">
            <div style="
    margin-bottom: 24px;
    text-align: left;
">${this.formatMoney(price_cents)}
            </div>
            <div style="
    margin-bottom: 5px;
    text-align: left;
">SIZE: ${escape(product.size)}
            </div>
            <div style="margin-bottom: 5px;text-align: left;">ITEM: ${product.sku}
            </div>
            <div style="
    margin-bottom: 5px;
    text-align: left;
">QUANTITY: ${escape(product.cart_quantity)}
            </div>
        </div>
    </div>
`;
	}

	convertToDateTime(epochTime) {
		if (this.isNumber(epochTime)) return this.client_to_server_datetime(new Date(epochTime));
		if (Number.isNaN(parseInt(epochTime))) return this.client_to_server_datetime(new Date());
		let epoch = parseInt(epochTime);
		return this.client_to_server_datetime(new Date(epoch));
	}

	isNumber(n) {
		if (this.isInt(n) || this.isFloat(n)) {
			return true;
		}
	}

	isInt(n) {
		return Number(n) === n && n % 1 === 0;
	}

	isFloat(n) {
		return Number(n) === n && n % 1 !== 0;
	}

	removeUserErrorFromEmail(email) {
		if (!email) return email;
		return email.toLowerCase().trim().replace('mailto:', '').replace('.con', '.com');
	}

	isMainProcess() {
		var os = require('os');
		var hostname = os.hostname();
		if (
			(hostname === 'piphany-rest-1' || hostname == 'piphany-rest-sandbox') &&
			process.env.NODE_APP_INSTANCE == '0'
		) {
			return true;
		}
		return false;
	}

	isEmptyObject(obj) {
		// null and undefined are "empty"
		if (obj == null) return true;

		// Assume if it has a length property with a non-zero value
		// that that property is correct.
		if (obj.length && obj.length > 0) return false;
		if (obj.length === 0) return true;

		return !Object.keys(obj).length;
	}

	isValidEmail(email) {
		var re = /^([\w-]+([\+)(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		return re.test(email);
	}

	toData(obj) {
		if (obj && obj.data) {
			return obj.data;
		}
		return obj;
	}

	formatMoneyCents(value, show_commas) {
		value = parseFloat(value) / 100;
		if (show_commas) return '$' + this.numberWithCommas(value.toFixed(2));
		return '$' + value.toFixed(2);
	}

	numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	testRegex(regex, value) {
		regex = new RegExp(regex);
		return regex.test(value);
	}
}

export const utils = new Utils();
