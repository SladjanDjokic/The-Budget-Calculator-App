import axios from 'axios';
import { StringUtils } from '../utils/utils';
import fs from '../utils/fs';
import path from 'path';

const projectId = 23057003;
const gitLabAccessToken = '8swxgB5UqePtrzGxkmbc';
const typeFiles = ['api.d.ts', 'models.d.ts', 'redsky.d.ts'];

interface GitlabResponse {
	file_name: string;
	file_path: string;
	size: number;
	encoding: 'base64';
	content_sha256: string;
	ref: string;
	blob_id: string;
	commit_id: string;
	last_commit_id: string;
	content: string;
}

(async function () {
	for (let file of typeFiles) {
		const projectDetailResponse: GitlabResponse = (
			await axios.get(
				`https://gitlab.com/api/v4/projects/${projectId}/repository/files/src%2F%40types%2F${file}?ref=master`,
				{
					headers: {
						'private-token': gitLabAccessToken
					}
				}
			)
		).data;
		const decodedFile = StringUtils.atob(projectDetailResponse.content);
		await fs.writeFile(path.join(__dirname, `../../src/@types/${projectDetailResponse.file_name}`), decodedFile);
	}
})();
