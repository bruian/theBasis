import express  from 'express'
import passport from 'passport'

const srvPath = process.cwd() + '/server/'

const ObjectID     = require('mongodb').ObjectID
const db           = require(srvPath + 'db/mongoose')
const log          = require(srvPath + 'log')(module)
const tgmUserModel = require(srvPath + 'model/tgmUser')

const router = express.Router()

router.get('/', passport.authenticate('bearer', { session: false }), (req, res) => {
  tgmUserModel.find(undefined, '_id', (err, tgmUsers) => {
    if(!err) {
      return res.json(tgmUsers)
    } else {
      res.statusCode = 500
      log.error('❌  Internal error (%d): %s', res.statusCode, err.message)
      return res.json({ error: 'Database error' })
    }
  })
})

router.get('/:id', passport.authenticate('bearer', { session: false }), (req, res) => {
  tgmUserModel.findById(req.params.id, (err, tgmUser) => {
    if (!tgmUser) {
      res.statusCode = 404
      log.error('❌  Telegram user with id: %s Not Found', req.params.id)
      return res.json({ error: 'Not found' })
    }
        
    if (!err) {
      return res.json({ status: 'OK', tgmUser:tgmUser })
    } else {
      res.statusCode = 500
      log.error('❌  Internal error (%d): %s', res.statusCode, err.message)
      return res.json({ error: 'Database error' })
    }
  })
})

router.post('/', passport.authenticate('bearer', { session: false }), (req, res) => {
  var tgmUser = new tgmUserModel({ 
    username: req.body.username,
    phonenumber: req.body.phonenumber,
    api_id: req.body.api_id,
    api_hash: req.body.api_hash,
    app_title: req.body.app_title,
    testConfiguration: req.body.testConfiguration,
    prodConfiguration: req.body.prodConfiguration,
    rsaPublicKey: req.body.rsaPublicKey,
    publicKeys: req.body.publicKeys
  })

  tgmUser.save((err) => {
    if (!err) {
      log.info('New telegram user created with id: %s', tgmUser.id)
      return res.json( { status: 'OK', id:tgmUser.id } )
    } else {
      if (err.name == 'ValidationError') {
        res.statusCode = 400
        res.json({ error: 'Validation error' })
      } else {
        res.statusCode = 500
        res.json({ error: 'Database error' })
      }
      
      log.error('❌  Internal error (%d): %s', res.statusCode, err.message)
    }
  })
})

router.put('/:id', passport.authenticate('bearer', { session: false }), (req, res) => {
  tgmUserModel.findById(req.params.id, (err, tgmUser) => {
    if (!tgmUser) {
      res.statusCode = 404
      log.error('❌  Telegram user with id: %s Not Found', req.params.id)
      return res.json({ error: 'Not found' })
    }

    tgmUser.username = req.body.username
    tgmUser.phonenumber = req.body.phonenumber
    tgmUser.api_id = req.body.api_id
    tgmUser.api_hash = req.body.api_hash
    tgmUser.app_title = req.body.app_title
    tgmUser.testConfiguration = req.body.testConfiguration
    tgmUser.prodConfiguration = req.body.prodConfiguration
    tgmUser.rsaPublicKey = req.body.rsaPublicKey
    tgmUser.publicKeys = req.body.publicKeys

    tgmUser.save((err) => {
      if (!err) {
        log.info('Telegram user with id: %s updated', req.params.id)
        return res.json({ status: 'OK' })
      } else {
        if (err.name == 'ValidationError') {
          res.statusCode = 400
          res.json({ error: 'Validation error' })
        } else {
          res.statusCode = 500
          res.json({ error: 'Database error' })
        }
        
        log.error('❌  Internal error (%d): %s', res.statusCode, err.message)
      }
    })
  })
})

router.delete('/:id', passport.authenticate('bearer', { session: false }), (req, res) => {
  tgmUserModel.findById(req.params.id, (err, tgmUser) => {
    if (!tgmUser) {
      res.statusCode = 404
      log.error('❌  Telegram user with id: %s Not Found', req.params.id)
      return res.json({ error: 'Not found' })
    }

    tgmUser.remove((err) => {
      if (!err) {
        log.info('Telegram user with id: %s removed', req.params.id)
        return res.json({ status: 'OK' })
      } else {
        res.statusCode = 500
        log.error('❌  Internal error (%d): %s', res.statusCode, err.message)
        return res.json({ error: 'Database error' })
      }
    })
  })
})

module.exports = router
