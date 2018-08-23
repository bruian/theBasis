function AuthError(message, code, uri, status) {
	Error.call(this)

	if (!status) {
		switch (code) {
			case 'invalid_request': status = 400; break;
			case 'invalid_data': status = 400; break;
		}
	}

	this.message = message
	this.code = code || 'server_error'
	this.uri = uri
	this.status = status || 500
	this.name = 'AuthError'
}

AuthError.prototype = Object.create(Error.prototype)

exports.AuthError = AuthError
