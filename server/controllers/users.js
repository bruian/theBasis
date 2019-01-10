const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import { isNumeric } from '../utils'
import { PgError, SrvError } from '../errors'
import pg from '../db/postgres'

async function _create(condition, client) {
	const parametres = pg.prepareParametres(condition)
	let		tempClient = (client) ? client : await pg.pool.connect()

	try {
		const { rowCount: userCount, rows: user } = await tempClient.query(`INSERT INTO users (${parametres.fields}) VALUES (${parametres.anchors}) RETURNING *`, parametres.values)

		if (userCount === 1) {
			return Promise.resolve({ rowCount: userCount, rows: user })
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
			fields = 'name, parent, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, group_type'
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
		return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
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
	let client,
		condition1 = '',
		condition2 = '',
		limit = 'null', offset = 'null',
		queryText = ''

	try {
		if (isNumeric(condition.mainUser_id)) {
			condition2 = condition2 + ` AND ul.user_id = ${condition.mainUser_id}`
		} else {
			return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
			because regarding his rights there will be a request for information from the database`))
		}

		if (isNumeric(condition.user_id)) {
			condition1 = condition1 + ` AND usr.id = ${condition.user_id}`
			//condition2 = condition2 + ` AND ul.friend_id = ${condition.user_id}`
			//visible = condition.mainUser_id == condition.user_id ? '> 0' : '= 2'
		}

		if (isNumeric(condition.limit)) {
			limit = condition.limit
		}

		if (isNumeric(condition.offset)) {
			offset = condition.offset
		}

		if (condition.like) {
			condition1 = condition1 + ` AND usr.username ILIKE '%${condition.like}%'`
			condition2 = condition2 + ` AND usr.username ILIKE '%${condition.like}%'`
		}

		/* users.visible: 0 - not visible, 1 - only from user list, 2 - visible for all */
		/* users_list.visible: 0 - not visible for cpecific user, 1 - visible for specific invited user and friend user,
			2 - visible for specific friend user */
		if (condition.whose === '' || condition.whose === 'all') {
			/* query for get all visible users form me (I see all users and my friends, if they visible) */
			queryText = `WITH users_table AS (
			SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar, 0 as friend FROM users AS usr
				RIGHT JOIN users_personality AS usr_p ON usr.id = usr_p.user_id
				RIGHT JOIN users_photo AS usr_ph ON usr.id = usr_ph.user_id AND usr_ph.isAvatar = true
				WHERE usr.visible = 2 ${condition1}
			UNION
			SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar, 1 as friend FROM users_list AS ul
				RIGHT JOIN users AS usr ON ul.friend_id = usr.id AND usr.visible > 0
				RIGHT JOIN users_personality AS usr_p ON ul.friend_id = usr_p.user_id
				RIGHT JOIN users_photo AS usr_ph ON ul.friend_id = usr_ph.user_id AND usr_ph.isAvatar = true
				WHERE ul.visible > 0 ${condition2})
			SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, avatar, sum(friend) as friend FROM users_table
			GROUP BY id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, avatar
			LIMIT ${limit} OFFSET ${offset};`
		} else if (condition.whose === 'user') {
			if (condition.mainUser_id == condition.user_id) {
				/* query for get my visible form me friends (I see only my friends, if they visible) */
				queryText = `
				SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar, 1 as friend FROM users_list AS ul
					RIGHT JOIN users AS usr ON ul.friend_id = usr.id AND usr.visible > 0
					RIGHT JOIN users_personality AS usr_p ON ul.friend_id = usr_p.user_id
					RIGHT JOIN users_photo AS usr_ph ON ul.friend_id = usr_ph.user_id AND usr_ph.isAvatar = true
					WHERE ul.visible = 2 ${condition2}
				LIMIT ${limit} OFFSET ${offset};`
			} else {
				/* query for get visible friends my friend (I see his/her friends, if i'm his/her friend and if they visible) */
				queryText = `
				WITH main_ul AS (
					SELECT * FROM users_list AS ul
					WHERE ul.visible = 2 AND ul.user_id = ${condition.mainUser_id} AND ul.friend_id = ${condition.user_id}
				)
				SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar FROM users_list AS ul
					RIGHT JOIN users AS usr ON ul.friend_id = usr.id AND usr.visible = 1
					RIGHT JOIN users_personality AS usr_p ON ul.friend_id = usr_p.user_id
					RIGHT JOIN users_photo AS usr_ph ON ul.friend_id = usr_ph.user_id AND usr_ph.isAvatar = true
					WHERE ul.visible > 0 AND (SELECT COUNT(user_id) FROM main_ul) > 0 ${condition2};`
			}
		}
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

/* Add user to my user list */
async function addUsers(condition, done) {
	let client, queryText

	try {
		if (!isNumeric(condition.mainUser_id)) {
			return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
			because regarding his rights there will be a request for information from the database`))
		}

		if (isNumeric(condition.user_id)) {
			queryText = `INSERT INTO users_list (user_id, friend_id, visible) VALUES (${condition.mainUser_id}, ${condition.user_id}, 2) RETURNING *`
		} else {
			return done(new PgError(`The condition must contain the <user_id> field`))
		}
	} catch (error) {
		return done(error)
	}

	try {
		client = await pg.pool.connect()

		const { rowCount } = await client.query(queryText)

		if (rowCount === 0) {
			return done({ message: `Can't add user to users-list`, status: 400, code: 'rejected_addusers', name: 'ApiMessage' })
		} else {
			return done(null, true)
		}
	} catch (error) {
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

/* Remove user from my user list */
async function removeUsers(condition, done) {
	let client, queryText

	try {
		if (!isNumeric(condition.mainUser_id)) {
			return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
			because regarding his rights there will be a request for information from the database`))
		}

		if (isNumeric(condition.user_id)) {
			queryText = `DELETE FROM users_list WHERE user_id = ${condition.mainUser_id} AND friend_id = ${condition.user_id} RETURNING *`
		} else {
			return done(new PgError('The condition must contain the <user_id> field'))
		}
	} catch (error) {
		return done(error)
	}

	try {
		client = await pg.pool.connect()

		const { rowCount } = await client.query(queryText)

		if (rowCount === 0) {
			return done({ message: `Can't remove user from users-list`, status: 400, code: 'rejected_deleteusers', name: 'ApiMessage' })
		} else {
			return done(null, true)
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
	getUser,
	addUsers,
	removeUsers
}
