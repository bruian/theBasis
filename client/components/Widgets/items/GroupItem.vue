<template>
  <div class="group-container">
    <div v-bind:class="classObject" v-if="!item.isDivider && item.isShowed" @click="onBodyClick">
      <div class="group-clmn2">
        <div
          v-bind:class="{ 'itm-handle': true, 'itm-handle-active': item.isActive }"
          @mousedown="dragHandleDown"
          @mouseup="dragHandleUp"
        ></div>
        <VCircle dot small :color="groupIndicator(item.consistency)"></VCircle>
      </div>

      <div class="group-clmn1">
        <v-avatar tile :size="64">
          <img src="/public/defaultGroup.png" alt="avatar">
        </v-avatar>
      </div>

      <div class="group-clmn2">
        <div class="vert-filler"></div>

        <v-icon
          @click="onExpandSubElements()"
          v-show="item.depth > 1"
          class="expand-ico"
          slot="activator"
          color="primary"
          dark
        >{{ (item.isSubElementsExpanded > 1) ? "expand_less" : "expand_more" }}</v-icon>
      </div>

      <div class="group-clmn3">
        <p>
          <b>{{item.name}}</b>
        </p>
        <p>Personal group</p>
        <p>id: {{ item.id }}</p>
      </div>

      <div class="group-clmn4">
        <v-icon
          @click="onExpandMore(item)"
          class="expand-ico"
          slot="activator"
          color="primary"
          dark
        >{{ (item.isExpanded) ? "unfold_less" : "unfold_more" }}</v-icon>

        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" class="expand-ico" color="primary">more_horiz</v-icon>
          </template>
          <v-list>
            <v-list-tile v-for="(item, index) in moreMenu" :key="index" @click="onMenu(item.id)">
              <v-list-tile-avatar>
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- group-body -->
    <div class="group-expander" v-show="item.isExpanded">
      <v-tabs slot="extension" slider-color="primary" v-model="currentTab">
        <v-tabs-slider></v-tabs-slider>
        <v-tab v-for="(tab, index) in tabs" :key="index">{{ tab.name }}</v-tab>
      </v-tabs>
      <v-tabs-items v-model="currentTab">
        <v-tab-item v-for="(tab, index) in tabs" :key="index">
          <component v-bind:is="currentTabComponent" :item="item" :sheet_id="sheet_id"></component>
        </v-tab-item>
      </v-tabs-items>
    </div>

    <draggable
      v-model="items"
      v-show="(item.isSubElementsExpanded > 1)"
      :options="getDraggableOptions()"
      @start="onDragStart"
      @end="onDrop"
      v-bind:data-parent_id="item.id"
    >
      <div
        v-for="(children, index) in items"
        :key="children.id"
        v-bind:data-id="children.id"
        v-bind:data-parent_id="(children.parent) ? children.parent.id : '0'"
      >
        <GroupItem :sheet_id="sheet_id" :item="children" @drop="onDrop"></GroupItem>
      </div>
    </draggable>
  </div>
</template>

<script>
import itmTextArea from "../itmTextArea.vue";
import VCircle from "../../VCircle/VCircle.js";
import { isNumeric, activityStatus } from "../../../util/helpers.js";

import draggable from "vuedraggable";

const tabs = [
  {
    name: "Property",
    component: () => import("../itemElements/GroupPropertyTab.vue")
  },
  {
    name: "Group rights",
    component: { template: "<div>Very soon</div>" }
  },
  {
    name: "Element rights",
    component: { template: "<div>Coming soon</div>" }
  }
];

export default {
  name: "group-item",
  components: {
    GroupItem: () => import("./GroupItem.vue"),
    VCircle,
    itmTextArea,
    draggable
  },
  props: ["item", "sheet_id"],
  data: () => ({
    direction: "right",
    hover: false,
    transition: "slide-x-transition",
    moreMenu: [
      { id: 0, title: "Show list", icon: "visibility" },
      { id: 1, title: "Show with inner", icon: "" }
      // { id: 2, title: "Property", icon: "tune" }
    ],
    groupChangeStart: false,
    isTagsInitialized: false,
    tabs: tabs,
    currentTab: 1,
    timeoutID: null
  }),
  computed: {
    currentTabComponent: function() {
      return this.tabs[this.currentTab].component;
    },
    items: {
      get() {
        return this.item.children;
      },
      set(value) {}
    },
    mainGroupsMini() {
      return this.$store.getters.mainGroupsMini;
    },
    classObject() {
      const classObj = {
        "group-body": true,
        "group-level-2": false,
        "group-level-3": false,
        active: this.item.isActive,
        passive: !this.item.isActive
      };

      if (this.item.level === 2) {
        classObj["group-level-2"] = true;
      } else if (this.item.level === 3) {
        classObj["group-level-3"] = true;
      }

      return classObj;
    }
  },
  watch: {
    currentTab() {
      if (this.tabs[this.currentTab].name === "Activity") {
      }
    }
  },
  // beforeDestroy() {
  // clearTimeout(this.timeoutID)
  // },
  methods: {
    onNameChange: function(text) {
      this.$store
        .dispatch("UPDATE_ELEMENT", {
          sheet_id: this.sheet_id,
          id: this.item.id,
          name: text
        })
        .catch(err => {
          console.warn(err);
        });
    },
    groupIndicator: function(itm) {
      const status = ["success", "yellow", "error"];
      return status[itm];
    },
    getDraggableOptions: function() {
      return { group: this.sheet_id, handle: ".itm-handle" };
    },
    onDragStart: function(dragResult) {
      const { item } = dragResult;

      this.$store.commit("SELECT_ELEMENT", {
        sheet_id: this.sheet_id,
        id: item.dataset.id
      });
    },
    onDrop: function(dropResult) {
      this.$emit("drop", dropResult);
    },
    dragHandleDown: function() {
      if (this.item.isSubElementsExpanded > 1) {
        this.item.isSubElementsExpanded = 1;
      }
    },
    dragHandleUp: function() {
      if (this.item.isSubElementsExpanded === 1) {
        this.item.isSubElementsExpanded = 2;
      }
    },
    onBodyClick: function() {
      this.$store.commit("SELECT_ELEMENT", {
        sheet_id: this.sheet_id,
        id: this.item.id
      });
    },
    onMenu(id) {
      if (id === 0) {
        this.activateLayout("list-sheet");
      } else if (id === 1) {
        this.activateLayout("list-sheet", true);
      } else if (id === 2) {
        this.activateLayout("property-sheet");
      }
    },
    onExpandMore() {
      if (!this.item.isExpanded) {
        this.currentTab = 0;
      }

      this.$store.commit("UPDATE_ELEMENT", {
        sheet_id: this.sheet_id,
        id: this.item.id,
        isExpanded: !this.item.isExpanded
      });
    },
    onExpandSubElements() {
      if (Array.isArray(this.item.children) && this.item.children.length > 0) {
        this.$store.commit("UPDATE_ELEMENT", {
          sheet_id: this.sheet_id,
          id: this.item.id,
          isSubElementsExpanded: this.item.isSubElementsExpanded > 1 ? 0 : 2
        });
      } else {
        return this.$store
          .dispatch("FETCH_ELEMENTS", {
            sheet_id: this.sheet_id,
            parent_id: this.item.id
          })
          .then(count => {
            this.$store.commit("UPDATE_ELEMENT", {
              sheet_id: this.sheet_id,
              id: this.item.id,
              isSubElementsExpanded: this.item.isSubElementsExpanded > 1 ? 0 : 2
            });
          })
          .catch(err => {
            console.warn(err);
          });
      }
    },
    activateLayout(type_layout, withDescendants = false) {
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

      /* В зависимости от типа выбранного layout, будет открыт либо
				'список элементов' для sheet, либо 'свойства' этого sheet */
      if (type_layout === "list-sheet") {
        /* Для списка элементов, из groups-sheet можно открыть tasks-sheet. Открытый sheet можно
					временно разместить в service sheet. Для этого специально обновляется информация что
					должен содержать этот sheet */

        const taskServiceSheet = this.$store.state.sheets.find(
          el => el.service && el.type_el === "tasks-sheet"
        );
        /* Добавление нового layout для временного sheet */

        this.$store
          .dispatch("UPDATE_SHEET_VALUES", {
            id: taskServiceSheet.sheet_id,
            values: [
              { field: "name", value: `Tasks for ${this.item.name}` },
              {
                field: "condition",
                value: {
                  group_id: withDescendants
                    ? this.$store.getters.listGroupsHierarchy(this.item.id)
                    : [this.item.id]
                }
              }
            ]
          })
          .then(() => {
            if (position === 2) {
              /* Если открывается в additional layout, то необходимо закрыть предыдущее представление,
          		 в случае если оно уже открыто*/
              if (
                additionalLayout &&
                (additionalLayout.type_layout === "property-sheet" ||
                  additionalLayout.type_layout === "list-sheet")
              ) {
                return this.$store.dispatch("REMOVE_LAYOUT", additionalLayout);
              }
            } else {
              return Promise.resolve(true);
            }
          })
          .then(() => {
            this.$store.dispatch("ADD_LAYOUT", {
              type_layout,
              position,
              sheet_id: taskServiceSheet.sheet_id,
              type_el: taskServiceSheet.type_el,
              element_id: ""
            });
          });
      } else if (type_layout === "property-sheet") {
      }
    }
  }
};
</script>

<style lang="css">
.group-container {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin-bottom: 0.1em;
}

.group-body {
  margin-top: 0.3em;
  margin-right: 0.3em;
  margin-left: 0.3em;
  display: flex;
  flex-flow: row nowrap;
  background-color: #f8f9fa;
  /* box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2); */
}

.group-body:hover,
.group-body:focus,
.group-body:active {
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(0, 0, 0, 0.1) inset;
}

.group-clmn1 {
  align-self: center;
  width: 64px;
  min-height: 47px;
  margin: 0.3em;
}

.group-clmn1 .v-btn--floating.v-btn--small {
  height: 35px;
  width: 35px;
  outline: none;
}

.v-speed-dial--direction-right {
  z-index: 1;
}

.group-clmn2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  margin: 2px 2px 2px 0px;
}

.group-clmn3 {
  flex: 1 1 auto;
  margin: 2px 1px 1px 1px;
}

.group-clmn3 p {
  margin-bottom: 2px;
}

.group-clmn4 {
  /* width: 120px; */
  margin: 1px 2px 2px 1px;
  display: flex;
  flex-flow: column;
  align-content: space-between;
}

.group-level-2 {
  margin-left: 8px;
}

.group-level-3 {
  margin-left: 12px;
}

.group-duration {
  font-size: 12px;
  padding-top: 2px;
  padding-left: 1px;
}

.group-status .v-icon {
  color: #5dc282;
  font-size: 1.1rem;
}

.group-id {
  flex: 2;
  font-size: 0.9rem;
  font-size: 12px;
  padding-top: 2px;
  padding-left: 3px;
  text-align: center;
}

.expand-ico {
  flex: 1;
  text-align: right;
}

.vert-filler {
  flex-grow: 2;
  min-width: 22px;
}

.group-expander {
  margin-left: 0.3em;
  margin-right: 0.3em;
  margin-top: 1px;
}

.group-expander .v-tabs__bar {
  background: none;
}

.group-expander .v-tabs__container {
  height: auto;
}

.group-expander .v-card {
  background: none;
  border: none;
}
</style>
