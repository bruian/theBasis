import mongoose from 'mongoose'

var Schema = mongoose.Schema

var tgmUser = new Schema({
  username: {
    type: String,
    required: true
  },
  phonenumber: {
    type: String,
    required: true
  },
  api_id: {
    type: String,
    unique: true,
    required: true
  },
  api_hash: {
    type: String,
    unique: true,
    required: true
  },
  app_title: {
    type: String
  },
  testConfiguration: {
    type: String
  },
  prodConfiguration: {
    type: String
  },
  rsaPublicKey: {
    type: String
  },
  publicKeys: {
    type: String
  },  
})

module.exports = mongoose.model('tgmUser', tgmUser)
