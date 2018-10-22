const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import pg from '../db/postgres'


async function _create(condition, client) {
	const parametres = pg.prepareParametres(condition)
	let		tempClient = (client) ? client : await pg.pool.connect()

	try {
		const { rowCount: groupCount, rows: group } = await tempClient.query(`INSERT INTO groups (${parametres.fields}) VALUES (${parametres.anchors}) RETURNING *`, parametres.values)

		if (groupCount === 1) {
			return Promise.resolve({ rowCount: groupCount, rows: group })
		} else {
			return Promise.reject({ error: 'Do not execute query', groupStep: groupCount })
		}
	} catch (error) {
		throw error
	} finally {
		if (!client) tempClient.release()
	}
}

function _read(condition) {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(condition)

		return client.query(`SELECT * FROM groups WHERE ${parametres.condition}`, parametres.values)
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

		return client.query(`UPDATE groups SET ${parametres.datastring} WHERE ${parametres.condition} ${retstring}`, parametres.values)
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

		return client.query(`DELETE FROM groups WHERE ${parametres.condition}`, parametres.values)
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

function getGroups(req, res) {
	_read({ user_id: req.body.userId })
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
	getGroups
}
