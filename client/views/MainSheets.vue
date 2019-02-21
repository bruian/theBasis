<template>
  <section class="itm-container">
    <div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>

    <ul class="itm-general">
      <li style="all: unset;" v-for="sheetItem in generalSheets" :key="sheetItem.id">
        <tasks-sheet
          v-if="sheetItem.type_el === 'tasks-sheet'"
          v-bind:sheet_id="sheetItem.sheet_id"
        ></tasks-sheet>
        <groups-sheet
          v-if="sheetItem.type_el === 'groups-sheet'"
          v-bind:sheet_id="sheetItem.sheet_id"
        ></groups-sheet>
        <users-sheet
          v-if="sheetItem.type_el === 'users-sheet'"
          v-bind:sheet_id="sheetItem.sheet_id"
        ></users-sheet>
      </li>
    </ul>

    <ul class="itm-additional" v-if="isShowAdditional">
      <li style="all: unset;" v-for="sheetItem in additionalSheets" :key="sheetItem.id">
        <tasks-sheet
          v-if="sheetItem.type_el === 'tasks-sheet'"
          v-bind:sheet_id="sheetItem.sheet_id"
        ></tasks-sheet>
        <groups-sheet
          v-if="sheetItem.type_el === 'groups-sheet'"
          v-bind:sheet_id="sheetItem.sheet_id"
        ></groups-sheet>
        <users-sheet
          v-if="sheetItem.type_el === 'users-sheet'"
          v-bind:sheet_id="sheetItem.sheet_id"
        ></users-sheet>
      </li>
    </ul>

    <div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>
  </section>
</template>

<script>
import Profile from "../components/widgets/Profile.vue";

export default {
  name: "main-sheets",
  components: {
    Profile,
    UsersSheet: () => import("../components/widgets/sheets/UsersSheet.vue"),
    TasksSheet: () => import("../components/widgets/sheets/TasksSheet.vue"),
    GroupsSheet: () => import("../components/widgets/sheets/GroupsSheet.vue")
  },
  data: () => ({}),
  beforeRouteEnter(to, from, next) {
    next();
  },
  computed: {
    fillsClass: function() {
      return {
        "itm-fill": this.$vuetify.breakpoint.lgOnly,
        "itm-fill-xlarge": this.$vuetify.breakpoint.xlOnly,
        "itm-fill-medium": this.$vuetify.breakpoint.mdAndDown
        //'itm-fill-small': this.$vuetify.breakpoint.smAndDown
      };
    },
    generalSheets() {
      return this.$store.getters.generalSheets(this.$vuetify.breakpoint);
    },
    additionalSheets() {
      return this.$store.getters.additionalSheets;
    },
    isShowAdditional() {
      return this.$store.getters.isShowAdditional(this.$vuetify.breakpoint);
    }
  }
};
</script>

<style scoped lang="css">
.itm-container {
  display: flex;
  justify-content: center;
}

.itm-general {
  all: unset;
  flex: 6;
  margin-left: 5px;
  margin-right: 5px;
  /* border: 1px solid red; */
}

.itm-additional {
  all: unset;
  flex: 5;
  margin-left: 5px;
  margin-right: 5px;
  /* border: 1px solid greenyellow; */
}

.itm-fill {
  flex: 1;
  /* border: 1px solid blue; */
}

.itm-fill-xlarge {
  flex: 2;
}

.itm-fill-medium {
  flex: 0 1 40px;
}

.itm-fill-small {
  flex: 0 1 20px;
}
</style>
