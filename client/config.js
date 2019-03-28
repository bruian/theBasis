// require('babel-polyfill');

const environment = {
	development: {
		isProduction: false
	},
	production: {
		isProduction: true
	}
}[process.env.NODE_ENV || 'development'];

module.exports = Object.assign(
	{
		ssl: true, // dev: true, prod: false
		apiHost: process.env.API_HOST || 'intask.me', // dev:127.0.0.1, prod:intask.me
		apiPort: process.env.API_PORT || 3001,
		apiWOPort: process.env.WOPORT || true, // dev:false, prod:true
		authHost: process.env.AUTHOST || 'intask.me', // dev:192.168.1.40, prod:intask.me
		authPort: process.env.AUTHPORT || 3000,
		authWOPort: process.env.WOPORT || true, // dev:false, prod:true
		activeRegistration: false,
		DEBUG_API: process.env.DEBUG_API || false, // dev: true, prod:false
		app: {
			title: 'inTask.me',
			description: 'Incredible taskmanager'
		}
	},
	environment
);
