<template>
	<v-dialog v-model="value" width="500px">
		<v-card class="elevation-12">
			<v-toolbar dark color="primary">
				<v-toolbar-title>
					<a class="login-header" v-bind:class="[formState == 0 ? 'active-login-header' : '']" href="" @click.prevent="formState=0">Login</a>
					<span> | </span>
					<a class="login-header" v-bind:class="[formState == 1 ? 'active-login-header' : '']" href="" @click.prevent="formState=1">Register</a>
				</v-toolbar-title>
				<v-spacer></v-spacer>
				<v-tooltip bottom>
					<v-btn icon @click="$emit('input', false)" slot="activator">
						<v-icon>cancel</v-icon>
					</v-btn>
					<span>cancel</span>
				</v-tooltip>
			</v-toolbar>
			<v-card-text>
				<v-form @submit.prevent="login">
					<v-text-field prepend-icon="person" name="login" v-model="username" label="Login" type="text"></v-text-field>
					<v-text-field prepend-icon="lock" name="password" v-model="password" label="Password" id="password" type="password"></v-text-field>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn color="primary" type="submit">Login</v-btn>
					</v-card-actions>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
	name: 'Login',
	props: {
		value: {
			type: Boolean,
			required: true
		}
	},
	data: function() {
		return {
			username: '',
			password: '',
			formState: 0, //0 - show Login form; 1 - show Register form
		}
	},
	methods: {
		login() {
			const { username, password } = this
			this.$store.dispatch('AUTH_REQUEST', { username, password }).then(() => {
				//this.$router.push('/')
				console.log('AUTH_REQUEST')
			})
		}
	}
}
</script>

<style lang="stylus">
.login-header
	color white
.active-login-header
	text-decoration underline
</style>
