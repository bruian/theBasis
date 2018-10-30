const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import { isNumeric } from '../utils'
import { PgError, SrvError } from '../errors'
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

async function getGroups(condition, done) {
	let client,
		condition1 = '',
		condition2 = '',
		limit = 'null', offset = 'null',
		queryText = ''

	try {
		if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
			return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
				because regarding his rights there will be a request for information from the database`))
		}

		if (isNumeric(condition.user_id)) {

		}

		if (isNumeric(condition.group_id)) {

		}

		if (isNumeric(condition.limit)) {
			limit = condition.limit
		}

		if (isNumeric(condition.offset)) {
			offset = condition.offset
		}

		if (condition.like) {
			condition1 = condition1 + ` AND grp.username ILIKE '%${condition.like}%'`
		}

		let whose
		if (condition.whose === '' || condition.whose === 'all') {
			whose = `AND grp.owner != ${condition.mainUser_id}`
		} else if (condition.whose === 'user') {
			whose = ''
		}

		queryText = `SELECT group_id AS id, user_type, name, parent, creating, reading, updating, deleting, task_creating,
				task_reading, task_updating, task_deleting, group_type, 0 AS haveChild, owner FROM groups_list AS gl
			RIGHT JOIN groups AS grp ON gl.group_id = grp.id ${whose}
			WHERE grp.parent IS null
				AND gl.group_id NOT IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent)
				AND grp.reading >= gl.user_type
				AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
				${condition1}
		UNION
		SELECT group_id AS id, user_type, name, parent, creating, reading, updating, deleting, task_creating,
				task_reading, task_updating, task_deleting, group_type, 1 AS haveChild, owner FROM groups_list AS gl
			RIGHT JOIN groups AS grp ON gl.group_id = grp.id ${whose}
			WHERE grp.parent IS null
				AND gl.group_id IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent)
				AND grp.reading >= gl.user_type
				AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
				${condition1}
		LIMIT ${limit} OFFSET ${offset};`
	} catch (error) {
		return done(error)
	}

	try {
		client = await pg.pool.connect()

		const { rowCount, rows } = await client.query(queryText)

		if (rowCount === 0) {
			return done({ message: `No datas with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		} else {
			return done(null, rows)
		}
	} catch (error) {
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

module.exports = {
	_create,
	_read,
	_update,
	_delete,
	getGroups
}
