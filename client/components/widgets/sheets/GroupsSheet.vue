<template>
	<v-card >
		<v-expansion-panel class="mb-0">
			<v-expansion-panel-content class="sheet-header"
				expand
				expand-icon="search"
			>
				<div slot="header">
					<v-toolbar card dense color="transparent">
						<div class="activeGroupsSheetbox">
							<span v-bind:class="{ opacIn: showActiveGroupsSheet }">{{ activeGroupsSheet.text }}</span>
							<span style="margin-left: 5px;">groups</span>
						</div>

						<v-spacer></v-spacer>

						<transition-group name="sheet">
							<span v-for="glitem in availableGroupsSheet" v-bind:key="glitem.id">
								<a class="activeitem"
									v-show="glitem.visible"
									href=""
									@click.prevent.stop="activeClick(glitem.id)">{{ glitem.text }}
								</a>
							</span>
						</transition-group>
					</v-toolbar>
				</div>

				<v-card class="sheet-body">
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
			<vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="grpbox">
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
				<infinite-loading @infinite="infiniteHandler" ref="infLoadingGroupsSheet"></infinite-loading>
			</vue-perfect-scrollbar>
		</v-card-text>
	</v-card>
</template>

<script>
import VuePerfectScrollbar from '../../Perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

export default {
	name: 'groups-sheet',
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
		showActiveGroupsSheet: false, //shows selected user sheet, my or all. Its for animation
	}),
	beforeMount () {
		if (this.$root._isMounted) {
		}
	},
	computed: {
		items() {	return this.$store.getters.groupsSheet },
		selected() {
			if (!this.active.length) return undefined

			const id = this.active[0]

			return this.users.find(user => user.id === id)
		},
		activeGroupsSheet() { return this.$store.state.activeGroupsSheet },
		availableGroupsSheet() { return this.$store.state.availableGroupsSheet }
	},
  methods: {
		onChange: function(value) {
			console.log('changed searchText: ' + value)
			this.searchText = value
			let that = this

			function que(params) {
				if (that.countEl == 0) {
					that.$store.commit('RESET_GROUPS_SHEET')
					that.$store.commit('SET_PARAMS_GROUPS_SHEET', { searchText: that.searchText })
					that.$refs.infLoadingGroupsSheet.$emit('$InfiniteLoading:reset')
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
			return this.$store.dispatch('LINK_GROUPS_SHEET', id).then((res) => {})
			.catch((err) => {
				console.log(err)
			})
		},
		onUnLink: function(id) {
			return this.$store.dispatch('UNLINK_GROUPS_SHEET', id).then((res) => {})
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
				console.log(`1**GR infiniteHandler fetch offset: ${this.$store.state[this.$store.state.activeGroupsSheet.sheet].offset} CNT: ${this.countEl}`)
				return this.$store.dispatch('FETCH_GROUPS_SHEET').then((count) => {
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
			this.$store.commit('SET_ACTIVE_GROUPS_SHEET', activeID)
			this.$nextTick(() => {
        this.$refs.infLoadingGroupsSheet.$emit('$InfiniteLoading:reset')
      })

			this.showActiveGroupsSheet = !this.showActiveGroupsSheet
      setTimeout(() => {
        this.showActiveGroupsSheet = !this.showActiveGroupsSheet
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
	.sheet-header .v-expansion-panel__header {
		padding: 0px;
	}

	.sheet-header .v-expansion-panel__header__icon {
		padding-top: 4px;
		padding-right: 5px;
	}

	.sheet-header .search-button {
		padding-top: 4px;
		margin-left: 0px;
		margin-right: 0px;
	}

	.sheet-header .v-toolbar__content {
		padding-right: 5px;
	}

	.sheet-body .sbx-twitter {
		width: 100%;
	}

	.sheet-body .main {
		margin-left: 5px;
		margin-right: 5px;
		margin-bottom: 5px;
	}

	.activebox {
		white-space: nowrap;
		display: flex;
		justify-content: space-between;
	}

	.activeGroupsSheetbox {
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

	.sheet-enter-active, .sheet-leave-active {
	  transition: all 1s;
	}

	.sheet-enter, .sheet-leave-to /* .sheet-leave-active до версии 2.1.8 */ {
		opacity: 0;
		transform: translateY(30px);
	}
</style>

<style lang="stylus">
	.drawer-menu--scroll
		height: calc(70vh)
		overflow: auto
</style>
