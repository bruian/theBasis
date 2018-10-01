<template>
	<v-card>
		<v-img src="https://cdn.vuetifyjs.com/images/parallax/material.jpg" height="300">
			<v-layout column fill-height class="lightbox ma-0">
				<v-card-title>
					<v-spacer></v-spacer>
					<v-btn dark icon class="mr-3">
						<v-icon>edit</v-icon>
					</v-btn>
				</v-card-title>
				<v-spacer></v-spacer>
				<v-card-title class="white--text">
					<div class="display-1 pl-5 pt-5">{{computedUserInfo.username}}</div>
				</v-card-title>
			</v-layout>
		</v-img>
		<v-list two-line class="pa-0">
			<v-list-tile>
				<v-list-tile-action>
					<v-icon color="indigo">phone</v-icon>
				</v-list-tile-action>
				<v-list-tile-content>
					<v-list-tile-title>{{computedUserInfo.phonenumber}}</v-list-tile-title>
					<v-list-tile-sub-title>Mobile</v-list-tile-sub-title>
				</v-list-tile-content>
			</v-list-tile>
			<v-divider inset></v-divider>
			<v-list-tile>
        <v-list-tile-action>
          <v-icon color="indigo">mail</v-icon>
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>{{computedUserInfo.email}}</v-list-tile-title>
          <v-list-tile-sub-title>{{ computedUserInfo.verified ? 'Verified' : '' }}</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>
      <v-list-tile>
        <v-list-tile-action><div></div></v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>{{computedUserInfo.username}}</v-list-tile-title>
          <v-list-tile-sub-title>Username</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>
      <v-divider inset></v-divider>
      <v-list-tile>
        <v-list-tile-action>
          <v-icon color="indigo">location_on</v-icon>
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>1400 Main Street</v-list-tile-title>
          <v-list-tile-sub-title>Orlando, FL 79938</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>
		</v-list>
	</v-card>
</template>

<script>
export default {
	computed: {
		computedUserInfo() {
			let user = {
				username: '',
				email: '',
				verified: true,
				phonenumber: ''
			}

			if (this.$store.state.theUser) {
				user = this.$store.state.theUser
			}

			return user
		}
	}
}
</script>

<style>

</style>
