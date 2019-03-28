import Vue from 'vue';
import 'es6-promise/auto';
import qs from 'qs';
import axios from 'axios';
import VueAxios from 'vue-axios';

import PrettyCheckbox from 'pretty-checkbox-vue';
import config from './config';
import createApp from './app';
import ProgressBar from './components/ProgressBar.vue';

import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'pretty-checkbox/dist/pretty-checkbox.css'; // eslint-disable-line
import 'vuetify/dist/vuetify.min.css';
import '@riophae/vue-treeselect/dist/vue-treeselect.css';
import './app.css';

Vue.use(PrettyCheckbox);
Vue.use(VueAxios, axios);

const apiPort = config.apiWOPort ? '' : `:${config.apiPort}`;

Vue.axios.defaults.baseURL = `https://${config.apiHost}${apiPort}/api/`;
Vue.axios.defaults.paramsSerializer = params => {
	return qs.stringify(params, { arrayFormat: 'repeat' });
};

// global progress bar
// eslint-disable-next-line
const bar = (Vue.prototype.$bar = new Vue(ProgressBar).$mount());
document.body.appendChild(bar.$el);

// a global mixin that calls `asyncData` when a route component's params change
Vue.mixin({
	beforeRouteUpdate(to, from, next) {
		// debugger
		const { asyncData } = this.$options;
		if (asyncData) {
			asyncData({
				store: this.$store,
				route: to
			})
				.then(next)
				.catch(next);
		} else {
			next();
		}
	}
});

const { app, router, store } = createApp();

// prime the store with server-initialized state.
// the state is determined during SSR and inlined in the page markup.
/* eslint-disable no-underscore-dangle */
if (window.__INITIAL_STATE__) {
	store.replaceState(window.__INITIAL_STATE__);
}

// wait until router has resolved all async before hooks
// and async components...
router.onReady(() => {
	// Add router hook for handling asyncData.
	// Doing it after initial route is resolved so that we don't double-fetch
	// the data that we already have. Using router.beforeResolve() so that all
	// async components are resolved.
	router.beforeResolve((to, from, next) => {
		const matched = router.getMatchedComponents(to);
		const prevMatched = router.getMatchedComponents(from);
		let diffed = false;
		const activated = matched.filter((c, i) => {
			return diffed || (diffed = prevMatched[i] !== c); // eslint-disable-line
		});

		const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _);
		if (!asyncDataHooks.length) {
			return next();
		}

		bar.start();
		return Promise.all(asyncDataHooks.map(hook => hook({ store, route: to })))
			.then(() => {
				bar.finish();
				next();
			})
			.catch(next);
		// added return
	});

	// actually mount to DOM
	app.$mount('#app');
});

// service worker
// eslint-disable-next-line
if ('https:' === location.protocol && navigator.serviceWorker) {
	navigator.serviceWorker.register('/service-worker.js');
}
