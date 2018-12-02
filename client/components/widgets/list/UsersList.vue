<template>
	<v-card >
		<v-expansion-panel class="mb-0">
			<v-expansion-panel-content class="list-header"
				expand
				expand-icon="search">
				<!-- v-model="externalOpen"
				hide-actions> -->

				<div slot="header">
					<v-toolbar card dense color="transparent">
						<div class="activeUsersListbox">
							<span v-bind:class="{ opacIn: showActiveUsersList }">{{ activeUsersList.text }}</span>
							<span style="margin-left: 5px;">users</span>
						</div>

						<v-spacer></v-spacer>

						<transition-group name="list">
							<span v-for="ulitem in availableUsersList" v-bind:key="ulitem.id">
								<a class="activeitem"
									v-show="ulitem.visible"
									href=""
									@click.prevent.stop="activeClick(ulitem.id)">{{ ulitem.text }}
								</a>
							</span>
						</transition-group>

						<!-- <v-btn flat icon color="grey" class="search-button" @click.stop="externalOpen = !externalOpen">
              <v-icon>search</v-icon>
            </v-btn> -->
				    <!-- <v-btn flat icon color="grey" class="settings-button" @click.stop="externalOpen = !externalOpen">
              <v-icon>settings</v-icon>
            </v-btn> -->
					</v-toolbar>
				</div>

				<v-card class="list-body">
					<!--search bar-->

          <v-text-field class=""
            label="Solo"
            solo
						hide-details
						@input="onChange"
          ></v-text-field>
					<!-- <vue-instant :suggestion-attribute="suggestionAttribute"
						v-model="searchText"
						:disabled="false"
						@input="changed"
						@click-input.stop="clickInput"
						@click-button="clickButton"
						@selected="selected"
						@enter="enter"
						@key-up="keyUp"
						@key-down="keyDown"
						@key-right="keyRight"
						@clear="clear"
						@escape="escape"
						:show-autocomplete="true"
						:autofocus="false"
						:suggestions="suggestions"
						name="customName"
						placeholder="custom placeholder"
						type="twitter">
					</vue-instant> -->
        	<!-- <v-card-text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</v-card-text> -->
      	</v-card>
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-divider class="ma-0"></v-divider>
		<v-card-text class="pa-0">
			<vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="usrbox">
				<v-list two-line class="pa-0" dense>
					<template v-for="(item, index) in items">
						<v-subheader v-if="item.header" :key="item.id">{{ item.header }}</v-subheader>
						<!-- <v-divider v-else-if="item.divider" :key="index" class="ma-0"></v-divider> -->
						<v-list-tile avatar v-else :key="item.username" @click="handleClick">
							<v-list-tile-avatar>
								<img :src="item.avatar">
							</v-list-tile-avatar>
							<v-list-tile-content>
								<v-list-tile-title v-html="item.username"></v-list-tile-title>
								<v-list-tile-sub-title v-html="item.id"></v-list-tile-sub-title>
							</v-list-tile-content>
							<v-spacer></v-spacer>
							<v-list-tile-action>
								<v-btn v-if="item.friend == 0" :loading="item.loadingButton" flat small @click.stop="onLink(item.id)">Link</v-btn>
								<v-btn v-else flat small color="error" @click.stop="onUnLink(item.id)">Unlink</v-btn>
							</v-list-tile-action>
						</v-list-tile>
					</template>
				</v-list>
				<infinite-loading @infinite="infiniteHandler" ref="infLoadingUsersList"></infinite-loading>
			</vue-perfect-scrollbar>
		</v-card-text>
	</v-card>
</template>

<script>
import VuePerfectScrollbar from '../../Perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'
//import InfiniteLoading from 'vue-infinite-loading/src/components/InfiniteLoading.vue'
//import axios from 'axios'

export default {
	name: 'users-list',
	components: {
		VuePerfectScrollbar,
		InfiniteLoading,
	},
	data: () => ({
		searchText: '',
		suggestionAttribute: 'original_title',
		suggestions: [],
		selectedEvent: "",
		scrollSettings: {
			maxScrollLength: 10
		},
		countEl: 0, //pass to load data
		blocked: false,
		showActiveUsersList: false, //shows selected user list, my or all. Its for animation
		//externalOpen: false
	}),
	beforeMount () {
		if (this.$root._isMounted) {
			//this.loadItems()
			//this.$route.params.id
		}
	},
	computed: {
		items() {	return this.$store.getters.usersList },
		activeUsersList() { return this.$store.state.activeUsersList },
		availableUsersList() { return this.$store.state.availableUsersList }
	},
  methods: {
		onChange: function(value) {
			console.log('changed searchText: ' + value)
			this.searchText = value
			let that = this

			function que(params) {
				//this.$nextTick(() => {
					//this.countEl = 1
					if (that.countEl == 0) {
						that.$store.commit('RESET_USERS_LIST')
						that.$store.commit('SET_PARAMS_USERS_LIST', { searchText: that.searchText })
						that.$refs.infLoadingUsersList.$emit('$InfiniteLoading:reset')
						that.blocked = false
						console.log('ask')

						return
					} else {
						that.blocked = true
						console.log('wait')
						setTimeout(que, 400)
					}
				//})
			}

			if (!this.blocked) que()
		},
		onLink: function(id) {
			return this.$store.dispatch('LINK_USERS_LIST', id).then((res) => {
			})
			.catch((err) => {
				console.log(err)
			})
		},
		onUnLink: function(id) {
			return this.$store.dispatch('UNLINK_USERS_LIST', id).then((res) => {
				if (res) {}
			})
			.catch((err) => {
				console.log(err)
			})
		},
    handleClick: (e) => {
      console.log(e)
		},
		infiniteHandler($state) {
			if (this.countEl == 0) {
				this.countEl++
				console.log(`1** infiniteHandler fetch offset: ${this.$store.state[this.$store.state.activeUsersList.list].offset} CNT: ${this.countEl}`)
				return this.$store.dispatch('FETCH_USERS_LIST').then((count) => {
					this.countEl--
					if (count) {
						$state.loaded()
						console.log(`2** infiniteHandler fetched from srv: ${count} elements CNT: ${this.countEl}`)
					} else {
						$state.complete()
						console.log(`3** infiniteHandler loaded off CNT: ${this.countEl}`)
					}
				})
				.catch((err) => {
					this.countEl = 0
					console.log(err)
				})
			}
		},
   	activeClick: function(activeID) {
			this.countEl = 0
			this.$store.commit('SET_ACTIVE_USERS_LIST', activeID)
			this.$nextTick(() => {
        this.$refs.infLoadingUsersList.$emit('$InfiniteLoading:reset')
      })

			this.showActiveUsersList = !this.showActiveUsersList
      setTimeout(() => {
        this.showActiveUsersList = !this.showActiveUsersList
      }, 500)
		},
		getHref(condition) {
			//v-bind:href="getHref(ulitem.condition)"
			//let values = this.$store.getters.conditionValues(condition) deprecated
			//return 'users' + ((values === undefined) ? '' : `/${values}`)
		},
		// clickInput: function() {
		// 	this.selectedEvent = 'click input'
		// 	console.log(this.selectedEvent)
		// },
		// clickButton: function() {
		// 	this.selectedEvent = 'click button'
		// 	console.log(this.selectedEvent)
		// },
		// selected: function() {
		// 		this.selectedEvent = 'selection changed'
		// },
		// enter: function() {
		// 		this.selectedEvent = 'enter'
		// },
		// keyUp: function() {
		// 		this.selectedEvent = 'keyup pressed'
		// },
		// keyDown: function() {
		// 		this.selectedEvent = 'keyDown pressed'
		// },
		// keyRight: function() {
		// 		this.selectedEvent = 'keyRight pressed'
		// },
		// clear: function() {
		// 		this.selectedEvent = 'clear input'
		// },
		// escape: function() {
		// 		this.selectedEvent = 'escape'
		// },
		// changed: function() {
		// 	console.log('changed searchText: ' + this.searchText)

		// 	this.$store.commit('RESET_USERS_LIST')
		// 	this.$store.commit('SET_PARAMS_USERS_LIST', { searchText: this.searchText })
		// 	this.$nextTick(() => {
		// 		this.countEl = 1
    //     this.$refs.infLoadingUsersList.$emit('$InfiniteLoading:reset')
    //   })
		// }
  },
}
</script>

<style lang="css">
.list-header .v-expansion-panel__header {
  padding: 0px;
}

.list-header .v-expansion-panel__header__icon {
	padding-top: 4px;
	padding-right: 5px;
}

.list-header .search-button {
	padding-top: 4px;
	margin-left: 0px;
	margin-right: 0px;
}

.list-header .v-toolbar__content {
	padding-right: 5px;
}

.list-body .sbx-twitter {
	width: 100%;
}

.list-body .main {
	margin-left: 5px;
	margin-right: 5px;
	margin-bottom: 5px;
}

.activebox {
  white-space: nowrap;
  display: flex;
  justify-content: space-between;
}

.activeUsersListbox {
  display: flex;
}

.opacIn {
  animation-name: fadeIn;
  animation-duration: .5s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.activeitem {
	margin-right: 5px;
	color: blue;
}

.list-enter-active, .list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to /* .list-leave-active до версии 2.1.8 */ {
  opacity: 0;
  transform: translateY(30px);
}
</style>

<style lang="stylus">
	.drawer-menu--scroll
		height: calc(70vh)
		overflow: auto
</style>
