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

module.exports = {
	getSheets,
}
