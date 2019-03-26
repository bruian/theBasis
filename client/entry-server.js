import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';
import createApp from './app';

const isDev = process.env.NODE_ENV !== 'production';

Vue.use(VueAxios, axios);
Vue.axios.defaults.baseURL = `http://localhost:3000/api/`;

/* This exported function will be called by `bundleRenderer`.
This is where we perform data-prefetching to determine the
state of our application before actually rendering it.
Since data fetching is async, this function is expected to
return a Promise that resolves to the app instance. */
export default context => {
	return new Promise((resolve, reject) => {
		const s = isDev && Date.now();

		const { app, router, store } = createApp();

		const { url } = context;
		const { fullPath } = router.resolve(url).route;

		if (fullPath !== url) {
			// eslint-disable-next-line
			return reject({ url: fullPath });
		}

		// set router's location
		router.push(url);

		// wait until router has resolved possible async hooks
		router.onReady(() => {
			const matchedComponents = router.getMatchedComponents();
			// no matched routes
			if (!matchedComponents.length) {
				// eslint-disable-next-line
				return reject({ code: 404 });
			}
			// Call fetchData hooks on components matched by the route.
			// A preFetch hook dispatches a store action and returns a Promise,
			// which is resolved when the action is complete and store state has been
			// updated.

			return Promise.all(
				matchedComponents.map(Component => {
					if (Component.asyncData) {
						return Component.asyncData({
							store,
							route: router.currentRoute
						});
					}
				})
			)
				.then(() => {
					// eslint-disable-next-line
					isDev && console.log(`data pre-fetch: ${Date.now() - s}ms`);
					// After all preFetch hooks are resolved, our store is now
					// filled with the state needed to render the app.
					// Expose the state on the render context, and let the request handler
					// inline the state in the HTML response. This allows the client-side
					// store to pick-up the server-side state without having to duplicate
					// the initial data fetching on the client.
					context.state = store.state;
					resolve(app);
				})
				.catch(reject);
		}, reject);
	});
};
