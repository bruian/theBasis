<template>
  <div id="app">
		<template>
    <v-app id="inspire" class="app">
			<app-drawer v-model="drawer" class="app--drawer"></app-drawer>
			<app-toolbar v-model="drawer" v-bind:authDialog.sync="authDialog" class="app--toolbar"></app-toolbar>

			<v-content>
				<!-- Page Header -->
				<!--page-header v-if="$route.meta.breadcrumb"></page-header-->
				<v-breadcrumbs class="mt-0 pb-1">
					<v-icon slot="divider">link</v-icon>

					<v-breadcrumbs-item
						v-for="item in crumbs"
						:disabled="item.disabled"
						:key="item.text"
						:to="item.to"
					>
						{{ item.text }}
					</v-breadcrumbs-item>
				</v-breadcrumbs>

				<transition name='fade' mode='out-in'>
					<div class="page-wrapper">
						<router-view class='view'></router-view>
					</div>
				</transition>

				<v-btn fab bottom	right	color="blue" dark	fixed @click.stop="dialog = !dialog" style="bottom: 45px;">
					<v-icon>add</v-icon>
				</v-btn>

				<!-- App Footer -->
				<v-footer app>
					<span class="pl-2">YouStudy.club</span>
					<v-spacer></v-spacer>
					<span class="pr-2">&copy; 2018</span>
				</v-footer>
			</v-content>

			<Login v-model="authDialog"></Login>
			<MessageDialog v-model="messageDialog"></MessageDialog>

			<v-dialog v-model="dialog" width="800px">
				<v-card>
					<v-card-title	class="grey lighten-4 py-4 title">
						Create contact
					</v-card-title>
					<v-container grid-list-sm class="pa-4">
						<v-layout row wrap>
							<v-flex xs12 align-center justify-space-between>
								<v-layout align-center>
									<v-avatar size="40px" class="mr-3">
										<img src="//ssl.gstatic.com/s2/oz/images/sge/grey_silhouette.png"	alt="">
									</v-avatar>
									<v-text-field	placeholder="Name"></v-text-field>
								</v-layout>
							</v-flex>
							<v-flex xs6>
								<v-text-field
									prepend-icon="business"
									placeholder="Company"
								></v-text-field>
							</v-flex>
							<v-flex xs6>
								<v-text-field
									placeholder="Job title"
								></v-text-field>
							</v-flex>
							<v-flex xs12>
								<v-text-field
									prepend-icon="mail"
									placeholder="Email"
								></v-text-field>
							</v-flex>
							<v-flex xs12>
								<v-text-field
									type="tel"
									prepend-icon="phone"
									placeholder="(000) 000 - 0000"
									mask="phone"
								></v-text-field>
							</v-flex>
							<v-flex xs12>
								<v-text-field
									prepend-icon="notes"
									placeholder="Notes"
								></v-text-field>
							</v-flex>
						</v-layout>
					</v-container>
					<v-card-actions>
						<v-btn flat color="primary">More</v-btn>
						<v-spacer></v-spacer>
						<v-btn flat color="primary" @click="dialog = false">Cancel</v-btn>
						<v-btn flat @click="dialog = false">Save</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>
    </v-app>
		</template>
  </div>
</template>

<script>
import AppDrawer from './components/AppDrawer.vue'
import AppToolbar from './components/AppToolbar.vue'
import Login from './views/Login.vue'
import MessageDialog from './views/MessageDialog.vue'

export default {
	name: 'App',
	components: {
		AppDrawer,
		AppToolbar,
		Login,
		MessageDialog
	},
	data: () => ({
		dialog: false,
		drawer: false,
		authDialog: false,
		messageDialog: false,
		crumbs: [
			{ text: "Home", disabled: false, to: '/' },
			{ text: "iView", disabled: false, to: 'appGrid' },
			{ text: "flex-box", disabled: false, to: 'flexBox' },
			{ text: "css", disabled: true, to: 'css' }
		],
	}),
	created() {
		if (this.$route.matched.some(record => record.meta.action === 'verified')) {
			if (this.$route.query.token) {

				this.$store.dispatch('AUTH_REQUEST', { verifytoken: this.$route.query.token })
				.then(() => {
					this.messageDialog = true
				})
				.catch((err) => {
					//this.message = err.error_description
					console.log(err.error_description)
				})
			}
		}
	},
	watch: {
		/*
		drawer: function() {
			console.log('App drawer:' + this.drawer)
		}
		*/
	},
	computed: {
		isAuth() {
			return this.$store.getters.isAuth
		}
	},
	props: {
    source: String
  }
}
</script>

<style lang="stylus">
.fade-enter-active, .fade-leave-active
  transition all .2s ease

.fade-enter, .fade-leave-active
  opacity 0

@media (max-width 860px)
  .header .inner
    padding 15px 30px

@media (max-width 600px)
  .header
    .inner
      padding 15px
    a
      margin-right 1em
    .github
      display none
</style>
