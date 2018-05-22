import express from 'express'
import passport from 'passport'

const srvPath = process.cwd() + '/server/'
const oauth2 = require(srvPath + 'auth/oauth2')

const router = express.Router()

router.post('/login', oauth2.token)
router.post('/logout', oauth2.logout)
router.get('/refresh', oauth2.refresh)

router.get('/user', passport.authenticate('bearer', { session: false }), (req, res) => {
  // req.authInfo is set using the `info` argument supplied by
  // `BearerStrategy`. It is typically used to indicate scope of the token,
  // and used in access control checks. For illustrative purposes, this
  // example simply returns the scope in the response.
  res.json({
    user_id: req.user.userId,
    name: req.user.username,
    scope: req.authInfo.scope
  })
})

module.exports = router
