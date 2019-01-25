import express from 'express'
import UserController from '../controllers/users'
import GroupController from '../controllers/groups'
import TaskController from '../controllers/tasks'
import ActivityController from '../controllers/activity'
import ContextController from '../controllers/contexts'
import SheetController from '../controllers/sheets'
// import faker from 'faker'
// import crypto from 'crypto'
// import pg from '../db/postgres'

const srvPath = process.cwd() + '/server/'
const log     = require(srvPath + 'log')(module)
const router = express.Router();

//get authenticated user
router.get('/main-user', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		packet: ('packet' in req.headers) ? req.headers.packet : null
	}

	UserController.getUser(condition, (err, data) => {
		if (err) return res.send(err)

		if (condition.packet === null) {
			return res.json(data)
		} else {
			return res.json({ data: data, packet: condition.packet })
		}
	})
})

/*** -USERS API- */
router.get('/users/:id', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		user_id: req.params.id,
		like: ('like' in req.query) ? req.query.like : null,
		whose: ('whose' in req.query) ? req.query.whose : null,
		limit: ('limit' in req.headers) ? req.headers.limit : null,
		offset: ('offset' in req.headers) ? req.headers.offset : null
	}

	UserController.getUsers(condition, (err, data) => {
		if (err) return res.send(err)

		log.debug(`/users:return |-> like: ${condition.like} | offset: ${condition.offset} | partid: ${req.headers.partid}`)
		return res.json({ data: data, partid: req.headers.partid })
	})
})

router.get('/users', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		user_id: null,
		like: ('like' in req.query) ? req.query.like : null,
		whose: ('whose' in req.query) ? req.query.whose : null,
		limit: ('limit' in req.headers) ? req.headers.limit : null,
		offset: ('offset' in req.headers) ? req.headers.offset : null
	}

	UserController.getUsers(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/users:return |-> like: ${condition.like} | offset: ${condition.offset} | partid: ${req.headers.partid}`)
		const ids = data.map((el) => el.id).toString()
		console.log(ids)

		return res.json({ data: data, partid: req.headers.partid })
	})
})

router.post('/users', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		user_id: ('user_id' in req.query) ? req.query.user_id : null
	}

	UserController.createUsers(condition, (err, data) => {
		if (err) return res.json(err)

		return res.send(data)
	})
})

router.delete('/users', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		user_id: ('user_id' in req.query) ? req.query.user_id : null
	}

	UserController.removeUsers(condition, (err, data) => {
		if (err) return res.json(err)

		return res.send(data)
	})
})

/*** -GROUPS API- */
router.get('/groups/:id', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		group_id: req.params.id,
		user_id: ('user_id' in req.query) ? req.query.user_id : null,
		like: ('like' in req.query) ? req.query.like : null,
		whose: ('whose' in req.query) ? req.query.whose : null,
		limit: ('limit' in req.headers) ? req.headers.limit : null,
		offset: ('offset' in req.headers) ? req.headers.offset : null
	}

	GroupController.getGroups(condition, (err, data) => {
		if (err) return res.send(err)

		log.debug(`/groups:return |-> like: ${condition.like} | offset: ${condition.offset} | partid: ${req.headers.partid}`)
		return res.json({ data: data, partid: req.headers.partid })
	})
})

router.get('/groups', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		group_id: null,
		user_id: ('user_id' in req.query) ? req.query.user_id : null,
		like: ('like' in req.query) ? req.query.like : null,
		whose: ('whose' in req.query) ? req.query.whose : null,
		limit: ('limit' in req.headers) ? req.headers.limit : null,
		offset: ('offset' in req.headers) ? req.headers.offset : null,
		packet: ('packet' in req.headers) ? req.headers.packet : null
	}

	GroupController.getGroups(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/groups:return |-> like: ${condition.like} | offset: ${condition.offset} | partid: ${req.headers.partid}`)
		const ids = data.map((el) => el.id).toString()
		console.log(ids)

		return res.json({ data: data, partid: req.headers.partid, packet: condition.packet })
	})
})

router.post('/groups', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		group_id: ('group_id' in req.query) ? req.query.group_id : null
	}

	GroupController.createGroup(condition, (err, data) => {
		if (err) return res.json(err)

		return res.send(data)
	})
})

router.delete('/groups', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		group_id: ('group_id' in req.query) ? req.query.group_id : null
	}

	GroupController.removeGroup(condition, (err, data) => {
		if (err) return res.json(err)

		return res.send(data)
	})
})

/* ----------------------------------------CONTEXTS API----------------------------------------- */

router.get('/contexts', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		user_id: ('user_id' in req.query) ? req.query.user_id : null,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		searchText: ('searchText' in req.query) ? req.query.searchText : null,
		limit: ('limit' in req.headers) ? req.headers.limit : null,
		offset: ('offset' in req.headers) ? req.headers.offset : null,
		packet: ('packet' in req.headers) ? req.headers.packet : null
	}

	ContextController.getContexts(condition, (err, data) => {
		if (err) return res.json(err)

		const ids = data.map((el) => el.context_id).toString()
		log.debug(`/contexts:get |-> task_id:${condition.task_id} | offset:${condition.offset} | limit:${condition.limit} | for user:${condition.mainUser_id} | elements:[${ids}]`)

		return res.json({ data: data, packet: condition.packet })
	})
})

router.post('/contexts', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		values: req.body
	}

	ContextController.addContext(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/contexts:post |-> task_id:${condition.task_id} | for user: ${condition.mainUser_id}`)

		return res.json({ data: data })
	})
})

router.delete('/contexts', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		values: req.body
	}

	ContextController.deleteContext(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/context:delete |-> task_id:${condition.task_id} | for user: ${condition.mainUser_id}`)

		return res.json({ data: data })
	})
})

/* ------------------------------------------TASKS API------------------------------------------ */

/***
 * @func router.get("/tasks")
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "getTasks" and responce data: JSON
*/
router.get('/tasks', (req, res) => {
	const timeStart = Date.now()
	let condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	condition = Object.assign(condition, req.headers)

	TaskController.getTasks(condition)
	.then(data => {
		const ids = data.map((el) => el.task_id).toString()
		log.debug(`/tasks:get ${Date.now()-timeStart}ms |-> like:${condition.searchText} | group_id:${condition.group_id} | parent_id:${condition.parent_id} | for user:${condition.mainUser_id} | offset:${condition.offset} | partid:${req.headers.partid} | elements:[${ids}]`)

		return res.json({ data: data, partid: req.headers.partid })
	})
	.catch(err => {
		log.warn(`/task:get |-> name:${err.name} | status:${err.jse_info.status} | message:	${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.post('/tasks')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "createTask"->"createActivity" and responce data: JSON
*/
router.post('/tasks', (req, res) => {
	const timeStart = Date.now()
	const condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)

	const onTaskCreated = (taskData) => {
		log.debug(`/tasks:post ${Date.now()-timeStart}ms |-> id:${taskData[0].task_id} | parent:${taskData[0].parent}	| group:${taskData[0].group_id} | for user: ${condition.mainUser_id}`)

		condition.status = 0
		condition.type_el = 2
		condition.task_id = taskData[0].task_id
		condition.group_id = taskData[0].group_id

		return ActivityController.createActivity(condition).then(activityData => {
			log.debug(`/activity:post ${Date.now()-timeStart}ms |-> id:${condition.task_id} | group:${condition.group_id}	| type:${condition.type_el} | for user: ${condition.mainUser_id}`)

			return res.json({ data: taskData, activity_data: activityData })
		})
		.catch(err => Promise.reject(err))
	}

	TaskController.createTask(condition).then(onTaskCreated)
	.catch(err => {
		log.warn(`/tasks:post |-> name:${err.name} | status:${err.jse_info.status}	| message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

router.delete('/tasks', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		group_id: ('group_id' in req.query) ? req.query.group_id : null
	}

	TaskController.deleteTask(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/tasks:delete |-> id:${condition.task_id} | for user: ${condition.mainUser_id}`)

		return res.json({ data: data })
	})
})

/***
 * @func router.put('/tasks')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "updateTask" and responce data: JSON
*/
router.put('/tasks', (req, res) => {
	const timeStart = Date.now()
	const condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	const values = Object.assign({}, req.body)

	TaskController.updateTask(condition, values)
	.then(taskData => {
		log.debug(`/tasks:put ${Date.now()-timeStart}ms |-> id:${taskData.task_id} | for user:${condition.mainUser_id}`)

		return res.json({ data: taskData })
	})
	.catch(err => {
		log.warn(`/task:put |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.put('/tasks/order')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "updatePosition" and responce data: JSON
*/
router.put('/tasks/order', (req, res) => {
	const timeStart = Date.now()
	let condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)

	const onTaskUpdated = (taskData) => {
		log.debug(`/tasks/order ${Date.now()-timeStart}ms |-> id:${condition.task_id} | parent:${condition.parent_id} | group:${condition.group_id} | position:${condition.position} | isBefore:${condition.isBefore} | for user: ${condition.mainUser_id}`)

		condition.status = 0
		condition.type_el = 2
		condition.task_id = condition.task_id
		condition.group_id = condition.group_id

		if (!taskData.groupChanged) {
			return res.json({ data: taskData })
		}

		return ActivityController.createActivity(condition).then(activityData => {
			log.debug(`/activity:post ${Date.now()-timeStart}ms |-> id:${condition.task_id} | group:${condition.group_id}	| type:${condition.type_el} | for user: ${condition.mainUser_id}`)

			return res.json({ data: taskData, activity_data: activityData })
		})
		.catch(err => Promise.reject(err))
	}

	TaskController.updatePosition(condition).then(onTaskUpdated)
	.catch(err => {
		log.warn(`/tasks/order:put |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)

	})
})

/* -----------------------------------------ACTIVITY API---------------------------------------- */

/***
 * @func router.get('/activity')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "getActivity" and responce data: JSON
*/
router.get('/activity', (req, res) => {
	const timeStart = Date.now()
	let condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	condition = Object.assign(condition, req.headers)

	ActivityController.getActivity(condition)
	.then(data => {
	 	const ids = data.map((el) => el.id).toString()
		log.debug(`/activity:get ${Date.now()-timeStart}ms |-> like:${condition.searchText} | group_id:${condition.group_id} | for user:${condition.mainUser_id} | offset:${condition.offset} | elements:[${ids}]`)

		return res.json({ data: data })
	})
	.catch(err => {
		log.warn(`/activity:get |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.post('/activity')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "createActivity" and responce data: JSON
*/
router.post('/activity', (req, res) => {
	const timeStart = Date.now()
	const condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)

	ActivityController.createActivity(condition)
	.then(data => {
		log.debug(`/activity:post ${Date.now()-timeStart}ms |-> id:${condition.task_id} | group:${condition.group_id} | type:${condition.type_el} | for user:${condition.mainUser_id}`)

		return res.json({ data: data })
	})
	.catch(err => {
		log.warn(`/activity:post |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.put('/activity')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "updateActivity" and responce data: JSON
*/
router.put('/activity', (req, res) => {
	const timeStart = Date.now()
	const condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	const values = Object.assign({}, req.body)

	ActivityController.updateActivity(condition, values)
	.then(data => {
		log.debug(`/activity:put ${Date.now()-timeStart}ms |-> id:${condition.id} | for user:${condition.mainUser_id}`)

		return res.json({ data: data })
	})
	.catch(err => {
		log.warn(`/activity:put |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

router.delete('/activity', (req, res) => {
	// const condition = {
	// 	mainUser_id: req.auth.userId,
	// 	task_id: ('task_id' in req.query) ? req.query.task_id : null,
	// 	group_id: ('group_id' in req.query) ? req.query.group_id : null
	// }

	// TaskController.deleteTask(condition, (err, data) => {
	// 	if (err) return res.json(err)

	// 	log.debug(`/tasks:delete |-> id:${condition.task_id} | for user: ${condition.mainUser_id}`)
	// 	return res.json({ data: data })
	// })
	return res.json({ error: 'Api delete - not ready' })
})

router.put('/activity/order', (req, res) => {
	// const condition = {
	// 	mainUser_id: req.auth.userId,
	// 	group_id: ('group_id' in req.query) ? req.query.group_id : null,
	// 	task_id: ('task_id' in req.query) ? req.query.task_id : null,
	// 	parent_id: ('parent_id' in req.query) ? req.query.parent_id : null,
	// 	position: ('position' in req.query) ? req.query.position : null,
	// 	isBefore: ('isBefore' in req.query) ? req.query.isBefore : null
	// }

	// TaskController.updatePosition(condition, (err, data) => {
	// 	if (err) return res.json(err)

	// 	log.debug(`/tasks/order |-> id:${condition.task_id} | parent:${condition.parent_id} | group:${condition.group_id} | position:${condition.position} | isBefore:${condition.isBefore} | for user: ${condition.mainUser_id}`)

	// 	return res.json({ data: data })
	// })

	return res.json({ error: 'Api put order - not ready' })
})

/* -----------------------------------------SHEETS API------------------------------------------ */

/***
 * @func router.get('/sheets')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "getSheets" and responce data: JSON
*/
router.get('/sheets', (req, res) => {
	const timeStart = Date.now()
	let condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	condition = Object.assign(condition, req.headers)

	SheetController.getSheets(condition)
	.then(data => {
	 	const ids = data.map((el) => el.id).toString()
		log.debug(`/sheets:get ${Date.now()-timeStart}ms |-> | for user:${condition.mainUser_id} | elements:[${ids}]`)

		return res.json({ data: data, packet: condition.packet })
	})
	.catch(err => {
		log.warn(`/sheets:get |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.post('/sheets')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "createSheet" and responce data: JSON
*/
router.post('/sheets', (req, res) => {
	const timeStart = Date.now()
	const condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	const values = Object.assign({}, req.body)

	SheetController.createSheet(condition, values)
	.then(data => {
		log.debug(`/sheets:post ${Date.now()-timeStart}ms |-> for user:${condition.mainUser_id}`)

		return res.json({ data: data })
	})
	.catch(err => {
		log.warn(`/sheets:post |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.put('/sheets')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "updateSheet" and responce data: JSON
*/
router.put('/sheets', (req, res) => {
	const timeStart = Date.now()
	let condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	condition = Object.assign(condition, req.headers)
	const values = Object.assign({}, req.body)

	SheetController.updateSheet(condition, values)
	.then(sheetData => {
		log.debug(`/sheets:put ${Date.now()-timeStart}ms |-> id:${sheetData.id} | for user:${condition.mainUser_id}`)

		return res.json({ data: sheetData })
	})
	.catch(err => {
		log.warn(`/sheets:put |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

/***
 * @func router.delete('/sheets')
 * @param {String} path - http path from METHOD
 * @param {function(...args): Callback} response - to client
 * @returns { Response: Object }
 * @description Http METHOD. Call api function "deleteSheet" and responce data: JSON
*/
router.delete('/sheets', (req, res) => {
	const timeStart = Date.now()
	let condition = Object.assign({ mainUser_id: req.auth.userId }, req.query)
	condition = Object.assign(condition, req.headers)

	SheetController.deleteSheet(condition)
	.then(sheetData => {
		log.debug(`/sheets:delete ${Date.now()-timeStart}ms |-> id:${condition.id} | for user:${condition.mainUser_id}`)

		return res.json({ data: sheetData })
	})
	.catch(err => {
		log.warn(`/sheets:delete |-> name:${err.name} | status:${err.jse_info.status} | message:${err.message}`)

		return res.status(err.jse_info.status).end(err.message)
	})
})

module.exports = router;
