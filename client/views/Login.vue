<template>
	<div class="login-view">
		<b-container class="b-login-row">
      <b-row align-v="start">
        <b-col class="text-center">
          <b-img align-h="center" width="180" height="180" alt="center image" class="m-1" src="./public/appLogo.png"/>
        </b-col>
      </b-row>
      <b-row>
        <b-col><span class="sp1"></span></b-col>
        <b-col cols="8">
          <b-form @submit="onSubmit">
            <b-form-group id="emailGroup" 
              label="Email address:" 
              label-for="emailGroup">
              <b-form-input id="emailUser" 
                type="email" 
                v-model="data.body.username" 
                required 
                placeholder="Enter email">
              </b-form-input>
            </b-form-group>
            <b-form-group id="passwordGroup" 
              label="Your password:" 
              label-for="passwordGroup">
              <b-form-input id="passwordUser" 
                type="password" 
                v-model="data.body.password" 
                required 
                placeholder="Enter password">
              </b-form-input>
            </b-form-group>
            <b-alert :show="showError" 
              dismissible 
              variant="warning" 
              @dismissed="showError=false"
              fade>
              {{errorDescription}}
            </b-alert> 
            <b-button class="btnLogin" type="submit" variant="primary">Log in</b-button>
          </b-form>
        </b-col>
        <b-col><span class="sp3"></span></b-col>
      </b-row>
      <b-row align-v='end'></b-row>
    </b-container>
	</div>
</template>

<script>
import querystring from 'querystring'

export default {
	name: 'login-view',
	data() {
		return {
			data: {
        body: {
          grant_type: 'password',
          client_id: this.$store.state.client_id,
          client_secret: this.$store.state.client_secret,
          username: '',
          password: ''
        },
        rememberMe: false,
        fetchUser: true,
      },
      showError: false,
      error: '',
      errorDescription: ''
    }
  },
  methods: {
    onSubmit (evt) {
      evt.preventDefault()
      var redirect = this.$auth.redirect()

      this.$auth.login({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        methods: 'post',
        data: querystring.stringify(this.data.body),
        rememberMe: this.data.rememberMe,
        redirect: {name: redirect ? redirect.from.name : 'TgmUsers'},
        fetchUser: this.data.fetchUser
      })
      .then((res) => {
        console.log('User loged ' + res.data)
      }, (res) => {
        var error = 'Unhandled error'
        var errorDescription = `You need to contact the developers and send the following information:
        module: Login.vue, caller: $auth.login`

        try {
          error = res.response.data.error
          errorDescription = res.response.data.error_description
        } catch (err) {}

        this.showError = true
        this.error = error
        this.errorDescription = errorDescription

        res.response = null
      })
    }
  }
}
</script>

<style lang='stylus'>
.btnLogin
  margin-right 5px
.sp1
  background-color #263238
  color white
.sp2
  background-color #CFD8DC
.sp3
  background-color #FF5722
.login-view
  /* background: #ccc */
</style>