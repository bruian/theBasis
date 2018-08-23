const srvPath = process.cwd() + '/server/'
const ClientModel = require(srvPath + 'model/client')
const log = require(srvPath + 'log')(module)

// Create endpoint /api/client for POST
exports.postClients = function(req, res) {
	// Create a new instance of the Client model
	log.debug(`🔑 postClients with req: ${req}`)
  var client = new ClientModel()

  // Set the client properties that came from the POST data
  client.name = req.body.name
  client.secret = req.body.secret
  client.userId = req.user._id

  // Save the client and check for errors
  client.save(function(err) {
    if (err)
      res.send(err)

		log.debug(`🔑 save client`)
    res.json({ message: 'Client added to the locker!', data: client })
  })
}

// Create endpoint /api/clients for GET
exports.getClients = function(req, res) {
	// Use the Client model to find all clients
	if (req.user) {
		ClientModel.find({ userId: req.user.id }, function(err, clients) {
			if (err)
				res.send(err)

			res.json(clients)
		})
	} else {
		ClientModel.find({ }, function(err, clients) {
			if (err)
				res.send(err)

			res.json(clients)
		})
	}
}
