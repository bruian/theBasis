<template>
	<div id="panelSettings">
		<v-toolbar color="primary" dark>
			<v-toolbar-title>
				Sheets layout
			</v-toolbar-title>
		</v-toolbar>

		<v-container pa-2>
			<v-layout column>
				<v-flex>
					<v-subheader class="px-1 my-1">
						Раскладка
					</v-subheader>

					<v-radio-group v-model="layout" row class="mt-1">
						<v-radio label="One" value="1"></v-radio>
						<v-radio label="Two" value="2"></v-radio>
					</v-radio-group>

					<v-subheader class="px-1 my-1">
						Sheets
					</v-subheader>

					<settings-list
						v-model="sheets"
						@onCreate="onCreateSheet"
						@onDelete="onDeleteSheet"
						@onMove="onMoveSheet"
					></settings-list>
				</v-flex>
			</v-layout>
		</v-container>
	</div>
</template>

<script>
import SettingsList from './Widgets/SettingsList.vue'

export default {
	name: 'panel-settings',
	components: {
		SettingsList
	},
  data () {
    return {
    }
  },
  computed: {
		layout: {
			get() {
				return this.$store.state.layout.toString()
			},
			set(value) {
				this.$store.commit('SET_LAYOUT', value)
			}
		},
		sheets: {
			get() {
				return this.$store.state.mainSheets
			},
			set(value) {
				this.$store.dispatch('UPDATE_MAIN_SHEETS_VALUES', value)
				.catch((err) => {	console.warn(err)	})
			}
		}
	},
	methods: {
		onCreateSheet: function (sheet) {
			this.$store.dispatch('CREATE_SHEET_ELEMENT', sheet)
			.catch((err) => { console.warn(err) })
		},
		onDeleteSheet: function (sheet) {
			this.$store.dispatch('DELETE_SHEET_ELEMENT', { id: sheet.id })
			.catch((err) => { console.warn(err) })
		},
		onMoveSheet: function (sheet) {
			this.$store.commit('MOVE_SHEET_ELEMENT', sheet)
		}
	}
}
</script>

<style lang="css" scoped>
</style>
