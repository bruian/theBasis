import express from 'express'
import UserController from '../controllers/users'
import faker from 'faker'
import crypto from 'crypto'
import pg from '../db/postgres'

const srvPath = process.cwd() + '/server/'
const log     = require(srvPath + 'log')(module)
const router = express.Router();

router.get('/hello', (req, res) => {
	res.send('Hello')
})

//get authenticated user
router.get('/main-user', (req, res) => {
	const condition = { mainUser_id: req.body.userId }
	UserController.getUser(condition, (err, data) => {
		if (err) return res.send(err)
		return res.json(data)
	})
})

//get all users visible by this user
router.get('/users/:id', (req, res) => {
	const condition = {
		mainUser_id: req.body.userId,
		user_id: req.params.id,
		limit: (req.headers.limit) ? req.headers.limit : null,
		offset: (req.headers.offset) ? req.headers.offset : null
	}

	UserController.getUsers(condition, (err, data) => {
		if (err) return res.send(err)
		return res.json(data)
	})
})

router.get('/users', (req, res) => {
	const condition = {
		mainUser_id: req.body.userId,
		limit: (req.headers.limit) ? req.headers.limit : null,
		offset: (req.headers.offset) ? req.headers.offset : null
	}

	UserController.getUsers(condition, (err, data) => {
		if (err) return res.send(err)
		return res.json(data)
	})
})

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
