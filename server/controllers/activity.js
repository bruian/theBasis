// const srvPath = process.cwd() + '/server/'
// const log = require(srvPath + 'log')(module)

import VError from 'VError'
import { isNumeric } from '../utils'
import { PgError } from '../errors'
import pg from '../db/postgres'

async function getActivity(condition, done) {
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
 * @func addActivity
 * @param {{ mainUser_id: Number,	group_id: Number,
 * 					 type_el: Number, task_id: Number,
 * 					 start: ISO-DateTime string,
 * 					 isStart: boolean }} condition - Get from api
 * @param { function(...args): Callback } done
 * @returns { function(...args): Promise }
 * @description Create new <Activity> in database
 * And set new position in activity_list and linked to the task if it exists
*/
async function addActivity(condition, done) {
	let task_id = null,
			isStart = false,
			start = null,
			end = null

	/* Убедимся что все параметры присутствуют */

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе
		относительно этого пользователя происходит запрос данных у базы, с ним же
		связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда
		сервером авторизации
		- Ожидается number */
	if (!condition.hasOwnProperty('mainUser_id')
		|| !isNumeric(condition.mainUser_id)) {
		return done(new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'mainUser_id', 'value': condition.mainUser_id, 'status': 401 /* Unauthorized */ }
		}, 'User authentication required'))
		//{ message: `User authentication required`, status: 400, code: 'no_datas', name: 'ApiMessage' })
	}

	/* group_id - идентификатор группы в которую будет добавляться новая активность.
		- обязательный параметр, относительно которого назначаются параметры
		прав доступа и видимости элементов
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('group_id')
		|| !isNumeric(condition.group_id)) {
		return done(new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'group_id', 'value': condition.group_id, 'status': 400 /* Bad request */ }
		}, 'For add activity need: <group_id> query parameter >= 0'))
	}

	/* type_el - идентификатор типа элемента, в текущем случае это activity = 1
		- обязательный параметр
		- должен приходить от клиента а api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('type_el')
		|| !isNumeric(condition.type_el)) {
		return done(new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'type_el', 'value': condition.type_el, 'status': 400 /* Bad request */ }
		}, 'For add activity need: <type_el> query parameter >= 0'))
	}

	/* start - параметр указывающий начало статуса элемента активности
		- обязательный параметр
		- ожидается string со значением ISO DateTime */
	if (!condition.hasOwnProperty('start')
		|| typeof condition.start !== 'string') {
		return done(new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'start', value: condition.start, 'status': 400 /* Bad request */ }
		}, 'For add activity need: <start> query parameter ISO DateTime string'))
	} else {
		const valid = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/.test(condition.start)
		if (!valid) {
			return done(new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'start', value: condition.start, 'status': 400 /* Bad request */ }
			}, '<start> value might contain string in ISO DateTime'))
		}

		start = condition.start
	}

	/* task_id - идентификатор задачи, к которой будет привязан создаваемый элемент
		- необязательный параметр, отсутвие которого говорит о том что элемент не привязан
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('task_id')) {
		if (!isNumeric(condition.task_id)) {
			return done(new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'task_id', 'value': condition.task_id, 'status': 400 /* Bad request */ }
			}, '<task_id> query parameter >= 1'))
		}

		task_id = condition.task_id
	}

	/* isStart - параметр указывающий куда поместить создаваемый элемент,
		в начало или конец списка
		- необязательный параметр, отсутсвие которого полагает начало списка
		- ожидается boolean */
	if (condition.hasOwnProperty('isStart')) {
		if (condition.isStart === null || condition.isStart === undefined) {
			return done(new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'task_id', 'value': condition.task_id, 'status': 400 /* Bad request */ }
			}, '<isStart> query has been boolean'))
		}

		isStart = (condition.isStart)
	}

	/* Добавление элемента activity происходит в 4 этапа
		1) Создание в таблице activity элемента со значениями default:
			task_id = null, name = '', note = '', part = 0, status = 0, owner = mainUser_id,
			productive = false, start = null, ends = null
		2) Добавление id созданного элемента в таблицу activity_list со значениями default:
			group_id = group_id, user_id = mainUser_id, type_el = type_el
		3) Если присутствует параметр start, то обновляется это значение в таблице activity
		4) Если присутствует параметр task_id, то обновляется это значение в таблице activity,
			значение activity.name обновляется на task.name
			значение productuve обновляется на true
	*/
	const client = await pg.pool.connect()

	try {
		// Начало транзакции
		await client.query('BEGIN')

		// Создание в таблице activity элемента и добавление в activity_list
		let queryText = `SELECT add_activity($1, $2, $3, $4);`
		let params = [condition.mainUser_id, condition.group_id, condition.type_el, isStart]
		const { rows: newElements } = await client.query(queryText, params)

		const elementId = newElements[0].add_activity

		// Обновление значения start в таблице activity
		if (start) {
			queryText = 'UPDATE activity SET start = $1 WHERE id = $2;'
			params = [start, elementId]
			await client.query(queryText, params)
		}

		// Обновление значения task_id в таблице activity
		if (task_id) {
			queryText = 'UPDATE activity SET task_id = $1 WHERE id = $2;'
			params = [task_id, elementId]
			await client.query(queryText, params)
		}

		// Фиксация транзакции
		await client.query('commit')

		// Получение данных по добавленному элементу
		queryText = `SELECT al.id, al.group_id, al.user_id, al.type_el,
			act.task_id, act.name, act.note, act.productive, act.part,
			act.status, act.owner, act.start, act.ends
		FROM activity_list AS al
		RIGHT JOIN activity AS act ON al.id = act.id
		WHERE al.id = $1`
		params = [elementId]
		const { rows: elements } = await client.query(queryText, params)

		// if (rowCount === 0) {
		// 	await client.query('ROLLBACK')

		// 	return done(new VError({
		// 		'name': 'DatabaseError',
		// 		'info': { 'status': 400 /* Bad request */ }
		// 	}, 'No datas from db'))
		// }

		return done(null, elements)
	} catch (error) {
		await client.query('ROLLBACK')

		return done(new VError({
			'name': 'DatabaseError',
			'cause': error,
			'info': { 'status': 400 }
		}, 'DB error'))
	} finally {
		client.release()
	}
}

async function updateActivity(condition, done) {
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

async function deleteActivity(condition, done) {
	let client,
			onlyFromList = true,
			queryText,
			params,
			errMessage = ''

	if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
		return done(new PgError('For database operations, a main user token is required'))
	}

	if (isNumeric(condition.task_id) && condition.task_id >= 0) {
	} else {
		return done(new PgError('For delete task need: <task_id> attribut >= 0'))
	}

	if (isNumeric(condition.group_id) && condition.group_id > 0) {
	} else {
		return done(new PgError('For delete task need: <group_id> attribut >= 0'))
	}

	queryText = `SELECT delete_task($1, $2, $3, $4);`
	params = [condition.mainUser_id, condition.task_id, condition.group_id, onlyFromList]

	client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		const { rowCount, rows } = await client.query(queryText, params)

		if (rowCount === 0) {
			await client.query('ROLLBACK')
			return done({ message: `No tasks with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		let result = rows[0].delete_task
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
					errMessage = 'No rights to delete the task from the group'
					break
				case -4:
					errMessage = 'Can not delete. Task have subelement'
					break
			}

			await client.query('ROLLBACK')
			return done({ message: errMessage, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		await client.query('commit')

		return done(null, true)
	} catch (error) {
		await client.query('ROLLBACK')
		return done(new PgError(error))
	} finally {
		client.release()
	}
}

/***
 * Set new position in activity_list OR change group for activity
 * condition = { mainUser_id,	group_id,	activity_id, position,	isBefore }
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

module.exports = {
	getActivity,
	addActivity,
	updateActivity,
	deleteActivity,
	updatePosition,
}
