const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import { isNumeric } from '../utils'
import { PgError } from '../errors'
import pg from '../db/postgres'

async function getContexts(condition, done) {
	let client,
			limit = 'null', offset = 'null',
			queryText,
			pgTaskCondition = '',
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

		if (isNumeric(condition.task_id) && condition.task_id > 0) {
			pgTaskCondition = ` AND tl.task_id = ${condition.task_id}`
		}

		if (isNumeric(condition.limit) && isNumeric(condition.offset)) {
			pgLimit = `LIMIT ${limit} OFFSET ${offset}`
		}

		if (condition.searchText) {
			pgSearchText = ` AND c.value ILIKE '%${condition.searchText}%'`
		}

		queryText = `WITH main_visible_groups AS (
			SELECT group_id FROM groups_list AS gl
				LEFT JOIN groups AS grp ON gl.group_id = grp.id
				WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
			)
			SELECT tl.group_id, tl.task_id, cl.context_id, c.value,
				cs.user_id, cs.inherited_id, cs.active, cs.note, cs.activity_type FROM tasks_list AS tl
			RIGHT JOIN context_list AS cl ON cl.task_id = tl.task_id
			RIGHT JOIN context AS c ON cl.context_id = c.id
			RIGHT JOIN context_setting AS cs ON cs.context_id = cl.context_id AND cs.user_id = ${condition.mainUser_id}
			WHERE tl.group_id IN (SELECT * FROM main_visible_groups) ${pgTaskCondition} ${pgSearchText}
			ORDER BY tl.group_id, tl.task_id ${pgLimit};`
	} catch (error) {
		return done(error)
	}

	client = await pg.pool.connect()

	try {
		const { rowCount:contextsCount, rows: contexts } = await client.query(queryText)

		if (contextsCount === 0) {
			return done({ message: `No tasks with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		return done(null, contexts)
	} catch (error) {
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

async function addContext(condition, done) {
	let client,
		queryText = '',
		value = '',
		context_id = null

	if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
		return done(new PgError('For database operations, a main user token is required'))
	}

	if (!condition.task_id && !isNumeric(condition.task_id)) {
		return done(new PgError('For database operations, a <task_id> is required'))
	}

	if ('context_value' in condition.values) {
		value = condition.values.context_value
	}

	if ('context_id' in condition.values) {
		context_id = condition.values.context_id
	}

	if (value === '' && context_id === null) {
		return done(new PgError('For context update need, a <context_id> or <context_value> in body req'))
	}

	queryText = `SELECT add_task_context($1, $2, $3, $4)`
	const params = [condition.mainUser_id, condition.task_id, context_id, value]

	client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		const { rowsCount, rows: result } = await client.query(queryText, params)

		if (rowsCount === 0) {
			await client.query('ROLLBACK')
			return done({ message: `No tasks with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		if (result[0].add_task_context <= 0) {
			let errMessage = ''
			switch (result[0].add_task_context) {
				case 0:
					errMessage = 'There is no group or task that matches the specified <task-id> or main user token'
					break
				case -1:
					errMessage = 'No rights to read the group containing the task'
					break
				case -2:
					errMessage = 'No rights to read the task by the ID'
					break
				case -3:
					errMessage = 'No rights to update the task by the ID'
					break
				case -4:
					errMessage = 'Values must contain either the name of the context or its id'
					break
				case -5:
					errMessage = 'There is no context with such an id and the name of the context for its creation is not specified'
			}

			await client.query('ROLLBACK')
			return done({ message: errMessage, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		queryText = `SELECT tl.group_id, tl.task_id, cl.context_id, c.value,
		cs.user_id, cs.inherited_id, cs.active, cs.note, cs.activity_type FROM tasks_list AS tl
		RIGHT JOIN context_list AS cl ON cl.task_id = tl.task_id
		RIGHT JOIN context AS c ON cl.context_id = c.id
		RIGHT JOIN context_setting AS cs ON cs.context_id = cl.context_id AND cs.user_id = $1
		WHERE cl.context_id = $2 AND tl.task_id = $3;`

		const { rows:contexts } = await client.query(queryText, [condition.mainUser_id, result[0].add_task_context, condition.task_id])

		await client.query('commit')

		return done(null, contexts[0])
	} catch (error) {
		await client.query('ROLLBACK')
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

module.exports = {
	getContexts,
	addContext
}
