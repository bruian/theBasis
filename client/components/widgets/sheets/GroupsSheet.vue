<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <v-icon style="cursor: pointer" v-bind:color="selectedSheet" @click="onSelectSheet">bookmark</v-icon>

      <v-btn small icon @click="onAddItem(false)">
        <v-icon color="primary">add_circle</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 1" @click="onAddItem(true)">
        <v-icon color="primary">add_circle_outline</v-icon>
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

      <v-btn small icon v-show="isAllowedOperation & 16" @click="onMoveIn">
        <v-icon color="primary">arrow_forward</v-icon>
      </v-btn>

      <v-btn small icon v-show="isAllowedOperation & 32" @click="onMoveOut">
        <v-icon color="primary">arrow_back</v-icon>
      </v-btn>

      <div style="margin: auto;">
        <p style="margin: auto;">{{thisSheet.name}}</p>
      </div>

      <v-btn small icon @click="onCloseLayout">
        <v-icon color="primary">clear</v-icon>
      </v-btn>
    </div>

    <v-divider class="ma-0"></v-divider>

    <!-- :options="getDraggableOptions()" -->
    <div class="itm-sheet-body">
      <vue-perfect-scrollbar class="sheet--scroll" :settings="scrollSettings" ref="layout.id">
        <draggable
          v-model="items"
          v-bind="getDraggableOptions()"
          @start="onDragStart"
          @end="onDrop"
          v-bind:data-parent_id="0"
        >
          <div
            v-for="(item, index) in items"
            :key="item.id"
            v-bind:data-id="item.id"
            v-bind:data-parent_id="(item.parent) ? item.parent.id : '0'"
          >
            <GroupItem :sheet_id="thisSheet.sheet_id" :item="item" @drop="onDrop"></GroupItem>
          </div>
        </draggable>

        <infinite-loading
          @infinite="infiniteHandler"
          :identifier="infiniteId"
          ref="infLoadingGroupsSheet"
          force-use-infinite-wrapper
        ></infinite-loading>
      </vue-perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import GroupItem from "../items/GroupItem.vue";
import VuePerfectScrollbar from "../../Perfect-scrollbar.vue";
import InfiniteLoading from "vue-infinite-loading";
import { recursiveFind, findGroup, getElements } from "../../../util/helpers";
import config from "../../../config";

const dbg = !!config.DEBUG_API;

import draggable from "vuedraggable";

export default {
  name: "groups-sheet",
  components: {
    GroupItem,
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
    countEl: 0,
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
					3) Сортировка элементов согласно порядка их следования определённого пользователем
					4) Вставка визуальных разделителей групп
				*/
        return getElements(st.Groups, this.thisSheet, (el, sheets) => {
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
			1 - add subgroup    000001
			2 - delete group    000010
			4 - move up         000100
			8 - move down       001000
			16 - move in group  010000
			32 - move out group 100000
		*/
    isAllowedOperation() {
      let result = 0;

      if (this.thisSheet && this.thisSheet.selectedItem) {
        if (this.thisSheet.selectedItem.el.group_type > 1) {
          result += 2;
        }

        function recurr(sheet, id) {
          let res = 0;

          for (let i = 0; i < sheet.length; i++) {
            if (sheet[i].id === id) {
              if (sheet[i].level === 1) {
                res += 1;

                if (i > 0) res += 4;
                if (i < sheet.length) res += 8;
              } else if (sheet[i].level > 1 && sheet[i].level <= 3) {
                res += 1;

                if (i > 0) res += 4;
                if (i < sheet.length - 1) res += 8;
              }

              if (i > 0 && sheet[i].level < 3) {
                if (sheet[i].level + (sheet[i].depth - 1) < 3) res += 16;
              }
              if (sheet[i].level > 1) res += 32;
            } else if (sheet[i].children && sheet[i].children.length > 0) {
              res = recurr(sheet[i].children, id);
            }

            if (res) break;
          }

          return res;
        }

        result = result + recurr(this.items, this.thisSheet.selectedItem.el.id);
      }

      return result;
    }
  },
  methods: {
    getDraggableOptions: function() {
      return { group: this.layout.sheet_id, handle: ".itm-handle" };
    },
    onSelectSheet: function() {
      this.$store.commit("SELECT_ELEMENT", { sheet_id: this.layout.sheet_id });
    },
    onChange: function(value) {
      this.like = value;
      let that = this;

      function que(params) {
        if (that.countEl == 0) {
          that.$refs.infLoadingGroupsSheet.$emit("$InfiniteLoading:reset");
          that.blocked = false;

          return;
        } else {
          that.blocked = true;
          setTimeout(que, 400);
        }
      }

      if (!this.blocked) que();
    },
    onDragStart: function(dragResult) {
      const { item } = dragResult;

      this.$store.commit("SELECT_ELEMENT", {
        sheet_id: this.layout.sheet_id,
        id: item.dataset.id
      });
    },
    onDrop: function(dropResult) {
      let { newIndex, oldIndex, from, to } = dropResult;

      let fromElement;
      if (from.dataset.parent_id === "0") {
        fromElement = this.items[oldIndex];
      } else {
        fromElement = recursiveFind(
          this.items,
          el => el.id === from.dataset.parent_id
        ).element.children[oldIndex];
      }

      let toElement;
      let parent_id = "0";
      let isBefore = false;
      // toParent_id: to.dataset.parent_id ? to.dataset.parent_id : null,

      /* Проверка на перемещение внутри первого уровня */
      if (
        !fromElement.parent &&
        from.dataset.parent_id === to.dataset.parent_id
      ) {
        /* Если позиция не меняется, то нет необходимости в дальнейших действиях */
        if (oldIndex === newIndex) {
          return;
        }

        /* Необходимо понять, что за элементы меняются при перемещении, если получатель divider,
					то перемещаемый элемент должен встать после divider и получить его группу */
        if (this.items[newIndex].isDivider && newIndex === 0) {
          /* Для самого первого разделителя нет допустимых действий */
          return;
        } else if (this.items[newIndex].isDivider) {
          /* Для последующих разделителей необходимо понять в каком направлении происходит
            перемещение элемента */
          if (newIndex > oldIndex) {
            /* Перемещение сверху вниз - элемент размещается в группе разделителя */
          } else {
            /* Перемещение снизу вверх - элемент размещается в группе предшествущей разделителю */
            isBefore = true;
          }
        } else {
          /* Перемещение элемента на элемент */
          toElement = this.items[newIndex];
          isBefore = !(newIndex > oldIndex);
        }
      } else {
        /* Обработка перемещения с уровня на уровень */

        /* Необходимо вычислить направление перемещения, т.к. на разных уровнях используется
					различная индексация элементов, то необходимо привести перемещение к одному уровню */
        let { index: parentIndex, element: toParent } = recursiveFind(
          this.items,
          el => el.id === to.dataset.parent_id
        );

        if (toParent) {
          toElement = toParent.children[newIndex];
          parent_id = toParent.id;
        } else {
          toElement = this.items[newIndex];
          parent_id = "0";
        }

        if (!toElement) {
          isBefore = true;
        } else {
          if (fromElement.level === toElement.level) {
            /* Перемещение внутри уровня */
            isBefore = !(newIndex > oldIndex);
          } else if (fromElement.level < toElement.level) {
            /* Перемещение снаружи внутрь */

            /* Ограничение по уровню перемещения - всего вложенность не больше 3-х уровней */
            if (toParent.level + fromElement.depth > 3) return;

            isBefore = true;
          } else {
            /* Перемещение изнутри наружу */
            isBefore = true;
          }
        }
      }

      let dispatchObject = {
        fromId: fromElement.id,
        toId: toElement ? toElement.id : "0",
        parent_id,
        isBefore,
        sheet_id: this.layout.sheet_id
      };

      this.$store.dispatch("REORDER_ELEMENTS", dispatchObject).catch(err => {
        console.warn(err);
      });
    },
    onMoveIn: function() {
      if (this.thisSheet.selectedItem) {
        let parent_id;
        const { index, element } = recursiveFind(
          this.items,
          el => el.id === this.thisSheet.selectedItem.el.id
        );

        if (element.parent === null) {
          parent_id = this.items[index - 1].id;
        } else {
          if (element.parent.children && element.parent.children.length > 1) {
            parent_id = element.parent.children[index - 1].id;
          }
        }

        const options = {
          fromId: element.id,
          toId: null,
          parent_id,
          isBefore: true,
          sheet_id: this.layout.sheet_id
        };

        if (Array.isArray(element.children) && element.children.length > 0) {
          this.$store.dispatch("REORDER_ELEMENTS", options);
        } else {
          this.$store
            .dispatch("FETCH_ELEMENTS", {
              sheet_id: this.layout.sheet_id,
              parent_id
            })
            .then(count => {
              this.$store.dispatch("REORDER_ELEMENTS", options);
            })
            .catch(err => {
              console.warn(err);
            });
        }
      }
    },
    onMoveOut: function() {
      if (this.thisSheet.selectedItem) {
        let parent_id;
        const { index, element } = recursiveFind(
          this.items,
          el => el.id === this.thisSheet.selectedItem.el.id
        );

        /* Перемещение из элемента родителя на уровень вверх. Для этого необходимо определить
					ниже какого элемента будет впоследствии стоять перемещаемый элемент. Это по-умолчанию
					считается родительский элемент. Поэтому достаточно передать его id и флаг isBefore,
					который укажет, что элемент необходимо разместить после него. */

        /* Определим нового родителя, логично полагать, что это будет родитель предыдущего
					родителя. Если же у элемента родитель null, то этом может означать только то что
					элемент на самом верху и перемещать нет смысла - выход */
        if (element.parent !== null) {
          parent_id = element.parent.parent;
        } else {
          return;
        }

        this.$store
          .dispatch("REORDER_ELEMENTS", {
            fromId: element.id,
            toId: element.parent.id,
            parent_id: parent_id ? parent_id.id : null,
            isBefore: false,
            sheet_id: this.layout.sheet_id
          })
          .catch(err => {
            console.warn(err);
          });
      }
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
        if (element.parent === null) {
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
        } else {
          /* Вложенные уровни не содержат divider поэтому элементы сортируются в порядке группы
						иная группа у следующего элемента свидетельствует об окончании пределов перемещения
						текущего элемента */
          if (
            UP &&
            (index === 0 ||
              (element.parent.children.length > 0 &&
                element.parent.children[index - 1].group_id !==
                  element.group_id))
          ) {
            /* бежим вниз до границы */
            for (let i = index; i < element.parent.children.length; i++) {
              if (element.parent.children[i].group_id !== element.group_id)
                break;

              newIndex = i;
            }
          } else if (
            !UP &&
            (index === element.parent.children.length ||
              (index < element.parent.children.length &&
                element.parent.children[index + 1].group_id !==
                  element.group_id))
          ) {
            /* бежим вверх пока не обнаружим начало */
            for (let i = index; i >= 0; i--) {
              if (element.parent.children[i].group_id !== element.group_id)
                break;

              newIndex = i;
            }
          } else {
            /* свободно двигаемся на позицию выше/ниже */
            newIndex = UP ? index - 1 : index + 1;
          }
        }

        /* нет смысла перемещать элемент у которого не изменилась позиция */
        if (newIndex === index) return;

        let toId;
        if (element.parent) {
          toId = element.parent.children[newIndex].id;
        } else {
          toId = this.items[newIndex].id;
        }

        /* передаем хранилищу смещение элемента */
        this.$store.dispatch("REORDER_ELEMENTS", {
          fromId: element.id,
          toId,
          parent_id: element.parent ? element.parent.id : null,
          sheet_id: this.layout.sheet_id,
          isBefore: newIndex < index
        });
      }
    },
    onAddItem(isSubelement = false) {
      this.$store.dispatch("CREATE_ELEMENT", {
        sheet_id: this.layout.sheet_id,
        isSubelement,
        isStart: true
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
        dbg &&
          console.log(`1** infiniteHandler fetch tasks CNT: ${this.countEl}`); // eslint-disable-line
        return this.$store
          .dispatch("FETCH_ELEMENTS", { sheet_id: this.layout.sheet_id })
          .then(count => {
            this.countEl--;
            if (count) {
              $state.loaded();
              dbg &&
                console.log(
                  `2** infiniteHandler fetched from srv: ${count} elements CNT: ${
                    this.countEl
                  }`
                ); // eslint-disable-line
            } else {
              $state.complete();
              dbg &&
                console.log(
                  `3** infiniteHandler loaded off CNT: ${this.countEl}`
                ); // eslint-disable-line
            }
          })
          .catch(err => {
            this.countEl = 0;
            console.warn(err);
          });
      }
    },
    onLink: function(id) {
      return this.$store.dispatch("LINK_GROUPS_SHEET", id).catch(err => {
        console.warn(err);
      });
    },
    onUnLink: function(id) {
      return this.$store.dispatch("UNLINK_GROUPS_SHEET", id).catch(err => {
        console.warn(err);
      });
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
