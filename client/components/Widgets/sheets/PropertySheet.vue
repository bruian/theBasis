<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <div style="margin: auto;">
        <p class="blank-title">Property sheet for {{sheet_id}}</p>
      </div>

      <v-btn small icon @click="onCloseSheet">
        <v-icon color="primary">clear</v-icon>
      </v-btn>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <div class="drawer-menu--scroll"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "property-sheet",
  components: {},
  props: {
    sheet_id: {
      type: String,
      required: true
    },
    layout: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    thisSheet: null,
    scrollSettings: {
      maxScrollLength: 10
    }
  }),
  created() {},
  computed: {},
  methods: {
    onCloseSheet() {
      let selectedSheet;

      if (this.layout === 1) {
        selectedSheet = this.$store.getters.generalSheet;
      } else {
        selectedSheet = this.$store.getters.additionalSheet;
      }

      this.$store.dispatch("REMOVE_LAYOUT", selectedSheet);
    }
  }
};
</script>

<style lang="css">
</style>
