<template>
  <div class="sheet-container">
    <div v-bind:class="classObject" @click="onBodyClick">
      <div class="sheet-clmn1">
        <div v-bind:class="classHandle"></div>
        <VCircle dot small :color="sheetIndicator(sheet.consistency)"></VCircle>
      </div>

      <div class="sheet-clmn2">
        <v-icon large>{{sheet.icon}}</v-icon>
      </div>

      <div class="sheet-clmn3">
        <input
          class="item-input"
          type="text"
          v-model="sheet.name"
          @change="onNameChange($event, sheet.sheet_id)"
        >

        <v-btn small icon @click="activateLayout('list-sheet')">
          <v-icon color="primary">visibility</v-icon>
        </v-btn>
        <v-btn small icon :disabled="sheet.defaults" @click="activateLayout('property-sheet')">
          <v-icon color="primary">tune</v-icon>
        </v-btn>
      </div>
      <!-- <div class="sheet-clmn4"></div> -->
    </div>
  </div>
</template>

<script>
import VCircle from "../../VCircle/VCircle.js";
import { isNumeric, activityStatus } from "../../../util/helpers.js";

export default {
  name: "sheet-item",
  components: {
    VCircle
  },
  props: ["sheet"],
  data: () => ({}),
  computed: {
    classObject() {
      let sheet_id = "";
      if (this.$store.state.selectedSheet) {
        sheet_id = this.$store.state.selectedSheet.sheet_id;
      }

      return {
        "sheet-body": true,
        active: this.sheet.sheet_id === sheet_id,
        passive: this.sheet.sheet_id !== sheet_id
      };
    },
    classHandle() {
      let sheet_id = "";
      if (this.$store.state.selectedSheet) {
        sheet_id = this.$store.state.selectedSheet.sheet_id;
      }

      return {
        "itm-handle": true,
        "itm-handle-active": this.sheet.sheet_id === sheet_id
      };
    },
    selectedSheet() {
      return this.$store.state.selectedSheet;
    }
  },
  methods: {
    onNameChange: function(e, id) {
      this.$store.dispatch("UPDATE_SHEET_VALUES", {
        id: this.sheet.sheet_id,
        values: [{ field: "name", value: e.target.value }]
      });
    },
    sheetIndicator: function(itm) {
      const status = ["success", "yellow", "error"];
      return status[itm];
    },
    onBodyClick: function() {
      this.$store.commit("UPDATE_MAIN_USER", {
        selectedSheet: this.sheet.sheet_id
      });
    },
    activateLayout(type_layout) {
      /* Проверка на то, в каком из position откроется sheet */
      let additionalLayout;
      const position = this.$store.getters.isShowAdditional(
        this.$vuetify.breakpoint
      )
        ? 2
        : 1;

      if (position === 2) {
        additionalLayout = this.$store.getters.additionalLayout;
      }

      if (additionalLayout && additionalLayout.type_layout === type_layout)
        return;

      /* В зависимости от типа выбранного layout, будет открыт либо
				'список элементов' для sheet, либо 'свойства' этого sheet */
      if (type_layout === "list-sheet") {
        /* Для списка элементов */

        this.$store
          .dispatch("ADD_LAYOUT", {
            type_layout,
            position,
            sheet_id: this.sheet.sheet_id,
            type_el: this.sheet.type_el,
            element_id: ""
          })
          .then(() => {
            if (position === 2) {
              /* Если открывается в additional layout, то необходимо закрыть предыдущее представление,
							в случае если оно уже открыто*/
              if (
                additionalLayout &&
                additionalLayout.type_layout === "property-sheet" &&
                additionalLayout.sheet_id === this.sheet.sheet_id
              ) {
                this.$store.dispatch("REMOVE_LAYOUT", additionalLayout);
              }
            }

            return Promise.resolve(true);
          });
      } else if (type_layout === "property-sheet") {
        this.$store
          .dispatch("ADD_LAYOUT", {
            type_layout,
            position,
            sheet_id: this.sheet.sheet_id,
            type_el: this.sheet.type_el,
            element_id: ""
          })
          .then(() => {
            if (position === 2) {
              if (
                additionalLayout &&
                additionalLayout.sheet_id === this.sheet.sheet_id
              ) {
                this.$store.dispatch("REMOVE_LAYOUT", additionalLayout);
              }
            }

            return Promise.resolve(true);
          });
      }
    }
  }
};
</script>

<style lang="css">
.sheet-container {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin-bottom: 0.1em;
}

.sheet-body {
  margin-top: 0.3em;
  margin-right: 0.3em;
  margin-left: 0.3em;
  display: flex;
  flex-flow: row nowrap;
  background-color: #f8f9fa;
}

.sheet-body:hover,
.sheet-body:focus,
.sheet-body:active {
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(0, 0, 0, 0.1) inset;
}

.sheet-clmn1 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  margin: 2px 2px 2px 0px;
}

.sheet-clmn2 {
  align-self: flex-start;
  width: 28px;
  padding-left: 0.2em;
  padding-right: 0.2em;
}

.sheet-clmn2 .v-btn--floating.v-btn--small {
  height: 35px;
  width: 35px;
  outline: none;
}

.sheet-clmn3 {
  display: flex;
  flex: 1 1 auto;
  margin: 2px 1px 1px 1px;
}

.sheet-clmn4 {
  width: 120px;
  margin: 1px 2px 2px 1px;
  display: flex;
  flex-flow: row wrap;
  align-content: space-between;
}

.item-input {
  flex: 1 1;
}
</style>
