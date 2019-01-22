<template>
	<div class="tasks-sheet">
		<div class="task-sheet-header">
			<v-icon style="cursor: pointer;"
				v-bind:color="selectedSheet"
				@click="onSelectSheet">bookmark</v-icon>

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
				<p style="margin: auto;">{{mainSheet.name}}</p>
			</div>
		</div>

		<v-divider class="ma-0"></v-divider>

		<div class="tasks-sheet-body">
			<vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="sheet_id">
				<draggable v-model="items"
					:options="getDraggableOptions()"
					@start="onDragStart"
					@end="onDrop"
					v-bind:data-parent_id="0"
				>
					<div v-for="(item, index) in items"
						:key="item.task_id"
						v-bind:data-task_id="item.task_id"
						v-bind:data-parent_id="(item.parent) ? item.parent.task_id : 0"
					>
						<TaskItem :sheet_id="sheet_id" :item="item" ></TaskItem>
					</div>
				</draggable>

				<infinite-loading @infinite="infiniteHandler" ref="infLoadingTasksSheet"></infinite-loading>
			</vue-perfect-scrollbar>
		</div> <!-- tasks-sheet-body -->
	</div> <!-- tasks-sheet -->
</template>

<script>
import TaskItem from '../items/TaskItem.vue'
import VuePerfectScrollbar from '../../Perfect-scrollbar.vue'
import InfiniteLoading from '../../InfiniteLoading'
import { recursiveFind } from '../../../util/helpers'

import draggable from 'vuedraggable'

export default {
	name: 'tasks-sheet',
	components: {
		TaskItem,
		VuePerfectScrollbar,
		InfiniteLoading,
		draggable
	},
	props: {
		sheet_id: {
			type: String,
			required: true
		}
	},
	data: () => ({
		thisSheet: null,
		mainSheet: null,
		searchText: '',
		scrollSettings: {
			maxScrollLength: 10
		},
		countEl: 0, //pass to load data
		blocked: false,
		showActiveTasksSheet: false //shows selected user sheet, my or all. Its for animation
	}),
	created() {
		this.thisSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
		this.mainSheet = this.$store.state.mainSheets.find(el => el.sheet_id === this.sheet_id)
	},
	computed: {
		items: {
			get() {
				// return this.$store.getters.tasksSheet(this.sheet_id)
				return this.thisSheet.sheet
			},
			set(value) {}
		},
		selectedSheet() {
			// const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
			return (this.thisSheet.selectedSheet) ? 'primary' : ''
		},
		/*
			1 - add subtask    000001
			2 - delete task    000010
			4 - move up        000100
			8 - move down      001000
			16 - move in task  010000
			32 - move out task 100000
		*/
		isAllowedOperation() {
			let result = 0
			const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)

			if (activeSheet.selectedItem) {
				result += 2

				function recurr(sheet, task_id) {
					let res = 0

					for (let i = 0; i < sheet.length; i++) {
						if (sheet[i].task_id === task_id) {
							if (sheet[i].level === 1) {
								res += 1

								if (i > 1 && !sheet[i-1].isDivider) res += 4
								if (i < sheet.length && i < sheet.length - 1 && !sheet[i+1].isDivider) res += 8
							} else if (sheet[i].level > 1 && sheet[i].level < 3) {
								res += 1

								if (i > 0) res += 4
								if (i < sheet.length - 1) res += 8
							}

							if (i > 0 && !sheet[i - 1].isDivider & sheet[i].level < 3) {
								if (sheet[i].level + (sheet[i].depth - 1) < 3) res += 16
							}
							if (sheet[i].level > 1) res += 32
						} else if (sheet[i].children && sheet[i].children.length > 0) {
							res = recurr(sheet[i].children, task_id)
						}

						if (res) break
					}

					return res
				}

				result = result + recurr(activeSheet.sheet, activeSheet.selectedItem)
			}

			return result
		}
	},
  methods: {
		getDraggableOptions: function() {
			return { group:this.sheet_id, handle:'.task-handle' }
		},
		onSelectSheet: function() {
			this.$store.commit('SET_ACTIVE_SHEET', { sheet_id: this.sheet_id })
		},
		onChange: function(value) {
			console.log('changed searchText: ' + value)
			this.searchText = value
			let that = this

			function que(params) {
				if (that.countEl == 0) {
					that.$refs.infLoadingTasksSheet.$emit('$InfiniteLoading:reset')
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

			this.$store.commit('SET_ACTIVE_TASK', { sheet_id: this.sheet_id, task_id: Number.parseInt(item.dataset.task_id, 10) })
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
				sheet_id: this.sheet_id })
			.then((res) => {
				console.log('reordering sheet')
			})
			.catch((err) => {
				console.warn(err)
			})
		},
		onMoveIn: function() {
			const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
			if (activeSheet.selectedItem) {
				let toParent_id
				const { index, element } = recursiveFind(activeSheet.sheet, el => el.isActive)
				if (element.parent === null) {
					toParent_id = activeSheet.sheet[index - 1].task_id
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
					sheet_id: this.sheet_id
				}

				if (Array.isArray(element.children) && element.children.length > 0) {
					this.$store.dispatch('REORDER_TASKS', options)
				} else {
					this.$store.dispatch('FETCH_TASKS', { sheet_id: this.sheet_id, parent_id: toParent_id })
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
			const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
			if (activeSheet.selectedItem) {
				let toParent,	lastParentIndex
				const { index, element } = recursiveFind(activeSheet.sheet, el => el.isActive)
				if (element.parent !== null) {
					toParent = element.parent.parent

					if (toParent === null) {
						lastParentIndex = recursiveFind(activeSheet.sheet, el => el.task_id === element.parent.task_id).index
						if (lastParentIndex < activeSheet.sheet.length) lastParentIndex++
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
					sheet_id: this.sheet_id
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
			const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
			if (activeSheet.selectedItem) {
				let newIndex
				const { index, element } = recursiveFind(activeSheet.sheet, el => el.isActive)

				/* Выбор новой позиции для перемещаемого элемента, перемещаем вверх/вниз, из-за наличия
					divider на первом уровне, логика для первого и вложенного уровней различна */
				newIndex = index
				if (element.parent === null) {
					/* divider в списке является разделителем групп, если наткнулись на разделитель выше,
						значит достигнуто начало списка и элемент по кругу необходимо переместить в конец
						списка, для этого прокрутим список назад до конца или следующего разделителя */
					if (UP && index > 0 && activeSheet.sheet[index - 1].isDivider) {
						/* бежим вниз до границы */
						for (let i = index; i < activeSheet.sheet.length; i++) {
							if (activeSheet.sheet[i].isDivider) break

							newIndex = i
						}
					} else if ( (!UP) && ( (index === activeSheet.sheet.length)
														  || (index < activeSheet.sheet.length && activeSheet.sheet[index + 1].isDivider))) {
						/* перемещаемся на позицию ниже, если достигли конца списка или достигли divider
							необходимо переместить элемент по кругу в начало divider этой группы
							бежим вверх по списку, пока не обнаружим начало */
						for (let i = index; i >= 0; i--) {
							if (activeSheet.sheet[i].isDivider) break

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
					sheet_id: this.sheet_id
				})
			}
		},
		onAddItem(isSubelement = false) {
			this.$store.dispatch('CREATE_ELEMENT', { sheet_id: this.sheet_id, isSubelement, isStart: true })
		},
		onDeleteItem() {
			this.$store.dispatch('DELETE_ELEMENT', { sheet_id: this.sheet_id }).catch(err => {
				console.log(err)
			})
		},
		infiniteHandler($state) {
			if (this.countEl == 0) {
				this.countEl++
				console.log(`1** infiniteHandler fetch tasks CNT: ${this.countEl}`)
				return this.$store.dispatch('FETCH_TASKS', { sheet_id: this.sheet_id }).then((count) => {
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
			this.$store.commit('SET_ACTIVE_TASKS_SHEET', activeID)
			this.$nextTick(() => {
        this.$refs.infLoadingTasksSheet.$emit('$InfiniteLoading:reset')
      })

			this.showActiveTasksSheet = !this.showActiveTasksSheet
      setTimeout(() => {
        this.showActiveTasksSheet = !this.showActiveTasksSheet
      }, 500)
		}
  }
}
</script>

<style lang="css">
.tasks-sheet {
	box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
  /* border-radius: 2px;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
  display: block;
  position: relative;
	text-decoration: none; */
	/* min-width: 550; */
  transition: .3s cubic-bezier(.25,.8,.5,1);
}

.task-sheet-header {
	display: flex;
}

.tasks-sheet-body {
	padding: 1px;
	margin: 0px;
}

.sheet-header
.v-expansion-panel__header {
  padding: 0px;
}

.sheet-header
.v-expansion-panel__header__icon {
	padding-top: 4px;
	padding-right: 5px;
}

.sheet-header
.search-button {
	padding-top: 4px;
	margin-left: 0px;
	margin-right: 0px;
}

.sheet-header
.v-toolbar__content {
	padding-right: 5px;
}

.sheet-body
.sbx-twitter {
	width: 100%;
}

.sheet-body .main {
	margin-left: 5px;
	margin-right: 5px;
	margin-bottom: 5px;
}

.activebox { /*what is it */
  white-space: nowrap;
  display: flex;
  justify-content: space-between;
}

.activeTasksSheetbox {
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

.smooth-dnd-container.vertical > .smooth-dnd-draggable-wrapper {
  overflow: visible;
}
</style>

<style lang="stylus">
	.drawer-menu--scroll
		height: calc(70vh)
		overflow: auto
</style>
