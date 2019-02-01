<template>
	<div id="sheetManager">
		<v-toolbar color="primary" dark>
			<v-toolbar-title>
				Sheet manage
			</v-toolbar-title>
		</v-toolbar>

		<v-container pa-2>
			<v-layout column>
				<v-flex>
					<p style="margin-bottom: 2px;">Группа</p>
					<treeselect v-model="group_id"
						placeholder="Groups"
						:clearable="false"
						:multiple="false"
						:options="mainGroupsMini" />

					<p style="margin-top: 10px; margin-bottom: 2px;">Пользователь</p>
					<treeselect v-model="user_id"
						placeholder="Users"
						:clearable="false"
						:multiple="false"
						:options="mainUsersMini"
						@open="onUsersOpen"
						@input="onUsersInput" />
				</v-flex>
			</v-layout>
		</v-container>
	</div>
</template>

<script>
import Treeselect from '@riophae/vue-treeselect'

export default {
	name: 'sheet-manager',
	components: {
		Treeselect,
	},
  data () {
    return {
			user_id: 1,
			userChangeStart: false,
    }
  },
  computed: {
		group_id: {
			get () {
				if (this.$store.state.selectedSheet) {
					return this.$store.state.selectedSheet.condition.group_id
				}

				return null
			},
			set (value) {
				this.$store.dispatch('UPDATE_SHEETS_VALUES', {
					sheet_id: this.$store.state.selectedSheet.sheet_id,
					field: 'condition',
					value: {
						group_id: value
					}
				})
			}
		},
		mainGroupsMini() { return this.$store.state.mainGroupsMini },
		mainUsersMini() { return this.$store.state.mainUsersMini },
	},
	methods: {
		onUsersOpen: function () {
			this.userChangeStart = true
		},
		onUsersInput: function () {
			if (this.userChangeStart) {
				this.userChangeStart = false
			}
		},
	}
}
</script>
