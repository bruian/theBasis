<template>
	<div id="Home">
		<section>
			<v-parallax src="./public/screen1_1920_1080.jpg" height="600">
				<v-layout
					column
					align-center
					justify-center
					class="white--text">
					<!--v-img src="./public/Rocket.svg" alt="inTask.me" height="100"></v-img-->
					<h1 class="white--text mb-2 display-1 text-xs-center">inTask.me</h1>
					<div class="subheading mb-3 text-xs-center">Невероятный менеджер задач для вас</div>
					<v-btn
						class="blue lighten-2 mt-5"
						dark
						large
						href="/start">
						Давай попробую
					</v-btn>
				</v-layout>
			</v-parallax>
		</section>

		<section>
			<v-layout
				column
				wrap
				class="my-5"
				align-center>
				<v-flex xs12 sm4 class="my-3">
					<div class="text-xs-center">
						<h2 class="headline">Эффективная управленческая деятельность</h2>
						<span class="subheading">
							стоит на трех китах
						</span>
					</div>
				</v-flex>
				<v-flex xs12>
					<v-container grid-list-xl>
						<v-layout row wrap align-center>
							<v-flex xs12 md4>
								<v-card class="elevation-0 transparent">
									<v-card-text class="text-xs-center">
										<v-icon x-large class="blue--text text--lighten-2">build</v-icon>
									</v-card-text>
									<v-card-title primary-title class="layout justify-center">
										<div class="headline text-xs-center">Квалификация</div>
									</v-card-title>
									<v-card-text>
										Cras facilisis mi vitae nunc lobortis pharetra. Nulla volutpat tincidunt ornare.
										Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
										Nullam in aliquet odio. Aliquam eu est vitae tellus bibendum tincidunt. Suspendisse potenti.
									</v-card-text>
								</v-card>
							</v-flex>
							<v-flex xs12 md4>
								<v-card class="elevation-0 transparent">
									<v-card-text class="text-xs-center">
										<v-icon x-large class="blue--text text--lighten-2">flag</v-icon>
									</v-card-text>
									<v-card-title primary-title class="layout justify-center">
										<div class="headline">Дисциплина</div>
									</v-card-title>
									<v-card-text>
										Cras facilisis mi vitae nunc lobortis pharetra. Nulla volutpat tincidunt ornare.
										Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
										Nullam in aliquet odio. Aliquam eu est vitae tellus bibendum tincidunt. Suspendisse potenti.
									</v-card-text>
								</v-card>
							</v-flex>
							<v-flex xs12 md4>
								<v-card class="elevation-0 transparent">
									<v-card-text class="text-xs-center">
										<v-icon x-large class="blue--text text--lighten-2">flash_on</v-icon>
									</v-card-text>
									<v-card-title primary-title class="layout justify-center">
										<div class="headline text-xs-center">Ответственность</div>
									</v-card-title>
									<v-card-text>
										Cras facilisis mi vitae nunc lobortis pharetra. Nulla volutpat tincidunt ornare.
										Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
										Nullam in aliquet odio. Aliquam eu est vitae tellus bibendum tincidunt. Suspendisse potenti.
									</v-card-text>
								</v-card>
							</v-flex>
						</v-layout>
					</v-container>
				</v-flex>
			</v-layout>
		</section>

		<section>
			<v-parallax src="./public/screen3_1600_900.jpg" height="430">
				<v-layout column align-center justify-center>
					<div class="headline white--text mb-3 text-xs-center">Web development has never been easier</div>
					<em>Kick-start your application today</em>
					<v-btn
						class="blue lighten-2 mt-5"
						dark
						large
						href="/pre-made-themes"
					>
						Get Started
					</v-btn>
				</v-layout>
			</v-parallax>
		</section>

		<section>
			<v-container grid-list-xl>
				<v-layout row wrap justify-center class="my-5">
					<v-flex xs12 sm4>
						<v-card class="elevation-0 transparent">
							<v-card-title primary-title class="layout justify-center">
								<div class="headline">Company info</div>
							</v-card-title>
							<v-card-text>
								Cras facilisis mi vitae nunc lobortis pharetra. Nulla volutpat tincidunt ornare.
								Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
								Nullam in aliquet odio. Aliquam eu est vitae tellus bibendum tincidunt. Suspendisse potenti.
							</v-card-text>
						</v-card>
					</v-flex>
					<v-flex xs12 sm4 offset-sm1>
						<v-card class="elevation-0 transparent">
							<v-card-title primary-title class="layout justify-center">
								<div class="headline">Contact us</div>
							</v-card-title>
							<v-card-text>
								Cras facilisis mi vitae nunc lobortis pharetra. Nulla volutpat tincidunt ornare.
							</v-card-text>
							<v-list class="transparent">
								<v-list-tile>
									<v-list-tile-action>
										<v-icon class="blue--text text--lighten-2">phone</v-icon>
									</v-list-tile-action>
									<v-list-tile-content>
										<v-list-tile-title>777-867-5309</v-list-tile-title>
									</v-list-tile-content>
								</v-list-tile>
								<v-list-tile>
									<v-list-tile-action>
										<v-icon class="blue--text text--lighten-2">place</v-icon>
									</v-list-tile-action>
									<v-list-tile-content>
										<v-list-tile-title>Chicago, US</v-list-tile-title>
									</v-list-tile-content>
								</v-list-tile>
								<v-list-tile>
									<v-list-tile-action>
										<v-icon class="blue--text text--lighten-2">email</v-icon>
									</v-list-tile-action>
									<v-list-tile-content>
										<v-list-tile-title>john@vuetifyjs.com</v-list-tile-title>
									</v-list-tile-content>
								</v-list-tile>
							</v-list>
						</v-card>
					</v-flex>
				</v-layout>
			</v-container>
		</section>

		<v-container justify-center grid-list-md>
			<v-card>
				<v-layout>
					<h1></h1>
					<v-flex xs6>
						<v-card-title primary-title>
							<div>
								<div class="headline">Meet the incredible task manager - inTask.me</div>
								<div>Maus.club &copy designed</div>
								<div>(2018)</div>
							</div>
						</v-card-title>
					</v-flex>
					<v-flex xs4>
					</v-flex>
				</v-layout>
				<v-divider light></v-divider>
				<v-card-actions class="pa-3">
					Estimate your chaos
					<v-spacer></v-spacer>
					<v-icon>star_border</v-icon>
					<v-icon>star_border</v-icon>
					<v-icon>star_border</v-icon>
					<v-icon>star_border</v-icon>
					<v-icon>star_border</v-icon>
				</v-card-actions>
			</v-card>
		</v-container>
	</div>
</template>

<script>
//import AuthCheck from '../components/AuthCheck.vue'
import mTypes from '../store/mutation-types.js'
export default {
	components: {
	//	AuthCheck
	},
	asyncData ({ store, route }) {
		return
	},
}
</script>

<style lang="stylus">

</style>
