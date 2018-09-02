import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

// route-level code splitting
const createListView = id => () => import('../views/CreateListView').then(m => m.default(id))
const factoryListView = id => () => import('../views/FactoryListView').then(m => m.default(id))
const ItemView = () => import('../views/ItemView.vue')
const UserView = () => import('../views/UserView.vue')
const Private = () => import('../views/Private.vue')
const Login = () => import('../views/Login.vue')
const TgmUsers = () => import('../views/TgmUsers.vue')

export function createRouter () {
  return new Router({
    mode: 'history',
    fallback: false,
    scrollBehavior: () => ({ y: 0 }),
    routes: [
			{ path: '/login', name: 'login', component: Login },
			{ path: '/resetpassword', name: 'resetpassword', component: () => import('../views/Home.vue') },
			{ path: '/', name: 'home', component: () => import('../views/Home.vue') },
      { path: '/appGrid', name: 'appGrid', component: () => import('../views/AppGrid.vue') },
      { path: '/tgmUsers', name: 'TgmUsers', component: TgmUsers, meta: { auth: true } },
      { path: '/tgmUsers/:id', component: TgmUsers, meta: { auth: true } },
      { path: '/top/:page(\\d+)?', component: createListView('top') },
      { path: '/new/:page(\\d+)?', component: createListView('new') },
      { path: '/show/:page(\\d+)?', component: createListView('show') },
      { path: '/ask/:page(\\d+)?', component: createListView('ask') },
      { path: '/job/:page(\\d+)?', component: createListView('job') },
      { path: '/item/:id(\\d+)', component: ItemView },
      { path: '/user/:id', component: UserView },
      { path: '/private', component: Private, meta: { auth: true } },
      { path: '/redirect', redirect: '/' }
    ]
  })
}
