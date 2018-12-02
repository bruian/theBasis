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
				<SlickList
					lockAxis="y"
					:value="items"
					:useDragHandle="true"
					@sort-start="onSortStart($event)"
					@sort-end="onSortEnd($event)">
					<SlickItem v-for="(item, index) in items"
						:index="index"
						:key="item.task_id"
						class="task-container"
						collection="#1">

						<div class="task-divider-body" v-if="item.divider">
							<div class="task-divider-clmn1">
								<p>id: {{ item.group_id }} | Группа: {{ item.name }}</p>
							</div>
						</div>

						<TaskItem :item="item" v-if="!item.divider"></TaskItem>
					</SlickItem>
				</SlickList>
				<infinite-loading @infinite="infiniteHandler" ref="infLoadingTasksList"></infinite-loading>
			</vue-perfect-scrollbar>
		</div> <!-- tasks-list-body -->
	</div> <!-- tasks-list -->
</template>

<script>
import TaskItem from '../items/TaskItem.vue'
import VuePerfectScrollbar from '../../Perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'

import { SlickList, SlickItem } from 'vue-slicksort'

export default {
	name: 'tasks-list',
	components: {
		TaskItem,
		VuePerfectScrollbar,
		InfiniteLoading,
    SlickItem,
    SlickList
	},
	data: () => ({
		searchText: '',
		// suggestionAttribute: 'original_title',
		// suggestions: [],
		// selectedEvent: "",
		scrollSettings: {
			maxScrollLength: 10
		},
		countEl: 0, //pass to load data
		blocked: false,
		showActiveTasksList: false //shows selected user list, my or all. Its for animation
	}),
	// beforeMount () {
	// 	if (this.$root._isMounted) {
	// 	}
	// },
	computed: {
		items() {	return this.$store.getters.tasksList },
		activeTasksList() { return this.$store.state.activeTasksList },
		availableTasksList() { return this.$store.state.availableTasksList }
	},
  methods: {
		onChange: function(value) {
			console.log('changed searchText: ' + value)
			this.searchText = value
			let that = this

			function que(params) {
				if (that.countEl == 0) {
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
    onSortStart: function(e) {
			const task = this.$store.getters.taskByIndex(e.index)
      this.$store.commit('SET_ACTIVE_TASK', { task_id: task.task_id })
		},
		onSortEnd: function(e) {
			console.log(e)
			if (e.oldIndex !== e.newIndex & e.newIndex > 0) {
				this.$store.dispatch('REORDER_TASKS_LIST', {
					oldIndex: e.oldIndex,
					newIndex: e.newIndex,
					list: e.collection })
				.then((res) => {
					console.log('reordering')
				})
				.catch((err) => {
					console.err(err)
				})
			}
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
	flex-direction: column;
	max-width: 100%;

  margin: 0.3em;
}

.list-header
.v-expansion-panel__header {
  padding: 0px;
}

.list-header
.v-expansion-panel__header__icon {
	padding-top: 4px;
	padding-right: 5px;
}

.list-header
.search-button {
	padding-top: 4px;
	margin-left: 0px;
	margin-right: 0px;
}

.list-header
.v-toolbar__content {
	padding-right: 5px;
}

.list-body
.sbx-twitter {
	width: 100%;
}

.list-body .main {
	margin-left: 5px;
	margin-right: 5px;
	margin-bottom: 5px;
}

.activebox { /*what is it */
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

.task-divider-body {
	display: flex;
	flex-flow: row nowrap;
	border-top: 1px solid #b3d4fc;
}

.task-divider-body p {
	margin: 0.2em;
}

.task-divider-clmn1 {
	align-self: center;
	min-height: 20px;
}
/* .tsk-area-el {
	flex: 1;
} */

</style>

<style lang="stylus">
	.drawer-menu--scroll
		height: calc(70vh)
		overflow: auto
</style>
