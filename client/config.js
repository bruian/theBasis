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
		apiHost: process.env.API_HOST || 'intask.me', // 127.0.0.1
		apiPort: process.env.API_PORT || 3001,
		apiWOPort: process.env.WOPORT || true,
		authHost: process.env.AUTHOST || 'intask.me', // 178.32.120.216
		authPort: process.env.AUTHPORT || 3000,
		authWOPort: process.env.WOPORT || true,
		activeRegistration: false,
		DEBUG_API: process.env.DEBUG_API || true,
		app: {
			title: 'inTask.me',
			description: 'Incredible taskmanager'
		}
	},
	environment
);
