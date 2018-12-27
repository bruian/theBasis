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
		selectTask = false,
		queryTextTasks,
		pgСonditions = '',
		pgUserGroups = '',
		pgGroups = 'main_visible_groups', //tasks visible only for main user
		pgParentCondition = ' AND tsk.parent = 0', //select Top level tasks
		pgParentCondition2 = 'parent = 0',
		pgTaskCondition = '',
		pgGroupCondition = '',
		pgSearchText = '',
		pgLimit = ''

	try {
		if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
			return done(new PgError('For database operations, a main user token is required'))
		}

		if (isNumeric(condition.limit)) {
			limit = condition.limit
		}

		if (isNumeric(condition.offset)) {
			offset = condition.offset
		}

		if (isNumeric(condition.parent_id) && condition.parent_id > 0) {
			selectTask = true
			pgParentCondition = ` AND tsk.parent = ${condition.parent_id}`
			pgParentCondition2 = `parent = ${condition.parent_id}`
		}

		if (isNumeric(condition.task_id) && condition.task_id > 0) {
			selectTask = true
			pgTaskCondition = ` AND tsk.id = ${condition.task_id}`
		}

		if (!selectTask) {
			pgLimit = `LIMIT ${limit} OFFSET ${offset}`
		}

		if (condition.user_id && isNumeric(condition.user_id)) {
			pgUserGroups = `, user_groups AS (
				SELECT gl.group_id FROM groups_list AS gl
					WHERE gl.group_id IN (SELECT * FROM main_visible_groups) AND gl.user_id = ${condition.user_id}
			)`

			pgGroups = 'user_groups'
		}

		if (condition.group_id && isNumeric(condition.group_id)) {
			pgGroupCondition = ` AND tl.group_id = ${condition.group_id}`
		}

		if (condition.searchText) {
			pgSearchText = ` AND tsk.name ILIKE '%${condition.searchText}%'`
		}

		pgСonditions = pgParentCondition + pgTaskCondition + pgGroupCondition + pgSearchText

		//SELECT mainUser-groups, filter on: mainUser_id or [public groups (group_id = 0)]
		// if condition.whose = 'user' SELECT user-groups from [mainUser-groups] filter on: user_id
		//	SELECT tasks IN [mainUser-groups] OR [user-groups if condition.whose = 'user'] filter on: tasks.parent = task_id

		queryTextTasks = `WITH RECURSIVE main_visible_groups AS (
			SELECT group_id FROM groups_list AS gl
				LEFT JOIN groups AS grp ON gl.group_id = grp.id
				WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
			) ${pgUserGroups}, descendants(id, parent, depth, path) AS (
					SELECT id, parent, 1 depth, ARRAY[id] FROM tasks WHERE ${pgParentCondition2}
			UNION
				SELECT t.id, t.parent, d.depth + 1, path || t.id FROM tasks t
				JOIN descendants d ON t.parent = d.id
			)
			SELECT tl.task_id, tl.group_id, tl.p, tl.q,
				tsk.tid, tsk.name, tsk.owner AS tskowner,
				tsk.status, tsk.duration, tsk.note, tsk.parent,
				(SELECT COUNT(*) FROM tasks WHERE parent = tsk.id) AS havechild,
				dsc.depth
			FROM tasks_list AS tl
			RIGHT JOIN tasks AS tsk ON tl.task_id = tsk.id
			JOIN (SELECT max(depth) AS depth, descendants.path[1] AS parent_id FROM descendants GROUP BY descendants.path[1]) AS dsc ON tl.task_id = dsc.parent_id
			WHERE tl.group_id IN (SELECT * FROM ${pgGroups}) ${pgСonditions}
			ORDER BY tl.group_id, (tl.p::float8/tl.q) ${pgLimit};`

		// queryTextContext = `SELECT cl.task_id, cl.context_id FROM context_list AS cl
		// 	LEFT JOIN context AS c ON c.id = cl.context_id
		// 	LEFT JOIN context_setting AS cs ON cs.context_id = cl.context_id AND cs.user_id = ${condition.mainUser_id}
		// 	WHERE cl.task_id = ANY($1::int[]);`
	} catch (error) {
		return done(error)
	}

	client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		const { rowCount:tasksCount, rows: tasks } = await client.query(queryTextTasks)

		if (tasksCount === 0) {
			await client.query('ROLLBACK')
			return done({ message: `No tasks with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		//const taskIds = tasks.map(el => el.task_id)

		//const { rows:contexts } = await client.query(queryTextContext, [taskIds])

		tasks.forEach(el => {
			//el.context = contexts.filter(fe => fe.task_id === el.task_id).map(function(me) { return me.context_id } )

			el.havechild = parseInt(el.havechild, 10)
			if (el.havechild) el.children = []
		})

		await client.query('commit')

		return done(null, tasks)
	} catch (error) {
		await client.query('ROLLBACK')
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

/***
 * Set new position in tasks_list OR change group for task
 * condition = { mainUser_id,	group_id,	task_id, parent_id,	position,	isBefore }
 */
async function updatePosition(condition, done) {
	let client, queryText, isBefore = false

	try {
		if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
			return done(new PgError('For database operations, a main user token is required'))
		}

		if (!condition.group_id) {
			return done(new PgError('Condition must contain <group_id> field and value must be not null'))
		}

		if (!condition.task_id) {
			return done(new PgError('Condition must contain <task_id> field (from task) and value must be not null'))
		}

		if (condition.isBefore !== null) isBefore = condition.isBefore

		queryText = `SELECT reorder_task(${condition.mainUser_id}, ${condition.group_id}, ${condition.task_id}, ${condition.position}, ${isBefore}, ${condition.parent_id});`
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

async function updateTask(condition, done) {
	let client, queryText, attributes = ''

	if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
		return done(new PgError('For database operations, a main user token is required'))
	}

	if (!condition.task_id) {
		return done(new PgError('Condition must contain <task_id> field (from task) and value must be not null'))
	}

	for (var prop in condition.values) {
		switch (prop) {
			case 'name':
				attributes = attributes + ` name = '${condition.values[prop]}'`
				break
			case 'note':
				attributes = attributes + ` note = '${condition.values[prop]}'`
				break
			default:
				break;
		}
	}

	if (attributes.length === 0) {
		return done(new PgError('Condition must contain in body <object> with task attributes '))
	}

	queryText = `WITH main_visible_task AS (
		SELECT tl.task_id FROM groups_list AS gl
			LEFT JOIN groups AS grp ON gl.group_id = grp.id
			RIGHT JOIN tasks_list AS tl ON gl.group_id = tl.group_id AND tl.task_id = ${condition.task_id}
			WHERE grp.reading >= gl.user_type AND grp.updating >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
		)
		UPDATE tasks SET ${attributes} WHERE id IN (SELECT * FROM main_visible_task);`

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

async function addTask(condition, done) {
	let client,
			isStart,
			queryText,
			params,
			errMessage = ''

	if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
		return done(new PgError('For database operations, a main user token is required'))
	}

	if (isNumeric(condition.parent_id) && condition.parent_id >= 0) {
	} else {
		return done(new PgError('For add task need: <parent_id> attribut >= 0'))
	}

	if (isNumeric(condition.group_id) && condition.group_id > 0) {
	} else {
		return done(new PgError('For add task need: <group_id> attribut >= 0'))
	}

	if (condition.isStart !== null) {
		isStart = (condition.isStart === 'true') ? true : false
	}

	queryText = `SELECT add_task($1, $2, $3, $4);`
	params = [condition.mainUser_id, condition.group_id, condition.parent_id, isStart]

	client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		const { rowCount, rows } = await client.query(queryText, params)

		if (rowCount === 0) {
			await client.query('ROLLBACK')
			return done({ message: `No tasks with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		let result = rows[0].add_task
		if (result <= 0) {
			switch(result) {
				case 0:
					errMessage = 'Group for main user not found'
					break
				case -1:
					errMessage = 'No rights to read the group'
					break
				case -2:
					errMessage = 'No rights to read the task by the ID'
					break
				case -3:
					errMessage = 'No rights to create the task in the group'
					break
			}

			await client.query('ROLLBACK')
			return done({ message: errMessage, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		queryText = `SELECT tl.task_id, tl.group_id, tl.p, tl.q,
			tsk.tid, tsk.name, tsk.owner AS tskowner,
			tsk.status, tsk.duration, tsk.note, tsk.parent,
			0 AS havechild,	1 as depth
		FROM tasks_list AS tl
		RIGHT JOIN tasks AS tsk ON tl.task_id = tsk.id
		WHERE tl.task_id = $1 AND tl.group_id = $2`
		params = [result, condition.group_id]

		const { rows: tasks } = await client.query(queryText, params)

		await client.query('commit')

		return done(null, tasks)
	} catch (error) {
		await client.query('ROLLBACK')
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
	getTasks,
	updatePosition,
	updateTask,
	addTask
}
