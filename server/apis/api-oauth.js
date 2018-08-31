import express from 'express'
import passport from 'passport'

const srvPath = process.cwd() + '/server/'

const log               = require(srvPath + 'log')(module)
const utils							= require(srvPath + 'utils')
const configPrivate     = require(srvPath + 'config-private')
const config						= require(srvPath + 'config')
const UserModel         = require(srvPath + 'model/user')
const ClientModel       = require(srvPath + 'model/client')
const GrantCodeModel		= require(srvPath + 'model/grantCode')
const AccessTokenModel  = require(srvPath + 'model/accessToken')
const RefreshTokenModel = require(srvPath + 'model/refreshToken')
const LocalStrategy			= require('passport-local').Strategy
const BasicStrategy 		= require('passport-http').BasicStrategy
const BearerStrategy    = require('passport-http-bearer').Strategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy

import jwt							from 'jsonwebtoken'
import passportJWT			from 'passport-jwt'
import crypto           from 'crypto'
import oauth2orize      from 'oauth2orize'
import { AuthError }		from '../errors'

//*** Create OAuth 2.0 server */
const router = express.Router()
const server = oauth2orize.createServer()
//const TokenError = oauth2orize.TokenError
const accessExpiresIn = { expires_in: config.security.accessTokenExpires }
const jwtExpiresIn = { expiresIn: config.security.jwtTokenExpires }
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

//TODO : place it in util functions
const calculateExpirationDate = (expIn) => new Date(Date.now() + (expIn * 1000))

/** Register serialialization and deserialization functions.
 *
 * When a client redirects a user to user authorization endpoint, an
 * authorization transaction is initiated.  To complete the transaction, the
 * user must authenticate and approve the authorization request.  Because this
 * may involve multiple HTTPS request/response exchanges, the transaction is
 * stored in the session.
 *
 * An application must supply serialization functions, which determine how the
 * client object is serialized into the session.  Typically this will be a
 * simple matter of serializing the client's ID, and deserializing by finding
 * the client by ID from the database.
*/
passport.serializeUser((user, done) => {
	log.debug('🔑  serializeUser user.id: ${user.id}')

	done(null, user.id)
})

passport.deserializeUser((id, done) => {
	log.debug('🔑  deserializeUser atempt user.id: ${id}')

	UserModel.findOne({ id: id }, (err, user) => {
    if (err) return done(new AuthError(err))
    if (!user) return done(null, false)

    log.debug('🔑  deserializeUser success user.id: ${id}, user.username: ${user.username}')
    return done(null, user)
  })
})

//*** Serialize and deserialize client session */
server.serializeClient((client, done) => {
	log.debug('🔑  serializeClient client.id: ${client.id}')

	done(null, client.id)
})

server.deserializeClient((id, done) => {
	log.debug('🔑  deserializeClient atempt client.id: ${id}')

	ClientModel.findOne({ id: id }, (err, client) => {
    if (err) return done(new AuthError(err))
    if (!client) return done(null, false)

    log.debug('🔑  deserializeClient success client.id: ${id}, client.name: ${client.name}')
    return done(null, client)
  })
})

async function createToken(data, tokenType) {
  try {
		const tokens = []

		if (tokenType === 'access' || tokenType === 'both') {
			await AccessTokenModel.findOneAndRemove({ clientId: data.clientId, userId: data.userId })

			const accessTokenData = Object.assign({}, data)
			accessTokenData.value = crypto.randomBytes(32).toString('hex')
			accessTokenData.expiration = calculateExpirationDate(config.security.accessTokenExpires)
			let token = new AccessTokenModel(accessTokenData)
			await token.save()
			tokens.push(accessTokenData)
		}

		if (tokenType === 'refresh' || tokenType === 'both') {
			await RefreshTokenModel.findOneAndRemove({ clientId: data.clientId, userId: data.userId })

			const refreshTokenData = Object.assign({}, data)
			refreshTokenData.value = crypto.randomBytes(32).toString('hex')
			refreshTokenData.expiration = calculateExpirationDate(config.security.refreshTokenExpires)
			let token = new RefreshTokenModel(refreshTokenData)
			await token.save()
			tokens.push(refreshTokenData)
		}

		if (tokenType === 'jwt') {
			data.expiration = calculateExpirationDate(config.security.jwtTokenExpires)
			const accessTokenData = Object.assign({}, data)
			accessTokenData.value = jwt.sign(data, configPrivate.security.sessionSecret, jwtExpiresIn)
			accessTokenData.expiration = data.expiration
			tokens.push(accessTokenData)
		}

    log.debug(`🔑  generateTokens -> Generated new tokens for client.id: ${data.clientId} and user.id: ${data.userId} =tokens: ${tokens}`)
    return tokens
  } catch (err) {
		throw err
	}
}

/**
 * Grant authorization codes
 *
 * The callback takes the `client` requesting authorization, the `redirectURI`
 * (which is used as a verifier in the subsequent exchange), the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a code,
 * which is bound to these values, and will be exchanged for an access token.
*/
server.grant(oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
	log.debug(`🔑  grant.code atempt for client: ${client.id}=${client.name} and user: ${user.id}=${user.username}`)
	//const token = createToken({ sub: user.id, expires_in: config.security.codeTokenExpires })
	const codeValue = crypto.randomBytes(16).toString('hex')

	const code = new GrantCodeModel({
		value: codeValue,
		redirectUri: redirectUri,
		userId: user.id,
		clientId: client.id,
		scope: client.scope
	})

	code.save((err) => {
		if (err) return done(new AuthError(err))

		log.debug(`🔑  grant.code.value: ${codeValue} success for client: ${client.id}=${client.name} and user: ${user.id}=${user.username}`)
		done(null, codeValue)
	})
}))

/**
 * Grant implicit authorization.
 *
 * The callback takes the `client` requesting authorization, the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a token,
 * which is bound to these values.
*/
server.grant(oauth2orize.grant.token((client, user, ares, done) => {
	log.debug(`🔑  grant.token atempt for client: ${client.id}=${client.name} and user: ${user.id}=${user.username}`)

	//const token = createToken({ sub: user.id, exp: config.security.accessTokenExpires })
	createToken({
		userId: user.id,
		clientId: client.id,
		scope: client.scope
	}, 'access')
	.then((tokens) => {
		log.debug(`🔑  grant.token.value: ${tokens[0].value} success for client: ${client.id}=${client.name} and user: ${user.id}=${user.username}`)

		done(null, tokens[0].value, accessExpiresIn)
	})
	.catch((err) => {
		done(new AuthError(err))
	})
}))

/**
 * Exchange authorization codes for access tokens.
 *
 * The callback accepts the `client`, which is exchanging `code` and any
 * `redirectURI` from the authorization request for verification.  If these values
 * are validated, the application issues an access token on behalf of the user who
 * authorized the code.
*/
server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) => {
	log.debug(`🔑  exchange.code atempt for client: ${client.id}=${client.name} and code: ${code}`)

	GrantCodeModel.findOne({ value: code }, (err, authCode) => {
		if (err) return done(new AuthError(err))
		if (authCode === undefined) return done(null, false)
		if (client.id.toString() !== authCode.clientId) return done(null, false)
		if (redirectUri !== authCode.redirectUri) return done(null, false)

		log.debug(`🔑  exchange.code found for client: ${client.id}=${client.name} and code: ${code}`)

		authCode.remove((err) => {
			if (err) return done(new AuthError(err))

			createToken({
				userId: authCode.userId,
				clientId: authCode.clientId,
				scope: '*'
			}, 'both')
			.then((tokens) => {
				log.debug(`🔑  exchange.code token: ${tokens} created for client: ${client.id}=${client.name} and code: ${code}`)

				if (tokens.length === 1) {
					return done(null, tokens[0].value, null, accessExpiresIn)
				}
				if (tokens.length === 2) {
					return done(null, tokens[0].value, tokens[1].value, accessExpiresIn)
				}
			}).catch((err) => {
				done(new AuthError(err))
			})
		})
	})
}))

/**
 * Exchange user id and password for access tokens.
 *
 * The callback accepts the `client`, which is exchanging the user's name and password
 * from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the user who authorized the code.
*/
server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
	log.debug(`🔑  exchange.password for client: ${client.id}, user: ${username} and password: ${password}`)

	UserModel.findOne({ username: username })
	.then((user) => {
		if (!user) {
			done(new AuthError(`A user with this username ${username} does not exist`, 'invalid_verification'))
			return Promise.reject()
		}

		if (!user.checkPassword(password)) {
			done(new AuthError('Wrong password', 'invalid_verification'))
			return Promise.reject()
		}

		const data = {
			userId: user.id,
			clientId: client.id,
			scope: scope
		}

		if (config.security.sendEmailVerification && !user.verified && user.verify_token) {
			const emailData = {
				to: user.email,
				from: configPrivate.email.address,
				template: 'emailverification',
				subject: 'Verify your account',
				context: {
					url: 'http://localhost:8080/api/oauth2/verifytoken?token=' + user.verify_token,
					name: user.username
				}
			}

			data.verify_expired = user.verify_expired

			//You can not wait for the completion of this task and release the user
			utils.smtpTransport.sendMail(emailData, (err) => {
				if (err) {
					log.error(`🔑  send email error`)
				} else {
					log.debug(`🔑  email sended`)
				}
			})
		}

		return createToken(data, (config.security.jwtOn) ? 'jwt' : 'both')
	})
	.then((tokens) => {
		log.debug(`🔑  exchange.password token created: ${tokens} created for ${client.id}, user: ${username} and password: ${password}`)

		let params = accessExpiresIn
		if (config.security.jwtOn) {
			params = Object.assign({}, jwtExpiresIn)
			params.token_type = 'jwt'
			params.action = 'created'
		}

		if (tokens.length === 1) return done(null, tokens[0].value, null, params)
		if (tokens.length === 2) return done(null, tokens[0].value, tokens[1].value, params)
	}, (rej) => {})
	.catch((err) => {
		done(new AuthError(err))
	})
}))

/**
 * Exchange the client id and password/secret for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id and
 * password/secret from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the client who authorized the code.
*/
server.exchange(oauth2orize.exchange.clientCredentials((client, scope, done) => {
	log.debug(`🔑  exchange.clientCredentials for client: ${client.id}=${client.name}`)

	createToken({
		userId: '',
		clientId: client.id,
		scope: scope
	}, 'access')
	.then((tokens) => {
		log.debug(`🔑  exchange.clientCredentials token: ${tokens} created for client: ${client.id}=${client.name}`)

		done(null, tokens[0].value, null, accessExpiresIn)
	})
	.catch((err) => {
		done(new AuthError(err))
	})
}))

/**
 * Exchange the refresh token for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id from the token
 * request for verification.  If this value is validated, the application issues an access
 * token on behalf of the client who authorized the code
*/
server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
	log.debug(`🔑  exchange.refreshToken for client: ${client.id}=${client.name}`)

	RefreshTokenModel.findOne({ value: refreshToken })
	.then((token) => {
		if(!token) {
			done(new AuthError(`A token does not exist in db`, 'invalid_verification'), false)
			return Promise.reject()
		}

		if(token.clientId !== client.id) {
			done(new AuthError(`A client and token not equals`, 'invalid_verification'), false)
			return Promise.reject()
		}

		return Promise.resolve(client)
	})
	.then(async () => {
		try {
			const atm = await AccessTokenModel.findOneAndRemove({ userId: client.userId, clientId: client.id })
			const rtm = await RefreshTokenModel.findOneAndRemove({ userId: client.userId, clientId: client.id })

			log.debug(`🔑  exchange.refreshToken tokens deleted for client: ${client.id}=${client.name}`)

			return createToken({
				userId: client.userId,
				clientId: client.id,
				scope: (scope) ? scope : '*'
			}, 'both')
		} catch (err) {
			throw err
		}
	}, (rej) => {})
	.then((tokens) => {
		log.debug(`🔑  exchange.refreshToken token: ${tokens} created for client: ${client.id}=${client.name}`)

		done(null, tokens[0].value, tokens[1].value, accessExpiresIn)
	}, (rej) => {})
	.catch((err) => {
		done(new AuthError(err))
	})
}))

/**
 * Exchange the client id and password/secret for an access token. JWT Bearer ex
 */

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
*/
const cbLocalStrategy = (username, password, done) => {
	log.debug(`🔑  cbLocalStrategy for username: ${username} and password: ${password}`)

	UserModel.findOne({ username: username }, (err, user) => {
		if (err) return done(new AuthError(err))
		if (!user) return done(new AuthError(`A user with this username ${username} does not exist`, 'invalid_verification'))
		if (!user.checkPassword(password)) return done(new AuthError('Wrong password', 'invalid_verification'))

		log.debug(`in cbLocalStrategy for username: ${username} and password: ${password} -> done`)
		return done(null, user)
	})
}

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
*/
const cbBasicStrategy = (username, password, done) => {
	log.debug(`🔑  cbBasicStrategy for username: ${username} and password: ${password}`)

	UserModel.findOne({ username: username }, (err, user) => {
		if (err) return done(new AuthError(err))
		if (!user) return done(new AuthError(`A user with this username ${username} does not exist`, 'invalid_verification'))
		if (!user.checkPassword(password)) return done(new AuthError('Wrong password', 'invalid_verification'))

		log.debug(`in cbBasicStrategy for username: ${username} and password: ${password} -> done`)
		return done(null, user)
	})
}

const cbClientBasicStrategy = (req, username, password, done) => {
	log.debug(`🔑  cbClientBasicStrategy for user: ${username} and password: ${password}`)

	UserModel.findOne({ username: username })
	.then((user) => {
		log.debug(`in cbClientBasicStrategy for user: ${username} and password: ${password} -> done`)

		if (!user) {
			done(new AuthError(`A user with this username ${username} does not exist`, 'invalid_data'))
			return Promise.reject()
		}

		if (!user.checkPassword(password)) {
			done(new AuthError('Wrong password', 'invalid_verification'))
			return Promise.reject()
		}

		req.user = user

		const client_name = (req.body.client_name) ? req.body.client_name : 'WebBrowser'
		return ClientModel.findOne({ userId: user.id, name: client_name })
		//return Promise.resolve(user)
	})
	.then((client) => {
		if (!client) return done(new AuthError('A client not found', 'invalid_data'))
		if (!client.checkSecret(password)) return done(new AuthError('A client wrong password', 'invalid_verification'))

		log.debug(`in cbClientBasicStrategy for client.name: ${client.name} -> done`)
		done(null, client)
	}, (rej) => {})
	.catch((err) => {
		done(new AuthError(err))
	})
}

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
*/
const cbClientPasswordStrategy = (clientId, clientSecret, done) => {
	log.debug(`🔑  cbClientPasswordStrategy for clientId: ${clientId} and clientSecret: ${clientSecret}`)

  ClientModel.findOne({ id: clientId }, (err, client) => {
    if (err) return done(new AuthError(err))
    if (!client) return done(new AuthError('A client not found', 'invalid_data'))
    if (!client.checkSecret(clientSecret)) return done(new AuthError('A client wrong password', 'invalid_verification'))

    log.debug(`🔑  in cbClientPasswordStrategy for clientId: ${clientId} and clientSecret: ${clientSecret} -> done`)
    done(null, client)
  })
}

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 *
 * To keep this example simple, restricted scopes are not implemented, and this is just for
 * illustrative purposes
*/
const cbBearerStrategy = (bearerToken, done) => {
	log.debug(`🔑  cbBearerStrategy for bearerToken: ${bearerToken}`)

	AccessTokenModel.findOne({ value: bearerToken }, (err, accessToken) => {
		if (err) return done(new AuthError(err))
		if (!accessToken) {
			RefreshTokenModel.findOne({ value: bearerToken }, (err, refreshToken) => {
				if (err) return done(new AuthError(err))
				if (!refreshToken) return done(new AuthError(`A token does not exist in db`, 'invalid_verification'))

				log.debug(`🔑  cbBearerStrategy for bearerToken: ${bearerToken} - refres token found`)
				done(null, refreshToken, { scope: '*'})
			})
		} else {
			log.debug(`🔑  cbBearerStrategy for bearerToken: ${bearerToken} - access token found`)

			done(null, accessToken, { scope: '*' })
		}
	})
}

/**
 * JSON Web Tokens is an authentication standard that works by assigning and passing around an
 * encrypted token in requests that helps to identify the logged in user, instead of storing
 * the user in a session on the server and creating a cookie
*/
const cbJWTStrategy = (req, jwtPayload, done) => {
	log.debug(`🔑  cbJWTStrategy for jwtPayload: ${jwtPayload}`)
	debugger

	/* If the token has an "verify_expired" label, then it is necessary to check the verification
	of the user and the expiry date of verification, if the user is verified, then update the token
	to the worker, if the verification period has expired, then withdraw the current token and log out
	the user */
	if(jwtPayload.verify_expired) {
		UserModel.findOne({ _id: jwtPayload.userId })
		.then((user) => {
			if (!user) done(new AuthError(`User with this id (${jwtPayload.userId}) not exists`, 'invalid_data'))

			if (!user.verified) {
				if (user.verify_expired > new Date()) {
					done(null, jwtPayload)
				} else {
					//TODO: log out user
					user.loged = false
					user.save((err) => {
						if (err) throw new AuthError(err)

						req.logout()
						throw new AuthError('Session expired', 'session_expired')
					})
				}
			} else {
				//TODO: refresh token
				const data = {
					userId: user.id,
					clientId: jwtPayload.clientId,
					scope: jwtPayload.scope
				}

				createToken(data, 'jwt')
				.then((tokens) => {
					const params = Object.assign({}, jwtExpiresIn)
					params.token_type = 'jwt'
					params.action = 'refreshed'

					done(null, tokens[0].value, params)
				}).catch((err) => {
					done(new AuthError(err))
				})
			}
		}).catch((err) => {
			done(new AuthError(err))
		})
		/*
		*Получаем пользователя по его id
		*Проверяем верифицирован ли он
			*Если не верифицирован, проверяем срок истечения токена-верификации
				*Если срок истёк, делаем лог аут пользователя
				*Если срок не истёк, то отдаем данные по временному-токену
			*Если верифицирован, то меняем пользователю временный токен на постоянный (рефреш токен) -> Отдаем данные пользователю
		*/
	} else {
		const expirationTime = new Date(jwtPayload.expiration) - Date.now()
		if (expirationTime <= 0) {
			//TODO log out
			done(AuthError('Session expired', 'session_expired'))
		} else if (expirationTime <= (config.security.jwtTokenExpires *1000 * config.security.boundaryBeginExpires)) {
			const data = {
				userId: jwtPayload.userId,
				clientId: jwtPayload.clientId,
				scope: jwtPayload.scope
			}

			createToken(data, 'jwt')
			.then((tokens) => {
				const params = Object.assign({}, jwtExpiresIn)
				params.token_type = 'jwt'
				params.action = 'refreshed'

				done(null, tokens[0].value, params)
			}).catch((err) => {
				done(new AuthError(err))
			})
		} else {
			done(null, jwtPayload)
		}
		/*
		Проверяем граничное значение времени для обновления токена
			Если попадаем в граничное значение, то обновляем токен
			Если находимся раньше граничного значения, то отдаем данные
		*/
	}
}

const cbVerifyMailToken = (req, res, done) => {
	log.debug(`🔑  cbVerifyToken for body: ${req.body}`)
	debugger
	if (!req.query.token) done(null)

	UserModel.findOne({ verify_token: req.query.token, verify_expired: { $gt: Date.now() }})
	.then((user) => {
		if (!user) {
			done(new AuthError(`User with this token (${req.body.token}) not exists`, 'invalid_data'))
			return Promise.reject()
		}

		user.verified = true
		user.verify_token = null
		return user.save().then(() => {
			res.redirect('/appGrid')
		}).catch((err) => {
			done(new AuthError(err))
		})
	})
	.catch((err) => {
		done(new AuthError(err))
	})
}

const cbRegistrationStrategy = function (req, res, done) {
	log.debug(`🔑  registrationStrategy for body: ${req.body}`)

	//body composition check
	try {
		if (!req.body) throw new AuthError('Missing request body', 'invalid_request')
		if (!req.body.username) throw new AuthError('Missing required parameter: username', 'invalid_request')
		if (!req.body.password) throw new AuthError('Missing required parameter: password', 'invalid_request')
		if (!req.body.client_name) throw new AuthError('Missing required parameter: client_name', 'invalid_request')
		if (!req.body.scope) throw new AuthError('Missing required parameter: scope', 'invalid_request')
		if (!req.body.email) throw new AuthError('Missing required parameter: e-mail', 'invalid_request')
		if (!utils.validateEmail(req.body.email)) throw new AuthError('Wrong parameter: e-mail', 'invalid_data')

		function onCreateClient(newUser, newClient) {
			return req.login(newUser, (err) => {
				if (err) throw new AuthError(err)
				req.body.grant_type = 'password'

				done(null, newClient, newUser)
			})
		}

		function onSaveUser(newUser) {
			return ClientModel.create({ name: req.body.client_name, secret: req.body.password, userId: newUser.id })
				.then(function (newClient) {
					return onCreateClient(newUser, newClient)
				})
		}

		UserModel.findOne({ email: req.body.email })
		.then((user) => {
			if (user) {
				done(new AuthError(`User with this email (${req.body.email}) already exists`, 'invalid_data'))
				return Promise.reject()
			}

			const newUser = new UserModel()
			newUser.username = req.body.username
			newUser.password = req.body.password
			newUser.email = req.body.email
			if (config.security.sendEmailVerification) {
				newUser.verified = false
				newUser.verify_token = utils.randomToken()
				newUser.verify_expired = new Date(calculateExpirationDate(config.security.jwtTokenExpires))
			} else {
				newUser.verified = true
				newUser.verify_token = null
			}

			return newUser.save()
		})
		.then(onSaveUser, (rej) => {})
		.catch((err) => {
			done(new AuthError(err))
		})
	} catch (err) {
		return done(new AuthError(err))
	}
}

/**
 * code Authorization middleware
*/
const codeAuthorization = [
	server.authorization((clientId, redirectUri, scope, done) => {
		log.debug(`🔑  authorization`)

		ClientModel.findOne({ id: clientId }, (err, client) => {
			log.debug(`🔑  authorization - client found`)

			if (err) return done(new AuthError(err))
			client.scope = scope

      return done(null, client, redirectUri)
    })
  }),
  function(req, res){
		log.debug(`🔑  authorization second middleware`)
		res.json({ transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client })
		//TODO: add (allow/deny) response dialog, which will be asked client and after request, implement server.decision
		//for info read https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/Authorization-code
    //res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
]

for (let index = 0; index < config.security.securityStrategy.length; index++) {
	const element = config.security.securityStrategy[index];
	if (element === 'basic') passport.use(new BasicStrategy(cbBasicStrategy))
	if (element === 'local') passport.use(new LocalStrategy(cbLocalStrategy))
	if (element === 'bearer') passport.use(new BearerStrategy(cbBearerStrategy))
	if (element === 'client-basic') passport.use('client-basic', new BasicStrategy({ passReqToCallback: true }, cbClientBasicStrategy))
	if (element === 'oauth2-client-password') passport.use(new ClientPasswordStrategy(cbClientPasswordStrategy))
	if (element === 'jwt') passport.use(new JWTStrategy({
		jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
		secretOrKey: configPrivate.security.sessionSecret,
		ignoreExpiration: false,
		passReqToCallback: true },
		cbJWTStrategy))
}

let isAuthenticated = undefined
if (config.security.jwtOn) {
	isAuthenticated = (req, res, next) => {
		passport.authenticate(['jwt'], { session: false }, (err, data, info) => {
			if (err || !data) {
				let resErr = []
				let arrErr = []

				if (Array.isArray(err)) {
					arrErr = err
				} else if (Array.isArray(info)) {
					arrErr = info
				} else {
					resErr.push({ name: err.name, message: err.message })
				}

				for (let index = 0; index < arrErr.length; index++) {
					const element = arrErr[index];
					if(element instanceof Error) {
						resErr.push({ name: element.name, message: element.message })
					}
				}

				return res.status(401).send(resErr)
			}

			if (data && info) {
				let tok = {}
				tok.access_token = data
				if (info) { tok = Object.assign(tok, info) }
				tok.token_type = tok.token_type || 'Bearer';

				let json = JSON.stringify(tok);
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Cache-Control', 'no-store');
				res.setHeader('Pragma', 'no-cache');
				res.end(json);
			} else {
				return next(null, data)
			}
		})(req, res, next)
	}
} else {
	isAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false })
}

const cbSecurityStrategy = passport.authenticate(config.security.securityStrategy, { session : false })

/*
const isAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false })
const isClientAuthenticated = passport.authenticate(['client-basic', 'oauth2-client-password', 'bearer'], { session : false })
const isBearerAuthenticated = passport.authenticate('bearer', { session: false })
const isLocalAuthenticated = passport.authenticate('local', { session: false })
*/

const codeDecision = [
	server.decision()
]

const token = [
	server.token(),
	server.errorHandler()
]

if(!config.security.jwtOn) {
	router.get('/code-authorize', isAuthenticated, codeAuthorization)
	router.post('/code-authorize', isAuthenticated, codeDecision)
	router.post('/token', cbSecurityStrategy, token)
}
router.post('/login', cbSecurityStrategy, token)
router.post('/registration', cbRegistrationStrategy, token)
router.get('/verifytoken', cbVerifyMailToken)

exports.router = router
exports.isAuthenticated = isAuthenticated

/*** JWT Payload Structure
 jwtPayload = {
	 expiration, time to expiration token = Data.now + (jwtTokenExpires * 1000)
	 userId,
	 clientId,
	 scope,
	 verify_expired: time to expiration mail token
 }
 */

/*** Registration new user scenarios
 cli: Use this URL with POST:
 -> https://localhost:8080/api/oauth2/registration

 cli: In the payload section cli want to set the Content-Type header to "application/x-www-form-urlencoded"
 and this to the raw payload
 -> username=bob&password=secret&scope=*

 cli: Send and should get back access token that looks like this if all fine
 {
	"access_token": "lTCGXgP0K6w2NTz9Zgi9UuBRgGc2dnWEwXsMUAmHz0V2aiKqLtoEFskhxWaGARgXHv",
	"refresh_token": "c9pEaQvTXmJKm0CC5AqUuBRgGc2dnWEwXLwAyf5Gn2IvwWxomK3V66WqAj0EiFBGD",
	"expires_in": 3600,
	"token_type": "bearer"
 }

 srv: Receives the request and starts the router /registration which in case of executing the @cbRegistrationStrategy
 without errors, issues a temporary-token (with verify awayt payload) via the @token function

 srv: in @cbRegistrationStrategy function generates a mail-token and sends it to the user e-mail

 cli: get token on e-mail and click verification link

 srv: receive the request and starts the router /verifytoken, when the tokens match, the server sets the user's
 status to "verified" and redirect user to homepage

 cli: makes any request to the server via api and receives an updated work-token

 srv: receive temporary-token chech user status of the user for the presence of verify and if true, then generate
 work-token and send user
 */

/*** Security scenarios
 * 1) Resource Owner Password Credentials
 Use this URL with POST:
 -> https://localhost:8080/api/oauth2/token

 In the header section add the key of Authorization with the value of the client id and client
 secret of one of the clients, separated by a ":" and base64 encoded.

 It will look like this in Raw if you're using "my-client:my-secret"
 -> Authorization: Basic SWJsMTIzOncfda2dzcWNyZXQ=

 In the payload section you want to set the Content-Type header to "application/x-www-form-urlencoded"
 and this to the raw payload
 -> grant_type=password&username=bob&password=secret&scope=offline_access

 Send and you should get back your access token that looks like this
 {
	"access_token": "lTCGXgP0K6w2NTz9Zgi9UuBRgGc2dnWEwXsMUAmHz0V2aiKqLtoEFskhxWaGARgXHv",
	"refresh_token": "c9pEaQvTXmJKm0CC5AqUuBRgGc2dnWEwXLwAyf5Gn2IvwWxomK3V66WqAj0EiFBGD",
	"expires_in": 3600,
	"token_type": "bearer"
 }

 From here you exchange the access token for access to a resource. We'll access the api/info resource
 -> https://localhost:8080/api/info

 In the header section add the key of Authorization with the value of your access_token.
 It will look like this in Raw
 -> Authorization: Bearer lTCGXgP0K6w2NTz9Zgi9UuBRgGc2dnWEwXsMUAmHz0V2aiKqLtoEFskhxWaGARgXHv

 You should then get back your user id like so
 {
	"user_id": "1",
	"name": "Bob Smith",
	"scope": "*"
 }

 The scope=offline_access is optional above and by default if it is left out you will not get a refresh token.
 However, if you do get a refresh token and want to retrieve an access token from it then you would use the
 same token endpoint above. In the header section add the key of Authorization with the value of the client
 id and client secret of one of the clients, separated by a ":" and base64 encoded.

 It will look like this in Raw if you're using "my-client:my-secret"
 -> Authorization: Basic SWJsMTIzOncfda2dzcWNyZXQ=

 Then do a POST using the URL of
 -> https://localhost:8080/api/oauth2/token

 The Raw payload of:
 -> grant_type=refresh_token&refresh_token=c9pEaQvTXmJKm0CC5AqUuBRgGc2dnWEwXLwAyf5Gn2IvwWxomK3V66WqAj0EiFBGD

 And set your content-type to: application/x-www-form-urlencoded
 Then you'll get back your token which will look like this:

 {
	"access_token": "NCjOmSY1Lat3crhi6325sJ3BWjSde0619QDIWlE0qGvoYu7da3OihpxecBapA87H",
	"expires_in": 3600,
	"token_type": "bearer"
 }
 * 2) Authorization-code
 * for info read https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/Authorization-code
*/
