<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <div style="margin: auto;">
        <p class="blank-title">Sheet not selected</p>
      </div>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <div class="drawer-menu--scroll"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "blank-sheet",
  components: {},
  props: {
    sheet_id: {
      type: String,
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
  methods: {}
};
</script>

<style lang="css">
</style>
