const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import pg from '../db/postgres'

function _create(condition, returning = false, type='access') {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(condition),
					retstring = returning ? 'RETURNING *' : ''

		return client.query(`INSERT INTO ${type}_tokens (${parametres.fields}) VALUES (${parametres.anchors}) ${retstring}`, parametres.values)
		.then((res) => {
			client.release()

			return Promise.resolve(res)
		})
		.catch((err) => {
			client.release()

			throw err
		})
	})
	.catch((err) => {
		throw err
	})
}

function _read(condition, type='access') {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(condition)

		return client.query(`SELECT * FROM ${type}_tokens WHERE ${parametres.condition}`, parametres.values)
		.then((res) => {
			client.release()

			return Promise.resolve(res)
		})
		.catch((err) => {
			client.release()

			throw err
		})
	})
	.catch((err) => {
		throw err
	})
}

function _update(condition, data, returning = false, type='access') {
	return pg.pool.connect()
	.then((client) => {
		const retstring = returning ? 'RETURNING *' : '',
					parametres = pg.prepareParametres(condition, data)

		return client.query(`UPDATE ${type}_tokens SET ${parametres.datastring} WHERE ${parametres.condition} ${retstring}`, parametres.values)
		.then((res) => {
			client.release()

			return Promise.resolve(res)
		})
		.catch((err) => {
			client.release()

			throw err
		})
	})
	.catch((err) => {
		throw err
	})
}

function _delete(condition, type='access') {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(obj)

		return client.query(`DELETE FROM ${type}_tokens WHERE ${parametres.condition}`, parametres.values)
		.then((res) => {
			client.release()

			return Promise.resolve(res)
		})
		.catch((err) => {
			client.release()

			throw err
		})
	})
	.catch((err) => {
		throw err
	})
}

module.exports = {
	_create,
	_read,
	_update,
	_delete
}
