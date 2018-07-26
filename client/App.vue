<template>
  <div id="app">
    <!-- <HeaderBar></HeaderBar>
    <transition name='fade' mode='out-in'>
      <router-view class='view'></router-view>
    </transition>
    -->
    <v-app id="inspire">
      <v-navigation-drawer app></v-navigation-drawer>
      <v-toolbar app></v-toolbar>
      <v-content>
        <transition name='fade' mode='out-in'>
          <router-view></router-view>
        </transition>
      </v-content>
      <v-footer app></v-footer>
    </v-app>
  </div>
</template>

<script>
import HeaderBar from './components/HeaderBar.vue'

export default {
	name: 'App',
	components: {
		HeaderBar
	}
}
</script>

<style lang="stylus">
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
