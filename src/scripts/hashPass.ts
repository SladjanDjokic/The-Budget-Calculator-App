/**********************************************
 * Example:
 * yarn hash dendi
 *
 * Hashing pasword: dendi
 * $2a$10$g9/SuHftyF1.RDRgiaM6EexSb5ZVx3Nhxxx1WoyEEljKIMBxtDKAG
 * ✨  Done in 0.47s.
 *
 **********************************************/

import SparkMD5 from 'spark-md5';
import bcrypt from '../utils/bcrypt';
(async () => {
	if (process.argv.length != 3) {
		console.error('Missing argument: password');
		process.exit(1);
	}
	console.log('Hashing password: ' + process.argv[2]);
	let md5Hash = SparkMD5.hash(process.argv[2]);
	console.log(`MD5 - ${md5Hash}`);
	let finalHash = await bcrypt.hash(md5Hash, null);
	console.log(finalHash);
})();
