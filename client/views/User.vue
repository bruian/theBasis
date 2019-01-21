<template>
	<v-container grid-list-xl >
		<v-layout row wrap>
			<v-flex lg4 md12 sm12 xs12>
				<profile></profile>
			</v-flex>
			<v-flex lg4 md6 sm12 xs12>
				<groups-list></groups-list>
			</v-flex>
			<v-flex lg4 md6 sm12 xs12>
				<users-list></users-list>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import Profile from '../components/widgets/Profile.vue'
import UsersList from '../components/widgets/list/UsersList.vue'
import GroupsList from '../components/widgets/list/GroupsList.vue'

export default {
	name: 'user',
	components: {
		Profile,
		UsersList,
		GroupsList
	},
	beforeRouteEnter (to, from, next) {
		//console.log('beforeRouteEnter: contacts')
		next()
	}
}
</script>

<style lang="stylus">

</style>
