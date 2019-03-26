<template>
  <v-switch
    :input-value="singular"
    label="Singular - Исключительная задача"
    @change="onSingularChange"
  ></v-switch>
</template>

<script>
export default {
  props: ["item", "sheet_id"],
  data: () => ({
    singular: true
  }),
  created() {
    this.singular = this.item.singular;
  },
  methods: {
    onSingularChange: function(value) {
      this.$store
        .dispatch("UPDATE_ELEMENT", {
          sheet_id: this.sheet_id,
          id: this.item.id,
          singular: value
        })
        .catch(err => {
          console.warn(err);
        });
    }
  }
};
</script>
