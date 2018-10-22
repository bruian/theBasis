import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
/*
const camelize = str => str.charAt(0).toUpperCase() + str.slice(1)

import ItemList from './ItemList.vue'
() => import('../views/Home.vue')

// This is a factory function for dynamically creating root-level list views,
// since they share most of the logic except for the type of items to display.
// They are essentially higher order components wrapping ItemList.vue.
export default function createListView (type) {
  return {
    name: `${type}-stories-view`,

    asyncData ({ store }) {
      return store.dispatch('FETCH_LIST_DATA', { type })
    },

    title: camelize(type),

    render (h) {
      return h(ItemList, { props: { type }})
    }
  }
}

const createAppView = id => () => import('../views/CreateListView').then(m => m.default(id))
*/
// route-level code splitting
const createListView = id => () => import('../views/CreateListView').then(m => m.default(id))
const factoryListView = id => () => import('../views/FactoryListView').then(m => m.default(id))
const ItemView = () => import('../views/ItemView.vue')
const UserView = () => import('../views/UserView.vue')
const Private = () => import('../views/Private.vue')
//const Login = () => import('../views/Login.vue')
const TgmUsers = () => import('../views/TgmUsers.vue')

export function createRouter (store) {
  const router = new Router({
    mode: 'history',
    fallback: false,
    scrollBehavior: () => ({ y: 0 }),
    routes: [
			{ path: '/', name: 'home', component: () => import('../views/Home.vue') }, 																					//OK
			{ path: '/resetpassword', name: 'resetpassword', component: () => import('../views/Home.vue') },										//OK
			{ path: '/verified', name: 'verified', component: () => import('../views/Home.vue'), meta: { action: 'verified' } },//OK
			{ path: '/users', name: 'users', component: () => import('../views/Users.vue'), meta: { auth: true } },							//OK
			{ path: '/users/:id', name: 'users', component: () => import('../views/Users.vue'), mets: { auth: true } },
			{ path: '/groups', name: 'groups', component: () => import('../views/Groups.vue'), meta: { auth: true } },					//OK
			{ path: '/appGrid', name: 'appGrid', component: () => import('../views/AppGrid.vue'), meta: { auth: true } },
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

	router.beforeEach((to, from, next) => {
		// only for client check route
		if (process.env.VUE_ENV !== 'server') {
			//debugger
			//appReady indicator that Vue.app is created (see App.vue->Created())
			if (store.state.appReady) {
				//Check for the presence of meta-keys in the route
				if (Object.keys(to.meta).length !== 0) {
					//Finally, the main check for the feasibility of the route
					if (to.meta.auth && store.getters.isAuth) {
						//There is a validation label and a label that the user is authenticated
						next()
					} else {
						//Refusal to resolved the route
						next({ name: 'home' })
					}
				} else {
					//If there are no meta keys, then the route can be resolved to any one
					next()
				}
			} else {
				//You must enable the route, otherwise the application will not load
				//Because before the full initialization of the application, beforeEach is triggered
				next()
			}
		} else {
			//server allways is OK
			next()
		}
	})

	return router
}

//			{ path: '/login', name: 'login', component: Login },
