<template>
  <div class="list-sheet-property">
    <p style="margin-top: 5px; margin-bottom: 5px;">Groups filter</p>
    <treeselect
      v-model="selectGroups"
      placeholder="Group"
      :flat="true"
      :clearable="false"
      :multiple="true"
      :options="mainGroupsMini"
      @input="onGroupInput"
    />

    <div v-if="isType('activity-sheet') || isType('tasks-sheet')">
      <p style="margin-top: 10px; margin-bottom: 5px;">Видимые статусы</p>
      <p-check
        name="Assigned"
        color="success"
        v-model="activityStatus.Assigned"
        @change="onActivityStatusChange('Assigned', $event)"
      >Назначено</p-check>
      <p-check
        name="Started"
        color="success"
        v-model="activityStatus.Started"
        @change="onActivityStatusChange('Started', $event)"
      >Начато</p-check>
      <p-check
        name="Completed"
        color="success"
        v-model="activityStatus.Completed"
        @change="onActivityStatusChange('Completed', $event)"
      >Завершено</p-check>
      <p-check
        name="Suspended"
        color="success"
        v-model="activityStatus.Suspended"
        @change="onActivityStatusChange('Suspended', $event)"
      >Приостановлено</p-check>
      <p-check
        name="Canceled"
        color="success"
        v-model="activityStatus.Canceled"
        @change="onActivityStatusChange('Canceled', $event)"
      >Отменено</p-check>
      <p-check
        name="Continued"
        color="success"
        v-model="activityStatus.Continued"
        @change="onActivityStatusChange('Continued', $event)"
      >Продолжено</p-check>
      <p-check
        name="Removed"
        color="success"
        v-model="activityStatus.Removed"
        @change="onActivityStatusChange('Removed', $event)"
      >Удалено</p-check>
    </div>

    <div class="list-sheet-property-action">
      <v-btn
        small
        :loading="loading"
        :disabled="loading || (!changedGroup && !changedVision)"
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
    changedGroup: false,
    changedVision: false,
    activityStatus: null
  }),
  created() {
    this.selectGroups = this.item.condition.group_id;
    this.activityStatus = Object.assign({}, this.item.vision.activityStatus);
  },
  watch: {
    item() {
      this.selectGroups = this.item.condition.group_id;
      this.activityStatus = Object.assign({}, this.item.vision.activityStatus);
    }
  },
  computed: {
    mainGroupsMini() {
      return this.$store.getters.mainGroupsMini;
    }
    // activityStatus() {
    //   return Object.assign({}, this.item.vision.activityStatus);
    // }
  },
  methods: {
    onActivityStatusChange(activity, value) {
      // const activityStatus = Object.assign(
      //   {},
      //   this.item.vision.activityStatus
      // );
      // activityStatus[activity] = value;
      // this.$store.dispatch("UPDATE_SHEET_VALUES", {
      //   id: this.$store.state.selectedSheet.sheet_id,
      //   values: [
      //     {
      //       field: "vision",
      //       value: {
      //         activityStatus
      //       }
      //     }
      //   ]
      // });
    },
    isType(value) {
      if (this.item) {
        return this.item.type_el === value;
      } else {
        return false;
      }
    },
    onGroupInput: function(value, instanceId) {
      this.changedGroup = true;
    },
    onActivityStatusChange: function(activity, value) {
      this.changedVision = true;
      this.activityStatus[activity] = value;
    },
    onApply: function() {
      this.loading = true;

      const values = [];
      if (this.changedGroup) {
        values.push({
          field: "condition",
          value: { group_id: this.selectGroups }
        });
      }

      if (this.changedVision) {
        values.push({
          field: "vision",
          value: {
            activityStatus: this.activityStatus
          }
        });
      }

      this.$store
        .dispatch("UPDATE_SHEET_VALUES", {
          id: this.item.sheet_id,
          values
        })
        .then(() => {
          this.loading = false;
          this.changedGroup = false;
          this.changedVision = false;
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
