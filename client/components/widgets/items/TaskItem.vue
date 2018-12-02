<template>
	<div>
		<div class="task-body"
			v-bind:class="{ active: item.isActive }"
			@click="taskBodyClick(item.task_id)">
			<div v-handle v-bind:class="{ 'task-handle': true, 'task-handle-active': item.isActive }"></div>
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

				<v-menu
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
				</v-menu>

				<!-- <a style="margin-bottom: 2px">more</a> -->
			</div>

			<div class="task-clmn3">
				<ItmTextArea
					placeholder="Task name"
					v-model="item.name"
					:min-height="21"
					:max-height="84">
				</ItmTextArea>

				<!-- <v-flex class="ma-0" style="padding:1px;"> -->
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
				<!-- </v-flex> -->
			</div>

			<div class="task-clmn4">
				<v-tooltip bottom >
					<div slot="activator" class="task-duration">{{ getDuration(item.duration) }}</div>
					<span>Время затрачено</span>
				</v-tooltip>

				<div class="task-id">id: {{ item.tid }}</div>

				<v-icon @click="expandIcoClick(item)" class="expand-ico"
					slot="activator"
					color="primary"
					dark
				>{{ (item.isExpanded) ? "keyboard_arrow_up" : "keyboard_arrow_down" }}</v-icon>

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
	</div>
</template>

<script>
import Treeselect from '@riophae/vue-treeselect'
import ItmTextArea from '../ItmTextArea.vue'
import TagsInput from '../../VoerroTagsInput/VoerroTagsInput.vue'
import { HandleDirective } from 'vue-slicksort'

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
		Treeselect,
		TagsInput,
		ItmTextArea
	},
	directives: { handle: HandleDirective },
	props: {
		item: {
			type: Object,
			default: () => { return {} }
		}
	},
	data: () => ({
		// item: {},
		direction: 'right',
		hover: false,
		transition: 'slide-x-transition',
		moreMenu: [
			{ title: 'Add subtask' },
			{ title: 'Collapse subtask' }
		],
		groupChangeStart: false
	}),
	computed: {
		mainGroupsMini() { return this.$store.state.mainGroupsMini }
	},
	watch: {
		// value() {
		// 	this.item = this.value
		// }
	},
	methods: {
		onGroupOpen: function(instanceId) {
			this.groupChangeStart = true
		},
		onGroupInput: function(value, instanceId) {
			if (this.groupChangeStart) {
				this.$store.commit('UPDATE_VALUES_TASK',
					{ task_id: this.$store.state.theTask.task_id,
						group_id: value,
						reorder: true
				})
				this.groupChangeStart = false
			}
		},
		taskBodyClick: function(task_id) {
			this.$store.commit('SET_ACTIVE_TASK', { task_id: task_id })
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
		expandIcoClick(item) {
			console.log('fireddd')
			this.$store.commit('UPDATE_VALUES_TASK', { task_id: item.task_id, isExpanded: !item.isExpanded })
		}
		// getContext(id) {
		// 	let thisContext = this.$store.getters.context(id)
		// 	return thisContext
		// },
	}
}
</script>

<style lang="css">
.task-body {
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
</style>
