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
    if (err)
      res.send(err)

    res.json(users)
  })
}
