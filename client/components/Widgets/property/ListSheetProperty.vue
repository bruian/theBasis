<template>
  <div class="list-sheet-property">
    <p>Groups filter</p>
    <treeselect
      v-model="selectGroups"
      placeholder="Group"
      :flat="true"
      :clearable="false"
      :multiple="true"
      :options="mainGroupsMini"
      @input="onGroupInput"
    />

    <div class="list-sheet-property-action">
      <v-btn
        small
        :loading="loading"
        :disabled="loading || !changed"
        color="primary"
        @click="onApply"
      >Apply</v-btn>
    </div>
  </div>
</template>

<script>
import Treeselect from "@riophae/vue-treeselect";

export default {
  name: "list-sheet-property",
  components: {
    Treeselect
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    selectGroups: null,
    loading: false,
    changed: false
  }),
  created() {
    this.selectGroups = this.item.condition.group_id;
  },
  computed: {
    mainGroupsMini() {
      return this.$store.getters.mainGroupsMini;
    }
  },
  methods: {
    onGroupInput: function(value, instanceId) {
      this.changed = true;
    },
    onApply: function() {
      this.loading = true;
      this.$store
        .dispatch("UPDATE_SHEET_VALUES", {
          id: this.item.sheet_id,
          values: [
            {
              field: "condition",
              value: { group_id: this.selectGroups }
            }
          ]
        })
        .then(() => {
          this.loading = false;
          this.changed = false;
        });
    }
  }
};
</script>

<style lang="css">
.list-sheet-property {
  margin: 0.5em;
}

.list-sheet-property-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 1em;
  border-top: 1px rgba(0, 0, 0, 0.12) solid;
}
</style>
