import express from 'express'
import UserController from '../controllers/users'
import GroupController from '../controllers/groups'
import TaskController from '../controllers/tasks'
import ContextController from '../controllers/contexts'
import faker from 'faker'
import crypto from 'crypto'
import pg from '../db/postgres'

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

	UserController.addUsers(condition, (err, data) => {
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

	GroupController.addGroup(condition, (err, data) => {
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

/*** -CONTEXTS API- */
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

		log.debug(`/contexts:return |-> `)
		const ids = data.map((el) => el.context_id).toString()
		console.log(ids)

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

		log.debug(`/contexts:add |-> `)

		return res.json({ data: data })
	})
})

/*** -TASKS API- */
router.get('/tasks', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		group_id: ('group_id' in req.query) ? req.query.group_id : null,
		user_id: ('user_id' in req.query) ? req.query.user_id : null,
		parent_id: ('parent_id' in req.query) ? req.query.parent_id : null,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		searchText: ('searchText' in req.query) ? req.query.searchText : null,
		limit: ('limit' in req.headers) ? req.headers.limit : null,
		offset: ('offset' in req.headers) ? req.headers.offset : null
	}

	TaskController.getTasks(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/tasks:return |-> like: ${condition.searchText} | offset: ${condition.offset} | partid: ${req.headers.partid}`)
		const ids = data.map((el) => el.task_id).toString()
		console.log(ids)

		return res.json({ data: data, partid: req.headers.partid })
	})
})

router.put('/tasks', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		values: req.body
	}

	TaskController.updateTask(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/tasks:update task |-> data`)

		return res.json({ data: data })
	})
})

router.put('/tasks/order', (req, res) => {
	const condition = {
		mainUser_id: req.auth.userId,
		group_id: ('group_id' in req.query) ? req.query.group_id : null,
		task_id: ('task_id' in req.query) ? req.query.task_id : null,
		parent_id: ('parent_id' in req.query) ? req.query.parent_id : null,
		position: ('position' in req.query) ? req.query.position : null,
		isBefore: ('isBefore' in req.query) ? req.query.isBefore : null
	}

	TaskController.updatePosition(condition, (err, data) => {
		if (err) return res.json(err)

		log.debug(`/tasks/order:return |-> data`)

		return res.json({ data: data })
	})
})

/*** -OTHER API- */
router.get('/fakeSet', (req, res) => {
	return res.end('Can not generates fake datas')

	const usersFields = 'username, email, hashedpassword, created, verified, verify_expired, verify_token, salt, loged, visible',
				usersAnchors = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10',
				clientsFields = 'user_id, name, hashedsecret, salt',
				clientsAnchors = '$1, $2, $3, $4',
				groupsFields = 'name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type',
				groupsAnchors = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11',
				personalityFields = 'user_id, name, dateofbirth, city, country, phone',
				personalityAnchors = '$1, $2, $3, $4, $5, $6'

	let values = [],
			client

	for (let i = 5; i < 50; i++) {
		(async () => {
			const client = await pg.pool.connect()

			try {
				await client.query('BEGIN')
				console.log('Generated user id:' + i)

				let salt = crypto.randomBytes(128).toString('hex')

				values = [faker.name.findName(), faker.internet.email(), crypto.pbkdf2Sync('password', salt, 10000, 512, 'sha512').toString('hex'),
					new Date(), true, new Date(), '', salt, false, 1]
				await client.query(`INSERT INTO users (${usersFields}) VALUES (${usersAnchors})`, values)

				values = [i, 'WebBrowser', crypto.pbkdf2Sync('password', salt, 10000, 512, 'sha512').toString('hex'), salt]
				await client.query(`INSERT INTO clients (${clientsFields}) VALUES (${clientsAnchors})`, values)

				values = ['personal', null, 1, 1, 1, 1, 1, 1, 1, 1, 1]
				await client.query(`INSERT INTO groups (${groupsFields}) VALUES (${groupsAnchors})`, values)

				await client.query(`INSERT INTO groups_list (user_id, group_id, user_type) VALUES ($1, $2, $3)`, [i, i, 1])

				values = [i, faker.name.findName(), faker.date.past(), faker.address.city(), faker.address.country(), faker.phone.phoneNumber()]
				await client.query(`INSERT INTO users_personality (${personalityFields}) VALUES (${personalityAnchors})`, values)

				await client.query(`INSERT INTO users_photo (user_id, isavatar, url) VALUES ($1, $2, $3)`, [i, true, faker.internet.avatar()])

				await client.query('COMMIT')
			} catch (error) {
				await client.query('ROLLBACK')
				throw error
			} finally {
				client.release()
			}
		})().catch(e => console.error(e.stack))
	}

	return res.end('Datas generated')
})

module.exports = router;

/*
app.use('/api/clients', express.Router()
	.post('/', passport.authenticate(['basic'], { session : false }), clientController.postClients)
	.get('/', passport.authenticate(['basic', 'bearer'], { session : false }), clientController.getClients))
app.use('/api/clients', express.Router().get('/', apiOauth.isAuthenticated, userController.getUsers))
app.use('/api/users', express.Router().post('/', userController.postUsers).get('/', userController.getUsers))
app.use('/api/articles', apiArticles)
app.use('/api/tgmUsers', apiTgmUsers)

		let fakeDatas = {
			users: {
				//id: 2,
				username: faker.name.findName(),
				email: faker.internet.email(),
				hashedpassword: crypto.pbkdf2Sync('password', salt, 10000, 512, 'sha512').toString('hex'),
				created: new Date(),
				verified: true,
				verify_expired: new Date(),
				verify_token: '',
				salt: salt,
				loged: false,
				visible: 1
			},
			clients: {
				//id: 2,
				user_id: i,
				name: 'WebBrowser',
				hashedsecret: crypto.pbkdf2Sync('password', salt, 10000, 512, 'sha512').toString('hex'),
				salt: salt
			},
			groups: {
				//id: 2,
				name: 'personal',
				parent: 'null',
				creating: 1,
				reading: 1,
				updating: 1,
				deleting: 1,
				task_creating: 1,
				task_reading: 1,
				task_updating: 1,
				task_deleting: 1,
				group_type: 1
			},
			groups_list: {
				user_id: i,
				group_id: i,
				user_type: 1
			},
			users_personality: {
				user_id: i,
				name: faker.name.findName(),
				dateofbirth: faker.date.past(),
				city: faker.address.city(),
				country: faker.address.country(),
				phone: faker.phone.phoneNumber()
			},
			users_photo: {
				//photo_id: 2,
				user_id: i,
				isavatar: true,
				url: faker.internet.avatar()
			}
		}
*/
