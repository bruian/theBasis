import mongoose from 'mongoose'

var Schema = mongoose.Schema

var BlacklistToken = new Schema({
  key: {
    type: String,
    unique: true,
    required: true
  },
  value: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('BlacklistToken', BlacklistToken)
