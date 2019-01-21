<template>
	<v-card >
		<v-expansion-panel class="mb-0">
			<v-expansion-panel-content class="list-header"
				expand
				expand-icon="search">

				<div slot="header">
					<v-toolbar card dense color="transparent">
						<div class="activeGroupsListbox">
							<span v-bind:class="{ opacIn: showActiveGroupsList }">{{ activeGroupsList.text }}</span>
							<span style="margin-left: 5px;">groups</span>
						</div>

						<v-spacer></v-spacer>

						<transition-group name="list">
							<span v-for="glitem in availableGroupsList" v-bind:key="glitem.id">
								<a class="activeitem"
									v-show="glitem.visible"
									href=""
									@click.prevent.stop="activeClick(glitem.id)">{{ glitem.text }}
								</a>
							</span>
						</transition-group>
					</v-toolbar>
				</div>

				<v-card class="list-body">
					<!--search bar-->
          <v-text-field class=""
            label="Solo"
            solo
						hide-details
						@input="onChange">
					</v-text-field>
      	</v-card>
			</v-expansion-panel-content>
		</v-expansion-panel>

		<v-divider class="ma-0"></v-divider>

		<v-card-text class="pa-0">
			<vue-perfect-scrollbar class="drawer-menu--scrollV" :settings="scrollSettings" ref="grpbox">
				<v-treeview
          :active.sync="active"
          :items="items"
          :load-children="fetchSubgroups"
          :open.sync="open"
          activatable
          active-class="primary--text"
          class="grey lighten-5"
          open-on-click
          transition>
          <v-icon
            v-if="!item.children"
            slot="prepend"
            slot-scope="{ item, active }"
            :color="active ? 'primary' : ''">
						mdi-account
					</v-icon>
        </v-treeview>
				<infinite-loading @infinite="infiniteHandler" ref="infLoadingGroupsList"></infinite-loading>
			</vue-perfect-scrollbar>
		</v-card-text>
	</v-card>
</template>

<script>
import VuePerfectScrollbar from '../../Perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

export default {
	name: 'groups-listV',
	components: {
		VuePerfectScrollbar,
		InfiniteLoading,
	},
	data: () => ({
		active: [], //trw
		open: [], //trw
		users: [],
		searchText: '',
		suggestionAttribute: 'original_title',
		suggestions: [],
		selectedEvent: "",
		scrollSettings: {
			maxScrollLength: 10
		},
		countEl: 0, //pass to load data
		blocked: false,
		showActiveGroupsList: false, //shows selected user list, my or all. Its for animation
	}),
	beforeMount () {
		if (this.$root._isMounted) {
		}
	},
	computed: {
		items() {	return this.$store.getters.groupsList },
		selected() {
			if (!this.active.length) return undefined

			const id = this.active[0]

			return this.users.find(user => user.id === id)
		},
		activeGroupsList() { return this.$store.state.activeGroupsList },
		availableGroupsList() { return this.$store.state.availableGroupsList }
	},
  methods: {
		onChange: function(value) {
			console.log('changed searchText: ' + value)
			this.searchText = value
			let that = this

			function que(params) {
				if (that.countEl == 0) {
					that.$store.commit('RESET_GROUPS_LIST')
					that.$store.commit('SET_PARAMS_GROUPS_LIST', { searchText: that.searchText })
					that.$refs.infLoadingGroupsList.$emit('$InfiniteLoading:reset')
					that.blocked = false
					console.log('ask groups')

					return
				} else {
					that.blocked = true
					console.log('wait groups')
					setTimeout(que, 400)
				}
			}

			if (!this.blocked) que()
		},
		onLink: function(id) {
			return this.$store.dispatch('LINK_GROUPS_LIST', id).then((res) => {})
			.catch((err) => {
				console.log(err)
			})
		},
		onUnLink: function(id) {
			return this.$store.dispatch('UNLINK_GROUPS_LIST', id).then((res) => {})
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
				console.log(`1**GR infiniteHandler fetch offset: ${this.$store.state[this.$store.state.activeGroupsList.list].offset} CNT: ${this.countEl}`)
				return this.$store.dispatch('FETCH_GROUPS_LIST').then((count) => {
					this.countEl--
					if (count) {
						$state.loaded()
						console.log(`2**GR infiniteHandler fetched from srv: ${count} elements CNT: ${this.countEl}`)
					} else {
						$state.complete()
						console.log(`3**GR infiniteHandler loaded off CNT: ${this.countEl}`)
					}
				})
				.catch((err) => {
					this.countEl = 0
					console.warn(err)
				})
			}
		},
   	activeClick: function(activeID) {
			this.countEl = 0
			this.$store.commit('SET_ACTIVE_GROUPS_LIST', activeID)
			this.$nextTick(() => {
        this.$refs.infLoadingGroupsList.$emit('$InfiniteLoading:reset')
      })

			this.showActiveGroupsList = !this.showActiveGroupsList
      setTimeout(() => {
        this.showActiveGroupsList = !this.showActiveGroupsList
      }, 500)
		},
		async fetchSubgroups (item) {
			console.log(`1**SGR fetch`)
			return this.$store.dispatch('FETCH_SUBGROUPS', item.id).then((count) => {
				console.log(`2**SGR fetched`)
			})
			.catch((err) => {
				console.warn(err)
			})
		}
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

.activeGroupsListbox {
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
	.drawer-menu--scrollV
		max-height: calc(40vh)
		overflow: auto
</style>
