<template>
  <v-text-field
    v-model="item.name"
    @change="onNameChange"
    append-icon="done"
    @click:append="onNameChange"
    class="name-element"
    label="Group name"
    placeholder="Enter this name of group"
    clearable
    hide-details
  ></v-text-field>
</template>

<script>
export default {
  props: ["item", "sheet_id"],
  data: () => ({
    prevName: ""
  }),
  created: function() {
    this.prevName = this.item.name;
  },
  methods: {
    onNameChange: function() {
      if (this.prevName !== this.item.name) {
        this.$store
          .dispatch("UPDATE_ELEMENT", {
            sheet_id: this.sheet_id,
            id: this.item.id,
            name: this.item.name
          })
          .then(res => {
            this.prevName = this.item.name;
          })
          .catch(err => {
            console.warn(err);
          });
      }
    }
  }
};
</script>

<style lang="css">
.name-element {
  padding-left: 6px;
  padding-right: 6px;
  margin-bottom: 2px;
}
</style>
