<template>
  <header class='header'>
    <b-navbar toggleable='md' type='dark' variant='info' role='navigation'>
      <b-navbar-toggle target='nav_collapse'></b-navbar-toggle>
      <b-navbar-brand to='/'>
        <img v-if='$auth.check()' class='logo' src='~public/appLogo.png' alt='logo'>
        theBasis
      </b-navbar-brand>
      <b-collapse is-nav id='nav_collapse' v-if='$auth.check()'>
        <b-navbar-nav>
          <b-nav-item to='/'>Telegram users</b-nav-item>
          <b-nav-item to='/logs' disabled>Logs</b-nav-item>
        </b-navbar-nav>
        
        <b-navbar-nav class='ml-auto'>
          <b-nav-form>
            <b-form-input size='sm' class='mr-sm-2' type='text' placeholder='Search'/>
            <b-button size='sm' class='my-2 my-sm-0' type='submit'>Search</b-button>
          </b-nav-form>
          <b-button size='sm' class='my-2 my-sm-0' v-if='$auth.check()' v-on:click='logout()'>Logout</b-button>
        </b-navbar-nav>        
      </b-collapse>
    </b-navbar>
  </header>
</template>

<script>
//import NoSSR from 'vue-no-ssr'

export default {
  name: 'HeaderBar',
  methods: {
    logout() {
      var redirect = this.$auth.redirect()

      this.$auth.logout({
        makeRequest: true,
        redirect: {name: redirect ? redirect.from.name : 'login'},
        success() {
          console.log('success ' + this.context);
        },
        error() {
          console.log('error ' + this.context);
        }
        //params: {}, data: {} in axios
      })
    }
  }
}
</script>

<style lang="stylus">
.header
  background-color #17a2b8
  position fixed
  z-index 999
  height 55px
  top 0
  left 0
  right 0
  .inner
    max-width 800px
    box-sizing border-box
    margin 0px auto
    padding 15px 5px
  a
    color rgba(244, 180, 89, .8)
    line-height 24px
    transition color .15s ease
    display inline-block
    vertical-align middle
    font-weight 300
    letter-spacing .075em
    margin-right 1.8em
    &:hover
      color #fff
    &.router-link-active
      color #fff
      font-weight 400
    &:nth-child(6)
      margin-right 0
.my-2
  margin-right 5px
.logo
  width 28px
  margin-right 10px
  display inline-block
  vertical-align middle
.navbar-brand
  color rgba(244, 180, 89, .8)
</style>
