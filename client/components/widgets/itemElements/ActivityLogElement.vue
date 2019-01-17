<template>
	<v-list class="activity-log-element" two-line dense>
		<template v-for="(item, index) in items">
			<v-list-tile
				:key="item.id"
				avatar
				@click=""
			>
				<v-list-tile-avatar>
					<img :src="item.avatar">
				</v-list-tile-avatar>

				<v-list-tile-content>
					<v-list-tile-title>#{{item.part}} <b style="color: #4caf50;">{{ statusName(item.status) }}</b> to {{ item.group }} group</v-list-tile-title>
					<v-list-tile-sub-title>
						<b>Interval:</b> {{ startDate(item.start) }} <b>-</b> {{ endDate(item.ends) }}
						<b>Duration:</b> {{ duration(item) }}
					</v-list-tile-sub-title>
				</v-list-tile-content>

				<v-list-tile-action>
					<!-- <v-btn icon ripple> -->
						<v-icon color="success">{{ statusIcon(item.status) }}</v-icon>
					<!-- </v-btn> -->
				</v-list-tile-action>
			</v-list-tile>

			<!-- <v-divider
				dense
				v-if="index + 1 < items.length"
				:key="index"
			></v-divider> -->
		</template>
	</v-list>
</template>

<script>
import { activityStatus } from '../../../util/helpers.js'

export default {
	props: ['item', 'list_id'],
	data: () => ({
		//items: []
	}),
	mounted () {
		//this.items = this.item.activity
	},
	computed: {
		items: {
			get() { return this.item.activity },
			set(value) {}
		}
	},
	methods: {
		startDate: function (start) {
			const currentDate = new Date()

			if ( currentDate.getFullYear() === start.getFullYear()
				&& currentDate.getMonth() === start.getMonth()
				&& currentDate.getDate() === start.getDate() ) {

				//const options = { timeZone: 'UTC', timeZoneName: 'short' };
				//return `${start.getUTCHours()}:${start.getUTCMinutes()}:${start.getUTCSeconds()}`
				return start.toLocaleTimeString('ru-RU', { hour12: false })
			} else {
				return start.toISOString().replace(/T/, ' ').replace(/\..+/, '')
			}
		},
		endDate: function (end) {
			let ends = end
			if (!ends) ends = new Date()

			const currentDate = new Date()

			if ( currentDate.getFullYear() === ends.getFullYear()
				&& currentDate.getMonth() === ends.getMonth()
				&& currentDate.getDate() === ends.getDate() ) {
				return ends.toLocaleTimeString('ru-RU', { hour12: false })
			} else {
				return ends.toISOString().replace(/T/, ' ').replace(/\..+/, '')
			}
		},
		duration: function (item) {
			//debugger
			let ends = item.ends
			if (!ends) ends = new Date()

			let timeDiff = (ends - item.start) / 1000

			let seconds = Math.round(timeDiff % 60)
			timeDiff = Math.floor(timeDiff / 60)

			let minutes = Math.round(timeDiff % 60)
			timeDiff = Math.floor(timeDiff / 60)

			let hours = Math.round(timeDiff % 24)
			timeDiff = Math.floor(timeDiff / 24)
			hours = hours + (timeDiff * 24)

			return `${hours>9 ? '' : '0'}${hours}:${minutes>9 ? '' : '0'}${minutes}:${seconds>9 ? '' : '0'}${seconds}`
		},
		statusIcon: function (status) {
			return activityStatus[status].icon
		},
		statusName: function (status) {
			return activityStatus[status].name
		}
	}
}
</script>

<style lang="css">
	.activity-log-element {
		padding-left: 6px;
		padding-right: 6px;
		margin-bottom: 2px;
	}
	.theme--light.v-list.activity-log-element  {
		background: none;
	}
	.activity-log-element .v-list__tile {
		border-bottom: 1px solid #dee2e6;
		height: 52px;
	}
</style>
