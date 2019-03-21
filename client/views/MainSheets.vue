<template>
  <section class="itm-container" v-if="isAuth">
    <div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>

    <div class="itm-general">
      <!-- <keep-alive> -->
      <component :is="generalLayout.component" :layout="generalLayout"></component>
      <!-- </keep-alive> -->
    </div>

    <div class="itm-additional" v-if="isShowAdditional">
      <!-- <keep-alive> -->
      <component :is="additionalLayout.component" :layout="additionalLayout"></component>
      <!-- </keep-alive> -->
    </div>

    <div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>
  </section>
</template>

<script>
export default {
  name: "main-sheets",
  components: {
    UsersSheet: () => import("../components/widgets/sheets/UsersSheet.vue"),
    TasksSheet: () => import("../components/widgets/sheets/TasksSheet.vue"),
    ActivitySheet: () =>
      import("../components/widgets/sheets/ActivitySheet.vue"),
    GroupsSheet: () => import("../components/widgets/sheets/GroupsSheet.vue"),
    BlankSheet: () => import("../components/widgets/sheets/BlankSheet.vue"),
    ManageSheet: () => import("../components/widgets/sheets/ManageSheet.vue"),
    PropertySheet: () =>
      import("../components/widgets/sheets/PropertySheet.vue")
  },
  data: () => ({}),
  beforeRouteEnter(to, from, next) {
    next();
  },
  computed: {
    isAuth() {
      return this.$store.getters.isAuth;
    },
    fillsClass: function() {
      return {
        "itm-fill": this.$vuetify.breakpoint.lgOnly,
        "itm-fill-xlarge": this.$vuetify.breakpoint.xlOnly,
        "itm-fill-medium": this.$vuetify.breakpoint.mdAndDown
        //'itm-fill-small': this.$vuetify.breakpoint.smAndDown
      };
    },
    generalLayout() {
      let result = {
        component: "blank-sheet"
      };

      const activeLayout = this.$store.getters.generalLayout;
      if (activeLayout) {
        result = Object.assign({}, activeLayout);
        switch (activeLayout.type_layout) {
          case "manage-sheet":
          case "property-sheet":
            result.component = activeLayout.type_layout;
            break;
          case "list-sheet":
            result.component = activeLayout.type_el;
            break;
          default:
            break;
        }
      }

      return result;
    },
    additionalLayout() {
      let result = {
        component: "blank-sheet"
      };

      const activeLayout = this.$store.getters.additionalLayout;
      if (activeLayout) {
        result = Object.assign({}, activeLayout);
        switch (activeLayout.type_layout) {
          case "manage-sheet":
          case "property-sheet":
            result.component = activeLayout.type_layout;
            break;
          case "list-sheet":
            result.component = activeLayout.type_el;
            break;
          default:
            break;
        }
      }

      return result;
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
  flex: 5;
  margin-left: 5px;
  margin-right: 5px;
  /* border: 1px solid red; */
}

.itm-additional {
  all: unset;
  flex: 6;
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
