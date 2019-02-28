<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <v-icon style="cursor: pointer" v-bind:color="selectedSheet" @click="onSelectSheet">bookmark</v-icon>

      <v-btn small icon v-show="isAllowedOperation & 1" @click="onAddItem">
        <v-icon color="primary">add_circle</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 2" @click="onDeleteItem">
        <v-icon color="primary">delete</v-icon>
      </v-btn>

      <div style="margin: auto;">
        <p style="margin: auto;">{{thisSheet.name}}</p>
      </div>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="sheet_id">
        <div v-for="(item, index) in items" :key="item.id" v-bind:data-id="item.id">
          <UserItem :sheet_id="thisSheet.sheet_id" :item="item"></UserItem>
        </div>

        <infinite-loading @infinite="infiniteHandler" ref="infLoadingUsersSheet"></infinite-loading>
      </vue-perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import UserItem from "../items/UserItem.vue";
import VuePerfectScrollbar from "../../Perfect-scrollbar.vue";
import InfiniteLoading from "../../InfiniteLoading";
import { recursiveFind, getElements } from "../../../util/helpers";

export default {
  name: "users-sheet",
  components: {
    UserItem,
    VuePerfectScrollbar,
    InfiniteLoading
  },
  props: {
    sheet_id: {
      type: String,
      required: true
    }
  },
  data: () => ({
    thisSheet: null,
    like: "",
    scrollSettings: {
      maxScrollLength: 10
    },
    countEl: 0,
    blocked: false
  }),
  created() {
    this.thisSheet = this.$store.state.sheets.find(
      el => el.sheet_id === this.sheet_id
    );
  },
  computed: {
    items: {
      get() {
        const st = this.$store.state;
        /* Получение итогового списка элементов происходит в несколько этапов
					1) Объединение элемента с настройками его отображения
					2) Фильтрация элементов посредством вызова cb функции
					3) Сортировка элементов согласно порядка их следования определённого пользователем
					4) Вставка визуальных разделителей групп
				*/
        return getElements(st.Users, this.thisSheet, (el, sheets) => {
          return true;
        });
      },
      set(value) {}
    },
    selectedSheet() {
      return this.thisSheet === this.$store.state.selectedSheet
        ? "primary"
        : "";
    },
    /*
			1 - add user    000001
			2 - delete user 000010
		*/
    isAllowedOperation() {
      let result = 1;

      if (this.thisSheet.selectedItem) {
        result += 2;
      }

      return result;
    }
  },
  methods: {
    getDraggableOptions: function() {
      return { group: this.sheet_id, handle: ".itm-handle" };
    },
    onSelectSheet: function() {
      this.$store.commit("SELECT_ELEMENT", { sheet_id: this.sheet_id });
    },
    onChange: function(value) {
      this.like = value;
      let that = this;

      function que(params) {
        if (that.countEl == 0) {
          that.$refs.infLoadingUsersSheet.$emit("$InfiniteLoading:reset");
          that.blocked = false;

          return;
        } else {
          that.blocked = true;
          setTimeout(que, 400);
        }
      }

      if (!this.blocked) que();
    },
    onAddItem() {},
    onDeleteItem() {},
    infiniteHandler($state) {
      if (this.countEl == 0) {
        this.countEl++;
        console.log(`1** infiniteHandler fetch users CNT: ${this.countEl}`);
        return this.$store
          .dispatch("FETCH_ELEMENTS", { sheet_id: this.sheet_id })
          .then(count => {
            this.countEl--;
            if (count) {
              $state.loaded();
              console.log(
                `2** infiniteHandler fetched from srv: ${count} elements CNT: ${
                  this.countEl
                }`
              );
            } else {
              $state.complete();
              console.log(
                `3** infiniteHandler loaded off CNT: ${this.countEl}`
              );
            }
          })
          .catch(err => {
            this.countEl = 0;
            console.warn(err);
          });
      }
    }
  }
};
</script>

<style lang="css">
</style>
