<template>
	<div class="task-container">
		<div class="task-divider-body" v-if="item.isDivider">
			<div class="task-divider-clmn1">
				<p>id: {{ item.group_id }} | Группа: {{ item.name }}</p>
			</div>
		</div>

		<div v-bind:class="classObject"
			v-if="!item.isDivider && item.isShowed"
			@click="onBodyClick">
			<div v-bind:class="{ 'task-handle': true, 'task-handle-active': item.isActive }"
				@mousedown="dragHandleDown"
				@mouseup="dragHandleUp"></div>
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
				<v-tooltip bottom class="task-status">
					<v-icon
						slot="activator"
					>play_arrow</v-icon>
					<span>Начато</span>
				</v-tooltip>

				<v-icon @click="onExpandSubtasks()" v-show="item.havechild" class="expand-ico"
					slot="activator"
					color="primary"
					dark
				>{{ (item.isSubtaskExpanded > 1) ? "expand_less" : "expand_more" }}</v-icon>

				<!-- <v-menu
					bottom
					origin="center center"
					transition="scale-transition"
				>
					<v-icon
						slot="activator"
						color="primary"
					>more_horiz</v-icon>

					<v-list>
						<v-list-tile
							v-for="(mmitem, i) in moreMenu"
							:key="i"
							@click=""
						>
							<v-list-tile-title>{{ mmitem.title }}</v-list-tile-title>
						</v-list-tile>
					</v-list>
				</v-menu> -->

				<!-- <a style="margin-bottom: 2px">more</a> -->
			</div>

			<div class="task-clmn3">
				<ItmTextArea
					placeholder="Task name"
					v-model="item.name"
					:min-height="21"
					:max-height="84">
				</ItmTextArea>

				<TagsInput :element-id="'#'+item.tid"
					v-model="item.context"
					:existing-tags="{
						'web-development': 'Web Development',
						'php': 'PHP',
						'javascript': 'JavaScript',
					}"
					:typeahead="true"
					:placeholder="'Add a context'">
				</TagsInput>
			</div>

			<div class="task-clmn4">
				<v-tooltip bottom >
					<div slot="activator" class="task-duration">{{ getDuration(item.duration) }}</div>
					<span>Время затрачено</span>
				</v-tooltip>

				<div class="task-id">id: {{ item.tid }}</div>

				<v-icon @click="onExpandMore(item)" class="expand-ico"
					slot="activator"
					color="primary"
					dark
				>{{ (item.isExpanded) ? "unfold_less" : "unfold_more" }}</v-icon>
				<treeselect v-model="item.group_id"
					placeholder="Group"
					:clearable="false"
					:multiple="false"
					:options="mainGroupsMini"
					@open="onGroupOpen"
					@input="onGroupInput" />
			</div>
		</div> <!-- task-body -->

		<div class="task-expander" v-show="item.isExpanded">
			<v-textarea style="padding-left: 6px; padding-right: 6px; margin-bottom: 2px;"
				hide-details
				no-resize
				clearable
				rows="3"
				counter
				name="input-7-1"
				label="Примечание"
				v-model="item.note"
				placeholder="Введите сюда любую сопутствующую задаче текстовую информацию"></v-textarea>
		</div>

		<Container v-if="(item.isSubtaskExpanded > 1)"
			drag-handle-selector=".task-handle"
			group-name="1"
			:get-child-payload="itemIndex => getChildPayload(itemIndex, item.level + 1)"
			@drag-start="onDragStart"
			@drop="onDrop">
			<Draggable v-for="(children, index) in item.children"	:key="children.task_id">
				<TaskItem :list_id="list_id" :item="children" ></TaskItem>
			</Draggable>
		</Container>
	</div>
</template>

<script>
import Treeselect from '@riophae/vue-treeselect'
import ItmTextArea from '../ItmTextArea.vue'
import TagsInput from '../../VoerroTagsInput/VoerroTagsInput.vue'
import { recursiveFind } from '../../../util/helpers.js'

import { Container, Draggable } from 'vue-smooth-dnd'

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
	name: 'task-item',
	components: {
		TaskItem: () => import('./TaskItem.vue'),
		Treeselect,
		TagsInput,
		ItmTextArea,
		Container,
		Draggable
	},
	props: ['item', 'list_id'],
	// props: {
	// 	item: {
	// 		type: Object,
	// 		default: () => { return {} }
	// 	}
	// },
	data: () => ({
		direction: 'right',
		hover: false,
		transition: 'slide-x-transition',
		moreMenu: [
			{ title: 'Add subtask' },
			{ title: 'Collapse subtask' }
		],
		groupChangeStart: false,
		wasSubtaskExpanded: false
	}),
	computed: {
		mainGroupsMini() { return this.$store.state.mainGroupsMini },
		classObject() {
			const classObj = {
				'task-body': true,
				'task-level-2': false,
				'task-level-3': false,
				active: this.item.isActive
			}

			if (this.item.level === 2) {
				classObj['task-level-2'] = true
			} else if (this.item.level === 3) {
				classObj['task-level-3'] = true
			}

			return classObj
		}
	},
	watch: {
		// value() {
		// 	this.item = this.value
		// }
	},
	methods: {
		getChildPayload: function(itemIndex, level) {
      return { index: itemIndex, level, fromParent: this.item.task_id }
    },
    onDragStart: function(dragResult) {
			const { isSource, payload, willAcceptDrop } = dragResult

			if (this.item.children) {
				const task_id = this.item.children[payload.index].task_id
				this.$store.commit('SET_ACTIVE_TASK', { list_id: this.list_id, task_id: task_id })
			}
		},
		onDrop: function(dropResult) {
			const { removedIndex, addedIndex, payload, element } = dropResult

			if (removedIndex !== addedIndex & addedIndex > 0) {
				this.$store.dispatch('REORDER_TASKS', {
					oldIndex: removedIndex,
					newIndex: addedIndex,
					fromParent: payload.fromParent,
					toParent: this.item.task_id,
					list_id: this.list_id })
				.then((res) => {
					console.log('reordering')
				})
				.catch((err) => {
					console.err(err)
				})
			}
		},
		dragHandleDown: function() {
			if (this.item.isSubtaskExpanded > 1) {
				this.item.isSubtaskExpanded = 1
				//this.wasSubtaskExpanded = true
			}
		},
		dragHandleUp: function() {
			console.log('dragHandleUp')

			if (this.item.isSubtaskExpanded === 1) {
				this.item.isSubtaskExpanded = 2
				//this.wasSubtaskExpanded = false
			}
		},
		onGroupOpen: function(instanceId) {
			this.groupChangeStart = true
		},
		onGroupInput: function(value, instanceId) {
			//on default this event fired twice
			if (this.groupChangeStart) {
				//our need catch event only first time
				this.$store.commit('UPDATE_TASK_VALUES', {
					list_id: this.list_id,
					task_id: this.item.task_id,
					group_id: value,
					reorder: true
				})
				this.groupChangeStart = false
			}
		},
		onBodyClick: function() {
			this.$store.commit('SET_ACTIVE_TASK', { list_id: this.list_id, task_id: this.item.task_id })
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
		},
		onExpandMore() {
			console.log(`onExpandMore taskId !{ this.item.task_id }`)
			this.$store.commit('UPDATE_TASK_VALUES', { list_id: this.list_id, task_id: this.item.task_id, isExpanded: !this.item.isExpanded })
		},
		onExpandSubtasks() {
			console.log(`onExpandSubtasks taskId !{ this.item.task_id }`)

			if (Array.isArray(this.item.children) && this.item.children.length > 0) {
				this.$store.commit('UPDATE_TASK_VALUES', { list_id: this.list_id, task_id: this.item.task_id, isSubtaskExpanded: ((this.item.isSubtaskExpanded > 1) ? 0 : 2) })
			} else {
				return this.$store.dispatch('FETCH_TASKS', { list_id: this.list_id, parent_id: this.item.task_id }).
				then((count) => {
					//debugger
					this.$store.commit('UPDATE_TASK_VALUES', { list_id: this.list_id, task_id: this.item.task_id, isSubtaskExpanded: ((this.item.isSubtaskExpanded > 1) ? 0 : 2) })
					console.log('Subtasks fetched')
				})
				.catch((err) => {
					console.warn(err)
				})
			}
		}
		// getContext(id) {
		// 	let thisContext = this.$store.getters.context(id)
		// 	return thisContext
		// },
	}
}
</script>

<style lang="css">
.task-container {
	/* padding: 1em; */
	/* width: 100%; */
	display: flex;
	flex-direction: column;
	max-width: 100%;
  margin-bottom: 0.1em;
}

.task-body {
	margin-top: 0.3em;
	margin-right: 0.3em;
	margin-left: 0.3em;
	display: flex;
	flex-flow: row nowrap;
	background-color: #f8f9fa;
	box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2);
}

.task-body:hover,
.task-body:focus,
.task-body:active {
	box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2),
	/*-13px 0 15px -15px rgba(0, 0, 0, .7),
	13px 0 15px -15px rgba(0, 0, 0, .7),*/
	0 0 40px rgba(0, 0, 0, .1) inset
}

.active {
	box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2),
	/*-13px 0 15px -15px rgba(0, 0, 0, .7),
	13px 0 15px -15px rgba(0, 0, 0, .7),*/
	0 0 40px rgba(0, 0, 0, .1) inset
}

.task-handle {
  content: '...';
  width: 10px;
	max-width: 10px;
  /* height: 20px; */
  /* display: inline-block; */
  overflow: hidden;
  line-height: 5px;
  /* padding: 3px 4px; */
  cursor: move;
  /* vertical-align: middle; */
  /* margin-top: -.7em; */
  margin-left: .2em;
  font-size: 12px;
  font-family: sans-serif;
  letter-spacing: 2px;
  color: #cccccc;
  text-shadow: 1px 0 1px black;
}
.task-handle::after {
  content: '.. .. .. ..';
}
.task-handle-active {
	color: blue;
}
.task-handle-active::after {
	content: '.. .. .. .. .. ..'
}

.task-clmn1 {
	/* display: flex; */
	/* justify-content: space-between; */
	/* padding: 1px; */
	/* margin: 0px; */
	align-self: flex-start;
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
  justify-content: space-between;
	align-items: center;

	margin: 2px 2px 2px 0px;
}

.task-clmn3 {
  flex: 1 1 auto;
	margin: 2px 1px 1px 1px;
}

.task-clmn4 {
	width: 120px;
	margin: 1px 2px 2px 1px;
	display: flex;
	flex-flow: row wrap;
	align-content: space-between;
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

.task-level-2 {
	margin-left: 8px;
}

.task-level-3 {
	margin-left: 12px;
}

.task-duration {
	font-size: 12px;
	padding-top: 2px;
	padding-left: 1px;
}

.task-status .v-icon {
	/* color: #007bff; */
	color: #5dc282;
	font-size: 1.1rem;
}

.task-id {
	flex: 2;
	font-size: 0.9rem;
	font-size: 12px;
	padding-top: 2px;
	padding-left: 3px;
	text-align: center;
}

.expand-ico {
	flex: 1;
	text-align: right;
}

.vue-treeselect__control {
	height: 25px;
	padding-left: 1px;
	padding-right: 1px;
	border-radius: 3px;
}

.vue-treeselect__placeholder,
.vue-treeselect__single-value {
	font-size: 11px;
	line-height: 25px;
	padding-left: 2px;
	padding-right: 2px;
}

.vue-treeselect--searchable
.vue-treeselect__input-container {
	font-size: 11px;
  padding-left: 2px;
  padding-right: 2px;
}

.task-divider-body {
	margin-top: .2em;
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
