<template>
	<v-container grid-list-xl>
		<v-layout row wrap>
			<!-- <v-flex xl4 lg6 md6 sm12 xs12>
				<profile></profile>
			</v-flex> -->
			<v-flex xl12 lg12 md12 sm12 xs12>
				<tasks-list v-bind:list_id="'main-tasks'"></tasks-list>
			</v-flex>
			<!-- <v-flex xl4 lg6 md6 sm12 xs12>
				<users-list></users-list>
			</v-flex>
			<v-flex xl4 lg6 md6 sm12 xs12>
				<groups-list></groups-list>
			</v-flex> -->
		</v-layout>
	</v-container>
</template>

<script>
import TasksList from '../components/widgets/list/TasksList.vue'
import Profile from '../components/widgets/Profile.vue'
import UsersList from '../components/widgets/list/UsersList.vue'
import GroupsList from '../components/widgets/list/GroupsList.vue'

export default {
	components: {
		Profile,
		TasksList,
		UsersList,
		GroupsList
	},
	beforeRouteEnter (to, from, next) {
		next()
	}
}
</script>

<style lang="stylus">

</style>
