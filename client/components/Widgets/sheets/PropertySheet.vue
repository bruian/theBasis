<template>
  <section class="itm-sheet">
    <div class="itm-sheet-header">
      <div style="margin: auto;">
        <p class="blank-title">{{propertyName}}</p>
      </div>

      <v-btn small icon @click="onCloseLayout">
        <v-icon color="primary">clear</v-icon>
      </v-btn>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <div class="drawer-menu--scroll">
        <component :is="propertyComponent.component" :item="propertyComponent.item"></component>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "property-sheet",
  components: {
    ListSheetProperty: () => import("../property/ListSheetProperty.vue")
  },
  props: {
    layout: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    scrollSettings: {
      maxScrollLength: 10
    }
  }),
  created() {},
  computed: {
    propertyComponent() {
      /* Если не задан id элемента sheet, тогда откроется property для sheet-list */
      const theSheet = this.$store.state.sheets.find(
        el => el.sheet_id === this.layout.sheet_id
      );

      if (this.layout.element_id.trim() === "") {
        /* property for list-sheet */
        if (theSheet) {
          return {
            component: `list-sheet-property`,
            item: theSheet
          };
        }
      } else {
        /* property for sheet element */
        if (theSheet) {
          let section = theSheet.type_el.match(/^(?!-sheet)\w+/g)[0];
          return {
            component: `${section}-property`,
            item: ""
          };
        }
      }
    },
    propertyName() {
      const theSheet = this.$store.state.sheets.find(
        el => el.sheet_id === this.layout.sheet_id
      );

      if (this.layout.element_id.trim() === "") {
        return `Property for list "${theSheet.name}"`;
      } else {
        return `Property for element`;
      }
    }
  },
  methods: {
    onCloseLayout() {
      let selectedLayout;

      if (this.layout.position === 1) {
        selectedLayout = this.$store.getters.generalLayout;
      } else {
        selectedLayout = this.$store.getters.additionalLayout;
      }

      this.$store.dispatch("REMOVE_LAYOUT", selectedLayout);
    }
  }
};
</script>
