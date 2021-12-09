import fs from '../../utils/fs';
import path from 'path';
import hbjs from 'handbrake-js';

let encode = async function (localPath, deleteOnComplete) {
	let name = path.basename(localPath);
	let ext = path.extname(name);
	let dir = path.dirname(localPath);
	name = name.replace(ext, '');
	let finalPath = path.join(dir, name + '_enc.m4v');

	console.log('Begin Encoding: ' + localPath);
	let data = await Encode(localPath, finalPath);
	console.log('Complete Encoding: ' + localPath);
	if (deleteOnComplete) {
		fs.unlink(localPath).catch(console.error);
		console.log('Removed Encoded File: ' + localPath);
	}
	return {
		initial_path: localPath,
		path: finalPath,
		raw_data: data
	};
};

function Encode(inputFile, outputFile) {
	let options = {
		input: inputFile,
		output: outputFile,
		preset: 'Fast 1080p30'
	};

	return new Promise((resolve, reject) => {
		hbjs.spawn(options)
			.on('error', reject)
			.on('complete', resolve as () => void);
	});
}

module.exports = {
	encode
};
