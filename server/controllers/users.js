const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import pg from '../db/postgres'

function _create(condition, returning = false) {
	return pg.pool.connect()
	.then((client) => {
		const retstring = returning ? 'RETURNING *' : '',
					parametres = pg.prepareParametres(condition)

		return client.query(`INSERT INTO users (${parametres.fields}) VALUES (${parametres.anchors}) ${retstring}`, parametres.values)
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

function _read(condition) {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(condition)

		return client.query(`SELECT * FROM users WHERE ${parametres.condition}`, parametres.values)
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

function _update(condition, data, returning = false) {
	return pg.pool.connect()
	.then((client) => {
		const retstring = returning ? 'RETURNING *' : '',
					parametres = pg.prepareParametres(condition, data)

		return client.query(`UPDATE users SET ${parametres.datastring} WHERE ${parametres.condition} ${retstring}`, parametres.values)
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

function _delete(condition) {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(condition)

		return client.query(`DELETE FROM users WHERE ${parametres.condition}`, parametres.values)
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

function getUser(req, res) {
	_read({ id: req.body.userId })
	.then((result) => {
		if (result.rowCount === 0) return res.send({ message: 'User contained in token not found', status: 400, code: 'invalid_verification', name: 'AuthError' })

		const data = Object.assign({}, result.rows[0])
		delete data.hashedpassword
		delete data.salt
		delete data.verify_token
		delete data.verify_expired

    return res.json(data)
	})
	.catch((err) => {
		return res.send(err)
	})
}

module.exports = {
	_create,
	_read,
	_update,
	_delete,
	getUser
}
