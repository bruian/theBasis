require('babel-polyfill');

const environment = {
	development: {
		isProduction: false,
	},
	production: {
		isProduction: true,
	},
}[process.env.NODE_ENV || 'development'];

module.exports = Object.assign(
	{
		host: process.env.HOST || 'localhost',
		port: process.env.PORT || 8080,
		apiHost: process.env.APIHOST || '127.0.0.1',
		apiPort: process.env.APIPORT || 3001,
		authHost: process.env.AUTHOST || '127.0.0.1', // 178.32.120.216
		authPort: process.env.AUTHPORT || 3000,
		DEBUG_API: true,
		app: {
			title: 'inTask.me',
			description: 'Incredible taskmanager',
		},
	},
	environment,
);
