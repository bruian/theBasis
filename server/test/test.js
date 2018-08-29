import 'babel-polyfill'
import chai from 'chai'

import { MongoCache } from '../db/cachedb'

import crypto from 'crypto'
import mongoose 					 from '../db/mongoose'
import BlacklistTokenModel from '../model/blacklistToken'

const should = chai.should()

describe('Cachedb for blacklist token', function() {
	describe('#MongoCache test cache and mongodb equals', function() {
		let mongoCache = undefined
		const keyArray = []
		const key = crypto.randomBytes(32).toString('hex')

		it('Attempt to create an object', function() {
			mongoCache = new MongoCache(BlacklistTokenModel)
			mongoCache.should.be.an('object')
		})

		it('Should set many values in the Cache and async in the BlacklistTokenModel', function(done) {
			this.timeout(10000)

			const dateValue = new Date()
			dateValue.setMinutes(dateValue.getMinutes() + 1)

			for (let index = 0; index < 10; index++) {
				let key = crypto.randomBytes(32).toString('hex')
				keyArray.push(key)

				should.not.exist(mongoCache.set(key, { value: dateValue }, (err) => {
					if (!err) done()
				}))
			}
			keyArray.push(key)
			should.not.exist(mongoCache.set(key, { value: dateValue }, (err) => {
				if (!err) done()
			}))
		})

		it('Data Integrity Check', function() {
			const mcArray = mongoCache.keys()

			return BlacklistTokenModel.find({ key: { $in: keyArray }})
			.then((tokens) => {
				should.exist(tokens)
				let normalizeTokenArr = tokens.map(x => x.key)

				mcArray.should.have.members(normalizeTokenArr)
				keyArray.should.have.members(normalizeTokenArr)
			})
		})

		it('Cache init from mongoDB data set', function() {
			mongoCache.flushAll()

			return mongoCache.init().then(() => {
				const mcArray = mongoCache.keys()

				keyArray.should.have.members(mcArray)
			})
		})

		it('Attempt to get expired values', function(done) {
			const key = crypto.randomBytes(32).toString('hex')
			const dateValue = new Date()
			dateValue.setSeconds(dateValue.getSeconds() + 1)

			mongoCache.set(key, { value: dateValue })

			setTimeout(() => {
				should.not.exist(mongoCache.get(key))
				done()
			}, 1100)
		})

		after(function() {
			return BlacklistTokenModel.remove({ key: { $in: keyArray }})
			.then(() => {
				return mongoose.disconnect().then(() => {
					console.log('⚙️  Disconnected from MongoDB!')
					mongoCache.flushAll()
					mongoCache.close()
				})
			})
		})
	})
})
