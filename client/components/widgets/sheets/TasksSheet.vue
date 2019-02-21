<template>
  <div class="itm-sheet">
    <div class="itm-sheet-header">
      <v-icon style="cursor: pointer;" v-bind:color="selectedSheet" @click="onSelectSheet">bookmark</v-icon>

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
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="itm-sheet-body">
      <vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings" ref="sheet_id">
        <draggable
          v-model="items"
          :options="getDraggableOptions()"
          @start="onDragStart"
          @end="onDrop"
          v-bind:data-parent_id="null"
        >
          <div
            v-for="(item, index) in items"
            :key="item.id"
            v-bind:data-id="item.id"
            v-bind:data-parent_id="(item.parent) ? item.parent.id : null"
          >
            <TaskItem :sheet_id="thisSheet.sheet_id" :item="item"></TaskItem>
          </div>
        </draggable>

        <infinite-loading @infinite="infiniteHandler" ref="infLoadingTasksSheet"></infinite-loading>
      </vue-perfect-scrollbar>
    </div>
    <!-- tasks-sheet-body -->
  </div>
  <!-- tasks-sheet -->
</template>

<script>
import TaskItem from "../items/TaskItem.vue";
import VuePerfectScrollbar from "../../Perfect-scrollbar.vue";
import InfiniteLoading from "../../InfiniteLoading";
import { recursiveFind } from "../../../util/helpers";

import draggable from "vuedraggable";

export default {
  name: "tasks-sheet",
  components: {
    TaskItem,
    VuePerfectScrollbar,
    InfiniteLoading,
    draggable
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
    countEl: 0, //pass to load data
    blocked: false
    // showActiveTasksSheet: false //shows selected user sheet, my or all. Its for animation
  }),
  created() {
    this.thisSheet = this.$store.state.sheets.find(
      el => el.sheet_id === this.sheet_id
    );
  },
  computed: {
    items: {
      get() {
        return this.thisSheet.sheet;
      },
      set(value) {}
    },
    selectedSheet() {
      return this.thisSheet === this.$store.state.selectedSheet
        ? "primary"
        : "";
    },
    /*
			1 - add subtask    000001
			2 - delete task    000010
			4 - move up        000100
			8 - move down      001000
			16 - move in task  010000
			32 - move out task 100000
		*/
    isAllowedOperation() {
      let result = 0;
      // const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)

      if (this.thisSheet.selectedItem) {
        result += 2;

        function recurr(sheet, id) {
          let res = 0;

          for (let i = 0; i < sheet.length; i++) {
            if (sheet[i].id === id) {
              if (sheet[i].level === 1) {
                res += 1;

                if (i > 1 && !sheet[i - 1].isDivider) res += 4;
                if (
                  i < sheet.length &&
                  i < sheet.length - 1 &&
                  !sheet[i + 1].isDivider
                )
                  res += 8;
              } else if (sheet[i].level > 1 && sheet[i].level < 3) {
                res += 1;

                if (i > 0) res += 4;
                if (i < sheet.length - 1) res += 8;
              }

              if (i > 0 && !sheet[i - 1].isDivider & (sheet[i].level < 3)) {
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

        result =
          result + recurr(this.thisSheet.sheet, this.thisSheet.selectedItem.id);
      }

      return result;
    }
  },
  methods: {
    getDraggableOptions: function() {
      return { group: this.sheet_id, handle: ".task-handle" };
    },
    onSelectSheet: function() {
      this.$store.commit("SET_SELECTED", { sheet_id: this.sheet_id });
    },
    onChange: function(value) {
      console.log("changed searchText: " + value);
      this.like = value;
      let that = this;

      function que(params) {
        if (that.countEl == 0) {
          that.$refs.infLoadingTasksSheet.$emit("$InfiniteLoading:reset");
          that.blocked = false;
          console.log("ask");

          return;
        } else {
          that.blocked = true;
          console.log("wait");
          setTimeout(que, 400);
        }
      }

      if (!this.blocked) que();
    },
    onDragStart: function(dragResult) {
      const { item } = dragResult;

      this.$store.commit("SET_SELECTED", {
        sheet_id: this.sheet_id,
        id: item.dataset.id
      });
    },
    onDrop: function(dropResult) {
      const { newIndex, oldIndex, from, to } = dropResult;

      if (from.dataset.parent_id === to.dataset.parent_id) {
        if (oldIndex === newIndex) {
          return;
        }
      }

      this.$store
        .dispatch("REORDER_TASKS", {
          oldIndex: oldIndex,
          newIndex: newIndex,
          fromParent_id: from.dataset.parent_id ? from.dataset.parent_id : null,
          toParent_id: to.dataset.parent_id ? to.dataset.parent_id : null,
          sheet_id: this.sheet_id
        })
        .then(res => {
          console.log("reordering sheet");
        })
        .catch(err => {
          console.warn(err);
        });
    },
    onMoveIn: function() {
      // const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
      if (this.thisSheet.selectedItem) {
        let toParent_id;
        const { index, element } = recursiveFind(
          this.thisSheet.sheet,
          el => el.isActive
        );

        if (element.parent === null) {
          toParent_id = this.thisSheet.sheet[index - 1].id;
        } else {
          if (element.parent.children && element.parent.children.length > 1) {
            toParent_id = element.parent.children[index - 1].id;
          }
        }

        const options = {
          oldIndex: index,
          newIndex: 0,
          fromParent_id: element.parent ? element.parent.id : null,
          toParent_id: toParent_id,
          sheet_id: this.sheet_id
        };

        if (Array.isArray(element.children) && element.children.length > 0) {
          this.$store.dispatch("REORDER_TASKS", options);
        } else {
          this.$store
            .dispatch("FETCH_TASKS", {
              sheet_id: this.sheet_id,
              parent_id: toParent_id
            })
            .then(count => {
              this.$store.dispatch("REORDER_TASKS", options);
            })
            .catch(err => {
              console.warn(err);
            });
        }
      }
    },
    onMoveOut: function() {
      //debugger
      // const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
      if (this.thisSheet.selectedItem) {
        let toParent, lastParentIndex;
        const { index, element } = recursiveFind(
          this.thisSheet.sheet,
          el => el.isActive
        );
        if (element.parent !== null) {
          toParent = element.parent.parent;

          if (toParent === null) {
            lastParentIndex = recursiveFind(
              this.thisSheet.sheet,
              el => el.id === element.parent.id
            ).index;
            if (lastParentIndex < this.thisSheet.sheet.length)
              lastParentIndex++;
          } else {
            lastParentIndex = recursiveFind(
              toParent.children,
              el => el.id === element.parent.id
            ).index;
            if (lastParentIndex < toParent.children.length) lastParentIndex++;
          }
        } else {
          return;
        }

        this.$store
          .dispatch("REORDER_TASKS", {
            oldIndex: index,
            newIndex: lastParentIndex,
            fromParent_id: element.parent ? element.parent.id : null,
            toParent_id: toParent ? toParent.id : null,
            move_out: true,
            sheet_id: this.sheet_id
          })
          .then(res => {
            console.log("move out");
          })
          .catch(err => {
            console.warn(err);
          });
      }
    },
    onMove: function(UP = true) {
      // const activeSheet = this.$store.state.sheets.find(el => el.sheet_id === this.sheet_id)
      if (this.thisSheet.selectedItem) {
        let newIndex;
        const { index, element } = recursiveFind(
          this.thisSheet.sheet,
          el => el.isActive
        );

        /* Выбор новой позиции для перемещаемого элемента, перемещаем вверх/вниз, из-за наличия
					divider на первом уровне, логика для первого и вложенного уровней различна */
        newIndex = index;
        if (element.parent === null) {
          /* divider в списке является разделителем групп, если наткнулись на разделитель выше,
						значит достигнуто начало списка и элемент по кругу необходимо переместить в конец
						списка, для этого прокрутим список назад до конца или следующего разделителя */
          if (UP && index > 0 && this.thisSheet.sheet[index - 1].isDivider) {
            /* бежим вниз до границы */
            for (let i = index; i < this.thisSheet.sheet.length; i++) {
              if (this.thisSheet.sheet[i].isDivider) break;

              newIndex = i;
            }
          } else if (
            !UP &&
            (index === this.thisSheet.sheet.length ||
              (index < this.thisSheet.sheet.length &&
                this.thisSheet.sheet[index + 1].isDivider))
          ) {
            /* перемещаемся на позицию ниже, если достигли конца списка или достигли divider
							необходимо переместить элемент по кругу в начало divider этой группы
							бежим вверх по списку, пока не обнаружим начало */
            for (let i = index; i >= 0; i--) {
              if (this.thisSheet.sheet[i].isDivider) break;

              newIndex = i;
            }
          } else {
            /* свободно двигаемся на позицию выше / ниже*/
            newIndex = UP ? index - 1 : index + 1;
          }
        } else {
          /* вложенные уровни не содержат divider поэтому элементы сортируются в порядке группы
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
            /* свободно двигаемся на позицию выше / ниже */
            newIndex = UP ? index - 1 : index + 1;
          }
        }

        /* нет смысла перемещать элемент у которого не изменилась позиция */
        if (newIndex === index) return;

        /* передаем хранилищу смещение элемента */
        this.$store.dispatch("REORDER_TASKS", {
          oldIndex: index,
          newIndex: newIndex,
          fromParent_id: element.parent ? element.parent.id : null,
          toParent_id: element.parent ? element.parent.id : null,
          sheet_id: this.sheet_id
        });
      }
    },
    onAddItem(isSubelement = false) {
      this.$store.dispatch("CREATE_TASK", {
        sheet_id: this.sheet_id,
        isSubelement,
        isStart: true
      });
    },
    onDeleteItem() {
      this.$store
        .dispatch("DELETE_TASK", { sheet_id: this.sheet_id })
        .catch(err => {
          console.log(err);
        });
    },
    infiniteHandler($state) {
      if (this.countEl == 0) {
        this.countEl++;
        console.log(`1** infiniteHandler fetch tasks CNT: ${this.countEl}`);
        return this.$store
          .dispatch("FETCH_TASKS", { sheet_id: this.sheet_id })
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
            console.log(err);
          });
      }
    }
    // activeClick: function(activeID) {
    // 	this.countEl = 0
    // 	this.$store.commit('SET_ACTIVE_TASKS_SHEET', activeID)
    // 	this.$nextTick(() => {
    //     this.$refs.infLoadingTasksSheet.$emit('$InfiniteLoading:reset')
    //   })

    // 	this.showActiveTasksSheet = !this.showActiveTasksSheet
    //   setTimeout(() => {
    //     this.showActiveTasksSheet = !this.showActiveTasksSheet
    //   }, 500)
    // }
  }
};
</script>

<style lang="css">
</style>
