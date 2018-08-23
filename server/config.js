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
		accessTokenExpires: 60 * 15, //15 min
		refreshTokenExpires: 60 * 60, //1 hour
		codeTokenExpires: 60 * 60, //1 hour
		jwtTokenExpires: 20, //24 hours
		//must be: ResourceOwnerPasswordCredentials, AuthorizationCode
		securityScenarios: ['ResourceOwnerPasswordCredentials'],
		//must be: local, basic, bearer, client-basic, oauth2-client-password, jwt
		securityStrategy: ['client-basic', 'oauth2-client-password', 'jwt'],
		//if jwtOn=false, then in securityStrategy must be add 'bearer'
		//if jwtOn=true, then in securityStrategy must be add 'jwt' instead 'bearer'
		jwtOn: true
	}
}, environment)
