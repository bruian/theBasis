import mongoose from 'mongoose'

var Schema = mongoose.Schema

var grantCode = new Schema({
  value: {
    type: String,
    required: true
  },
  redirectUri: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
	},
	scope: {
		type: String
	}
})

module.exports = mongoose.model('grantCode', grantCode)
