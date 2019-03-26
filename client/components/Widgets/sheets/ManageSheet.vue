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
        <p class="blank-title">All {{layout.type_el}}</p>
      </div>

      <v-btn small icon @click="onCloseLayout">
        <v-icon color="primary">clear</v-icon>
      </v-btn>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="layout.id">
        <div v-for="(sheet, index) in sheets" :key="sheet.sheet_id">
          <SheetItem :sheet="sheet"></SheetItem>
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
    layout: {
      type: Object,
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
    sheets: {
      get() {
        const st = this.$store.state;
        return st.sheets.filter(
          el => el.type_el === this.layout.type_el && !el.service
        );
      },
      set(value) {}
    }
  },
  methods: {
    onCreateItem() {
      const type_el = sheetNameForType(this.layout.type_el);
      const newSheet = {
        type_el,
        name: "New sheet"
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
    onCloseLayout() {
      /* Т.к. ManageSheet открывается только в general layout, то однозначно известно
				из какого layout его следует удалить, при этом если данный sheet последний в списке, то
				layout из additional layout переносится на его место */
      const generalLayout = this.$store.getters.generalLayout;
      this.$store.dispatch("REMOVE_LAYOUT", generalLayout).then(() => {
        const additionalLayout = this.$store.getters.additionalLayout;
        if (additionalLayout) {
          const copy = Object.assign({}, additionalLayout);
          copy.position = 1;
          return this.$store.dispatch("REMOVE_LAYOUT", copy).then(() => {
            if (copy.type_layout === "property-sheet") {
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
