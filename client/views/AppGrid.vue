<template>
	<div>
		<!--svg viewBox="0 0 120 28">
			<defs>
				<path id="wave" d="M 0,10 C 30,10 30,15 60,15 90,15 90,10 120,10 150,10 150,15 180,15 210,15 210,10 240,10 v 28 h -240 z" />
			</defs>
			<use id="wave3" class="wave" xlink:href="#wave" x="0" y="-2" ></use>
			<use id="wave2" class="wave" xlink:href="#wave" x="0" y="0" ></use>
			<use id="wave1" class="wave" xlink:href="#wave" x="0" y="1" ></use>
		</svg-->
		<div class="info-block">
			<pre class="c-s" v-html="codes[0].code"></pre>
			<pre class="c-s" v-html="codes[1].code"></pre>
			<pre class="c-s" v-html="codes[2].code"></pre>
		</div>

		<pre class="c-s" v-html="codes[3].code"></pre>
		<v-container text-xs-center>
			<v-card dark color="primary" class="elevation-0">
				<v-card-text class="px-0">12</v-card-text>
			</v-card>
		</v-container>

		<pre class="c-s" v-html="codes[4].code"></pre>
		<v-container text-xs-center>
			<v-layout>
				<v-flex xs12>
					<v-card dark color="primary" class="elevation-8">
						<v-card-text class="px-0">12</v-card-text>
					</v-card>
				</v-flex>
				<v-flex v-for="i in 2" :key="`6${i}`" xs6>
					<v-card dark color="secondary" class="elevation-8">
						<v-card-text class="px-0">6</v-card-text>
					</v-card>
				</v-flex>
			</v-layout>
		</v-container>

		<pre class="c-s" v-html="codes[5].code"></pre>
		<v-container text-xs-center grid-list-md>
			<v-layout>
				<v-flex xs12>
					<v-card dark color="primary" class="elevation-8">
						<v-card-text class="px-0">12</v-card-text>
					</v-card>
				</v-flex>
				<v-flex v-for="i in 2" :key="`6${i}`" xs6>
					<v-card dark color="secondary" class="elevation-8">
						<v-card-text class="px-0">6</v-card-text>
					</v-card>
				</v-flex>
			</v-layout>
		</v-container>

		<pre class="c-s" v-html="codes[6].code"></pre>
		<v-container text-xs-center grid-list-md>
			<v-layout row wrap>
				<v-flex xs12>
					<v-card dark color="primary" class="elevation-8">
						<v-card-text class="px-0">12</v-card-text>
					</v-card>
				</v-flex>
				<v-flex v-for="i in 2" :key="`6${i}`" xs6>
					<v-card dark color="secondary" class="elevation-8">
						<v-card-text class="px-0">6</v-card-text>
					</v-card>
				</v-flex>
			</v-layout>
		</v-container>

		<pre class="c-s" v-html="codes[7].code"></pre>
		<v-container fluid text-xs-center grid-list-md>
			<v-layout row wrap>
				<v-flex xs12>
					<v-card dark color="primary" class="elevation-8">
						<v-card-text class="px-0">12</v-card-text>
					</v-card>
				</v-flex>
				<v-flex xs6 offset-xs6>
					<v-card dark color="secondary" class="elevation-8">
						<v-card-text class="px-0">6</v-card-text>
					</v-card>
				</v-flex>
			</v-layout>
		</v-container>
	</div>
</template>

<script>
import impCode from '../codes.js'

export default {
	name: 'AppGrid',
	data: () => ({
		isMobile: false,
		codes: impCode
	}),
	computed: {
		bp: function() {
			return this.$vuetify.breakpoint
		}
	},
	mounted() {
		this.onResize()
		window.addEventListener('resize', this.onResize, { passive: true} )
	},
	beforeDestroy() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', this.onResize, { passive: true } )
		}
	},
	methods: {
		onResize() {
			this.isMobile = window.innerWidth < 600
		}
	}
}
</script>

<style lang='stylus'>
.btnLogin
  margin-right 5px

.c-s
	padding 5px
	display block
	white-space pre-wrap
	box-sizing border-box
 	-moz-box-sizing border-box
 	webkit-box-sizing border-box
 	white-space pre-wrap
 	white-space -moz-pre-wrap
 	white-space -pre-wrap
 	white-space -o-pre-wrap
 	word-wrap break-word
	overflow-x auto
	background-color #f5f5f5
	color #bd4147
	box-shadow 0 2px 1px -1px rgba(0, 0 , 0, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12)

.o-s
	color green

.info-block
	display flex
	justify-content space-around
	flex-wrap wrap

.wave
	animation wave 3s linear
	animation-iteration-count infinite
	fill #4478e3
#wave2
	animation-duration 5s
	animation-direction reverse
	opacity .6
#wave3
	animation-duration 7s
	opacity .3
@keyframes wave
  to {
    transform translateX(-100%)
  }
</style>
