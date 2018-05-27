<template>
  <div class='App' id='app'>
    <div v-if="$auth.ready()" >
      <AuthCheck></AuthCheck>
      <HeaderBar></HeaderBar>
      <transition name='fade' mode='out-in'>
        <router-view class='view'></router-view>
      </transition>
    </div>
    <div v-if="!$auth.ready()" >
      loading...
    </div>
  </div>
</template>

<script>
import AuthCheck from './components/AuthCheck.vue'
import HeaderBar from './components/HeaderBar.vue'

export default {
	name: 'App',
	components: {
		HeaderBar,
		AuthCheck
	}
}
</script>

<style lang="stylus">
body
  font-family -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  font-size 15px
  background-color lighten(#eceef1, 30%)
  margin 0
  padding-top 55px
  color #34495e
  overflow-y scroll

a
  color #34495e
  text-decoration none

.view
  max-width 800px
  margin 0 auto
  position relative

.fade-enter-active, .fade-leave-active
  transition all .2s ease

.fade-enter, .fade-leave-active
  opacity 0

@media (max-width 860px)
  .header .inner
    padding 15px 30px

@media (max-width 600px)
  .header
    .inner
      padding 15px
    a
      margin-right 1em
    .github
      display none
</style>
