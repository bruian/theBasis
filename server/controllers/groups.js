const srvPath = process.cwd() + '/server/'
const log = require(srvPath + 'log')(module)

import { isNumeric } from '../utils'
import { PgError, SrvError } from '../errors'
import pg from '../db/postgres'

async function _create(condition, client) {
	const parametres = pg.prepareParametres(condition)
	let		tempClient = (client) ? client : await pg.pool.connect()

	try {
		const { rowCount: groupCount, rows: group } = await tempClient.query(`INSERT INTO groups (${parametres.fields}) VALUES (${parametres.anchors}) RETURNING *`, parametres.values)

		if (groupCount === 1) {
			return Promise.resolve({ rowCount: groupCount, rows: group })
		} else {
			return Promise.reject({ error: 'Do not execute query', groupStep: groupCount })
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

		return client.query(`SELECT * FROM groups WHERE ${parametres.condition}`, parametres.values)
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

		return client.query(`UPDATE groups SET ${parametres.datastring} WHERE ${parametres.condition} ${retstring}`, parametres.values)
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

		return client.query(`DELETE FROM groups WHERE ${parametres.condition}`, parametres.values)
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

async function getGroups(condition, done) {
	let client,
		condition1 = '',
		limit = 'null', offset = 'null',
		queryText = '',
		selectGroup = false

	try {
		if (!condition.mainUser_id && !isNumeric(condition.mainUser_id)) {
			return done(new PgError(`The condition must contain the <user_id> field that sets the current user relatively,
				because regarding his rights there will be a request for information from the database`))
		}

		//if (isNumeric(condition.user_id)) {}

		if (isNumeric(condition.group_id) && condition.group_id > 0) {
			selectGroup = true
		}

		if (isNumeric(condition.limit)) {
			limit = condition.limit
		}

		if (isNumeric(condition.offset)) {
			offset = condition.offset
		}

		if (condition.like) {
			condition1 = condition1 + ` AND grp.name ILIKE '%${condition.like}%'`
		}

		let whose
		if (condition.whose === '' || condition.whose === 'all') {
			whose = `AND grp.owner != ${condition.mainUser_id}`
		} else if (condition.whose === 'user') {
			whose = ''
		}

		if (selectGroup) {
			queryText = `WITH RECURSIVE recursive_tree (id, parent, path, user_type, level) AS (
				SELECT T1g.id, T1g.parent, CAST (T1g.id AS VARCHAR (50)) AS path, T1gl.user_type, 1
					FROM groups_list AS T1gl
				RIGHT JOIN groups AS T1g ON (T1gl.group_id = T1g.id)
				WHERE T1g.parent IS NULL AND T1gl.group_id = ${condition.group_id}
					UNION
				SELECT T2g.id, T2g.parent, CAST (recursive_tree.PATH ||'->'|| T2g.id AS VARCHAR(50)), T2gl.user_type, level + 1
					FROM groups_list AS T2gl
				RIGHT JOIN groups AS T2g ON (T2gl.group_id = T2g.id)
				INNER JOIN recursive_tree ON (recursive_tree.id = T2g.parent)
			)
			SELECT recursive_tree.id, recursive_tree.user_type, grp.name, recursive_tree.parent, recursive_tree.level, recursive_tree.path,
					grp.creating, grp.reading, grp.updating, grp.deleting, grp.task_creating,
					grp.task_reading, grp.task_updating, grp.task_deleting, grp.group_type FROM recursive_tree
			LEFT JOIN groups AS grp ON recursive_tree.id = grp.id
			ORDER BY path;`
		} else {
			queryText = `SELECT group_id AS id, user_type, name, parent, creating, reading, updating, deleting, task_creating,
					task_reading, task_updating, task_deleting, group_type, 0 AS haveChild, owner FROM groups_list AS gl
				RIGHT JOIN groups AS grp ON gl.group_id = grp.id ${whose}
				WHERE grp.parent IS null
					AND gl.group_id NOT IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent)
					AND grp.reading >= gl.user_type
					AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
					${condition1}
			UNION
			SELECT group_id AS id, user_type, name, parent, creating, reading, updating, deleting, task_creating,
					task_reading, task_updating, task_deleting, group_type, 1 AS haveChild, owner FROM groups_list AS gl
				RIGHT JOIN groups AS grp ON gl.group_id = grp.id ${whose}
				WHERE grp.parent IS null
					AND gl.group_id IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent)
					AND grp.reading >= gl.user_type
					AND (gl.user_id = 0 OR gl.user_id = ${condition.mainUser_id})
					${condition1}
			LIMIT ${limit} OFFSET ${offset};`
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
			if (selectGroup) {
				let hierarchicalRows = []

				function constructHierarchy (rows, parentId) {
					let hRows = []

					for (let i = 0; i < rows.length; i++) {
						let record = Object.assign({}, rows[i])
						if ((parentId === null && record.parent === null) || (record.parent === parentId)) {
							const innerRows = constructHierarchy(rows, record.id)
							if (innerRows.length > 0) {
								record.children = innerRows
								record.havechild = 1
							} else {
								record.havechild = 0
							}

							hRows.push(record)
						}
					}

					return hRows
				}
				hierarchicalRows = constructHierarchy(rows, null)

				return done(null, hierarchicalRows)
			} else {
				rows.forEach(el => {
					if (el.havechild) el.children = []
				})

				return done(null, rows)
			}
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
	getGroups
}
