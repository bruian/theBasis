import fs          from 'fs'
import LRU         from 'lru-cache'
import path        from 'path'
import helmet      from 'helmet'
import express     from 'express'
import favicon     from 'serve-favicon'
import compression from 'compression'
import microcache  from 'route-cache'

import { createBundleRenderer } from 'vue-server-renderer'

import session        from 'express-session'
import passport       from 'passport'
import bodyParser     from 'body-parser'
//import cookieParser   from 'cookie-parser'
import methodOverride from 'method-override'

import config from './config'
import configPrivate from './config-private'

import apiOauth    from './apis/api-oauth'
import apiArticles from './apis/api-articles'
import apiTgmUsers from './apis/api-tgmUsers'

const log            = require('./log')(module);
const resolve = file => path.resolve(__dirname, file)

const isProd = process.env.NODE_ENV === 'production'
const useMicroCache = process.env.MICRO_CACHE !== 'false'
const serverInfo =
   `express/${require('express/package.json').version} ` +
   `vue-server-renderer/${require('vue-server-renderer/package.json').version}`

const app = express()

function createRenderer (bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    // for component caching
    cache: LRU({
      max: 1000,
      maxAge: 1000 * 60 * 15
    }),
    // this is only needed when vue-server-renderer is npm-linked
    basedir: resolve('../dist'),
    // recommended for performance
    runInNewContext: false
  }))
}

let renderer
let readyPromise
const templatePath = resolve('../client/index.template.html')
if (isProd) {
  // In production: create server renderer using template and built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const template = fs.readFileSync(templatePath, 'utf-8')
  const bundle = require('../dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('../dist/vue-ssr-client-manifest.json')
  renderer = createRenderer(bundle, {
    template,
    clientManifest
  })
} else {
  // In development: setup the dev server with watch and hot-reload,
  // and create a new renderer on bundle / index template update.
  readyPromise = require('../build/setup-dev-server')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options)
    }
  )
}

const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0
})

app.use(helmet())
app.use(compression({ threshold: 0 }))
app.use(favicon('./public/appLogo.ico'))
app.use('/dist', serve('../dist', true))
app.use('/public', serve('../public', true))
app.use('/manifest.json', serve('../manifest.json', true))
app.use('/service-worker.js', serve('../dist/service-worker.js'))

//app.use(cookieParser()) //TODO cut cookie parser, because express-session already maintenance this
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride())
app.use(session({
	secret: configPrivate.security.sessionSecret,
	resave: false,
	saveUninitialized: false
}))

//**(passport)* Say express use passport middleware */
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'DELETE, PUT, UPDATE, HEAD, OPTIONS, GET, POST')

  next()
})

if (!isProd) {
  app.use((req, res, next) => {
    log.debug('🐰  FROM client= METHOD:%s URL:%s', req.method, req.url)
    log.debug(req.body)
		log.debug(req.headers)
		log.debug(req.session)

    next()
  })
}

const clientController = require('./controllers/clients')
const userController = require('./controllers/users')

//spmApp.use('/api', api);
//app.use('/api/auth/user', apiUsers);
app.use('/api/oauth2', apiOauth.router)
/*app.use('/api/clients', express.Router()
	.post('/', passport.authenticate(['basic'], { session : false }), clientController.postClients)
	.get('/', passport.authenticate(['basic', 'bearer'], { session : false }), clientController.getClients))
*/
app.use('/api/clients', express.Router().get('/', apiOauth.isAuthenticated, userController.getUsers))
app.use('/api/users', express.Router().post('/', userController.postUsers).get('/', userController.getUsers))
app.use('/api/articles', apiArticles)
app.use('/api/tgmUsers', apiTgmUsers)

// since this app has no user-specific content, every page is micro-cacheable.
// if your app involves user-specific content, you need to implement custom
// logic to determine whether a request is cacheable based on its url and
// headers.
// 1-second microcache.
// https://www.nginx.com/blog/benefits-of-microcaching-nginx/
app.use(microcache.cacheSeconds(1, req => useMicroCache && req.originalUrl))

function render (req, res) {
  const s = Date.now()

  res.setHeader("Content-Type", "text/html")
  res.setHeader("Server", serverInfo)

  const handleError = err => {
    if (err.url) {
      res.redirect(err.url)
    } else if(err.code === 404) {
      log.error(`❌  Fatal error when rendering : ${req.url}`)
      log.error(err)

      res.status(404).send('404 | Page Not Found')
    } else {
      // Render Error Page or Redirect
      log.error(`❌  error during render : ${req.url}`)
      log.error(err.stack)

      res.status(500).send('500 | Internal Server Error')
    }
  }

  const context = {
    title: 'theBasis', // default title
    url: req.url
  }

  renderer.renderToString(context, (err, html) => {
    if (err) {
      return handleError(err)
    }
    res.send(html)
    if (!isProd) {
      log.info(`whole request: ${Date.now() - s}ms`)
    }
  })
}

app.get('*', isProd ? render : (req, res) => {
  readyPromise.then(() => render(req, res))
})

if (config.port) {
  app.listen(config.port, (err) => {
    if (err) {
      log.error(err);
    }

    console.log(`Session started ${ new Date() } *********************\n`)
    log.info(
      '✅  %s is running, talking to API server on %s.',
      config.app.title,
      config.apiPort
    );

    log.info(
      '💻  Open http://%s:%s in a browser to view the app.',
      config.host,
      config.port
    );
  });
} else {
  log.error('❌  ERROR: No PORT environment variable has been specified');
}
