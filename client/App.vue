<template>
  <div id="app">
		<transition name='fade' mode='out-in'>
			<router-view class='view'></router-view>
		</transition>
  </div>
</template>

<script>
import HeaderBar from './components/HeaderBar.vue'

export default {
  name: 'App',
	components: {
		HeaderBar
  },
}
</script>

<style lang="stylus" scoped>
</style>
