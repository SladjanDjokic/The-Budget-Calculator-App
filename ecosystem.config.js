// this file is used for pm2 deployment
module.exports = {
	apps: [
		{
			name: 'dev-rest',
			script: 'dist/app.js',
			wait_ready: true,
			kill_timeout: 10000,
			listen_timeout: 10000,
			// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
			args: '',
			// instances: 'max',
			// exec_mode: 'cluster',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'development',
				PM2_KILL_TIMEOUT: 10000
			}
		},
		{
			name: 'qa-rest',
			script: 'dist/app.js',
			wait_ready: true,
			kill_timeout: 10000,
			listen_timeout: 10000,
			// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
			args: '',
			// instances: 'max',
			// exec_mode: 'cluster',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'development',
				PM2_KILL_TIMEOUT: 10000
			}
		},
		{
			name: 'uat-rest',
			script: 'dist/app.js',
			wait_ready: true,
			kill_timeout: 10000,
			listen_timeout: 10000,
			// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
			args: '',
			// instances: 'max',
			// exec_mode: 'cluster',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				PM2_KILL_TIMEOUT: 10000
			}
		},
		{
			name: 'prod-rest',
			script: 'dist/app.js',
			wait_ready: true,
			kill_timeout: 10000,
			listen_timeout: 10000,
			// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
			args: '',
			// instances: 'max',
			// exec_mode: 'cluster',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				PM2_KILL_TIMEOUT: 10000
			}
		}
	]
};
