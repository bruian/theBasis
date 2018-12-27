<template>
	<div class="tasks-list">
		<div class="task-list-header">
			<v-icon style="cursor: pointer;"
				v-bind:color="selectedList"
				@click="onSelectList">bookmark</v-icon>
			<v-btn small icon @click="onAddItem(false)">
				<v-icon color="primary">add_circle</v-icon>
			</v-btn>
			<v-btn small icon v-show="isAllowedOperation & 1" @click="onAddItem(true)">
				<v-icon color="primary">add_circle_outline</v-icon>
			</v-btn>
			<v-btn small icon v-show="isAllowedOperation & 2" @click="onDeleteItem">
				<v-icon color="primary">delete</v-icon>
			</v-btn>
			<v-btn small icon v-show="isAllowedOperation & 4" @click="onMove(true)">
				<v-icon color="primary">arrow_upward</v-icon>
			</v-btn>
			<v-btn small icon v-show="isAllowedOperation & 8" @click="onMove(false)">
				<v-icon color="primary">arrow_downward</v-icon>
			</v-btn>
			<v-btn small icon v-show="isAllowedOperation & 16" @click="onMoveIn">
				<v-icon color="primary">arrow_forward</v-icon>
			</v-btn>
			<v-btn small icon v-show="isAllowedOperation & 32" @click="onMoveOut">
				<v-icon color="primary">arrow_back</v-icon>
			</v-btn>
			<div style="margin: auto;">
				<p style="margin: auto;">Me tasks</p>
			</div>
		</div>
		<v-divider class="ma-0"></v-divider>
		<div class="tasks-list-body">
			<vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="list_id">
				<draggable v-model="items"
					:options="getDraggableOptions()"
					@start="onDragStart"
					@end="onDrop"
					v-bind:data-parent_id="0">
					<div v-for="(item, index) in items"
						:key="item.task_id"
						v-bind:data-task_id="item.task_id"
						v-bind:data-parent_id="(item.parent) ? item.parent.task_id : 0">
						<TaskItem :list_id="list_id" :item="item" ></TaskItem>
					</div>
				</draggable>
				<infinite-loading @infinite="infiniteHandler" ref="infLoadingTasksList"></infinite-loading>
			</vue-perfect-scrollbar>
		</div> <!-- tasks-list-body -->
	</div> <!-- tasks-list -->
</template>

<script>
import TaskItem from '../items/TaskItem.vue'
import VuePerfectScrollbar from '../../Perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'
import { recursiveFind } from '../../../util/helpers'

import draggable from 'vuedraggable'

export default {
	name: 'tasks-list',
	components: {
		TaskItem,
		VuePerfectScrollbar,
		InfiniteLoading,
		draggable
	},
	props: {
		list_id: {
			type: String,
			required: true
		}
	},
	data: () => ({
		searchText: '',
		scrollSettings: {
			maxScrollLength: 10
		},
		countEl: 0, //pass to load data
		blocked: false,
		showActiveTasksList: false //shows selected user list, my or all. Its for animation
	}),
	computed: {
		items: {
			get() {
				return this.$store.getters.tasksList(this.list_id)
			},
			set(value) {}
		},
		selectedList() {
			const activeList = this.$store.state.listOfList.find(el => el.list_id === this.list_id)
			return (activeList.selectedList) ? 'primary' : ''
		},
		/* 1 - add subtask    000001
			 2 - delete task    000010
			 4 - move up        000100
			 8 - move down      001000
			 16 - move in task  010000
			 32 - move out task 100000
		*/
		isAllowedOperation() {
			let result = 0
			const activeList = this.$store.state.listOfList.find(el => el.list_id === this.list_id)

			if (activeList.selectedItem) {
				result += 2

				function recurr(list, task_id) {
					let res = 0

					for (let i = 0; i < list.length; i++) {
						if (list[i].task_id === task_id) {
							if (list[i].level === 1) {
								res += 1

								if (i > 1 && !list[i-1].isDivider) res += 4
								if (i < list.length && i < list.length - 1 && !list[i+1].isDivider) res += 8
							} else if (list[i].level > 1 && list[i].level < 3) {
								res += 1

								if (i > 0) res += 4
								if (i < list.length - 1) res += 8
							}

							if (i > 0 && !list[i - 1].isDivider & list[i].level < 3) {
								if (list[i].level + (list[i].depth - 1) < 3) res += 16
							}
							if (list[i].level > 1) res += 32
						} else if (list[i].children && list[i].children.length > 0) {
							res = recurr(list[i].children, task_id)
						}

						if (res) break
					}

					return res
				}

				result = result + recurr(activeList.list, activeList.selectedItem)
			}

			return result
		}
	},
  methods: {
		getDraggableOptions: function() {
			return { group:this.list_id, handle:'.task-handle' }
		},
		onSelectList: function() {
			this.$store.commit('SET_ACTIVE_LIST', { list_id: this.list_id })
		},
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
    onDragStart: function(dragResult) {
			const { item } = dragResult

			this.$store.commit('SET_ACTIVE_TASK', { list_id: this.list_id, task_id: Number.parseInt(item.dataset.task_id, 10) })
		},
		onDrop: function(dropResult) {
			const { newIndex, oldIndex, from, to } = dropResult

			if (from.dataset.parent_id === to.dataset.parent_id) {
				if (oldIndex === newIndex) {
					return
				}
			}

			this.$store.dispatch('REORDER_TASKS', {
				oldIndex: oldIndex,
				newIndex: newIndex,
				fromParent_id: Number.parseInt(from.dataset.parent_id, 10),
				toParent_id: Number.parseInt(to.dataset.parent_id, 10),
				list_id: this.list_id })
			.then((res) => {
				console.log('reordering list')
			})
			.catch((err) => {
				console.warn(err)
			})
		},
		onMoveIn: function() {
			const activeList = this.$store.state.listOfList.find(el => el.list_id === this.list_id)
			if (activeList.selectedItem) {
				let toParent_id
				const { index, element } = recursiveFind(activeList.list, el => el.isActive)
				if (element.parent === null) {
					toParent_id = activeList.list[index - 1].task_id
				} else {
					if (element.parent.children && element.parent.children.length > 1) {
						toParent_id = element.parent.children[index - 1].task_id
					}
				}

				const options = {
					oldIndex: index,
					newIndex: 0,
					fromParent_id: (element.parent) ? element.parent.task_id : null,
					toParent_id: toParent_id,
					list_id: this.list_id
				}

				if (Array.isArray(element.children) && element.children.length > 0) {
					this.$store.dispatch('REORDER_TASKS', options)
				} else {
					this.$store.dispatch('FETCH_TASKS', { list_id: this.list_id, parent_id: toParent_id })
					.then((count) => {
						this.$store.dispatch('REORDER_TASKS', options)
					})
					.catch((err) => {
						console.warn(err)
					})
				}
			}
		},
		onMoveOut: function() {
			//debugger
			const activeList = this.$store.state.listOfList.find(el => el.list_id === this.list_id)
			if (activeList.selectedItem) {
				let toParent,	lastParentIndex
				const { index, element } = recursiveFind(activeList.list, el => el.isActive)
				if (element.parent !== null) {
					toParent = element.parent.parent

					if (toParent === null) {
						lastParentIndex = recursiveFind(activeList.list, el => el.task_id === element.parent.task_id).index
						if (lastParentIndex < activeList.list.length) lastParentIndex++
					} else {
						lastParentIndex = recursiveFind(toParent.children, el => el.task_id === element.parent.task_id).index
						if (lastParentIndex < toParent.children.length) lastParentIndex++
					}
				} else {
					return
				}

				this.$store.dispatch('REORDER_TASKS', {
					oldIndex: index,
					newIndex: lastParentIndex,
					fromParent_id: (element.parent) ? element.parent.task_id : 0,
					toParent_id: (toParent) ? toParent.task_id : 0,
					move_out: true,
					list_id: this.list_id
				})
				.then((res) => {
					console.log('move out')
				})
				.catch((err) => {
					console.warn(err)
				})
			}
		},
		onMove: function(UP = true) {
			const activeList = this.$store.state.listOfList.find(el => el.list_id === this.list_id)
			if (activeList.selectedItem) {
				let newIndex
				const { index, element } = recursiveFind(activeList.list, el => el.isActive)

				/* Выбор новой позиции для перемещаемого элемента, перемещаем вверх/вниз, из-за наличия
					divider на первом уровне, логика для первого и вложенного уровней различна */
				newIndex = index
				if (element.parent === null) {
					/* divider в списке является разделителем групп, если наткнулись на разделитель выше,
						значит достигнуто начало списка и элемент по кругу необходимо переместить в конец
						списка, для этого прокрутим список назад до конца или следующего разделителя */
					if (UP && index > 0 && activeList.list[index - 1].isDivider) {
						/* бежим вниз до границы */
						for (let i = index; i < activeList.list.length; i++) {
							if (activeList.list[i].isDivider) break

							newIndex = i
						}
					} else if ( (!UP) && ( (index === activeList.list.length)
														  || (index < activeList.list.length && activeList.list[index + 1].isDivider))) {
						/* перемещаемся на позицию ниже, если достигли конца списка или достигли divider
							необходимо переместить элемент по кругу в начало divider этой группы
							бежим вверх по списку, пока не обнаружим начало */
						for (let i = index; i >= 0; i--) {
							if (activeList.list[i].isDivider) break

							newIndex = i
						}
					} else {
						/* свободно двигаемся на позицию выше / ниже*/
						newIndex = (UP) ? index - 1 : index + 1
					}
				} else {
					/* вложенные уровни не содержат divider поэтому элементы сортируются в порядке группы
						иная группа у следующего элемента свидетельствует об окончании пределов перемещения
						текущего элемента */
					if ( (UP)	&& ( (index === 0)
											|| (element.parent.children.length > 0 && element.parent.children[index - 1].group_id !== element.group_id))) {
						/* бежим вниз до границы */
						for (let i = index; i < element.parent.children.length; i++) {
							if (element.parent.children[i].group_id !== element.group_id) break

							newIndex = i
						}
					} else if ( (!UP) && ( (index === element.parent.children.length)
															|| (index < element.parent.children.length && element.parent.children[index + 1].group_id !== element.group_id))) {
						/* бежим вверх пока не обнаружим начало */
						for (let i = index; i >= 0; i--) {
							if (element.parent.children[i].group_id !== element.group_id) break

							newIndex = i
						}
					} else {
						/* свободно двигаемся на позицию выше / ниже */
						newIndex = (UP) ? index - 1 : index + 1
					}
				}

				/* нет смысла перемещать элемент у которого не изменилась позиция */
				if (newIndex === index) return

				/* передаем хранилищу смещение элемента */
				this.$store.dispatch('REORDER_TASKS', {
					oldIndex: index,
					newIndex: newIndex,
					fromParent_id: (element.parent) ? element.parent.task_id : 0,
					toParent_id: (element.parent) ? element.parent.task_id : 0,
					list_id: this.list_id
				})
			}
		},
		onAddItem(isSubelement = false) {
			this.$store.dispatch('CREATE_ELEMENT', { list_id: this.list_id, isSubelement, isStart: true })
		},
		onDeleteItem() {
			this.$store.dispatch('DELETE_ELEMENT', { list_id: this.list_id })
		},
		infiniteHandler($state) {
			if (this.countEl == 0) {
				this.countEl++
				console.log(`1** infiniteHandler fetch tasks CNT: ${this.countEl}`)
				return this.$store.dispatch('FETCH_TASKS', { list_id: this.list_id }).then((count) => {
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
	box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
  /* border-radius: 2px;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
  display: block;
  position: relative;
	text-decoration: none; */
	min-width: 550;
  transition: .3s cubic-bezier(.25,.8,.5,1);
}

.task-list-header {
	display: flex;
}

.tasks-list-body {
	padding: 1px;
	margin: 0px;
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

.smooth-dnd-container.vertical > .smooth-dnd-draggable-wrapper {
  overflow: visible;
}
</style>

<style lang="stylus">
	.drawer-menu--scroll
		height: calc(70vh)
		overflow: auto
</style>
