<template>
  <div id="sheetManager">
    <v-toolbar color="primary" dark>
      <v-toolbar-title>Sheet manager</v-toolbar-title>
    </v-toolbar>

    <v-container pa-2>
      <v-layout column>
        <v-flex>
          <p style="margin-bottom: 2px;">Группа</p>
          <treeselect
            v-model="group_id"
            placeholder="Groups"
            :clearable="false"
            :multiple="false"
            :options="mainGroupsMini"
            @open="onGroupOpen"
            @input="onGroupInput"
          />

          <!-- <p style="margin-top: 10px; margin-bottom: 2px;">Пользователь</p>
          <treeselect
            v-model="user_id"
            placeholder="Users"
            :clearable="false"
            :multiple="false"
            :options="mainUsersMini"
            @open="onUsersOpen"
            @input="onUsersInput"
          />-->
          <div v-if="isType('activity-sheet') || isType('tasks-sheet')">
            <p style="margin-top: 10px; margin-bottom: 2px;">Видимые статусы</p>
            <p-check
              name="Assigned"
              color="success"
              v-model="activityStatus().Assigned"
              @change="onActivityStatusChange('Assigned', $event)"
            >Назначено</p-check>
            <p-check
              name="Started"
              color="success"
              v-model="activityStatus().Started"
              @change="onActivityStatusChange('Started', $event)"
            >Начато</p-check>
            <p-check
              name="Completed"
              color="success"
              v-model="activityStatus().Completed"
              @change="onActivityStatusChange('Completed', $event)"
            >Завершено</p-check>
            <p-check
              name="Suspended"
              color="success"
              v-model="activityStatus().Suspended"
              @change="onActivityStatusChange('Suspended', $event)"
            >Приостановлено</p-check>
            <p-check
              name="Canceled"
              color="success"
              v-model="activityStatus().Canceled"
              @change="onActivityStatusChange('Canceled', $event)"
            >Отменено</p-check>
            <p-check
              name="Continued"
              color="success"
              v-model="activityStatus().Continued"
              @change="onActivityStatusChange('Continued', $event)"
            >Продолжено</p-check>
            <p-check
              name="Removed"
              color="success"
              v-model="activityStatus().Removed"
              @change="onActivityStatusChange('Removed', $event)"
            >Удалено</p-check>
          </div>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import Treeselect from "@riophae/vue-treeselect";

export default {
  name: "sheet-manager",
  components: {
    Treeselect
  },
  data() {
    return {
      user_id: 1,
      userChangeStart: false,
      groupChangeStart: false
    };
  },
  computed: {
    group_id: {
      get() {
        if (this.$store.state.selectedSheet) {
          return this.$store.state.selectedSheet.condition.group_id;
        }

        return null;
      },
      set(value) {}
    },
    mainGroupsMini() {
      return this.$store.getters.mainGroupsMini;
    },
    mainUsersMini() {
      return this.$store.state.mainUsersMini;
    }
  },
  methods: {
    onActivityStatusChange(activity, value) {
      const activityStatus = Object.assign(
        {},
        this.$store.state.selectedSheet.vision.activityStatus
      );
      activityStatus[activity] = value;

      this.$store.dispatch("UPDATE_SHEET_VALUES", {
        id: this.$store.state.selectedSheet.sheet_id,
        values: [
          {
            field: "vision",
            value: {
              activityStatus
            }
          }
        ]
      });
    },
    activityStatus() {
      const selectedSheet = this.$store.state.selectedSheet;
      // return selectedSheet.vision.activityStatus; // reactivity link less
      return Object.assign({}, selectedSheet.vision.activityStatus);
    },
    loadSheetProperty() {
      const selectedSheet = this.$store.state.selectedSheet;
      if (selectedSheet.type_el === "activity-sheet") {
        Object.keys(this.actionStatus).forEach(key => {
          this.actionStatus[key] = selectedSheet.vision.checkStatus[key];
        });
      }
    },
    isType(value) {
      if (this.$store.state.selectedSheet) {
        return this.$store.state.selectedSheet.type_el === value;
      } else {
        return false;
      }
    },
    onUsersOpen: function() {
      this.userChangeStart = true;
    },
    onUsersInput: function() {
      if (this.userChangeStart) {
        this.userChangeStart = false;
      }
    },
    onGroupOpen: function(instanceId) {
      this.groupChangeStart = true;
    },
    onGroupInput: function(value, instanceId) {
      //on default this event fired twice
      if (this.groupChangeStart) {
        this.groupChangeStart = false;

        this.$store
          .dispatch("UPDATE_SHEET_VALUES", {
            id: this.$store.state.selectedSheet.sheet_id,
            values: [
              {
                field: "condition",
                value: {
                  group_id: value
                }
              }
            ]
          })
          .then(() => {
            this.groupChangeStart = false;
          });
      }
    }
  }
};
</script>
