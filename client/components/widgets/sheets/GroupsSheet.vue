<template>
  <div class="groups-sheet">
    <div class="groups-sheet-header">
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
    </div>

    <v-divider class="ma-0"></v-divider>

    <div class="groups-sheet-body">
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
            <GroupItem :sheet_id="thisSheet.sheet_id" :item="item"></GroupItem>
          </div>
        </draggable>

        <infinite-loading @infinite="infiniteHandler" ref="infLoadingGroupsSheet"></infinite-loading>
      </vue-perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import GroupItem from "../items/GroupItem.vue";
import VuePerfectScrollbar from "../../Perfect-scrollbar.vue";
import InfiniteLoading from "../../InfiniteLoading";
import { recursiveFind } from "../../../util/helpers";

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
    sheet_id: {
      type: String,
      required: true
    }
  },
  data: () => ({
    thisSheet: null,
    searchText: "",
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
			1 - add subgroup    000001
			2 - delete group    000010
			4 - move up         000100
			8 - move down       001000
			16 - move in group  010000
			32 - move out group 100000
		*/
    isAllowedOperation() {
      let result = 0;

      if (this.thisSheet.selectedItem) {
        if (this.thisSheet.selectedItem.group_type > 1) {
					result += 2;
				}

        function recurr(sheet, id) {
          let res = 0;

          for (let i = 0; i < sheet.length; i++) {
            if (sheet[i].id === id) {
              if (sheet[i].level === 1) {
                res += 1;

                if (i > 0) res += 4;
                if (
                  i < sheet.length 
                  // && i < sheet.length - 1
                )
                  res += 8;
              } else if (sheet[i].level > 1 && sheet[i].level < 3) {
                res += 1;

                if (i > 0) res += 4;
                if (i < sheet.length - 1) res += 8;
              }

              if (i > 0 && (sheet[i].level < 3)) {
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
      return { group: this.sheet_id, handle: ".group-handle" };
    },
    onSelectSheet: function() {
      this.$store.commit("SET_SELECTED", { sheet_id: this.sheet_id });
    },
    onChange: function(value) {
      this.searchText = value;
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
        .dispatch("REORDER_GROUPS", {
          oldIndex: oldIndex,
          newIndex: newIndex,
          fromParent_id: from.dataset.parent_id ? from.dataset.parent_id : null,
          toParent_id: to.dataset.parent_id ? to.dataset.parent_id : null,
          sheet_id: this.sheet_id
        })
        .catch(err => {
          console.warn(err);
        });
    },
    onMoveIn: function() {
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
          this.$store.dispatch("REORDER_GROUPS", options);
        } else {
          this.$store
            .dispatch("FETCH_GROUPS", {
              sheet_id: this.sheet_id,
              parent_id: toParent_id
            })
            .then(count => {
              this.$store.dispatch("REORDER_GROUPS", options);
            })
            .catch(err => {
              console.warn(err);
            });
        }
      }
    },
    onMoveOut: function() {
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
          .dispatch("REORDER_GROUPS", {
            oldIndex: index,
            newIndex: lastParentIndex,
            fromParent_id: element.parent ? element.parent.id : null,
            toParent_id: toParent ? toParent.id : null,
            move_out: true,
            sheet_id: this.sheet_id
          })
          .catch(err => {
            console.warn(err);
          });
      }
    },
    onMove: function(UP = true) {
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
        this.$store.dispatch("REORDER_GROUPS", {
          oldIndex: index,
          newIndex: newIndex,
          fromParent_id: element.parent ? element.parent.id : null,
          toParent_id: element.parent ? element.parent.id : null,
          sheet_id: this.sheet_id
        });
      }
    },
    onAddItem(isSubelement = false) {
      this.$store.dispatch("CREATE_GROUP", {
        sheet_id: this.sheet_id,
        isSubelement,
        isStart: true
      });
    },
    onDeleteItem() {
      this.$store
        .dispatch("DELETE_GROUP", { sheet_id: this.sheet_id })
        .catch(err => {
          console.warn(err);
        });
    },
    infiniteHandler($state) {
      if (this.countEl == 0) {
        this.countEl++;
        return this.$store
          .dispatch("FETCH_GROUPS", { sheet_id: this.sheet_id })
          .then(count => {
            this.countEl--;
            if (count) {
              $state.loaded();
            } else {
              $state.complete();
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
    }
  }
};
</script>

<style lang="css">
.groups-sheet {
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14),
    0 1px 3px 0 rgba(0, 0, 0, 0.12);
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.groups-sheet-header {
  display: flex;
}

.groups-sheet-body {
  padding: 1px;
  margin: 0px;
}
</style>

<style lang="stylus">
.drawer-menu--scroll {
  height: calc(70vh);
  overflow: auto;
}
</style>
