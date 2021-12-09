export default class AgendaMock {
	nowCalledCount: number = 0;
	defineCalledCount: number = 0;
	scheduleCalledCount: number = 0;

	lastJobNameCalled: string = '';
	lastAgendaData: any;
	lastScheduleTime: string | Date = '';

	define() {
		this.defineCalledCount++;
	}
	purge() {}
	now(jobName, data) {
		this.lastJobNameCalled = jobName;
		this.lastAgendaData = data;
		this.nowCalledCount++;
	}
	schedule(when, jobName, data) {
		this.lastScheduleTime = when;
		this.lastJobNameCalled = jobName;
		this.lastAgendaData = data;
		this.scheduleCalledCount++;
	}
	every() {}
	resetCounts() {
		this.nowCalledCount = 0;
		this.defineCalledCount = 0;
		this.scheduleCalledCount = 0;
	}
}
