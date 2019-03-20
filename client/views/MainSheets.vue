<template>
  <section class="itm-container">
    <div class="itm-fill" v-bind:class="fillsClass" v-if="$vuetify.breakpoint.smAndUp"></div>

    <div class="itm-general">
      <keep-alive>
        <component
          :is="generalSheet.type_el"
          :sheet_id="generalSheet.sheet_id"
          :layout="generalSheet.layout"
        ></component>
      </keep-alive>
    </div>

    <div class="itm-additional" v-if="isShowAdditional">
      <keep-alive>
        <component
          :is="additionalSheet.type_el"
          :sheet_id="additionalSheet.sheet_id"
          :layout="additionalSheet.layout"
        ></component>
      </keep-alive>
    </div>

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
    fillsClass: function() {
      return {
        "itm-fill": this.$vuetify.breakpoint.lgOnly,
        "itm-fill-xlarge": this.$vuetify.breakpoint.xlOnly,
        "itm-fill-medium": this.$vuetify.breakpoint.mdAndDown
        //'itm-fill-small': this.$vuetify.breakpoint.smAndDown
      };
    },
    generalSheet() {
      const result = {
        type_el: "blank-sheet",
        sheet_id: "blank",
        layout: 1
      };

      const activeSheet = this.$store.getters.generalSheet;
      if (activeSheet) {
        result.type_el = activeSheet.type_el;
        result.sheet_id = activeSheet.sheet_id;
      }

      return result;
    },
    additionalSheet() {
      const result = {
        type_el: "blank-sheet",
        sheet_id: "blank",
        layout: 2
      };

      const activeSheet = this.$store.getters.additionalSheet;
      if (activeSheet) {
        result.type_el = activeSheet.type_el;
        result.sheet_id = activeSheet.sheet_id;
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
