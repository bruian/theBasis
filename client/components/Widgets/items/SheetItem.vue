<template>
  <div class="sheet-container">
    <div v-bind:class="classObject" @click="onBodyClick">
      <div class="sheet-clmn1">
        <div v-bind:class="classHandle"></div>
        <VCircle dot small :color="sheetIndicator(item.consistency)"></VCircle>
      </div>

      <div class="sheet-clmn2">
        <v-icon large>{{item.icon}}</v-icon>
      </div>

      <div class="sheet-clmn3">
        <input
          class="item-input"
          type="text"
          v-model="item.name"
          @change="onNameChange($event, item.sheet_id)"
        >

        <v-btn small icon @click="activateSheet('list')">
          <v-icon color="primary">visibility</v-icon>
        </v-btn>
        <v-btn small icon @click="activateSheet('property')">
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
  props: ["item"],
  data: () => ({}),
  computed: {
    classObject() {
      let sheet_id = "";
      if (this.$store.state.selectedSheet) {
        sheet_id = this.$store.state.selectedSheet.sheet_id;
      }

      return {
        "sheet-body": true,
        active: this.item.sheet_id === sheet_id,
        passive: this.item.sheet_id !== sheet_id
      };
    },
    classHandle() {
      let sheet_id = "";
      if (this.$store.state.selectedSheet) {
        sheet_id = this.$store.state.selectedSheet.sheet_id;
      }

      return {
        "itm-handle": true,
        "itm-handle-active": this.item.sheet_id === sheet_id
      };
    },
    selectedSheet() {
      return this.$store.state.selectedSheet;
    }
  },
  methods: {
    onNameChange: function(e, id) {
      this.$store.dispatch("UPDATE_SHEET_VALUES", {
        id: this.item.sheet_id,
        values: [{ field: "name", value: e.target.value }]
      });
    },
    sheetIndicator: function(itm) {
      const status = ["success", "yellow", "error"];
      return status[itm];
    },
    onBodyClick: function() {
      this.$store.commit("UPDATE_MAIN_USER", {
        selectedSheet: this.item.sheet_id
      });
    },
    activateSheet(sheetViews) {
      /* Проверка на то, в каком из layout откроется sheet */
      let additionalSheet;
      const layout = this.$store.getters.isShowAdditional(
        this.$vuetify.breakpoint
      )
        ? 2
        : 1;
      if (layout === 2) {
        additionalSheet = this.$store.getters.additionalSheet;
      }

      /* В зависимости от типа выбранного представления будет, открыт в доступно layout либо
				'список элементов' в sheet, либо 'свойства' этого sheet */
      if (sheetViews === "list") {
        /* Для списка элементов */
        if (
          additionalSheet &&
          additionalSheet.sheet_id === this.item.sheet_id &&
          additionalSheet.type_el === this.item.type_el
        )
          return;

        this.$store
          .dispatch("ADD_LAYOUT", {
            layout,
            sheet_id: this.item.sheet_id,
            type_el: this.item.type_el
          })
          .then(() => {
            if (layout === 2) {
              /* Если открывается в additional layout, то необходимо закрыть предыдущее представление,
							в случае если оно уже открыто*/
              if (
                additionalSheet &&
                additionalSheet.type_el === "property-sheet"
              ) {
                this.$store.dispatch("REMOVE_LAYOUT", additionalSheet);
              }
            }

            return Promise.resolve(true);
          });
      } else if (sheetViews === "property") {
        if (additionalSheet && additionalSheet.type_el === "property-sheet")
          return;

        this.$store
          .dispatch("ADD_LAYOUT", {
            layout,
            sheet_id: this.item.sheet_id,
            type_el: "property-sheet"
          })
          .then(() => {
            if (layout === 2) {
              if (
                additionalSheet &&
                additionalSheet.sheet_id === this.item.sheet_id
              ) {
                this.$store.dispatch("REMOVE_LAYOUT", additionalSheet);
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
