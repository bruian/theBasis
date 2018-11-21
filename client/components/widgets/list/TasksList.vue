<template>
	<div class="tasks-list">
		<v-expansion-panel class="mb-0">
			<v-expansion-panel-content class="list-header"
				expand
				expand-icon="search">

				<div slot="header">
					<v-toolbar card dense color="transparent">
						<div class="activeTasksListbox">
							<span v-bind:class="{ opacIn: showActiveTasksList }">{{ activeTasksList.text }}</span>
							<span style="margin-left: 5px;">users</span>
						</div>

						<v-spacer></v-spacer>

						<transition-group name="list">
							<span v-for="tlitem in availableTasksList" v-bind:key="tlitem.id">
								<a class="activeitem"
									v-show="tlitem.visible"
									href=""
									@click.prevent.stop="activeClick(tlitem.id)">{{ tlitem.text }}
								</a>
							</span>
						</transition-group>
					</v-toolbar>
				</div>

				<v-card class="list-body">
          <v-text-field class=""
            label="Solo"
            solo
						hide-details
						@input="onChange"
          ></v-text-field>
      	</v-card>
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-divider class="ma-0"></v-divider>
		<div class="tasks-list-body">
			<vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="tskbox">
				<div class="task-container" v-for="(item, index) in items">
					<div class="task-clmn1">
						<v-speed-dial
							:direction="direction"
							:open-on-hover="hover"
							:transition="transition">
							<v-btn
								slot="activator"
								color="blue darken-2"
								dark
								fab
								small>
								<v-icon>playlist_add_check</v-icon>
								<v-icon>close</v-icon>
							</v-btn>
							<v-btn
								fab
								dark
								small
								color="green">
								<v-icon>play_arrow</v-icon>
							</v-btn>
							<v-btn
								fab
								dark
								small
								color="green">
								<v-icon>not_interested</v-icon>
							</v-btn>
							<v-btn
								fab
								dark
								small
								color="green">
								<v-icon>delete_forever</v-icon>
							</v-btn>
						</v-speed-dial>
					</div>

					<div class="task-clmn2">
						<v-flex class="task-status ma-0" style="padding:1px;" text-xs-center>
							<v-tooltip bottom>
								<v-icon
									slot="activator"
									color="primary"
									dark
								>play_arrow</v-icon>
								<span>Начато</span>
							</v-tooltip>
						</v-flex>
						<v-flex class="task-id ma-0" style="padding:1px;">
							<div>id: {{item.tid}}</div>
						</v-flex>
					</div>

					<div class="task-clmn3">
						<!-- <v-flex class="ma-0" style="padding:1px;"> -->
							<ItmTextArea
								placeholder="Task name"
								v-model="item.name"
								:min-height="21"
								:max-height="84"
							></ItmTextArea>
						<!-- </v-flex> -->
						<v-flex class="ma-0" style="padding:1px;">
							<TagsInput element-id="item.task_id"
								:tag-input="context(item.task_id)"
								:existing-tags="{
									'web-development': 'Web Development',
									'php': 'PHP',
									'javascript': 'JavaScript',
								}"
								:typeahead="true"
								:placeholder="'Add a context'">
							</TagsInput>
						</v-flex>
					</div>

					<div class="task-clmn4">
						<v-flex class="ma-0" style="padding:1px;">
							<div>{{getDuration(item.duration)}}</div>
						</v-flex>
						<v-flex class="ma-0" style="padding:1px;">
							<treeselect v-model="item.group_id"
								placeholder="Group"
								:multiple="false"
								:options="mainGroupsMini" />
						</v-flex>
					</div>
					<!--</div>  task-container -->
				</div> <!-- task-container -->

				<infinite-loading @infinite="infiniteHandler" ref="infLoadingTasksList"></infinite-loading>
			</vue-perfect-scrollbar>
		</div> <!-- tasks-list-body -->
	</div> <!-- tasks-list -->
</template>

<script>
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

import ItmTextArea from '../ItmTextArea.vue'
import VuePerfectScrollbar from '../perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'
import TagsInput from '../../VoerroTagsInput/VoerroTagsInput.vue'

const taskStatus = [
	'Assigned', //Назначено - 0
	'Started', //Начато - 1
	'Done', //Выполнено - 2
	'Suspended', //Приостановлено - 3
	'Cancel', //Отменено - 4
	'Continued', //Продолжено - 5
	'Performed' //Выполняется - 6
]

export default {
	name: 'tasks-list',
	components: {
		Treeselect,
		TagsInput,
		ItmTextArea,
		VuePerfectScrollbar,
		InfiniteLoading,
	},
	data: () => ({
		direction: 'right',
		hover: false,
		transition: 'slide-x-transition',
		searchText: '',
		suggestionAttribute: 'original_title',
		suggestions: [],
		selectedEvent: "",
		scrollSettings: {
			maxScrollLength: 10
		},
		countEl: 0, //pass to load data
		blocked: false,
		showActiveTasksList: false, //shows selected user list, my or all. Its for animation
	}),
	beforeMount () {
		if (this.$root._isMounted) {
		}
	},
	computed: {
		items() {	return this.$store.getters.tasksList },
		activeTasksList() { return this.$store.state.activeTasksList },
		availableTasksList() { return this.$store.state.availableTasksList },
		mainGroupsMini() { return this.$store.state.mainGroupsMini }
	},
  methods: {
		onChange: function(value) {
			console.log('changed searchText: ' + value)
			this.searchText = value
			let that = this

			function que(params) {
				if (that.countEl == 0) {
					//that.$store.commit('RESET_USERS_LIST')
					//that.$store.commit('SET_PARAMS_USERS_LIST', { searchText: that.searchText })
					that.$refs.infLoadingTasksList.$emit('$InfiniteLoading:reset')
					that.blocked = false
					console.log('ask')

					return
				} else {
					that.blocked = true
					console.log('wait')
					setTimeout(que, 400)
				}
			}

			if (!this.blocked) que()
		},
		onLink: function(id) {
			// return this.$store.dispatch('LINK_USERS_LIST', id).then((res) => {
			// })
			// .catch((err) => {
			// 	console.log(err)
			// })
		},
		onUnLink: function(id) {
			// return this.$store.dispatch('UNLINK_USERS_LIST', id).then((res) => {
			// 	if (res) {}
			// })
			// .catch((err) => {
			// 	console.log(err)
			// })
		},
    handleClick: (e) => {
      console.log(e)
		},
		infiniteHandler($state) {
			if (this.countEl == 0) {
				this.countEl++
				console.log(`1** infiniteHandler fetch offset: ${this.$store.state[this.$store.state.activeTasksList.list].offset} CNT: ${this.countEl}`)
				return this.$store.dispatch('FETCH_TASKS_LIST').then((count) => {
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
			this.$store.commit('SET_ACTIVE_TASKS_LIST', activeID)
			this.$nextTick(() => {
        this.$refs.infLoadingTasksList.$emit('$InfiniteLoading:reset')
      })

			this.showActiveTasksList = !this.showActiveTasksList
      setTimeout(() => {
        this.showActiveTasksList = !this.showActiveTasksList
      }, 500)
		},
		context(id) {
			return this.$store.getters.context(id)
		},
		getHref(condition) {
			//v-bind:href="getHref(ulitem.condition)"
			//let values = this.$store.getters.conditionValues(condition) deprecated
			//return 'users' + ((values === undefined) ? '' : `/${values}`)
		},
		getDuration(duration) {
			let timeDiff = duration / 1000

			let seconds = Math.round(timeDiff % 60)
			timeDiff = Math.floor(timeDiff / 60)

			let minutes = Math.round(timeDiff % 60)
			timeDiff = Math.floor(timeDiff / 60)

			let hours = Math.round(timeDiff % 24)
			timeDiff = Math.floor(timeDiff / 24)
			hours = hours + (timeDiff * 24)

			return `${hours>9 ? '' : '0'}${hours}:${minutes>9 ? '' : '0'}${minutes}:${seconds>9 ? '' : '0'}${seconds}`
		}
  }
}
</script>

<style lang="css">
.tasks-list {
  /* border-radius: 2px;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
  display: block;
  position: relative;
	text-decoration: none; */
	min-width: 550;
  transition: .3s cubic-bezier(.25,.8,.5,1);
}

.tasks-list-body {
	padding: 1px;
	margin: 0px;
}

.task-container {
	/* padding: 1em; */
	/* width: 100%; */
	display: flex;
	flex-flow: row nowrap;
	max-width: 100%;

  margin: 0.3em;
	background-color: #f8f9fa;
	box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2);
}

.task-container:hover, .task-container:focus, .task-container:active {
	box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2),
	-13px 0 15px -15px rgba(0, 0, 0, .7),
	13px 0 15px -15px rgba(0, 0, 0, .7),
	0 0 40px rgba(0, 0, 0, .1) inset
}

.task-clmn1 {
	/* display: flex; */
	/* justify-content: space-between; */
	/* padding: 1px; */
	/* margin: 0px; */
	align-self: center;
	width: 50px;
	min-height: 47px;
}

.task-clmn1 .v-btn--floating.v-btn--small {
	height: 35px;
	width: 35px;
	outline: none;
}

.v-speed-dial--direction-right {
	z-index: 1;
}

.task-clmn2 {
	display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: stretch;
}

/* .task-clmn2-row1 {
  width: 50px;
  border: 1px solid black;
  height: 100%;
}

.task-clmn2-row2 {
  width: 50px;
  border: 1px solid black;
} */

.task-status .v-icon {
	color: #007bff;
	font-size: 1.1rem;
}

.task-id div {
	font-size: 0.9rem;
}

.task-clmn3 {
  flex: 1 1 auto;
  /* border: 1px solid red; */
}

.task-clmn4 {
	width: 100px;
  /* border: 1px solid orange; */
}

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

.activeTasksListbox {
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

.tsk-area-el {
	flex: 1;
}

.vue-treeselect__control {
	height: 30px;
}
</style>

<style lang="stylus">
	.drawer-menu--scroll
		height: calc(70vh)
		overflow: auto
</style>
