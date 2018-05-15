import mongoose from 'mongoose'
import crypto from 'crypto'

const srvPath  = process.cwd() + '/server/'

const log = require(srvPath + 'log')(module)
const configPrivate = require(srvPath + 'config-private')

mongoose.connect(configPrivate.mongoose.uri)

var dbConnection = mongoose.connection

dbConnection.on('error', (err) => {
  log.error('⚙️  Database error: %s', err.message)
})

dbConnection.on('open', () => {
  log.info('⚙️  Connected to MongoDB!')
})

module.exports = mongoose
