import VError from 'VError'
import { isNumeric } from '../utils'
import pg from '../db/postgres'

/***
 * @func getSheets
 * @param {{ mainUser_id: Number }}
 * @returns { function(...args): Promise }
 * @description Get sheets from database
 */
async function getSheets(condition) {
	let params = []

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

	/* $1 = mainUser_id */
	let queryText = `
	SELECT *,
		(SELECT ARRAY(
			SELECT condition::integer
			FROM sheets_conditions
			WHERE sheet_id=sh.id
		)) AS conditions,
		(SELECT ARRAY(
			SELECT value::TEXT
			FROM sheets_conditions
			WHERE sheet_id=sh.id
		)) AS values
	FROM sheets AS sh WHERE user_id = $1;`

	const client = await pg.pool.connect()

	try {
		const { rows: data } = await client.query(queryText, params)

		return Promise.resolve(data)
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
 * @func updateSheet
 * @param {{ mainUser_id: Number,	id: String }} condition - Get from api
 * @param { values: Object } - values that need to be changed
 * @returns { function(...args): Promise }
 * @description Update exists <Sheet> in database
*/
async function updateSheet(condition, values) {
	let attributes = '',
			params = [],
			returning = ' RETURNING id'

	/* mainUser_id - идентификатор пользователя, который аутентифицирован в системе	относительно
		этого пользователя происходит запрос данных у базы, с ним же связаны все права доступа.
		- Находится в свойстве auth объекта express.router.request, помещается туда	сервером
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

	/* id - идентификатор элемента, атрибуты которого будут меняться
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается string в 8 символов */
	if (!condition.hasOwnProperty('id')) {
		/* Bad request */
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'id', 'value': null, 'status': 400 }
		}, 'Need <id> query parameter must contain 8 char string')
	} else {
		if (condition.id.length !== 8) {
			/* Bad request */
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 }
			}, '<id> query parameter must contain 8 char string')
		}
		params.push(condition.id)
	}

	/* Соберем запрос из значений, которые можно изменить
		- изменение owner запрещено */
	for (var prop in values) {
		switch (prop) {
			case 'name':
				attributes = attributes + ` name = \$${params.length + 1}`
				returning = returning + ', name'
				params.push(values[prop])
				break
			case 'visible':
				attributes = attributes + ` visible = \$${params.length + 1}`
				returning = returning + ', visible'
				params.push(values[prop] === 'true' ? true : false)
				break
			case 'layout':
				attributes = attributes + ` layout = \$${params.length + 1}`
				returning = returning + ', layout'
				params.push(Number(values[prop]))
				break
			default:
				break
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
	let queryText = `
		UPDATE sheets SET ${attributes} WHERE (user_id = $1) AND (id = $2)
		${returning};`

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
 * @func createSheet
 * @param {{ mainUser_id: Number }} condition
 * @param {{ type_el: Number, layout: Number,
 * 					 name: String, visible: boolean }} values
 * @returns { function(...args): Promise }
 * @description Create new <Sheet> in database
*/
async function createSheet(condition, values) {
	let queryValues = '', queryFields = '', params = []

	/* Убедимся что все параметры присутствуют */

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
		queryFields = queryFields + 'user_id, owner_id'
		queryValues = queryValues + `\$${params.length + 1}, \$${params.length + 1}`
		params.push(condition.mainUser_id)
	}

	/* type_el - битовый идентификатор типа элементов в списке
		- обязательный параметр
		- должен приходить от клиента а api запросе express.router.request.body
		- ожидается number */
	if (!values.hasOwnProperty('type_el') || !isNumeric(values.type_el)) {
		/* Bad request */
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'type_el', 'value': null, 'status': 400 }
		}, 'For create activity need: <type_el> query parameter >= 0')
	} else {
		queryFields = queryFields + ', type_el'
		queryValues = queryValues + `, \$${params.length + 1}`
		params.push(Number(values.type_el))
	}

	/* name - название списка
	- обязательный параметр
	- должен приходить от клиента а api запросе express.router.request.body
	- ожидается string */
	if (!values.hasOwnProperty('name')) {
		/* Bad request */
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'name', 'value': null, 'status': 400 }
		}, 'For create activity need: <name> query parameter')
	} else {
		queryFields = queryFields + ', name'
		queryValues = queryValues + `, \$${params.length + 1}`
		params.push(values.name)
	}

	/* layout - идентификатор раскладки в котором находится список
		- нобязательный параметр
		- может приходить от клиента а api запросе express.router.request.body
		- ожидается number */
	if (values.hasOwnProperty('layout')) {
		queryFields = queryFields + ', layout'
		queryValues = queryValues + `, \$${params.length + 1}`
		params.push(Number(values.layout))
	}

	/* visible - идентификатор видимости списка
		- нобязательный параметр
		- может приходить от клиента а api запросе express.router.request.body
		- ожидается boolean */
	if (values.hasOwnProperty('visible')) {
		queryFields = queryFields + ', visible'
		queryValues = queryValues + `, \$${params.length + 1}`
		params.push(values.visible === 'true' ? true : false)
	}

	const client = await pg.pool.connect()

	try {
		// Начало транзакции
		await client.query('BEGIN')

		// Получение одной активности по activity id
		const queryText = `INSERT INTO sheets (${queryFields}) VALUES (${queryValues})	RETURNING *;`

		let { rows: elements } = await client.query(queryText, params)

		for (let i = 0; i < elements.length; i++) {
			if (!elements[i].hasOwnProperty('conditions')) {
				elements[i].conditions = []
				elements[i].values = []
			}
		}

		// Фиксация транзакции
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
 * @func deleteSheet
 * @param {{ mainUser_id: Number, id: String }} condition
 * @returns { function(...args): Promise }
 * @description Delete exist <Sheet> in database
*/
async function deleteSheet(condition) {
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
	}

	/* id - идентификатор элемента, который будет удаляться
		- обязательный параметр
		- должен приходить от клиента в api запросе express.router.request.query
		- ожидается string в 8 символов */
	if (!condition.hasOwnProperty('id')) {
		/* Bad request */
		throw new VError({
			'name': 'WrongParameter',
			'info': { 'parameter': 'id', 'value': null, 'status': 400 }
		}, 'Need <id> query parameter must contain 8 char string')
	} else {
		if (condition.id.length !== 8) {
			/* Bad request */
			throw new VError({
				'name': 'WrongParameter',
				'info': { 'parameter': 'id', 'value': condition.id, 'status': 400 }
			}, '<id> query parameter must contain 8 char string')
		}
	}

	const client = await pg.pool.connect()

	try {
		// Начало транзакции
		await client.query('BEGIN')

		// Удаление элемента
		const queryText = `DELETE FROM sheets WHERE (owner_id = $1) AND (id = $2);`

		const params = [condition.mainUser_id, condition.id]

		let { rowCount } = await client.query(queryText, params)

		// Фиксация транзакции
		await client.query('commit')

		return Promise.resolve({ id: condition.id })
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

module.exports = {
	getSheets,
	updateSheet,
	createSheet,
	deleteSheet,
}
