import mongoose from 'mongoose'
import crypto from 'crypto'

const Schema = mongoose.Schema

const User = new Schema({
  username: { type: String },
	email: {
		type: String,
		unique: true,
		required: true,
		validate: {
			validator: (v) => { return /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/.test(v) },
			message: props => `${props.value} is not valid e-mail`
		}
	},
  created: { type: Date, default: Date.now },
	verified: { type: Boolean },
	verify_expired: {	type: Date },
	verify_token: {	type: String },
  hashedPassword: { type: String, required: true },
  salt: { type: String, required: true },
	loged: { type: Boolean }
})

User.methods.encryptPassword = function(password) {
  return crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
  //return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
}

User.virtual('userId').get(function() {
  return this.id
})

User.virtual('password').set(function(password) {
  this._plainPassword = password
  this.salt = crypto.randomBytes(128).toString('hex')
  this.hashedPassword = this.encryptPassword(password)
}).get(function() {
  return this._plainPassword
})

User.methods.checkPassword = function(password) {
  return this.encryptPassword(password) == this.hashedPassword
}

module.exports = mongoose.model('User', User)
