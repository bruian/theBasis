// const srvPath = process.cwd() + '/server/'
// const log = require(srvPath + 'log')(module)

import VError from 'VError'
import { isNumeric } from '../utils'
import pg from '../db/postgres'

/***
 * @func getActivity
 * @param {{ mainUser_id: Number, group_id: Number,	type_el: Number, id: Number
 * 					 limit: Number, offset: Number, searchText: String, user_id: Number,
 * 					 task_id: Number }}
 * @returns { function(...args): Promise }
 * @description Get activity from database. if id is given, then get one activity, else get list
 * 	activity
 */
async function getActivity(condition) {
	let limit = 'null', offset = 'null',
		params = [],
		pgСonditions = '',
		pgUserGroups = '',
		pgGroups = 'main_visible_groups', //activity visible only for main user
		pgIdCondition = '',
		pgTaskCondition = '',
		pgGroupCondition = '',
		pgSearchText = '',
		pgLimit = ''

	/* Убедимся что все параметры присутствуют */

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе	относительно
		этого пользователя происходит запрос данных у базы, с ним же связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда сервером
			авторизации
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

	/* type_el - битовый идентификатор типа элемента, в текущем случае это activity = 2
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('type_el') || !isNumeric(condition.type_el)) {
		/* Bad request */
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'type_el', 'value': condition.type_el, 'status': 400 }
		}, 'For get activity need: <type_el> query parameter >= 0')
	} else {
		params.push(condition.type_el)
	}

	/* group_id - идентификатор группы относительно, которой будут извлекаться активности
		- необязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('group_id')) {
		pgGroupCondition = ` AND al.group_id = \$${params.length + 1}`
		params.push(condition.group_id)
	}

	/* id - идентификатор элемента, при наличии этого параметра отбор будет
		производиться только по нему
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается string в 8 символов */
	if (condition.hasOwnProperty('id')) {
		if (condition.id.length !== 8) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 /* Bad request */ }
			}, '<id> query parameter must contain 8 char string')
		}

		pgIdCondition = ` AND al.id = \$${params.length + 1}`
		params.push(condition.id)
	}

	/* task_id - параметр по которому фильтруются значения элементов
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('task_id')) {
		pgTaskCondition = ` AND act.task_id = \$${params.length + 1}`
		params.push(condition.task_id)
	}

	/* user_id - параметр по которому фильтруются значения элементов
		- mainUser_id фильтрует по правам доступа, а user_id фильтрует уже из доступного списка
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('user_id')) {
		pgUserGroups = `, user_groups AS (
			SELECT gl.group_id FROM groups_list AS gl
				WHERE gl.group_id IN (SELECT * FROM main_visible_groups) AND gl.user_id = \$${params.length + 1}
		)`
		pgGroups = 'user_groups'

		params.push(condition.user_id)
	}

	/* searchText - параметр по которому фильтруются значения элементов в	полях name и note
		- необязательный параметр
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается string */
	if (condition.hasOwnProperty('searchText')) {
		pgSearchText = ` AND act.name ILIKE '%\$${params.length + 1}%'`
		params.push(condition.searchText)
	}

	/* limit - параметр который задает предел записей, что выдаст DB
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.header
		- ожидается number не больше 40 */
	if (!condition.hasOwnProperty('limit')) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'limit', 'value': condition.limit, 'status': 400 /* Bad request */ }
		}, '<limit> header parameter must contain number <= 40')
	} else {
		limit = parseInt(condition.limit, 10)

		if (limit < 1 || limit > 100) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'limit', 'value': condition.limit, 'status': 400 /* Bad request */ }
			}, '<limit> header parameter must contain number <= 40')
		}
	}

	/* offset - параметр который задает сдвиг относительно которого будет
		считываться текущая порция данных
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.header
		- ожидается number */
	if (!condition.hasOwnProperty('offset')) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'limit', 'value': condition.offset, 'status': 400 /* Bad request */ }
		}, '<offset> header parameter must contain number >= 0')
	} else {
		offset = parseInt(condition.offset, 10)

		if (offset < 0) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'limit', 'value': condition.offset, 'status': 400 /* Bad request */ }
			}, '<offset> header parameter must contain number >= 0')
		}
	}

	if (limit !== null && offset !== null) {
		pgLimit = `LIMIT \$${params.length + 1} OFFSET \$${params.length + 2}`
		params.push(limit)
		params.push(offset)
	}

	pgСonditions = pgIdCondition + pgTaskCondition + pgGroupCondition + pgSearchText

	/* $1 = mainUser_id */
	let queryText = `WITH RECURSIVE main_visible_groups AS (
		SELECT group_id FROM groups_list AS gl
		LEFT JOIN groups AS grp ON gl.group_id = grp.id
		WHERE (grp.reading >= gl.user_type)
			AND (grp.el_reading >= gl.user_type)
			AND (gl.user_id = 0 OR gl.user_id = $1)
		) ${pgUserGroups} SELECT al.id, al.group_id, al.user_id, act.task_id, al.type_el,
			act.name, act.note, act.productive, uf.url as avatar,
			act.part, act.status, act.owner, act.start, act.ends
		FROM activity_list AS al
		RIGHT JOIN activity AS act ON al.id = act.id
		RIGHT JOIN users_photo AS uf ON (al.user_id = uf.user_id) AND (uf.isavatar = true)
		WHERE al.group_id IN (SELECT * FROM ${pgGroups}) AND (al.type_el & $2) ${pgСonditions}
		ORDER BY al.group_id, (al.p::float8/al.q) ${pgLimit};`

	const client = await pg.pool.connect()

	try {
		const { rows: elements } = await client.query(queryText, params)

		return Promise.resolve(elements)
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
 * @func createActivity
 * @param {{ mainUser_id: Number,	group_id: Number,
 * 					 type_el: Number, task_id: Number,
 * 					 start: ISO-DateTime string, status: Number,
 * 					 isStart: boolean }} condition - Get from api
 * @returns { function(...args): Promise }
 * @description Create new <Activity> in database
 * And set new position in activity_list and linked to the task if it exists
*/
async function createActivity(condition) {
	let task_id = null,
			start = null,
			status = null,
			isStart = false

	/* Убедимся что все параметры присутствуют */

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

	/* group_id - идентификатор группы в которую будет добавляться новая активность.
		- обязательный параметр, относительно которого назначаются параметры
		прав доступа и видимости элементов
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('group_id')	|| !isNumeric(condition.group_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'group_id', 'value': condition.group_id, 'status': 400 /* Bad request */ }
		}, 'For create activity need: <group_id> query parameter >= 0')
	}

	/* type_el - битовый идентификатор типа элемента, в текущем случае это activity = 2
		- обязательный параметр
		- должен приходить от клиента а api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('type_el') || !isNumeric(condition.type_el)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'type_el', 'value': condition.type_el, 'status': 400 /* Bad request */ }
		}, 'For create activity need: <type_el> query parameter >= 0')
	}

	/* start - параметр указывающий начало статуса элемента активности
		- обязательный параметр
		- ожидается string со значением ISO DateTime */
	if (!condition.hasOwnProperty('start') || typeof condition.start !== 'string') {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'start', value: condition.start, 'status': 400 /* Bad request */ }
		}, 'For create activity need: <start> query parameter ISO DateTime string')
	} else {
		const valid = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9]).([0-9]+)?(Z)?$/.test(condition.start)
		if (!valid) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'start', value: condition.start, 'status': 400 /* Bad request */ }
			}, '<start> value might contain string in ISO DateTime')
		}

		start = condition.start
	}

	/* task_id - идентификатор задачи, к которой будет привязан создаваемый элемент
		- необязательный параметр, отсутвие которого говорит о том что элемент не привязан
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (condition.hasOwnProperty('task_id')) {
		if (!isNumeric(condition.task_id)) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'task_id', 'value': condition.task_id, 'status': 400 /* Bad request */ }
			}, '<task_id> query parameter >= 1')
		}

		task_id = condition.task_id
	}

	/* status - параметр статуса активности, передаётся когда у задачи меняется статус
		и автоматически создает несколько активностей алгоритм описан в модуле клиента
		actions.CREATE_ACTIVITY_ELEMENT
		- необязательный параметр, передаётся только когда меняется статус у задачи
		должен совместно идти с "task_id" и "start"
		- может приходить от клиента в api запросе express.router.request.query
		- ожидается number
	*/
	if (condition.hasOwnProperty('status')) {
		if (!task_id || !start) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'status', 'value': condition.status, 'status': 400 /* Bad request */ }
			}, '<status> query parameter must be >= 1, also have <task_id> and <start> parameter')
		}

		status = condition.status
	}

	/* isStart - параметр указывающий куда поместить создаваемый элемент,
		в начало или конец списка
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

	/* Добавление элемента activity происходит в 4 этапа
		1) Создание в таблице activity элемента со значениями default:
			task_id = null, name = '', note = '', part = 0, status = 0, owner = mainUser_id,
			productive = false, start = null, ends = null
		2) Добавление id созданного элемента в таблицу activity_list со значениями default:
			group_id = group_id, user_id = mainUser_id, type_el = type_el
		3) Если присутствует параметр start, то обновляется это значение в таблице activity
		4) Если присутствует параметр task_id, то обновляется это значение в таблице activity,
			значение activity.name обновляется на task.name	значение productuve обновляется на true
		5) Если присутствует status отличный от 0, тогда обновляется значение предыдущего
		элемента со статусами "Начато" или "Продолжено", назначается "ends" создается новая
		активность со статусом "Приостановлено" и назначением "start".
	*/
	let queryText, params, returnElements = []
	const client = await pg.pool.connect()

	try {
		// Начало транзакции
		await client.query('BEGIN')

		if (task_id) {
			//Проверка, есть ли права на task_id для текущего пользователя
			queryText = `SELECT tl.task_id FROM groups_list AS gl
				LEFT JOIN groups AS grp ON gl.group_id = grp.id
				RIGHT JOIN tasks_list AS tl ON (gl.group_id = tl.group_id) AND (tl.task_id = $2)
				WHERE (grp.reading >= gl.user_type)
					AND (grp.el_reading >= gl.user_type)
					AND (gl.user_id = 0 OR gl.user_id = $1)`
			params = [condition.mainUser_id, task_id]
			let { rowCount } = await client.query(queryText, params)

			//Если прав нет, то запрос вернет пустой результат и транзакция откатится
			if (rowCount === 0) {
				await client.query('ROLLBACK')

				throw new VError({
					'name': 'Permission denied',
					'info': { 'status': 400 /* Bad request */ }
				}, 'No right access to task with id %s', task_id)
			}
		}

		/* Обработка ситуации, когда меняется статус у задачи */
		if (status) {
			// Поиск активности со статусами "Started-1" или "Continued-5". Т.к. сперва
			// необходимо приостановить активности с действующим статусом у той задачи,
			// которая в данный момент выполняется и не равна задачи переданной пользователем
			queryText = `SELECT al.id, al.group_id, act.task_id
				FROM activity_list AS al
				RIGHT JOIN activity AS act ON al.id = act.id
				WHERE (al.user_id = $1)
					AND (act.task_id <> $2)
					AND (act.ends is null)
					AND (act.status = 1 OR act.status = 5);`
			let { rows: existsElements } = await client.query(queryText, params)

			// Если есть такие активности, то запрос вернёт массив с результатом
			if (existsElements && existsElements.length) {
				// Обновление значения активности на переданное от пользователя
				queryText = 'UPDATE activity SET ends = $1 WHERE id = $2;'
				params = [start, existsElements[0].id]
				await client.query(queryText, params)

				// Создание активности для действующей задачи, установка ей статуса  "Suspended-3"
				queryText = `SELECT add_activity($1, $2, $3, $4);`
				params = [condition.mainUser_id, existsElements[0].group_id, 1, isStart]
				let { rows } = await client.query(queryText, params)

				// Обновление атрибутов задачи
				queryText = `UPDATE activity
					SET (start, task_id, status, productive, part) =
						($1, $2, $3, $4, (SELECT count(id) FROM activity WHERE task_id = $2))
					WHERE id = $5;`
				params = [start, existsElements[0].task_id, 3, true, rows[0].add_activity]
				await client.query(queryText, params)

				returnElements.push(existsElements[0].task_id)
			}

			// Поиск активности у той задачи, которая в данный момент принадлежит
			// переданной пользователем задаче и имеет атрибут "ends" == null
			queryText = `SELECT al.id, al.group_id
				FROM activity_list AS al
				RIGHT JOIN activity AS act ON al.id = act.id
				WHERE (al.user_id = $1)
					AND (act.task_id = $2)
					AND (act.ends is null);`
			params = [condition.mainUser_id, task_id]
			let { rows } = await client.query(queryText, params)

			// Если есть такая активность, то запрос вернёт массив с результатом
			if (rows && rows.length) {
				// Обновление значения активности на переданное от пользователя
				queryText = 'UPDATE activity SET ends = $1 WHERE id = $2;'
				params = [start, rows[0].id]
				await client.query(queryText, params)
			}
		}

		// Создание в таблице activity элемента и добавление в activity_list
		queryText = `SELECT add_activity($1, $2, $3, $4);`
		params = [condition.mainUser_id, condition.group_id, condition.type_el, isStart]
		let { rows: newElements } = await client.query(queryText, params)

		const elementId = newElements[0].add_activity

		// Обновление значения start в таблице activity
		if (start) {
			queryText = 'UPDATE activity SET start = $1 WHERE id = $2;'
			params = [start, elementId]
			await client.query(queryText, params)
		}

		returnElements.push(task_id)

		// Обновление значения task_id в таблице activity
		if (task_id) {
			//Если есть права на задачу, то она слинкуется с элементом активности
			if (status) {
				queryText = `UPDATE activity
					SET (task_id, productive, status, start, part)
						= ($1, $2, $3, $4, (SELECT count(id) FROM activity WHERE task_id = $1))
					WHERE id = $5;`
				params = [task_id, true, status, start, elementId]
			} else {
				queryText = 'UPDATE activity SET (task_id, productive) = ($1, $2) WHERE id = $3;'
				params = [task_id, true, elementId]
			}
			await client.query(queryText, params)
		}

		// Фиксация транзакции
		await client.query('commit')

		// Получение данных по добавленному элементу
		if (task_id) {
			// Получение всех активностей по task_id
			queryText = `SELECT al.id, al.group_id, al.user_id, al.type_el,
				act.task_id, act.name, act.note, act.productive, act.part,
				act.status, act.owner, act.start, act.ends, uf.url as avatar
			FROM activity_list AS al
			RIGHT JOIN activity AS act ON al.id = act.id
			RIGHT JOIN users_photo AS uf ON (al.user_id = uf.user_id) AND (uf.isavatar = true)
			WHERE act.task_id IN (SELECT * FROM UNNEST ($1::integer[]))
			ORDER BY act.task_id, (al.p::float8/al.q);`
			params = [returnElements]
		} else {
			// Получение одной активности по activity id
			queryText = `SELECT al.id, al.group_id, al.user_id, al.type_el,
				act.task_id, act.name, act.note, act.productive, act.part,
				act.status, act.owner, act.start, act.ends, uf.url as avatar
			FROM activity_list AS al
			RIGHT JOIN activity AS act ON al.id = act.id
			RIGHT JOIN users_photo AS uf ON (al.user_id = uf.user_id) AND (uf.isavatar = true)
			WHERE al.id = $1;`
			params = [elementId]
		}
		let { rows: elements } = await client.query(queryText, params)

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

/***
 * @func updateActivity
 * @param {{ mainUser_id: Number,	id: String }} condition - Get from api
 * @param { values: Object } - values that need to be changed
 * @returns { function(...args): Promise }
 * @description Update exists <Activity> in database
*/
async function updateActivity(condition, values) {
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

	/* id - идентификатор элемента, который будет меняться
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается string в 8 символов */
	if (condition.hasOwnProperty('id')) {
		if (condition.id.length !== 8) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 /* Bad request */ }
			}, '<id> query parameter must contain 8 char string')
		}

		params.push(condition.id)
	} else {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 /* Bad request */ }
		}, 'For update values need <id> query parameter must contain 8 char string')
	}

	/* Соберем запрос из значений, которые можно изменить
		- назначение для активности "task_id", должно изменить значение флага "productive" на true
		- назначить для активности "task_id", разрешено только когда "status" = 0
		- снятие у активности "task_id" - запрещено, а значит и изменение "productive" на false у
		активности с назначенным "task_id" тоже запрещено
		- изменение группы у активности разрешено вызовом метода updatePosition
		- изменение "owner" и "user_id" запрещено
		- изменение "status" у активности запрещено, статус назначается вызовом метода createActivity,
		при этом создается новая активность с указанием нового статуса, активность должна иметь
		ссылку на "task_id" т.к. статусы меняются у задач, а активности поэтапно логируют эти изме-
		нения.
	*/
	// let productiveNewValue, taskNewValue
	for (var prop in values) {
		switch (prop) {
			case 'task_id':
				// attributes = attributes + ` task_id = \$${params.length + 1}`
				// params.push(values[prop])
				// taskNewValue = values[prop]
				break
			case 'name':
				attributes = attributes + ` name = \$${params.length + 1}`
				params.push(values[prop])
				break
			case 'note':
				attributes = attributes + ` note = \$${params.length + 1}`
				params.push(values[prop])
				break
			case 'productive':
				// attributes = attributes + ` productive = \$${params.length + 1}`
				// params.push(values[prop])
				// productiveNewValue = values[prop]
				break
			case 'group_id':
				throw new VError({
					'name': 'WrongMethod',
					'info': { 'parameter': 'group_id', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The group is changed using the HTTP method "PUT" with path /activity/order.')
			case 'owner':
			case 'user_id':
				throw new VError({
					'name': 'WrongParameter',
					'info': { 'parameter': 'user_id', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The activity can not change the user and the owner.')
			case 'status':
				throw new VError({
					'name': 'WrongMethod',
					'info': { 'parameter': 'status', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The status is changed using the HTTP method "POST" with path /activity. To create a new activity with a changed status')
			case 'part':
				throw new VError({
					'name': 'WrongParameter',
					'info': { 'parameter': 'status', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, 'The part can not change, because its autoincrement parameter')
			case 'start':
			case 'ends':
				throw new VError({
					'name': 'WrongParameter',
					'info': { 'parameter': 'status', 'value': values[prop], 'status': 400 /* Bad request */ }
				}, `The "start" and "end" is changed using the HTTP method "POST" with path /activity.
				To create a new activity with a changed status`)
			default:
				break;
		}
	}

	/* Если ничего не передано для изменения, то нет смысла делать запрос к базе */
	if (attributes.length === 0) {
		throw new VError({
			'name': 'WrongBody',
			'info': { 'body': 'id', 'value': values, 'status': 400 /* Bad request */ }
		}, 'For update need JSON object with values in body')
	}

	/* Обновляем только те активности, которые состоят в доступных пользователю группах */
	let queryText = `WITH main_visible_activity AS (
		SELECT al.id FROM groups_list AS gl
			LEFT JOIN groups AS grp ON gl.group_id = grp.id
			RIGHT JOIN activity_list AS al ON (gl.group_id = al.group_id) AND (al.id = $2)
			WHERE (grp.reading >= gl.user_type)
				AND (grp.el_updating >= gl.user_type)
				AND (gl.user_id = 0 OR gl.user_id = $1)
		)
		UPDATE activity SET ${attributes} WHERE id IN (SELECT * FROM main_visible_activity)
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

/***
 * @func deleteActivity
 * @param {{ mainUser_id: Number,	id: String, group_id: Number }} condition - Get from api
 * @returns { function(...args): Promise }
 * @description Delete exists <Activity> from database
*/
async function deleteActivity(condition) {
	let onlyFromList = true

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе
		относительно этого пользователя происходит запрос данных у базы, с ним же	связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда	сервером авторизации
		- Ожидается number */
	if (!condition.hasOwnProperty('mainUser_id') || !isNumeric(condition.mainUser_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'mainUser_id', 'value': condition.mainUser_id, 'status': 401 /* Unauthorized */ }
		}, 'User authentication required')
	}

	/* group_id - идентификатор группы из которой будет удаляться активность.
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается number */
	if (!condition.hasOwnProperty('group_id')	|| !isNumeric(condition.group_id)) {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'group_id', 'value': condition.group_id, 'status': 400 /* Bad request */ }
		}, 'For delete activity need: <group_id> query parameter >= 0')
	}

	/* id - идентификатор элемента, который удаляется из списка
		- бязательный параметр
		- приходит от клиента в api запросе express.router.request.query
		- ожидается string в 8 символов */
	if (condition.hasOwnProperty('id')) {
		if (condition.id.length !== 8) {
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 /* Bad request */ }
			}, '<id> query parameter must contain 8 char string')
		}
	} else {
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 /* Bad request */ }
		}, 'For delete values need <id> query parameter must contain 8 char string')
	}

	const queryText = `SELECT delete_activity($1, $2, $3, $4);`
	const params = [condition.mainUser_id, condition.id, condition.group_id, onlyFromList]

	const client = await pg.pool.connect()

	try {
		await client.query('BEGIN')

		const { rows } = await client.query(queryText, params)

		if (rowCount === 0) {
			await client.query('ROLLBACK')
			return done({ message: `No tasks with your conditions`, status: 400, code: 'no_datas', name: 'ApiMessage' })
		}

		let result = rows[0].delete_activity
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
			throw new VError({
				'name': 'Permission denied',
				'info': { 'status': 400 /* Bad request */ }
			}, 'No right access to activity with id %s', condition.id)
		}

		await client.query('commit')

		return Promise.resolve(true)
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
 * Set new position in activity_list OR change group for activity
 * condition = { mainUser_id,	group_id,	activity_id, position,	isBefore }
 */
async function updatePosition(condition, done) {
	return Promise.resolve(false)
}

module.exports = {
	getActivity,
	createActivity,
	updateActivity,
	deleteActivity,
	updatePosition
}
