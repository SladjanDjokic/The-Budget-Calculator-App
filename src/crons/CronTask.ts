export interface CronTaskStats {
	runCount: number;
	averageRunTime: number;
	lastRunTime: undefined | Date;
}

export default abstract class CronTask {
	private runCount = 0;
	private totalRunTime = 0;
	private averageRunTime = 0;
	private lastRunTime: undefined | Date;
	private taskStartTime = 0;

	getStats(): CronTaskStats {
		return {
			runCount: this.runCount,
			averageRunTime: this.averageRunTime,
			lastRunTime: this.lastRunTime
		};
	}

	// Must be implemented by concrete classes
	abstract getName(): string;

	protected startTaskTimer() {
		this.taskStartTime = Date.now();
	}

	protected endTaskTimer() {
		this.totalRunTime += Date.now() - this.taskStartTime;
		this.runCount++;
		this.averageRunTime = this.totalRunTime / this.runCount;
		this.lastRunTime = new Date();
	}
}
