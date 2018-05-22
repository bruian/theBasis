const passport               = require('passport')
const BasicStrategy          = require('passport-http').BasicStrategy
const BearerStrategy         = require('passport-http-bearer').Strategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy

const srvPath = process.cwd() + '/server/'

const log               = require(srvPath + 'log')(module)
const config            = require(srvPath + 'config')
const UserModel         = require(srvPath + 'model/user')
const ClientModel       = require(srvPath + 'model/client')
const AccessTokenModel  = require(srvPath + 'model/accessToken')
const RefreshTokenModel = require(srvPath + 'model/refreshToken')

const cbBasicStrategy = (username, password, done) => {
  log.debug(`in cbBasicStrategy with username: ${username} and password: ${password}`)

  ClientModel.findOne({ clientId: username }, (err, client) => {
    if (err) return done(err)
    if (!client) return done(null, false)
    if (client.clientSecret != password) return done(null, false)

    log.debug(`in cbBasicStrategy - ClientModel done`)
    return done(null, client)
  })
}

const cbClientPasswordStrategy = (clientId, clientSecret, done) => {
  log.debug(`in cbClientPasswordStrategy with cliendId: ${clientId} and clientSecret: ${clientSecret}`)

  ClientModel.findOne({ clientId: clientId }, (err, client) => {
    if (err) return done(err)
    if (!client) return done(null, false)
    if (client.clientSecret != clientSecret) return done(null, false)
    
    log.debug(`in cbClientPasswordStrategy - ClientModel done`)
    return done(null, client)
  })
}

const cbBearerStrategy = (req, cliToken, done) => {
  log.debug(`in cbBearerStrategy with token: ${ cliToken }`)
  
  let TokenModel = undefined

  if (req.headers) {
    if (req.headers.grant_type && req.headers.grant_type == 'refresh_token') {
      req.body = { 
        grant_type: req.headers.grant_type,
        refresh_token: cliToken,
        scope: ' '
      }

      TokenModel = RefreshTokenModel
    } else {
      TokenModel = AccessTokenModel
    }

    TokenModel.findOne({ token: cliToken }, (err, token) => {
      if (err) return done(err)
      if (!token) return done(null, false)
  
      if (Math.round((Date.now() - token.created)/1000) > config.security.tokenLife) {
        TokenModel.remove({ token: cliToken }, (err) => {
          if (err) return done(err)
        })
        
        log.debug(`in cbBearerStrategy - token expired`)
        return done(null , false, { message: 'Token expired' })
      }
  
      if (req.headers.grant_type && req.headers.grant_type == 'refresh_token') {
        ClientModel.findOne( { clientId: req.headers.client_id }, (err, client) => {
          if (err) return done(err)
          if (!client) return done(null, false,  { message: 'Unknow client' })

          log.debug(`in cbBearerStrategy - ClientModel done`)
          var info = { scope: ' ' }
          return done(null, client, info)
        })
      } else {
        UserModel.findById(token.userId, (err, user) => {
          if (err) return done(err)
          if (!user) return done(null, false, { message: 'Unknow user' } )
    
          log.debug(`in cbBearerStrategy - UserModel done`)
          var info = { scope: '*' }
          return done(null, user, info)
        })
      }
    })
  }
}

passport.use(new BasicStrategy(cbBasicStrategy))
passport.use(new BearerStrategy({ passReqToCallback: true }, cbBearerStrategy))
passport.use(new ClientPasswordStrategy(cbClientPasswordStrategy))
