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
    // for example uri: 'mongodb://<userDB>:<password>@<server>:<port>/<database>'
    // try use https://mlab.com/
	},
  security: {
		sessionSecret: 'insert this your server session secret key'
		// for example sessionSecret: 'fjdkajjfiajfjapfjakdfja;'
	}
}, environment);
