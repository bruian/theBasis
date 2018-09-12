import mongoose from 'mongoose'
import crypto from 'crypto'

const Schema = mongoose.Schema

const Client = new Schema({
  name: {
    type: String,
    required: true
  },
  hashedSecret: {
    type: String,
    required: true
	},
	salt: {
    type: String,
    required: true
  },
	userId: {
		type: String,
		required: true
	}
})

Client.methods.encryptSecret = function(secret) {
  return crypto.pbkdf2Sync(secret, this.salt, 10000, 512, 'sha512').toString('hex')
  //return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
}

Client.virtual('secret').set(function(secret) {
  this._plainSecret = secret
  this.salt = crypto.randomBytes(128).toString('hex')
  this.hashedSecret = this.encryptSecret(secret)
}).get(function() {
  return this._plainSecret
})

Client.methods.checkSecret = function(secret) {
  return this.encryptSecret(secret) == this.hashedSecret
}

module.exports = mongoose.model('Client', Client)
