import NodeCache 					 from 'node-cache'
import { MongoCacheError } from '../errors'

const showDebugMessage = false
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
	this.set = (key, value, cb) => {
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
							if(typeof cb === 'function') cb(null)
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
								if(typeof cb === 'function') cb(null)
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
						if(typeof cb === 'function') cb(err)
						log('queue clear')
					}
					log('Error: in try create new model - ' + err.message)
				})

				log('success set: ' + success)
				return null
			}
		})
	}

	if (initCache) this.init()
	log('Object created')
}
MongoCache.prototype = Object.create(NodeCache.prototype)

exports.MongoCache = MongoCache
exports.BlackListCache = undefined

exports.init = (model) => {
	exports.BlackListCache = new MongoCache(model, true)
}
