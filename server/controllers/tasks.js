const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import { isNumeric } from '../utils'
import { PgError, SrvError } from '../errors'
import pg from '../db/postgres'

async function _create(condition, client) {
	const parametres = pg.prepareParametres(condition)
	let		tempClient = (client) ? client : await pg.pool.connect()

	try {
		const { rowCount: tasksCount, rows: tasks } = await tempClient.query(`INSERT INTO tasks (${parametres.fields}) VALUES (${parametres.anchors}) RETURNING *`, parametres.values)

		if (tasksCount === 1) {
			return Promise.resolve({ rowCount: tasksCount, rows: tasks })
		} else {
			return Promise.reject({ error: 'Do not execute query', taskStep: tasksCount })
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

		return client.query(`SELECT * FROM tasks WHERE ${parametres.condition}`, parametres.values)
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

		return client.query(`UPDATE tasks SET ${parametres.datastring} WHERE ${parametres.condition} ${retstring}`, parametres.values)
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

		return client.query(`DELETE FROM tasks WHERE ${parametres.condition}`, parametres.values)
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

async function getTasks(condition, done) {
	let client,
		limit = 'null', offset = 'null',
		queryText = ''

	try {
		if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
			return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
				because regarding his rights there will be a request for information from the database`))
		}

		//if (isNumeric(condition.user_id)) {}

		if (isNumeric(condition.limit)) {
			limit = condition.limit
		}

		if (isNumeric(condition.offset)) {
			offset = condition.offset
		}

		// if (condition.like) {
		// 	condition1 = condition1 + ` AND grp.name ILIKE '%${condition.like}%'`
		// }

		// let whose
		// if (condition.whose === '' || condition.whose === 'all') {
		// 	whose = `AND grp.owner != ${condition.mainUser_id}`
		// } else if (condition.whose === 'user') {
		// 	whose = ''
		// }
		/*
		queryText = `WITH main_visible_groups AS (
			SELECT group_id, user_type, name, parent,
						 creating, reading, updating, deleting,
						 task_creating, task_reading, task_updating,
						 task_deleting, group_type, owner FROM groups_list AS gl
				RIGHT JOIN groups AS grp ON gl.group_id = grp.id
				WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
			)
			SELECT tl.task_id, tsk.tid, tsk.name,
						 tsk.owner AS tskowner, tsk.status,
						 tsk.duration, tsk.note, mvg.group_id,
						 mvg.owner AS growner FROM main_visible_groups AS mvg
					JOIN tasks_list AS tl ON mvg.group_id = tl.group_id
					LEFT JOIN tasks AS tsk ON tl.task_id = tsk.id
					ORDER BY tl.group_id, (tl.p::float8/tl.q)
			LIMIT ${limit} OFFSET ${offset}`
		*/

		queryText = `WITH RECURSIVE main_visible_groups AS (
			SELECT group_id FROM groups_list AS gl
				RIGHT JOIN groups AS grp ON gl.group_id = grp.id
				WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
			), recursive_tree (id, parent, path, group_id, p, q, level) AS (
			SELECT T1t.id, T1t.parent, CAST (T1t.id AS VARCHAR (50)) AS path, T1tl.group_id, T1tl.p, T1tl.q, 1
				FROM tasks_list AS T1tl
			RIGHT JOIN tasks AS T1t ON (T1tl.task_id = T1t.id)
			WHERE T1t.parent IS NULL AND T1tl.group_id IN (SELECT group_id FROM main_visible_groups)
				UNION
			SELECT T2t.id, T2t.parent, CAST (recursive_tree.PATH ||'->'|| T2t.id AS VARCHAR(50)), T2tl.group_id, T2tl.p, T2tl.q, level + 1
				FROM tasks_list AS T2tl
			RIGHT JOIN tasks AS T2t ON (T2tl.task_id = T2t.id)
			INNER JOIN recursive_tree ON (recursive_tree.id = T2t.parent)
		)	SELECT tsk.id AS task_id, tsk.tid, tsk.name,
			tsk.owner AS tskowner, tsk.status, tsk.duration,
			tsk.note, recursive_tree.group_id, recursive_tree.p, recursive_tree.q, recursive_tree.level FROM recursive_tree
		LEFT JOIN tasks AS tsk ON recursive_tree.id = tsk.id
		ORDER BY recursive_tree.group_id, (recursive_tree.p::float8/recursive_tree.q)
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
	getTasks
}
