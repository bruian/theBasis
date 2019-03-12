<template>
  <div id="sheetsManager">
    <v-toolbar color="primary" dark>
      <v-toolbar-title>Sheets layout</v-toolbar-title>
    </v-toolbar>

    <v-container pa-2>
      <v-layout column>
        <v-flex>
          <v-subheader class="px-1 my-1">Раскладка</v-subheader>

          <v-radio-group v-model="layout" row class="mt-1">
            <v-radio label="One" value="1"></v-radio>
            <v-radio label="Two" value="2"></v-radio>
          </v-radio-group>

          <v-subheader class="px-1 my-1">Sheets</v-subheader>

          <settings-list
            v-model="sheets"
            @onCreate="onCreateSheet"
            @onDelete="onDeleteSheet"
            @onMove="onMoveSheet"
          ></settings-list>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import SettingsList from "./Widgets/SettingsList.vue";

export default {
  name: "sheets-manager",
  components: {
    SettingsList
  },
  data() {
    return {};
  },
  computed: {
    layout: {
      get() {
        return this.$store.state.mainUser.layout.toString();
      },
      set(value) {
        this.$store.commit("UPDATE_MAIN_USER", { layout: parseInt(value, 10) });
      }
    },
    sheets: {
      get() {
        return this.$store.state.sheets;
      },
      set(value) {
        this.$store.dispatch("UPDATE_SHEET_VALUES", value).catch(err => {
          console.warn(err);
        });
      }
    }
  },
  methods: {
    onCreateSheet: function(sheet) {
      this.$store.dispatch("CREATE_SHEET_ELEMENT", sheet).catch(err => {
        console.warn(err);
      });
    },
    onDeleteSheet: function(sheet) {
      this.$store
        .dispatch("DELETE_SHEET_ELEMENT", { id: sheet.id })
        .catch(err => {
          console.warn(err);
        });
    },
    onMoveSheet: function(sheet) {
      this.$store.commit("MOVE_SHEET_ELEMENT", sheet);
    }
  }
};
</script>

<style lang="css" scoped>
</style>
