<script>
import mTypes from '../store/mutation-types.js'
export default {
	name: 'AuthCheck',
	beforeMount() {
		console.log('AuthCheck: beforeMount')
		debugger
		/*
		if (Object.keys(this.$route.meta).length !== 0) {
			if (this.$route.meta.auth && this.$store.getters.isAuth) {
				console.log('You are authorized')
			} else {
				console.log('You are not authorized')
				this.$router.replace('/')
			}
		} else {
			console.log('No need to check auth')
		}
		*/
	},
	asyncData ({ store, route }) {
		debugger
		console.log('asyncData: AuthCheck')
		if (!store.getters.isAuth) {
			const storage = (process.env.VUE_ENV === 'server') ? null : window.localStorage
			if (storage && storage.getItem('access_token')) {
				const token = storage.getItem('access_token')
				return store.dispatch(mTypes.USER_REQUEST, token)
			} else {
				return Promise.resolve()
			}
		}
	},
	methods: {
	},
	render(h) {
		return h(null)
	}
}
</script>
