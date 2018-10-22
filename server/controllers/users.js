const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import { isNumeric } from '../utils'
import { PgError } from '../errors'
import pg from '../db/postgres'

async function _create(condition, client) {
	const parametres = pg.prepareParametres(condition)
	let		tempClient = (client) ? client : await pg.pool.connect()

	try {
		const { rowCount: userCount, rows: user } = await tempClient.query(`INSERT INTO users (${parametres.fields}) VALUES (${parametres.anchors}) RETURNING *`, parametres.values)

		if (userCount === 1) {
			return Promise.resolve({ rowCount: userCount, rows: group })
		} else {
			return Promise.reject(new PgError('Do not execute query in users._create function'))
		}
	} catch (error) {
		throw new PgError(error)
	} finally {
		if (!client) tempClient.release()
	}
}

function _read(condition, fields = '*') {
	return pg.pool.connect()
	.then((client) => {
		const parametres = pg.prepareParametres(condition)

		return client.query(`SELECT ${fields} FROM users WHERE ${parametres.condition}`, parametres.values)
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

async function newUser(condition) {
	const client = await pg.pool.connect(),
				parametres = pg.prepareParametres(condition)
	let   groupCount = 0, groupListCount = 0,
				fields = '', datas = '', anchors = '',
				group

	try {
		await client.query('BEGIN')
		const { rowCount: userCount, rows: user } = await client.query(`INSERT INTO users (${parametres.fields}) VALUES (${parametres.anchors}) RETURNING *`, parametres.values)

		if (userCount === 1) {
			fields = 'name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type'
			datas  = ['personal', null, 1, 1, 1, 1, 1, 1, 1, 1, 1]
			anchors = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11'

			const { rowCount: grC, rows: gr } = await client.query(`INSERT INTO groups (${fields}) VALUES (${anchors}) RETURNING id`, datas)
			groupCount = grC
			group = gr
		}

		if (groupCount === 1) {
			fields = 'user_id, group_id, user_type'
			datas = [user[0].id, group[0].id, 1]
			anchors = '$1, $2, $3'

			const { rowCount: grLC } = await client.query(`INSERT INTO groups_list (${fields}) VALUES (${anchors}) RETURNING *`, datas)
			groupListCount = grLC
		}

		if (groupListCount === 1) {
			await client.query('COMMIT')
			return Promise.resolve({ rowCount: userCount, rows: user })
		}

		await client.query('ROLLBACK')
		return Promise.reject(new PgError(`Do not execute query in users.newUser function: userStep: ${userCount}, groupStep: ${groupCount}, groupListStep: ${groupListCount}`))
	} catch (error) {
		await client.query('ROLLBACK')
		throw new PgError(error)
	} finally {
		client.release()
	}
}

async function getUser(condition, done) {
	let client

	if (!condition.mainUser_id) {
		return done(PgError(`The condition must contain the <user_id> field that sets the current user relatively,
			because regarding his rights there will be a request for information from the database`))
	}

	const queryText = `
	SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar FROM users AS mainUser
		RIGHT JOIN users_personality AS usr_p ON mainUser.id = usr_p.user_id
		RIGHT JOIN users_photo AS usr_ph ON mainUser.id = usr_ph.user_id AND usr_ph.isAvatar = true
		WHERE mainUser.id = ${condition.mainUser_id};`

	try {
		client = await pg.pool.connect()

		const { rowCount, rows } = await client.query(queryText)

		if (rowCount === 0) {
			return done({ message: 'User contained in token not found', status: 400, code: 'invalid_verification', name: 'AuthError' })
		} else {
			return done(null, rows[0])
		}
	} catch (error) {
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

async function getUsers(condition, done) {
	let haveID = false,
		condition1 = '',
		condition2 = '',
		client,
		visible = '= 2',
		limit = 'null', offset = 'null'

	for (let key in condition) {
		switch (key) {
			case 'mainUser_id':
				if (isNumeric(condition[key])) {
					haveID = true
					condition2 = condition2 + ` AND ul.user_id = ${condition[key]}`
				} else {
					return done(PgError('The condition field <user_id> must be number and > 0'))
				}
				break
			case 'user_id':
				if (isNumeric(condition[key])) {
					condition1 = condition1 + ` AND usr.id = ${condition[key]}`
					condition2 = condition2 + ` AND ul.friend_id = ${condition[key]}`
					visible = condition.mainUser_id == condition.user_id ? '> 0' : '= 2'
				} else {
					return done(PgError('The condition field <id> must be number and > 0'))
				}
				break
			case 'limit':
				if (isNumeric(condition[key])) {
					limit = condition[key]
				}
				break
			case 'offset':
				if (isNumeric(condition[key])) {
					offset = condition[key]
				}
				break
		}
	}

	if (!haveID) {
		return done(PgError(`The condition must contain the <user_id> field that sets the current user relatively,
			because regarding his rights there will be a request for information from the database`))
	}

	const queryText = `
	SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar FROM users AS usr
		RIGHT JOIN users_personality AS usr_p ON usr.id = usr_p.user_id
		RIGHT JOIN users_photo AS usr_ph ON usr.id = usr_ph.user_id AND usr_ph.isAvatar = true
		WHERE usr.visible ${visible} ${condition1}
	UNION
	SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar FROM users_list AS ul
		RIGHT JOIN users AS usr ON ul.friend_id = usr.id AND usr.visible = 1
		RIGHT JOIN users_personality AS usr_p ON ul.friend_id = usr_p.user_id
		RIGHT JOIN users_photo AS usr_ph ON ul.friend_id = usr_ph.user_id AND usr_ph.isAvatar = true
		WHERE ul.visible > 0 ${condition2}
	LIMIT ${limit} OFFSET ${offset};`

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
	newUser,
	getUsers,
	getUser
}

/*
function _create1(condition, returning = false) {
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
*/
