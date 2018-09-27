<template>
	<!--v-content class="pt-0"-->
		<v-container justify-center grid-list-md>
			<v-card>
				<v-layout>
					<v-flex xs12>
						<v-card-title primary-title>
							<div>
								<div class="headline">Contacts</div>
								<div>Ваши контакты</div>
								<div>(2018)</div>
							</div>
						</v-card-title>
					</v-flex>
				</v-layout>
				<v-divider light></v-divider>
				<v-card-actions class="pa-3">
					Estimate your chaos
					<v-spacer></v-spacer>
					<v-icon>star_border</v-icon>
				</v-card-actions>
			</v-card>
		</v-container>
	<!--/v-content-->
</template>

<script>
export default {
	beforeRouteEnter (to, from, next) {
		console.log('beforeRouteEnter: contacts')
		next()
	}
}
</script>

<style lang="stylus">

</style>
