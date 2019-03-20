<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <v-btn small icon @click="onCreateItem">
        <v-icon color="primary">add_circle</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 2" @click="onDeleteItem">
        <v-icon color="primary">delete</v-icon>
      </v-btn>

      <div style="margin: auto;">
        <p class="blank-title">All {{sheet_id}}</p>
      </div>

      <v-btn small icon @click="onCloseSheet">
        <v-icon color="primary">clear</v-icon>
      </v-btn>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="sheet_id">
        <div v-for="(item, index) in items" :key="item.sheet_id">
          <SheetItem :item="item"></SheetItem>
        </div>
      </vue-perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import SheetItem from "../items/SheetItem.vue";
import VuePerfectScrollbar from "../../Perfect-scrollbar.vue";
import { sheetNameForType } from "../../../util/helpers";

export default {
  name: "manage-sheet",
  components: {
    VuePerfectScrollbar,
    SheetItem
  },
  props: {
    /* this equal type_el */
    sheet_id: {
      type: String,
      required: true
    }
  },
  data: () => ({
    scrollSettings: {
      maxScrollLength: 10
    }
  }),
  created() {},
  computed: {
    isAllowedOperation() {
      /*
				1 - create 	  000001
				2 - delete    000010
			*/
      let result = 0;
      if (this.$store.state.selectedSheet) {
        result += 2;
      }

      return result;
    },
    items: {
      get() {
        const st = this.$store.state;
        return st.sheets.filter(el => el.type_el === this.sheet_id);
      },
      set(value) {}
    }
  },
  methods: {
    onCreateItem() {
      const type_el = sheetNameForType(this.sheet_id);
      const newSheet = {
        type_el,
        layout: 1,
        name: "New sheet",
        visible: false
      };

      this.$store.dispatch("CREATE_SHEET_ELEMENT", newSheet).catch(err => {
        console.warn(err);
      });
    },
    onDeleteItem() {
      const selectedSheet = this.$strore.state.selectedSheet;

      if (selectedSheet) {
        this.$store
          .dispatch("DELETE_SHEET_ELEMENT", { id: selectedSheet.sheet_id })
          .catch(err => {
            console.warn(err);
          });
      }
    },
    onCloseSheet() {
      /* Т.к. ManageSheet открывается только в general layout, то однозначно известно
				из какого layout его следует удалить, при этом если данный sheet последний в списке, то
				sheet из additional layout переносится на его место */
      const generalSheet = this.$store.getters.generalSheet;
      this.$store.dispatch("REMOVE_LAYOUT", generalSheet).then(() => {
        const additionalSheet = this.$store.getters.additionalSheet;
        if (additionalSheet) {
          const copy = Object.assign({}, additionalSheet);
          copy.layout = 1;
          return this.$store.dispatch("REMOVE_LAYOUT", copy).then(() => {
            if (copy.type_el === "property-sheet") {
              return Promise.resolve(true);
            } else {
              return this.$store.dispatch("ADD_LAYOUT", copy);
            }
          });
        } else {
          return Promise.resolve(true);
        }
      });
    }
  }
};
</script>

<style lang="css">
</style>
