require('babel-polyfill');

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development'];

module.exports = Object.assign({
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 8080,
  apiHost: process.env.APIHOST || 'localhost',
  apiPort: process.env.APIPORT,
  DEBUG_API: true,
  app: {
    title: 'theBasis',
    description: 'Simple application',
  }
}, environment);
