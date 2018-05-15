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
  apiUrl: 'http://devise-token-auth.dev',
  DEBUG_API: true,
  debugTrace: true,
  expressLogging: false,
  expressLoggingError: true,
  security: {
    tokenLife : 3600
  },
  apiHost: process.env.APIHOST || 'localhost',
  apiPort: process.env.APIPORT,
  app: {
    title: 'theBasis',
    description: 'Simple application',
  }
}, environment)
