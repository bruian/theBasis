<template>
	<v-container grid-list-md text-xs-center>
		<v-layout row wrap>
      <v-flex xs12>
        <v-card dark color="primary">
          <v-card-text class="px-0">{{ isMobile }}</v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs12>
        <v-card dark color="primary">
          <v-card-text class="px-0">{{ bp }}</v-card-text>
        </v-card>
      </v-flex>			
		</v-layout>
	</v-container>
</template>

<script>
export default {
	name: 'AppGrid',
	data: () => ({
    isMobile: false
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
</style>