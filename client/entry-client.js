import Vue from 'vue'
import 'es6-promise/auto'
import { createApp } from './app'
import ProgressBar from './components/ProgressBar.vue'
import BootstrapVue from 'bootstrap-vue'

import config from './config'
const logRequests = !!config.DEBUG_API

import axios from 'axios'
import VueAxios from 'vue-axios'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import 'vuetify/dist/vuetify.min.css'

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)
Vue.axios.defaults.baseURL = `http://${window.location.host}/api/`

// global progress bar
const bar = Vue.prototype.$bar = new Vue(ProgressBar).$mount()
document.body.appendChild(bar.$el)

// a global mixin that calls `asyncData` when a route component's params change
Vue.mixin({
  beforeRouteUpdate (to, from, next) {
    const { asyncData } = this.$options
    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to
      }).then(next).catch(next)
    } else {
      next()
    }
  }
})

const { app, router, store } = createApp()

/*
const bearerAuth = {
  request: function (req, token) {
    token = token.split(';')
    var grant_type = ''
    
    if (req.url.indexOf('refresh') > -1) {
      token =  token[1]
      grant_type = 'refresh_token'
    } else {
      token =  token[0]
      grant_type = 'access_token'
    }

    this.options.http._setHeaders.call(this, req, { 
      Authorization: 'Bearer ' + token, 
      grant_type: grant_type,
      client_id: store.state.client_id
    })
  },
  response: function (res) {
    if (res.data.access_token && res.data.refresh_token && res.data.expires_in) {
      return res.data.access_token + ';' + res.data.refresh_token+ ';' + res.data.expires_in
    }
  }
}
*/

// prime the store with server-initialized state.
// the state is determined during SSR and inlined in the page markup.
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

// wait until router has resolved all async before hooks
// and async components...
router.onReady(() => {
  // Add router hook for handling asyncData.
  // Doing it after initial route is resolved so that we don't double-fetch
  // the data that we already have. Using router.beforeResolve() so that all
  // async components are resolved.
  router.beforeResolve((to, from, next) => {
    logRequests && console.log(`onReady ${from}...${to}`)
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })
    
    const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _)
    if (!asyncDataHooks.length) {
      return next()
    }

    bar.start()
    Promise.all(asyncDataHooks.map(hook => hook({ store, route: to })))
      .then(() => {
        bar.finish()
        next()
      })
      .catch(next)
  })

  // actually mount to DOM
  app.$mount('#app')
})

// service worker
if ('https:' === location.protocol && navigator.serviceWorker) {
  navigator.serviceWorker.register('/service-worker.js')
}
