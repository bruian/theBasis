<template>
	<section class="itm-container">
		<div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>

		<ul class="itm-general">
			<li style="all: unset;" v-for="sheetItem in generalSheets" :key="sheetItem.id">
				<tasks-listV v-if="sheetItem.component === 'task-listV'" v-bind:list_id="sheetItem.list_id"></tasks-listV>
				<tasks-listH v-if="sheetItem.component === 'task-listH'" v-bind:list_id="sheetItem.list_id"></tasks-listH>
				<groups-listV v-if="sheetItem.component === 'groups-listV'" v-bind:list_id="sheetItem.list_id"></groups-listV>
			</li>
		</ul>

		<ul class="itm-additional" v-if="isShowAdditional">
			<li style="all: unset;" v-for="sheetItem in additionalSheets" :key="sheetItem.id">
				<tasks-listV v-if="sheetItem.component === 'task-listV'" v-bind:list_id="sheetItem.list_id"></tasks-listV>
				<tasks-listH v-if="sheetItem.component === 'task-listH'" v-bind:list_id="sheetItem.list_id"></tasks-listH>
				<groups-listV v-if="sheetItem.component === 'groups-listV'" v-bind:list_id="sheetItem.list_id"></groups-listV>
			</li>
		</ul>

		<div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>
	</section>
	<!-- <v-container grid-list-lg style="border: 1px solid red;" > -->
		<!-- <v-layout row wrap style="border: 1px solid blue;" justify-center> -->
			<!-- <v-flex xl4 lg6 md6 sm12 xs12>
				<profile></profile>
			</v-flex> -->

			<!--
			<v-flex xl6 lg6 md6 sm6 xs6>
				<tasks-list v-bind:list_id="'main-tasks'"></tasks-list>
			</v-flex>
			<v-flex xl6 lg6 md6 sm6 xs6>
				<tasks-list v-bind:list_id="'main-tasks'"></tasks-list>
			</v-flex>
			<v-flex xl6 lg6 md6 sm6 xs6>
				<tasks-list v-bind:list_id="'main-tasks'"></tasks-list>
			</v-flex>
			<v-flex xl6 lg6 md6 sm6 xs6>
				<tasks-list v-bind:list_id="'main-tasks'"></tasks-list>
			</v-flex>
			-->

			<!-- <v-flex xl4 lg6 md6 sm12 xs12>
				<users-list></users-list>
			</v-flex>
			<v-flex xl4 lg6 md6 sm12 xs12>
				<groups-list></groups-list>
			</v-flex> -->
		<!-- </v-layout> -->
	<!-- </v-container> -->
</template>

<script>
import TasksList from '../components/widgets/list/TasksList.vue'
import Profile from '../components/widgets/Profile.vue'
import UsersList from '../components/widgets/list/UsersList.vue'
import GroupsList from '../components/widgets/list/GroupsList.vue'

export default {
	name: 'main-sheets',
	components: {
		Profile,
		TasksList,
		UsersList,
		GroupsList,
		TasksListH: () => import('../components/widgets/list/TasksListH.vue'),
		TasksListV: () => import('../components/widgets/list/TasksListV.vue'),
		GroupsListV: () => import('../components/widgets/list/GroupsListV.vue')
	},
	data: () => ({
	}),
	beforeRouteEnter (to, from, next) {
		next()
	},
	computed: {
		fillsClass: function () {
			return {
				'itm-fill': this.$vuetify.breakpoint.lgOnly,
				'itm-fill-xlarge': this.$vuetify.breakpoint.xlOnly,
				'itm-fill-medium': this.$vuetify.breakpoint.mdAndDown
				//'itm-fill-small': this.$vuetify.breakpoint.smAndDown
			}
		},
		generalSheets() {
			return this.$store.getters.generalSheets(this.$vuetify.breakpoint)
		},
		additionalSheets() {
			return this.$store.getters.additionalSheets
		},
		isShowAdditional() {
			return this.$store.getters.isShowAdditional(this.$vuetify.breakpoint)
		}
	}
}
</script>

<style scoped lang="css">
	.itm-container {
		display: flex;
		justify-content: center;
	}

	.itm-general {
		all: unset;
		flex: 6;
		margin-left: 5px;
		margin-right: 5px;
		/* border: 1px solid red; */
	}

	.itm-additional {
		all: unset;
		flex: 5;
		margin-left: 5px;
		margin-right: 5px;
		/* border: 1px solid greenyellow; */
	}

	.itm-fill {
		flex: 1;
		/* border: 1px solid blue; */
	}

	.itm-fill-xlarge {
		flex: 2;
	}

	.itm-fill-medium {
		flex: 0 1 40px;
	}

	.itm-fill-small {
		flex: 0 1 20px;
	}
</style>
