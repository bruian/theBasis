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

	this.message = ''
	this.status = status

	if (typeof(data) === 'object') {
		log.error(data)

		this.nativeError = data
		if (data.message) this.message = data.message
		if(data.status) this.status = data.status
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
		log.error(message)

		this.nativeError = message
		this.message = message.message
		this.status = 500
	} else {
		this.message = message
		this.status = 400
	}
	this.name = 'MongoCacheError'
}
MongoCacheError.prototype = Object.create(Error.prototype)

function PgError(message) {
	Error.call(this)

	if (typeof(message) === 'object') {
		log.error(message)

		this.nativeError = message
		this.message = message.message
		this.status = 500
	} else {
		this.message = message
		this.status = 400
	}
	this.name = 'PgError'
}
PgError.prototype = Object.create(Error.prototype)

function SrvError(message) {
	Error.call(this)

	this.status = 500
	log.error(message)
	if (typeof(message) === 'object') {
		this.nativeError = message
		this.message = message.message
	} else {
		this.message = message
	}
	this.name = 'SrvError'
}
SrvError.prototype = Object.create(Error.prototype)

exports.AuthError = AuthError
exports.MongoCacheError = MongoCacheError
exports.PgError = PgError
exports.SrvError = SrvError
