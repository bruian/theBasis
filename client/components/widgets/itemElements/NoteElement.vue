<template>
	<v-textarea class="note-element"
		hide-details
		no-resize
		clearable
		rows="3"
		name="input-7-1"
		label="Примечание"
		v-model="item.note"
		@change="onNoteChange"
		append-icon="done"
		@click:append="onNoteChange"
		placeholder="Введите сюда любую сопутствующую задаче текстовую информацию">
	</v-textarea>
</template>

<script>
export default {
	props: ['item', 'sheet_id'],
	data: () => ({
		prevNote: '',
	}),
	created: function () {
		this.prevNote = this.item.note
	},
	methods: {
		onNoteChange: function () {
			if (this.prevNote !== this.item.note) {
				this.$store.dispatch('UPDATE_TASK_VALUES', {
					sheet_id: this.sheet_id,
					task_id: this.item.task_id,
					note: this.item.note
				})
				.then((res) => {
					this.prevNote = this.item.note
				})
				.catch((err) => { console.warn(err) })
			}
		},
	}
}
</script>

<style lang="css">
	.note-element {
		padding-left: 6px;
		padding-right: 6px;
		margin-bottom: 2px;
	}
</style>
