import httpShutDown from 'http-shutdown';
import server from '../../app';

const app = httpShutDown(server);

// ROOT-LEVEL hook before()
before((done) => {
	app.on('app_started', () => {
		done();
	});
});

// ROOT-LEVEL hook after()
after((done) => {
	app.shutdown(() => {});
	done();
});
