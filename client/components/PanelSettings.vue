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

					<settings-list v-model="sheets"></settings-list>
				</v-flex>
			</v-layout>
		</v-container>
	</div>
</template>

<script>
import settingsList from './widgets/SettingsList.vue'

export default {
	name: 'panel-settings',
	components: {
		settingsList
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
				console.log(value)
			}
		}
  },
}
</script>

<style lang="css" scoped>
</style>
