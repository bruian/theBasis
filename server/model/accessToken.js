import mongoose from 'mongoose'

var Schema = mongoose.Schema

var AccessToken = new Schema({
  value: {
    type: String,
    unique: true,
    required: true
  },
  clientId: {
    type: String,
    required: true
	},
	userId: {
    type: String,
    required: true
	},
	scope: {
		type: String
	},
  expiration: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('AccessToken', AccessToken)
