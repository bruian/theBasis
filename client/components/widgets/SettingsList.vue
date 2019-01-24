<template>
	<div class="settings-list">
		<div class="settings-list-header">
			<v-btn small icon @click="onCreate">
				<v-icon color="primary">add_circle</v-icon>
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
		</div>

		<div class="settigs-list-body">
			<vue-perfect-scrollbar class="settings-list--scroll"
				:settings="scrollSettings"
				ref="scrollId"
			>
				<ul style="all: unset;">
					<li style="all: unset;" v-for="sheet in value" :key="sheet.sheet_id">
						<div class="item-container">
							<div class="item-body" v-bind:class="{'active': (selectedItem === sheet.sheet_id)}"
								@click="onItemClick(sheet.id, sheet.sheet_id)"
							>
								<div class="item-clmn1">
									<v-icon>{{sheet.icon}}</v-icon>
								</div>

								<div class="item-clmn2">
									<input class="item-input"
										type="text"
										v-model="sheet.name"
										@change="onNameChange($event, sheet.sheet_id)"
									></input>
								</div>

								<v-btn flat small icon class="item-clmn3"
									:color="isVisibleColor(sheet.visible)"
									@click="onVisibleChange(sheet.sheet_id, sheet.visible)"
								>
									<v-icon>visibility</v-icon>
								</v-btn>

								<v-menu
									bottom
									left
									transition="scale-transition"
								>
									<v-btn slot="activator" flat small icon color="primary" class="item-clmn3">
										{{(sheet.layout === 1) ? "one" : "two" }}
									</v-btn>

									<v-list>
										<v-list-tile
											v-for="(enumLayout, index) in enumLayouts"
											:key="index"
											@click="onLayoutChange(sheet.sheet_id, index)"
										>
											<v-list-tile-title>{{ enumLayout }}</v-list-tile-title>
										</v-list-tile>
									</v-list>
								</v-menu>
							</div>
						</div>
					</li>
				</ul>
			</vue-perfect-scrollbar>
		</div>

		<v-dialog v-model="createDialog" max-width="500px">
			<v-card>
				<v-card-title>
					New sheet
				</v-card-title>

				<v-card-text>
					<v-text-field
            label="Sheet name"
						v-model="createdName"
          ></v-text-field>

					<v-select
						:items="enumTypeEl"
						label="Select component"
						item-value="text"
						v-model="createdTypeEl"
					></v-select>

					<v-select
						:items="enumLayouts"
						label="Select layout"
						item-value="text"
						v-model="createdLayout"
					></v-select>

					<v-switch
						label="Visible"
						v-model="createdVisible"
					></v-switch>
				</v-card-text>

				<v-card-actions>
					<v-btn color="secondary" flat @click="createDialog=false">Close</v-btn>
					<v-btn color="primary" flat @click="onCreateItem">Create</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
import VuePerfectScrollbar from '../Perfect-scrollbar.vue'

export default {
	name: 'settings-list',
	components: {
		VuePerfectScrollbar
	},
	props: {
		value: {
			type: Array,
			default: []
		},
		enumLayouts: {
			type: Array,
			default: function () {
				return ['One', 'Two']
			}
		},
		enumTypeEl: {
			type: Array,
			default: function () {
				return ['Tasks', 'Groups', 'Users']
			}
		}
	},
	data: () => ({
		scrollSettings: {
			maxScrollLength: 10
		},
		selectedItem: null,
		selectedSheet_id: null,
		scrollId: "settings-list",
		createDialog: false,
		createdName: '',
		createdTypeEl: '',
		createdLayout: '',
		createdVisible: true
	}),
	computed: {
		/*
			1 - create 	  000001
			2 - delete    000010
			4 - move up   000100
			8 - move down 001000
		*/
		isAllowedOperation() {
			let result = 0
			if (this.selectedItem) {
				result += 2
				if (this.selectedItem > 1) result += 4
				if (this.selectedItem < this.value.length) result += 8
			}

			return result
		}
	},
	methods: {
		isVisibleColor(visible) {
			return (visible) ? "primary" : "#6c757d"
		},
		onCreate() {
			this.createDialog = true
		},
		onCreateItem() {
			let type_el
			switch (this.createdTypeEl) {
				case 'Tasks':
					type_el = 4
					break
				case 'Groups':
					type_el = 8
					break
				case 'Users':
					type_el = 16
					break
			}

			const createdLayout = this.enumLayouts.findIndex(el => el === this.createdLayout) + 1
			const createdSheet = { 'type_el': type_el, 'layout': createdLayout,
				'name': this.createdName, 'visible': this.createdVisible }

			this.createDialog = false
			this.$emit('onCreate', createdSheet)
		},
		onDeleteItem() {
			this.$emit('onDelete', { index: this.selectedItem, id: this.selectedSheet_id })
		},
		onMove: function(UP = true) {
			this.$emit('onMove', { index: this.selectedItem - 1, UP })
		},
		onItemClick: function(index, id) {
			this.selectedItem = index
			this.selectedSheet_id = id
			this.$emit('onSelect', { index, id })
		},
		onNameChange(e, id) {
			this.$emit('input', { 'id': id, 'field': 'name', 'value': e.target.value })
		},
		onVisibleChange(id, value) {
			this.$emit('input', { 'id': id, 'field': 'visible', 'value': !value })
		},
		onLayoutChange(id, index) {
			this.$emit('input', { 'id': id, 'field': 'layout', 'value': index + 1 })
		}
	}
}
</script>

<style scoped lang="css">
	.settings-list {
		box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
		transition: .3s cubic-bezier(.25,.8,.5,1);
	}

	.settings-list-header {
		display: flex;
	}

	.settings-list-body {
		padding: 1px;
		margin: 0px;
	}

	.settings-list--scroll {
		max-height: 300px;
		overflow: auto;
	}

	.item-container {
		display: flex;
		flex-direction: column;
		max-width: 100%;
  	margin-bottom: 0.1em;
	}

	.item-selected {
		box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2),
		/*-13px 0 15px -15px rgba(0, 0, 0, .7),
		13px 0 15px -15px rgba(0, 0, 0, .7),*/
		0 0 40px rgba(0, 0, 0, .1) inset
	}

	.item-body {
		margin-bottom: .3em;
		margin-right: 0.3em;
		margin-left: 0.3em;
		padding-left: 0.2em;
		padding-right: 0.3em;
		display: flex;
		flex-flow: row nowrap;
		background-color: #f8f9fa;
		box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2);
	}

	.item-body:hover,
	.item-body:focus,
	.item-body:active {
		box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, .2),
		13px 0 15px -15px rgba(0, 0, 0, .7),
		13px 0 15px -15px rgba(0, 0, 0, .7),
		0 0 40px rgba(0, 0, 0, .1) inset
	}

	.item-clmn1 {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		min-width: 20px;
		margin-top: auto;
		margin-bottom: 8px;
		margin-right: 3px;
	}

	.item-clmn1.v-btn--floating.v-btn--small {
		height: 25px;
		width: 25px;
		margin: 3px 4px;
		outline: none;
	}

	.item-clmn2 {
		display: flex;
		align-items: center;
		flex: 4 4 40px;
	}

	.item-clmn3.v-btn--icon.v-btn--small {
		height: 25px;
		width: 25px;
		margin: 3px 4px;
		outline: none;
	}

	.item-input {
		flex: 1 1;
	}

	.gray {
		color: #6c757d;
	}
</style>
