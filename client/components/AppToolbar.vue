<template>
	<v-toolbar
		v-bind:value="value"
		:clipped-left="$vuetify.breakpoint.lgAndUp"
		color="primary"
		dark
		app
		fixed>

		<v-toolbar-title style="width: 300px" class="ml-0 pl-0">
			<v-toolbar-side-icon @click="$emit('input', !value)" height="36"></v-toolbar-side-icon>
			<span class="hidden-sm-and-down">YouStudy</span>
		</v-toolbar-title>

		<v-text-field
			flat
			solo-inverted
			hide-details
			prepend-inner-icon="search"
			label="Search"
			class="hidden-sm-and-down">
		</v-text-field>

		<v-spacer></v-spacer>

		<v-menu
			offset-y
			origin="center center"
			:nudge-bottom="14"
			transition="scale-transition">

			<v-btn icon flat slot="activator">
				<v-badge color="red" overlap>
					<span slot="badge">3</span>
					<v-icon medium>notifications</v-icon>
				</v-badge>
			</v-btn>

			<notification-list></notification-list>
		</v-menu>

		<v-menu v-if="isAuth"
			offset-y
			origin="center center"
			:nudge-bottom="10"
			transition="scale-transition"
			light>

			<v-btn slot="activator" icon>
				<v-avatar size="32px" tile>
					<img src="https://www.freeiconspng.com/uploads/brain-icon-png-12.png" alt="Avatar">
				</v-avatar>
			</v-btn>

			<!--:href="item.href"-->
			<v-list class="pa-0">
				<v-list-tile
					v-for="(item, index) in userMenuItems"
					:to="!item.href ? { name: item.name } : null"
					@click="item.click"
					ripple="ripple"
					:disabled="item.disabled"
					:target="item.target"
					rel="noopener"
					:key="index">
					<v-list-tile-action v-if="item.icon">
						<v-icon>{{ item.icon }}</v-icon>
					</v-list-tile-action>
					<v-list-tile-content>
						<v-list-tile-title>{{ item.title }}</v-list-tile-title>
					</v-list-tile-content>
				</v-list-tile>
			</v-list>
		</v-menu>

		<v-btn v-if="!isAuth" icon @click.stop="$emit('update:authDialog', !authDialog)">
			<v-icon>account_circle</v-icon>
		</v-btn>
	</v-toolbar>
</template>

<script>
import NotificationList from '../components/widgets/list/NotificationList.vue'

let self = undefined

export default {
	name: 'app-toolbar',
	components: {
		NotificationList
	},
	props: {
		value: {
			type: Boolean,
			required: true
		},
		authDialog: {
			type: Boolean
		}
	},
	data: () => ({
		userMenuItems: [
			{
				icon: 'account_circle',
				href: '#',
				title: 'Profile',
				click: (e) => {
					console.log(e)
				}
			},
			{
				icon: 'settings',
				href: '#',
				title: 'Settings',
				click: (e) => {
					console.log(e)
				}
			},
			{
				icon: 'fullscreen_exit',
				href: '#',
				title: 'Logout',
				click: (e) => {
					self.logouts()
				}
			}
		]
	}),
	computed: {
		isAuth() {
			return this.$store.getters.isAuth
		}
	},
	methods: {
		logouts() {
			self.$store.dispatch('AUTH_LOGOUT').then(() => {
				self.$router.push('/')
			})
		}
	},
	watch: {
		/*
		value: function() {
			console.log('Toolbar drawer:' + this.value)
		}
		*/
	},
	created() {
		self = this
	}
}
</script>

<style lang="stylus">

</style>
