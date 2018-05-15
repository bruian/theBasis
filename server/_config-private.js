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
  mongoose: {
    uri: 'insert this mongodb connection string'
    // for example 'mongodb://<userDB>:<password>@<server>:<port>/<database>'
    // try use https://mlab.com/
  },
}, environment);
