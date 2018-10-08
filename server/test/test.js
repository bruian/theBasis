require('babel-core/register')
import 'babel-polyfill'
import chai from 'chai'

import { MongoCache } 		 from '../db/cachedb'

import crypto 						 from 'crypto'
import config							 from '../config'
import pg									 from '../db/postgres'
import mongoose 					 from '../db/mongoose'
import UsersController		 from '../controllers/users'
import BlacklistTokenModel from '../model/blacklistToken'

const calculateExpirationDate = (expIn) => new Date(Date.now() + (expIn * 1000))
const should = chai.should()
const expect = chai.expect

describe('inTask.me server tests', function() {
	describe.only('#Controllers tests', function() {
		describe('User controller test', function() {
			it('Attempt to create users objects', function() {
				UsersController._create({
					username: 'user1',
					email: 'user1@maus.club',
					hashedpassword: 'hhhheeeewwww',
					created: new Date(),
					verified: false,
					verify_expired: new Date(calculateExpirationDate(config.security.jwtTokenExpires)),
					verify_token: 'wwwweeeehhhh',
					salt: 'dddjjjkkk'
				}, true)
				.then((result) => {
					result.rows.should.have.length(1)
				}, (rej) => {
					console.log(rej)
				})
				.catch((err) => {
					should.not.exist(err)
					console.log(err)
				})

				UsersController._create({
					username: 'user2',
					email: 'user2@maus.club',
					hashedpassword: 'hhhheeeewwww',
					created: new Date(),
					verified: false,
					verify_expired: new Date(calculateExpirationDate(config.security.jwtTokenExpires)),
					verify_token: 'wwwweeeehhhh',
					salt: 'dddjjjkkk'
				}, true)
				.then((result) => {
					result.rows.should.have.length(1)
				}, (rej) => {
					console.log(rej)
				})
				.catch((err) => {
					should.not.exist(err)
					console.log(err)
				})
			})

			it('Attempt to read users object', function() {
				UsersController._update({ email: 'user1@maus.club' }, { username: 'maus' }, true)
				.then((result) => {
					const value = result.rows[0]

					//expect(value).to.have.property('username')
					console.log(value)
				})
				.catch((err) => {
					//should.not.exist(err)
					console.log(err)
				})
			})

			after(function() {
				pg.pool.end()
			})
		})
	}),
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
