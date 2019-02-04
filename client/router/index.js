import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

function createRouter(store) {
	const router = new Router({
		mode: 'history',
		fallback: false,
		scrollBehavior: () => ({ y: 0 }),
		routes: [
			{ path: '/', name: 'home', component: () => import('../views/Home.vue') }, // OK
			{
				path: '/resetpassword',
				name: 'resetpassword',
				component: () => import('../views/Home.vue'),
			}, // OK
			{
				path: '/verified',
				name: 'verified',
				component: () => import('../views/Home.vue'),
				meta: { action: 'verified' },
			}, // OK
			{
				path: '/user',
				name: 'user',
				component: () => import('../views/User.vue'),
				meta: { auth: true },
			}, // OK
			// { path: '/user/:id', name: 'user', component: () => import('../views/User.vue'), mets: { auth: true } },					//OK
			{
				path: '/groups',
				name: 'groups',
				component: () => import('../views/Groups.vue'),
				meta: { auth: true },
			}, // OK
			{
				path: '/main-sheets',
				name: 'main-sheets',
				component: () => import('../views/MainSheets.vue'),
				meta: { auth: true },
			},
			{ path: '/info', name: 'info', component: () => import('../views/Info.vue') },
			{
				path: '/appGrid',
				name: 'appGrid',
				component: () => import('../views/AppGrid.vue'),
				meta: { auth: true },
			},
			// { path: '/job/:page(\\d+)?', component: createListView('job') },
			// { path: '/item/:id(\\d+)', component: ItemView },
			// { path: '/user/:id', component: UserView },
			{ path: '/redirect', redirect: '/' },
		],
	});

	router.beforeEach((to, from, next) => {
		// only for client check route
		if (process.env.VUE_ENV !== 'server') {
			// appReady indicator that Vue.app is created (see App.vue->Created())
			if (store.state.appReady) {
				// Check for the presence of meta-keys in the route
				if (Object.keys(to.meta).length !== 0) {
					// Finally, the main check for the feasibility of the route
					if (to.meta.auth && store.getters.isAuth) {
						// There is a validation label and a label that the user is authenticated
						next();
					} else {
						// Refusal to resolved the route
						next({ name: 'home' });
					}
				} else {
					// If there are no meta keys, then the route can be resolved to any one
					next();
				}
			} else {
				// You must enable the route, otherwise the application will not load
				// Because before the full initialization of the application, beforeEach is triggered
				next();
			}
		} else {
			// server allways is OK
			next();
		}
	});

	return router;
}

export default createRouter;
