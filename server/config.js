require('babel-polyfill')

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development']

module.exports = Object.assign({
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 8080,
  DEBUG_API: true,
  debugTrace: true,
  expressLogging: false,
  expressLoggingError: true,
  apiHost: process.env.APIHOST || 'localhost',
  apiPort: process.env.APIPORT,
  app: {
    title: 'theBasis',
    description: 'Simple application',
	},
	security: {
		on: true, //true - authentication сhecking, false - no checking access grants
		accessTokenExpires: 60 * 60,
		refreshTokenExpires: 60 * 60 * 60,
		codeTokenExpires: 5 * 60,
		securityScenarios: 'ResourceOwnerPasswordCredentials' //ResourceOwnerPasswordCredentials, AuthorizationCode
	}
}, environment)
