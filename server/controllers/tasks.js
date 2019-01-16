// const srvPath = process.cwd() + '/server/'
// const log = require(srvPath + 'log')(module)

import VError from 'VError'
import { isNumeric } from '../utils'
import { PgError } from '../errors'
import pg from '../db/postgres'

/***
 * @func getTasks
 * @param {{ mainUser_id: Number, group_id: Number,	type_el: Number, limit: Number, offset: Number,
 * 					 searchText: String, user_id: Number, task_id: Number }}
 * @returns { function(...args): Promise }
 * @description Get tasks from database. if task_id is given, then get one task, else get tasks arr
 */
async function getTasks(condition) {
	let limit = 'null', offset = 'null',
		selectTask = false,
		params = [],
		pgСonditions = '',
		pgUserGroups = '',
		pgGroups = 'main_visible_groups', //tasks visible only for main user
		pgParentCondition = ' AND tsk.parent = 0', //select Top level tasks
		pgParentCondition2 = 'parent = 0',
		pgTaskCondition = '',
		pgGroupCondition = '',
		pgSearchText = '',
		pgLimit = ''

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе	относительно
		этого пользователя происходит запрос данных у базы, с ним же связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда
		сервером авторизации
		- Ожидается number */
	if (!condition.hasOwnProperty('mainUser_id') || !isNumeric(condition.mainUser_id)) {
		/* Unauthorized */
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'mainUser_id', 'value': condition.mainUser_id, 'status': 401 }
		}, 'User authentication required')
	} else {
		params.push(condition.mainUser_id)
	}

	/* parent_id - идентификатор родителя элемента, может быть 0 если элемент верхнего уровня
	- необязательный параметр, по умолчанию считается как 0
	- может приходить от клиента в api запросе express.router.request.query
	- ожидается number */
	if (condition.hasOwnProperty('parent_id') && parseInt(condition.parent_id, 10) > 0) {
		pgParentCondition = ` AND tsk.parent = \$${params.length + 1}`
		pgParentCondition2 = `parent = \$${params.length + 1}`
		params.push(condition.parent_id)
		selectTask = true
	}

	/* task_id - идентификатор элемента, при наличии этого параметра отбор будет	производиться
		только по	нему
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('task_id') && parseInt(condition.task_id, 10) > 0) {
		pgTaskCondition = ` AND tsk.id = \$${params.length + 1}`
		params.push(condition.task_id)
		selectTask = true
	}

	/* group_id - идентификатор группы относительно, которой будут извлекаться активности
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('group_id')) {
		pgGroupCondition = ` AND tl.group_id = \$${params.length + 1}`
		params.push(condition.group_id)
	}

	/* user_id - параметр по которому фильтруются значения элементов
		- mainUser_id фильтрует по правам доступа, а user_id фильтрует уже из доступного списка
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('user_id')) {
		pgUserGroups = `, user_groups AS (
			SELECT gl.group_id FROM groups_list AS gl
				WHERE (gl.group_id IN (SELECT * FROM main_visible_groups))
					AND (gl.user_id = \$${params.length + 1}))`
		pgGroups = 'user_groups'

		params.push(condition.user_id)
	}

	/* searchText - параметр по которому фильтруются значения элементов в	полях name и note
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается string */
	if (condition.hasOwnProperty('searchText')) {
		pgSearchText = ` AND tsk.name ILIKE '%\$${params.length + 1}%'`
		params.push(condition.searchText)
	}

	if (!selectTask) {
		/* limit - параметр который задает предел записей, что выдаст DB
			- обязательный параметр для запроса массива данных
			- должен приходить от клиента в api запросе express.router.request.header
			- ожидается number не больше 40 */
		if (!condition.hasOwnProperty('limit')) {
			/* Bad request */
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'limit', 'value': condition.limit, 'status': 400 }
			}, '<limit> header parameter must contain number <= 40')
		} else {
			limit = parseInt(condition.limit, 10)

			if (limit < 1 || limit > 100) {
				/* Bad request */
				throw new VError({
					'name': 'WrongParameter',
					'info': { 'parameter': 'limit', 'value': condition.limit, 'status': 400 }
				}, '<limit> header parameter must contain number <= 40')
			}
		}

		/* offset - параметр который задает сдвиг относительно которого будет считываться текущая
			порция данных
			- обязательный параметр для запроса массива данных
			- должен приходить от клиента в api запросе express.router.request.header
			- ожидается number */
		if (!condition.hasOwnProperty('offset')) {
			/* Bad request */
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'limit', 'value': condition.offset, 'status': 400 }
			}, '<offset> header parameter must contain number >= 0')
		} else {
			offset = parseInt(condition.offset, 10)

			if (offset < 0) {
				/* Bad request */
				throw new VError({
					'name': 'WrongParameter',
					'info': { 'parameter': 'limit', 'value': condition.offset, 'status': 400 }
				}, '<offset> header parameter must contain number >= 0')
			}
		}

		if (limit !== null && offset !== null) {
			pgLimit = `LIMIT \$${params.length + 1} OFFSET \$${params.length + 2}`
			params.push(limit)
			params.push(offset)
		}
	}

	pgСonditions = pgParentCondition + pgTaskCondition + pgGroupCondition + pgSearchText

	//SELECT mainUser-groups, filter on: mainUser_id or [public groups (group_id = 0)]
	// if condition.whose = 'user' SELECT user-groups from [mainUser-groups] filter on: user_id
	//	SELECT tasks IN [mainUser-groups] OR [user-groups if condition.whose = 'user'] filter on:
	//		tasks.parent = task_id

	/* $1 = mainUser_id */
	let queryText = `WITH RECURSIVE main_visible_groups AS (
		SELECT group_id FROM groups_list AS gl
			LEFT JOIN groups AS grp ON gl.group_id = grp.id
			WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = $1)
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
		JOIN (SELECT max(depth) AS depth, descendants.path[1] AS parent_id
					FROM descendants GROUP BY descendants.path[1]) AS dsc ON tl.task_id = dsc.parent_id
		WHERE tl.group_id IN (SELECT * FROM ${pgGroups}) ${pgСonditions}
		ORDER BY tl.group_id, (tl.p::float8/tl.q) ${pgLimit};`

	const client = await pg.pool.connect()

	try {
		const { rows: tasks } = await client.query(queryText, params)

		tasks.forEach(el => {
			el.havechild = parseInt(el.havechild, 10)
			if (el.havechild) el.children = []
		})

		return Promise.resolve(tasks)
	} catch (error) {
		throw new VError({
			'name': 'DatabaseError',
			'cause': error,
			'info': { 'status': 400 }
		}, 'DB error')
	} finally {
		client.release()
	}
}

/***
 * @func addTask
 * @param {{ mainUser_id: Number,	group_id: Number,
 * 					 parent_id: Number, start: ISO-DateTime string,
 * 					 isStart: boolean }} condition - Get from api
 * @returns { function(...args): Promise }
 * @description Create new <Task> in database and set new position in tasks_list
*/
async function addTask(condition) {
	let isStart = true

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе
		относительно этого пользователя происходит запрос данных у базы, с ним же
		связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда
		сервером авторизации
		- Ожидается number */
	if (!condition.hasOwnProperty('mainUser_id') || !isNumeric(condition.mainUser_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'mainUser_id', 'value': condition.mainUser_id, 'status': 401 /* Unauthorized */ }
		}, 'User authentication required')
	}

	/* parent_id - идентификатор указывающий на родителя в иерархии задач
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- Ожидается number
		- может быть 0 - указывает на отсутствии родителя у задачи */
	if (!condition.hasOwnProperty('parent_id') || !isNumeric(condition.parent_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'parent_id', 'value': condition.parent_id, 'status': 400 /* Bad request */ }
		}, 'For add task need: <parent_id> query parameter >= 0')
	}

	/* group_id - идентификатор группы в которую будет добавляться новая задача.
		- обязательный параметр, относительно которого назначаются параметры
		прав доступа и видимости элементов
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('group_id')	|| !isNumeric(condition.group_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'group_id', 'value': condition.group_id, 'status': 400 /* Bad request */ }
		}, 'For add task need: <group_id> query parameter > 0')
	}

	/* isStart - параметр указывающий куда поместить создаваемый элемент,	в начало или конец списка
		- необязательный параметр, отсутсвие которого полагает начало списка
		- ожидается boolean */
	if (condition.hasOwnProperty('isStart')) {
		if (condition.isStart === null || condition.isStart === undefined) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'task_id', 'value': condition.task_id, 'status': 400 /* Bad request */ }
			}, '<isStart> query has been boolean')
		}

		isStart = (condition.isStart === 'true')
	}

	const client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		let queryText = `SELECT add_task($1, $2, $3, $4);`
		let params = [condition.mainUser_id, condition.group_id, condition.parent_id, isStart]
		const { rows: newElements } = await client.query(queryText, params)

		const elementId = newElements[0].add_task

		queryText = `SELECT tl.task_id, tl.group_id, tl.p, tl.q,
			tsk.tid, tsk.name, tsk.owner AS tskowner,
			tsk.status, tsk.duration, tsk.note, tsk.parent,
			0 AS havechild,	1 as depth
		FROM tasks_list AS tl
		RIGHT JOIN tasks AS tsk ON tl.task_id = tsk.id
		WHERE tl.task_id = $1 AND tl.group_id = $2`
		params = [elementId, condition.group_id]

		const { rows: tasks } = await client.query(queryText, params)

		await client.query('commit')

		return Promise.resolve(tasks)
	} catch (error) {
		await client.query('ROLLBACK')

		throw new VError({
			'name': 'DatabaseError',
			'cause': error,
			'info': { 'status': 400 }
		}, 'DB error')
	} finally {
		client.release()
	}
}

/***
 * @func updateTask
 * @param {{ mainUser_id: Number,	task_id: Number }} condition - Get from api
 * @param { values: Object } - values that need to be changed
 * @returns { function(...args): Promise }
 * @description Update exists <Task> in database
*/
async function updateTask(condition, values) {
	let attributes = '',
			params = []

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе
		относительно этого пользователя происходит запрос данных у базы, с ним же
		связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда
		сервером авторизации
		- Ожидается number */
	if (!condition.hasOwnProperty('mainUser_id') || !isNumeric(condition.mainUser_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'mainUser_id', 'value': condition.mainUser_id, 'status': 401 /* Unauthorized */ }
		}, 'User authentication required')
	} else {
		params.push(condition.mainUser_id)
	}

	/* task_id - идентификатор задачи, которая будет меняться
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('task_id')) {
		// if (condition.id.length !== 8) {
		// 	throw new VError({
		// 		'name': 'WrongParameter',
		// 		'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 /* Bad request */ }
		// 	}, '<id> query parameter must contain 8 char string')
		// }

		params.push(condition.task_id)
	} else {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'task_id', 'value': condition.task_id, 'status': 400 /* Bad request */ }
		}, 'For update values need <task_id> query parameter')
	}

	/* Соберем запрос из значений, которые можно изменить
		- изменение group_id и parent у задачи разрешено вызовом метода updatePosition
		- изменение tid, owner запрещено */
	for (var prop in values) {
		switch (prop) {
			case 'tid':
				throw new VError({
					'name': 'WrongMethod',
					'info': { 'parameter': 'tid', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The task can not change the tid.')
			case 'owner':
				throw new VError({
					'name': 'WrongMethod',
					'info': { 'parameter': 'owner', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The task can not change the owner.')
			case 'parent':
				throw new VError({
					'name': 'WrongMethod',
					'info': { 'parameter': 'parent', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The parent is changed using the HTTP method "PUT" with path /task/order')
			case 'group_id':
				throw new VError({
					'name': 'WrongMethod',
					'info': { 'parameter': 'group_id', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The group_id is changed using the HTTP method "PUT" with path /task/order')
			case 'name':
				attributes = attributes + ` name = \$${params.length + 1}`
				params.push(values[prop])
				break
			case 'note':
				attributes = attributes + ` note = \$${params.length + 1}`
				params.push(values[prop])
				break
			default:
				break;
		}
	}

	/* Если ничего не передано для изменения, то нет смысла делать запрос к базе */
	if (attributes.length === 0) {
		throw new VError({
			'name': 'WrongBody',
			'info': { 'status': 400 /* Bad request */ }
		}, 'For update need JSON object with values in body')
	}

	/* Обновляем только те элементы задач, которые состоят в доступных пользователю группах */
	let queryText = `WITH main_visible_task AS (
		SELECT tl.task_id FROM groups_list AS gl
			LEFT JOIN groups AS grp ON gl.group_id = grp.id
			RIGHT JOIN tasks_list AS tl ON (gl.group_id = tl.group_id) AND (tl.task_id = $2)
			WHERE (grp.reading >= gl.user_type)
				AND (grp.el_updating >= gl.user_type)
				AND (gl.user_id = 0 OR gl.user_id = $1)
		)
		UPDATE tasks SET ${attributes} WHERE id IN (SELECT * FROM main_visible_task)
		RETURNING id;`

	const client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		const { rows: elements } = await client.query(queryText, params)

		await client.query('commit')

		return Promise.resolve(elements)
	} catch (error) {
		await client.query('ROLLBACK')

		throw new VError({
			'name': 'DatabaseError',
			'cause': error,
			'info': { 'status': 400 }
		}, 'DB error')
	} finally {
		client.release()
	}
}

async function deleteTask(condition, done) {
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

module.exports = {
	getTasks,
	addTask,
	updateTask,
	deleteTask,
	updatePosition
}
