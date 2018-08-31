const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

function AuthError(data, code, uri, status) {
	Error.call(this)

	if (!status) {
		switch (code) {
			case 'invalid_request': status = 400; break;
			case 'invalid_data': status = 400; break;
			case 'invalid_verification': status = 400; break;
		}
	}

	if (typeof(data) === 'object') {
		log.error(data)

		this.errorObj = data
	} else {
		log.debug(data)

		this.message = data
		this.code = code || 'server_error'
		this.uri = uri
		this.status = status || 500
	}
	this.name = 'AuthError'
}
AuthError.prototype = Object.create(Error.prototype)

function MongoCacheError(message) {
	Error.call(this)

	if (typeof(message) === 'object') {
		this.message = message.message
	} else {
		this.message = message
	}
	this.name = 'MongoCacheError'
}
MongoCacheError.prototype = Object.create(Error.prototype)

exports.AuthError = AuthError
exports.MongoCacheError = MongoCacheError
