const srvPath = process.cwd() + '/server/'
const UserModel = require(srvPath + 'model/user')
const log = require(srvPath + 'log')(module)

// Create endpoint /api/client for POST
exports.postUsers = function(req, res) {
	// Create a new instance of the User model
	log.debug(`🔑 postUsers with req: ${req}`)
  var user = new UserModel()

  // Set the client properties that came from the POST data
  user.username = req.body.username
  user.password = req.body.password

  // Save the client and check for errors
  user.save(function(err) {
    if (err)
      res.send(err)

		log.debug(`🔑 save user`)
    res.json({ message: 'User added to the locker!', data: user })
  })
}

// Create endpoint /api/clients for GET
exports.getUsers = function(req, res) {
  // Use the Client model to find all clients
  UserModel.find({ }, function(err, users) {
    if (err) res.send(err)

    res.json(users)
  })
}

exports.getUser = function(req, res) {
	//debugger
	UserModel.findOne({ _id: req.body.userId }, (err, user) => {
    if (err) return res.send(err)
		if (!user) return res.send({ message: 'User contained in token not found', status: 400, code: 'invalid_verification', name: 'AuthError' })

		const data = Object.assign({}, user._doc)
		delete data._id
		delete data.hashedPassword
		delete data.salt
		delete data.verify_token
		delete data.verify_expired
		delete data.loged

		data.id = user.id

    res.json(data)
  })
}
