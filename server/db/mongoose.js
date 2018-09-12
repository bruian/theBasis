import mongoose from 'mongoose'
import { init } from './cachedb'
import BlacklistTokenModel from '../model/blacklistToken'

const srvPath  = process.cwd() + '/server/'

const log = require(srvPath + 'log')(module)
const configPrivate = require(srvPath + 'config-private')

mongoose.connect(configPrivate.mongoose.uri, { ssl: configPrivate.mongoose.ssl })

var dbConnection = mongoose.connection

dbConnection.on('error', (err) => {
  log.error('⚙️  Database error: %s', err.message)
})

dbConnection.on('open', () => {
	log.info('⚙️  Connected to MongoDB!')

	init(BlacklistTokenModel)
})

module.exports = mongoose
