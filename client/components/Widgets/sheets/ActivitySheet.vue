<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <v-icon style="cursor: pointer;" v-bind:color="selectedSheet" @click="onSelectSheet">bookmark</v-icon>

      <v-btn small icon @click="onAddItem(false)">
        <v-icon color="primary">add_circle</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 2" @click="onDeleteItem">
        <v-icon color="primary">delete</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 4" @click="onMove(true)">
        <v-icon color="primary">arrow_upward</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 8" @click="onMove(false)">
        <v-icon color="primary">arrow_downward</v-icon>
      </v-btn>

      <div style="margin: auto;">
        <p style="margin: auto;">{{thisSheet.name}}</p>
      </div>

      <v-btn small icon @click="onCloseLayout">
        <v-icon color="primary">clear</v-icon>
      </v-btn>
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="layout.id">
        <draggable v-model="items" :options="getDraggableOptions()">
          <div v-for="(item, index) in items" :key="item.id" v-bind:data-id="item.id">
            <ActivityItem :sheet="thisSheet" :item="item"></ActivityItem>
          </div>
        </draggable>

        <infinite-loading
          @infinite="infiniteHandler"
          :identifier="infiniteId"
          ref="infLoadingActivitySheet"
        ></infinite-loading>
      </vue-perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import ActivityItem from "../items/ActivityItem.vue";
import VuePerfectScrollbar from "../../Perfect-scrollbar.vue";
import InfiniteLoading from "vue-infinite-loading";
import {
  recursiveFind,
  findGroup,
  getElements,
  activityStatus
} from "../../../util/helpers";
import moment from "moment";

import draggable from "vuedraggable";

export default {
  name: "activity-sheet",
  components: {
    ActivityItem,
    VuePerfectScrollbar,
    InfiniteLoading,
    draggable
  },
  props: {
    layout: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    thisSheet: null,
    like: "",
    scrollSettings: {
      maxScrollLength: 10
    },
    countEl: 0, //pass to load data
    blocked: false
  }),
  created() {
    this.thisSheet = this.$store.state.sheets.find(
      el => el.sheet_id === this.layout.sheet_id
    );
  },
  computed: {
    infiniteId() {
      return this.thisSheet.infiniteId;
    },
    items: {
      get() {
        const st = this.$store.state;
        /* Получение итогового списка элементов происходит в несколько этапов
					1) Объединение элемента с настройками его отображения
					2) Фильтрация элементов посредством вызова cb функции
				*/
        return getElements(st.Activity, this.thisSheet, (el, sheets) => {
          return true;
        })
          .filter(el => {
            return this.thisSheet.vision.activityStatus[
              activityStatus[el.status].name
            ];
          })
          .reduce((prev, curr, index, arr) => {
            if (
              index === 0 ||
              (!arr[index - 1].isDivider &&
                !moment(curr.start).isSame(arr[index - 1].start, "day"))
            ) {
              const div = {
                isDivider: true,
                id: `div ${moment(curr.start).valueOf()}`,
                start: curr.start,
                name: moment(curr.start).format("DD.MM.YY"),
                isActive: false
              };

              return [...prev, div, curr];
            }

            return [...prev, curr];
          }, []);
      },
      set(value) {}
    },
    selectedSheet() {
      return this.thisSheet === this.$store.state.selectedSheet
        ? "primary"
        : "";
    },
    /*
			2 - delete activity 000010
			4 - move up        	000100
			8 - move down       001000
		*/
    isAllowedOperation() {
      let result = 0;

      if (this.thisSheet.selectedItem) {
        result += 2;

        const id = this.thisSheet.selectedItem.el.id;

        for (let i = 0; i < this.items.length; i++) {
          // result += 1;

          if (i > 1 && !this.items[i - 1].isDivider) result += 4;
          if (
            i < this.items.length &&
            i < this.items.length - 1 &&
            !this.items[i + 1].isDivider
          )
            result += 8;
        }
      }

      return result;
    }
  },
  methods: {
    getDraggableOptions: function() {
      return {
        group: this.layout.sheet_id,
        handle: ".itm-handle",
        disabled: true
      };
    },
    onSelectSheet: function() {
      this.$store.commit("SELECT_ELEMENT", { sheet_id: this.layout.sheet_id });
    },
    onMove: function(UP = true) {
      if (this.thisSheet.selectedItem) {
        const { index, element } = recursiveFind(
          this.items,
          el => el.id === this.thisSheet.selectedItem.el.id
        );

        /* Выбор новой позиции для перемещаемого элемента, перемещаем вверх/вниз, из-за наличия
					divider на первом уровне, логика для первого и вложенного уровней различна */
        let newIndex = index;

        /* divider в списке является разделителем групп, если наткнулись на разделитель выше,
					значит достигнуто начало списка и элемент по кругу необходимо переместить в конец
					списка, для этого прокрутим список назад до конца или следующего разделителя */
        if (UP && index > 0 && this.items[index - 1].isDivider) {
          /* бежим вниз до границы */
          for (let i = index; i < this.items.length; i++) {
            if (this.items[i].isDivider) break;

            newIndex = i;
          }
        } else if (
          !UP &&
          (index === this.items.length ||
            (index < this.items.length && this.items[index + 1].isDivider))
        ) {
          /* перемещаемся на позицию ниже, если достигли конца списка или достигли divider
						необходимо переместить элемент по кругу в начало divider этой группы
						бежим вверх по списку, пока не обнаружим начало */
          for (let i = index; i >= 0; i--) {
            if (this.items[i].isDivider) break;

            newIndex = i;
          }
        } else {
          /* свободно двигаемся на позицию выше/ниже */
          newIndex = UP ? index - 1 : index + 1;
        }

        /* нет смысла перемещать элемент у которого не изменилась позиция */
        if (newIndex === index) return;

        let toId = this.items[newIndex].id;

        /* передаем хранилищу смещение элемента */
        this.$store.dispatch("REORDER_ELEMENTS", {
          fromId: element.id,
          toId,
          sheet_id: this.layout.sheet_id,
          isBefore: newIndex < index
        });
      }
    },
    onAddItem() {
      this.$store
        .dispatch("CREATE_ELEMENT", {
          sheet_id: this.layout.sheet_id,
          isStart: true
        })
        .catch(err => {
          console.warn(err);
        });
    },
    onDeleteItem() {
      this.$store
        .dispatch("DELETE_ELEMENTS", { sheet_id: this.layout.sheet_id })
        .catch(err => {
          console.warn(err);
        });
    },
    infiniteHandler($state) {
      if (this.countEl == 0) {
        this.countEl++;
        console.log(`1** infiniteHandler fetch tasks CNT: ${this.countEl}`);
        return this.$store
          .dispatch("FETCH_ELEMENTS", { sheet_id: this.layout.sheet_id })
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
    },
    onCloseLayout() {
      let selectedLayout;

      if (this.layout.position === 1) {
        selectedLayout = this.$store.getters.generalLayout;
      } else {
        selectedLayout = this.$store.getters.additionalLayout;
      }

      this.$store.dispatch("REMOVE_LAYOUT", selectedLayout);
    }
  }
};
</script>

<style lang="css">
</style>
