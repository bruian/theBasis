<template>
  <div id="app">
		<template v-if="appReady">
			<v-app id="inspire" class="app">
				<app-drawer v-model="drawer" class="app--drawer"></app-drawer>
				<app-toolbar v-model="drawer" v-bind:authDialog.sync="authDialog" class="app--toolbar"></app-toolbar>

				<v-content>
					<!-- Page Header -->
					<!--page-header v-if="$route.meta.breadcrumb"></page-header-->

					<div class="mt-0 pb-0" v-if="isAuth">
						<v-breadcrumbs :items="crumbs">
							<v-icon slot="divider">link</v-icon>
						</v-breadcrumbs>
					</div>

					<transition name='fade' mode='out-in'>
						<div class="page-wrapper">
							<router-view class='view'></router-view>
						</div>
					</transition>

					<!-- Большая синяя кнопка -->
					<!-- <v-btn fab bottom	right	color="blue" dark	fixed @click.stop="dialog = !dialog" style="bottom: 45px;">
						<v-icon>add</v-icon>
					</v-btn> -->

					<!-- App Footer -->
					<v-footer app>
						<span class="pl-2">inTask.me</span>
						<v-spacer></v-spacer>
						<span class="pr-2">&copy; 2018</span>
					</v-footer>
				</v-content>

				<v-btn small fab dark falt fixed
					top="top" right="right"
					class="setting-fab" color="red"
					@click="settingsDrawer = !settingsDrawer"
					v-if="isAuth"
				>
					<v-icon>settings</v-icon>
				</v-btn>

				<v-navigation-drawer
					class="setting-drawer"
					temporary
					right
					v-model="settingsDrawer"
					hide-overlay
					fixed
				>
					<panel-settings></panel-settings>
				</v-navigation-drawer>

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

		<template v-else>
			<div class="appLoading">
				<div>Application loaded...</div>
				<div class="atom-spinner">
					<div class="spinner-inner">
						<div class="spinner-line"></div>
						<div class="spinner-line"></div>
						<div class="spinner-line"></div>
						<!--Chrome renders little circles malformed :(-->
						<div class="spinner-circle">
							&#9679;
						</div>
					</div>
				</div>
			</div>
		</template>
  </div>
</template>

<script>
import AppDrawer from './components/AppDrawer.vue'
import AppToolbar from './components/AppToolbar.vue'
import PanelSettings from './components/PanelSettings.vue'
import Login from './views/Login.vue'
import MessageDialog from './views/MessageDialog.vue'
//import AuthCheck from './components/AuthCheck.vue'
//import { AtomSpinner } from 'epic-spinners'
//#2195f3
function getUserByToken(store, done) {
	const storage = (process.env.VUE_ENV === 'server') ? null : window.localStorage
	if (storage && storage.getItem('access_token')) {
		store.dispatch('MAINUSER_REQUEST')
		.then(() => {
			console.log('user get from server')
			done()
		})
		.catch((err) => {
			done(err)
		})
	} else {
		done()
	}
}

export default {
	name: 'App',
	components: {
		AppDrawer,
		AppToolbar,
		Login,
		MessageDialog,
		PanelSettings,
	//	AuthCheck,
	//	AtomSpinner
	},
	data: () => ({
		dialog: false,
		drawer: false,
		settingsDrawer: false,
		authDialog: false,
		messageDialog: false,
		crumbs: [
			{ text: "Home", disabled: false, to: '/' },
			{ text: "User", disabled: false, to: 'user' },
			{ text: "Main", disabled: true, to: 'css' }
		],
	}),
	created() {
		if (this.$route.matched.some(record => record.meta.action === 'verified')) {
			if (this.$route.query.token) {
				this.$store.dispatch('AUTH_REQUEST', { verifytoken: this.$route.query.token })
				.then(() => {
					this.messageDialog = true
					return this.$router.push({ name: 'home' },
						() => { this.$store.commit('CHANGE_APP_READY', true) },
						() => {	this.$store.commit('CHANGE_APP_READY', true) })
				})
				.catch((err) => {
					//this.message = err.error_description
					console.log(err.error_description)
				})
			}
		} else {
			//debugger
			getUserByToken(this.$store, (err) => {
				//debugger
				if (err) {
					return this.$router.push({ name: 'home' },
						() => { this.$store.commit('CHANGE_APP_READY', true) },
						() => {	this.$store.commit('CHANGE_APP_READY', true) })
				}

				if (!this.$store.getters.isAuth) {
					this.$router.push({ name: 'home' },
						() => {	this.$store.commit('CHANGE_APP_READY', true) },
						() => {	this.$store.commit('CHANGE_APP_READY', true) })
				} else {
					this.$store.commit('CHANGE_APP_READY', true)
				}
			})
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
		appReady() {
			return this.$store.state.appReady
		},
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

.setting-fab
	top: 50%!important
	right: 0
	border-radius: 0

.page-wrapper
	min-height:calc(100vh - 64px - 50px - 81px)

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

.appLoading
	width 100%
	height 100%
	position fixed
	top 0
	left 0
	display flex
	flex-flow: column
	align-items center
	align-content center
	justify-content center
	overflow auto
</style>

<style lang="css">
	.atom-spinner, .atom-spinner * {
		box-sizing: border-box;
	}

	.atom-spinner {
		height: 60px;
		width: 60px;
		overflow: hidden;
	}

	.atom-spinner .spinner-inner {
		position: relative;
		display: block;
		height: 100%;
		width: 100%;
	}

	.atom-spinner .spinner-circle {
		display: block;
		position: absolute;
		color: #007bff;
		font-size: calc(60px * 0.24);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.atom-spinner .spinner-line {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		animation-duration: 1s;
		border-left-width: calc(60px / 25);
		border-top-width: calc(60px / 25);
		border-left-color: #007bff;
		border-left-style: solid;
		border-top-style: solid;
		border-top-color: transparent;
	}

	.atom-spinner .spinner-line:nth-child(1) {
		animation: atom-spinner-animation-1 1s linear infinite;
		transform: rotateZ(120deg) rotateX(66deg) rotateZ(0deg);
	}

	.atom-spinner .spinner-line:nth-child(2) {
		animation: atom-spinner-animation-2 1s linear infinite;
		transform: rotateZ(240deg) rotateX(66deg) rotateZ(0deg);
	}

	.atom-spinner .spinner-line:nth-child(3) {
		animation: atom-spinner-animation-3 1s linear infinite;
		transform: rotateZ(360deg) rotateX(66deg) rotateZ(0deg);
	}

	@keyframes atom-spinner-animation-1 {
		100% {
			transform: rotateZ(120deg) rotateX(66deg) rotateZ(360deg);
		}
	}

	@keyframes atom-spinner-animation-2 {
		100% {
			transform: rotateZ(240deg) rotateX(66deg) rotateZ(360deg);
		}
	}

	@keyframes atom-spinner-animation-3 {
		100% {
			transform: rotateZ(360deg) rotateX(66deg) rotateZ(360deg);
		}
	}
</style>
