import CronTask from './CronTask';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

class CronTaskList {
	private taskList: CronTask[] = [];

	startCronTasks() {
		// Dynamically import tasks that self register to the task list
		fs.readdirSync(path.join(__dirname, 'tasks')).forEach(async (taskFile) => {
			// The following try / catch block fixes an issue when looking for the map file giving an exception thrown
			try {
				let TaskImport = await import(path.join(__dirname, 'tasks', taskFile));
				new TaskImport.default();
			} catch (e) {}
		});
	}

	register(task: CronTask) {
		logger.info('CRON: Registering Task: ' + task.getName());
		this.taskList.push(task);
	}
}

let cronTaskList = new CronTaskList();
export default cronTaskList;
