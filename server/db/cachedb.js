import crypto 						 from 'crypto'
import mongoose 					 from './mongoose'
import NodeCache 					 from 'node-cache'
import BlacklistTokenModel from '../model/blacklistToken'
import { MongoCacheError } from '../errors'
import { rejects } from 'assert';
import { model } from 'mongoose';

const showDebugMessage = true
function log(message) { if (showDebugMessage) console.log(message) }

Object.equals = function(x, y) {
  if (x === y) return true
  if (!(x instanceof Object) || !(y instanceof Object)) return false
  if (x.constructor !== y.constructor) return false

  for (var p in x) {
    if (!x.hasOwnProperty(p)) continue
    if (!y.hasOwnProperty(p)) return false
    if (x[p] === y[p]) continue
    if (typeof(x[p]) !== 'object') return false
    if (!Object.equals(x[p], y[p])) return false
  }

  for (p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false
  }
  return true
}

function MongoCache(MongoModel, initCache = false) {
	NodeCache.call(this)

	/* The model that stores the cache */
	this.MongoModel = MongoModel

	/* Queue promise mongo function call */
	this.queue = Promise.resolve()
	this.counter = 0

	/* Filling the cache with data from the database */
	/* Function not finished */
	this.init = () => {
		log('init started')
		const self = this

		if (MongoModel) {
			return this.MongoModel.deleteMany({
				value: { $lt: new Date() }
			})
			.then(() => {
				return this.MongoModel.find({})
			})
			.then((tokenModel) => {
				for (let index = 0; index < tokenModel.length; index++) {
					NodeCache.prototype.set.call(self, tokenModel[index].key, { value: tokenModel[index].value })
				}

				//log('get token models and fill cache:' + tokenModel)
				log('get token models and fill cache:')
			})
			.catch((err) => {
				log(err)
			})
		}
	}

	/* Get value from cache */
	this.get = (key) => {
		const gotValue = NodeCache.prototype.get.call(this, key)
		if (!gotValue) return undefined

		if (gotValue.value <= new Date()) {
			this.MongoModel.deleteOne({ key: key }, (err) => {
				if (err) throw new MongoCacheError(err)

				this.del(key, (err) => {
					if (err) throw new MongoCacheError(err)
				})
			})
			return undefined
		} else {
			return gotValue.value
		}
	}

	/* Set value in cache */
	this.set = (key, value) => {
		log('Set value function is started')
		let self = this
		if (typeof(value) !== 'object') {
			throw new MongoCacheError('Need object in value prop')
		}

		const gotValue = NodeCache.prototype.get.call(this, key)
		if (Object.equals(value, gotValue)) {
			log('Key and value are exists, operation skip')
			return null
		}

		NodeCache.prototype.set.call(self, key, value, function(err, success) {
			if (err) {
				throw new MongoCacheError(err.message)
			}

			if(success) {
				self.counter++
				const valueObj = Object.assign({ key: key }, value)
				log('mongo obj:' + Object.values(valueObj))

				self.queue = self.queue.then(() => {
					return self.MongoModel.findOneAndUpdate({ key: key }, valueObj)
					.then((foundDocument) => {
						if (!foundDocument) {
							log('Mongo document not found and then create')
							return self.MongoModel.create(valueObj)
						}

						self.counter--
						if(self.counter === 0) {
							self.queue = null
							self.queue = Promise.resolve()
							log('queue clear')
						}
						log('Mongo document updated')
						return null
					})
					.then((doc) => {
						if (doc) {
							log('Mongo document created')
							self.counter--
							if(self.counter === 0) {
								self.queue = null
								self.queue = Promise.resolve()
								log('queue clear')
							}

							return null
						}
					})
				})
				.catch((err) => {
					self.counter--
					if(self.counter === 0) {
						self.queue = null
						self.queue = Promise.resolve()
						log('queue clear')
					}
					log('Error: in try create new model - ' + err.message)
				})

				log('success set: ' + success)
				return null
			}
		})
	}

	if (initCache) init()
	log('Object created')
}
MongoCache.prototype = Object.create(NodeCache.prototype)

exports.MongoCache = MongoCache

/* Implementation protocol */

/* implement section */
const fill = 3
const key = '4e02fdf8d23306d34742e316d44c240cc64961ff46247edffce97b71a5e43e1b'
const start = +new Date()

let mongoCache = new MongoCache(BlacklistTokenModel)

if (fill === 0) {
	const dateValue = new Date()
	dateValue.setMinutes(dateValue.getMinutes() + 3)

	for (let index = 0; index < 10; index++) {
		let key = crypto.randomBytes(32).toString('hex')
		mongoCache.set(key, { value: dateValue })
	}
	mongoCache.set(key, { value: dateValue })
} else if (fill === 1) {
	mongoCache.init().then(() => {
		return mongoose.disconnect()}).then(()=>{
			let val = mongoCache.keys()
			log('get val:' + Object.values(val))
	})
} else if (fill === 2) {
	mongoCache.init().then(() => {
		let val = mongoCache.keys()
		log('get val:' + Object.values(val))

		const value = mongoCache.get(key)
		log('Get value:' + value)
	})
} else if (fill === 3) {
	const dateValue = new Date()
	dateValue.setSeconds(dateValue.getSeconds() + 5)

	mongoCache.set(key, { value: dateValue })
	log('value from cache' + mongoCache.get(key))

	setTimeout(() => {
		log('value from cache throught 10 seconds: ' + mongoCache.get(key))
	}, 10000)

	setTimeout(() => {
		log(Object.values(mongoCache.keys()))
	}, 15000)
}

const end = +new Date()
console.log(`Execution Time: ${end - start} ms`)
