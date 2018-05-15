import crypto           from 'crypto'
import passport         from 'passport'
import oauth2orize      from 'oauth2orize'

const srvPath = process.cwd() + '/server/';

const config            = require(srvPath + 'config')
const db                = require(srvPath + 'db/mongoose')
const log               = require(srvPath + 'log')(module)
const UserModel         = require(srvPath + 'model/user')
const AccessTokenModel  = require(srvPath + 'model/accessToken')
const RefreshTokenModel = require(srvPath + 'model/refreshToken')

const server = oauth2orize.createServer()

async function generateTokens(data, done) {
  try {
    let atm = await AccessTokenModel.findOneAndRemove(data)
    if (!atm) {
      log.debug('generateTokens -> AccessToken not found')
    }

    let rtm = await RefreshTokenModel.findOneAndRemove(data)
    if (!rtm) {
      log.debug('generateTokens -> RefreshToken not found')
    }

    const accessTokenValue = crypto.randomBytes(32).toString('hex')
    data.token = accessTokenValue
    let token = new AccessTokenModel(data)
    atm = await token.save()

    const refreshTokenValue = crypto.randomBytes(32).toString('hex')
    data.token = refreshTokenValue
    token = new RefreshTokenModel(data)
    rtm = await token.save()

    log.debug(`generateTokens -> Generated new tokens access: ${accessTokenValue} - refresh: ${refreshTokenValue}`)
    done(null, accessTokenValue, refreshTokenValue, { 'expires_in': config.security.tokenLife })
  } catch (err) {
    log.error(err)
    return done(err)
  }
}

async function logoutUser(user) {
  try {
    let atm = await AccessTokenModel.findOneAndRemove({ userId: user.userId })
    if (!atm) {
      log.debug('logoutUser -> AccessToken not found')
    }

    let rtm = await RefreshTokenModel.findOneAndRemove({ userId: user.userId })
    if (!rtm) {
      log.debug('logoutUser -> RefreshToken not found')
    }

    log.debug('logoutUser -> Deleted tokens')
  } catch (err) {
    log.error(err)
    return err
  }
}

server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
  log.debug(`server.exchange->oauth2orize.exchange.password: ${username} - ${password} - ${scope}`)

  UserModel.findOne({ username: username }, (err, user) => {
    if (err) return done(err)
    if (!user || !user.checkPassword(password)) return done(null, false)

    var model = {
      userId: user.userId,
      clientId: client.clientId
    }

    log.debug(`server.exchange->oauth2orize.exchange.password->UserModel: ${model}`)
    generateTokens(model, done)
  })
}))

server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
  log.debug(`server.exchange->oauth2orize.exchange.refreshToken: ${refreshToken} - ${scope}`)

  RefreshTokenModel.findOne({ token: refreshToken, clientId: client.clientId }, (err, token) => {
    if (err) return done(err)
    if (!token) return done(null, false)
    log.debug(`server.exchange->oauth2orize.exchange.refreshToken->RefreshTokenModel`)
    
    UserModel.findById(token.userId, (err, user) => {
      if (err) return done(err)
      if (!user) return done(null, false)

      var model = {
        userId: user.userId,
        clientId: client.clientId
      }

      log.debug(`server.exchange->oauth2orize.exchange.refreshToken->RefreshTokenModel->UserModel: ${model}`)
      generateTokens(model, done)
    })
  })
}))

const cbRefreshAuth = function(req, res, next) {
  passport.authenticate('bearer', function(err, user, info) {
    if (err) return next(err)

    if (user) {
      req.user = user
      
      return next()
    } else {
      return res.status(401).json({ status: 'error', code: 'unauthorized' })
    }
  })(req, res, next)
}

const cbLogout = function(req, res, next) {
  passport.authenticate('bearer', function(err, user, info) {
    if (err) return next(err)

    if (user) {
      log.debug(`cbLogout->logout user ${user}`)
      logoutUser(user)
      
      return res.status(204).end()
    } else {
      return res.status(401).json({ status: 'error', code: 'unauthorized' })
    }
  })(req, res, next)
}

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]

exports.refresh = [
  cbRefreshAuth,
  server.token(),
  server.errorHandler()
]

exports.logout = cbLogout