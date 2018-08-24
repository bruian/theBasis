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
const TokenError = oauth2orize.TokenError
const accessExpiresIn = { expires_in: config.security.accessTokenExpires }
const jwtExpiresIn = { expiresIn: config.security.jwtTokenExpires }
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

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
    if (err) return done(err)
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
    if (err) return done(err)
    if (!client) return done(null, false)

    log.debug('🔑  deserializeClient success client.id: ${id}, client.name: ${client.name}')
    return done(null, client)
  })
})

//TODO : place it in util functions
const calculateExpirationDate = (expIn) => new Date(Date.now() + (expIn * 1000))

async function createToken(data, tokenType) {
  try {
		const tokens = []

		if (tokenType === 'access' || tokenType === 'both') {
			await AccessTokenModel.findOneAndRemove({ clientId: data.clientId, userId: data.userId })

			const accessTokenData = Object.assign({}, data)
			accessTokenData.value = crypto.randomBytes(32).toString('hex')
			accessTokenData.expiration = calculateExpirationDate(config.security.accessTokenExpires)
			let token = new AccessTokenModel(accessTokenData)
			atm = await token.save()
			tokens.push(accessTokenData)
		}

		if (tokenType === 'refresh' || tokenType === 'both') {
			await RefreshTokenModel.findOneAndRemove({ clientId: data.clientId, userId: data.userId })

			const refreshTokenData = Object.assign({}, data)
			refreshTokenData.value = crypto.randomBytes(32).toString('hex')
			refreshTokenData.expiration = calculateExpirationDate(config.security.refreshTokenExpires)
			let token = new RefreshTokenModel(refreshTokenData)
			rtm = await token.save()
			tokens.push(refreshTokenData)
		}

		if (tokenType === 'jwt') {
			const accessTokenData = Object.assign({}, data)
			accessTokenData.value = jwt.sign(data, configPrivate.security.sessionSecret, jwtExpiresIn)
			accessTokenData.expiration = calculateExpirationDate(config.security.jwtTokenExpires)
			tokens.push(accessTokenData)
		}

    log.debug(`🔑  generateTokens -> Generated new tokens for client.id: ${data.clientId} and user.id: ${data.userId} =tokens: ${tokens}`)
    return tokens
  } catch (err) {
    log.error(err)
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
server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, done) {
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

	code.save(function(err) {
		if (err) { return done(err) }

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
		done(err)
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
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, done) {
	log.debug(`🔑  exchange.code atempt for client: ${client.id}=${client.name} and code: ${code}`)

	GrantCodeModel.findOne({ value: code }, function(err, authCode) {
		if (err) { return done(err) }
		if (authCode === undefined) { return done(null, false) }
		if (client.id.toString() !== authCode.clientId) { return done(null, false) }
		if (redirectUri !== authCode.redirectUri) { return done(null, false) }

		log.debug(`🔑  exchange.code found for client: ${client.id}=${client.name} and code: ${code}`)

		authCode.remove(function(err) {
			if (err) { return done(err) }

			createToken({
				userId: authCode.userId,
				clientId: authCode.clientId,
				scope: '*'
			}, 'both').then(tokens => {
				log.debug(`🔑  exchange.code token: ${tokens} created for client: ${client.id}=${client.name} and code: ${code}`)

				if (tokens.length === 1) {
					return done(null, tokens[0].value, null, accessExpiresIn);
				}
				if (tokens.length === 2) {
					return done(null, tokens[0].value, tokens[1].value, accessExpiresIn);
				}
			}).catch((err) => {
				done(err)
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
		if (!user) return done(null, false, { message: 'Incorrect username' })
		if (!user.checkPassword(password)) return done(null, false, { message: 'Wrong password' })

		const data = {
			userId: user.id,
			clientId: client.id,
			scope: scope
		}

		return createToken(data, (config.security.jwtOn) ? 'jwt' : 'both')
	})
	.then((tokens) => {
		log.debug(`🔑  exchange.password token created: ${tokens} created for ${client.id}, user: ${username} and password: ${password}`)

		let params = accessExpiresIn
		if (config.security.jwtOn) {
			params = Object.assign({}, jwtExpiresIn)
			params.token_type = 'jwt'
		}

		if (tokens.length === 1) return done(null, tokens[0].value, null, params)
		if (tokens.length === 2) return done(null, tokens[0].value, tokens[1].value, params)
	})
	.catch((err) => {
		done(err)
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
		done(err)
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
		if(!token) { return done(null, false) }
		if(token.clientId !== client.id) { return done(null, false) }

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
			log.error(err)
			throw err
		}
	})
	.then((tokens) => {
		log.debug(`🔑  exchange.refreshToken token: ${tokens} created for client: ${client.id}=${client.name}`)

		done(null, tokens[0].value, tokens[1].value, accessExpiresIn)
	})
	.catch((err) => {
		done(err)
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
const cbLocalStrategy = function(username, password, done) {
	log.debug(`🔑  cbLocalStrategy for username: ${username} and password: ${password}`)

	UserModel.findOne({ username: username }, (err, user) => {
		if (err) return done(err)
		if (!user) return done(null, false, { message: 'Incorrect username' })
		if (!user.checkPassword(password)) return done(new TokenError('Wrong password', 'invalid_grant'), false)

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

	UserModel.findOne({ username: username }, function (err, user) {
		if (err) { return done(err) }
		if (!user) { return done(null, false) }
		if (!user.checkPassword(password)) return done(new TokenError('Wrong password', 'invalid_grant'), false)

		log.debug(`in cbBasicStrategy for username: ${username} and password: ${password} -> done`)
		return done(null, user)
	})
}

const cbClientBasicStrategy = (req, username, password, done) => {
	log.debug(`🔑  cbClientBasicStrategy for user: ${username} and password: ${password}`)

	UserModel.findOne({ username: username })
	.then((user) => {
		if (!user) { return done(null, false) }
		if (!user.checkPassword(password)) { return done(null, false, { message: 'Wrong user password' }) }

		log.debug(`in cbClientBasicStrategy for user: ${username} and password: ${password} -> done`)
		req.user = user

		const client_name = (req.body.client_name) ? req.body.client_name : 'WebBrowser'
		return ClientModel.findOne({ userId: user.id, name: client_name })
		//return Promise.resolve(user)
	})
	.then((client) => {
		if (!client) { return done(null, false) }
		if (!client.checkSecret(password)) { return done(null, false, { message: 'Wrong client password' }) }

		log.debug(`in cbClientBasicStrategy for client.name: ${client.name} -> done`)
		done(null, client)
	})
	.catch((err) => done(err))
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
    if (err) return done(err)
    if (!client) return done(null, false)
    if (!client.checkSecret(clientSecret)) return done(new TokenError('Wrong secret', 'invalid_grant'), false)

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

	AccessTokenModel.findOne({ value: bearerToken }, function (err, accessToken) {
		if (err) { return done(err) }
		if (!accessToken) {
			RefreshTokenModel.findOne({ value: bearerToken }, function (err, refreshToken) {
				if (err) { return done(err) }
				if (!refreshToken) return done(null, false)

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
const cbJWTStrategy = (jwtPayload, done) => {
	log.debug(`🔑  cbJWTStrategy for jwtPayload: ${jwtPayload}`)

	done(null, jwtPayload)
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
				if (err) throw err
				req.body.grant_type = 'password'

				if (config.security.sendEmailVerification) {
					const emailData = {
						to: newUser.email,
						from: configPrivate.email.address,
						template: 'emailverification',
						subject: 'Verify your account',
						context: {
							url: 'http://localhost:8080/api/oauth2/verifytoken?token=' + newUser.verify_token,
							name: newUser.username
						}
					}

					//You can not wait for the completion of this task and release the user
					utils.smtpTransport.sendMail(emailData, function(err) {
						if (err) {
							log.err(`🔑  send email error`)
						} else {
							log.debug(`🔑  email sended`)
						}
					})
				}

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
			if (user) throw new AuthError(`User with this email (${req.body.email}) already exists`, 'invalid_data')

			const newUser = new UserModel()
			newUser.username = req.body.username
			newUser.password = req.body.password
			newUser.email = req.body.email
			if (config.security.sendEmailVerification) {
				newUser.verified = false
				newUser.verify_token = utils.randomToken()
			} else {
				newUser.verified = true
				newUser.verify_token = ''
			}

			return newUser.save()
		})
		.then(onSaveUser)
		.catch((err) => {
			log.error(err)
			done(err)
		})
	} catch (err) {
		return done(err)
	}
}

/**
 * code Authorization middleware
*/
const codeAuthorization = [
	server.authorization(function(clientId, redirectUri, scope, done) {
		log.debug(`🔑  authorization`)

		ClientModel.findOne({ id: clientId }, function (err, client) {
			log.debug(`🔑  authorization - client found`)

			if (err) { return done(err) }
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
		ignoreExpiration: false },
		cbJWTStrategy))
}

let isAuthenticated = undefined
if (config.security.jwtOn) {
	isAuthenticated = function(req, res, next) {
		passport.authenticate(['jwt'], { session: false }, function(err, user, info) {
			if (!user) {
				let resErr = []

				if (Array.isArray(info)) {
					for (let index = 0; index < info.length; index++) {
						const element = info[index];
						if(element instanceof Error) {
							resErr.push({ name: element.name, message: element.message })
						}
					}
				}

				return res.status(401).send(resErr)
			}

			return next(null, user)
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

router.get('/code-authorize', isAuthenticated, codeAuthorization)
router.post('/code-authorize', isAuthenticated, codeDecision)
router.post('/token', cbSecurityStrategy, token)
router.post('/login', cbSecurityStrategy, token)
router.post('/registration', cbRegistrationStrategy, token)

exports.router = router
exports.isAuthenticated = isAuthenticated

/*** Registration new user scenarios
 cli: Use this URL with POST:
 -> https://localhost:8080/api/oauth2/registration

 cli: In the payload section you want to set the Content-Type header to "application/x-www-form-urlencoded"
 and this to the raw payload
 -> username=bob&password=secret&scope=*

 cli: Send and you should get back your access token that looks like this if all fine
 {
	"access_token": "lTCGXgP0K6w2NTz9Zgi9UuBRgGc2dnWEwXsMUAmHz0V2aiKqLtoEFskhxWaGARgXHv",
	"refresh_token": "c9pEaQvTXmJKm0CC5AqUuBRgGc2dnWEwXLwAyf5Gn2IvwWxomK3V66WqAj0EiFBGD",
	"expires_in": 3600,
	"token_type": "bearer"
 }
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
