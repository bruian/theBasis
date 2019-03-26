<template>
  <v-container grid-list-xl>
    <v-layout row wrap>
      <v-flex lg4 md12 sm12 xs12>
        <profile></profile>
      </v-flex>
      <v-flex lg4 md6 sm12 xs12>
        <groups-sheet></groups-sheet>
      </v-flex>
      <v-flex lg4 md6 sm12 xs12>
        <users-sheet></users-sheet>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Profile from "../components/widgets/Profile.vue";
import UsersSheet from "../components/widgets/sheets/UsersSheet.vue";
import GroupsSheet from "../components/widgets/sheets/GroupsSheet.vue";

export default {
  name: "user",
  components: {
    Profile,
    UsersSheet,
    GroupsSheet
  },
  beforeRouteEnter(to, from, next) {
    //console.log('beforeRouteEnter: contacts')
    next();
  }
};
</script>
