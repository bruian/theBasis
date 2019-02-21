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
          @click="onExpandSubgroups()"
          v-show="item.havechild"
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
        <v-icon @click class="expand-ico" color="primary" dark>more_horiz</v-icon>
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
        v-bind:data-parent_id="(children.parent) ? children.parent.id : null"
      >
        <GroupItem :sheet_id="sheet_id" :item="children"></GroupItem>
      </div>
    </draggable>
  </div>
</template>

<script>
import ItmTextArea from "../ItmTextArea.vue";
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
    ItmTextArea,
    draggable
  },
  props: ["item", "sheet_id"],
  data: () => ({
    direction: "right",
    hover: false,
    transition: "slide-x-transition",
    moreMenu: [{ title: "Add subgroup" }, { title: "Collapse subgroup" }],
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
      return this.$store.state.mainGroupsMini;
    },
    classObject() {
      const classObj = {
        "group-body": true,
        "group-level-2": false,
        "group-level-3": false,
        active: this.item.isActive
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
  beforeDestroy() {
    // clearTimeout(this.timeoutID)
  },
  methods: {
    onNameChange: function(text) {
      this.$store
        .dispatch("UPDATE_GROUP_VALUES", {
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
      this.$store.commit("SET_SELECTED", {
        sheet_id: this.sheet_id,
        id: this.item.id
      });
    },
    onExpandMore() {
      if (!this.item.isExpanded) {
        this.currentTab = 0;
      }

      this.$store.commit("UPDATE_GROUP_VALUES", {
        sheet_id: this.sheet_id,
        id: this.item.id,
        isExpanded: !this.item.isExpanded
      });
    },
    onExpandSubgroups() {
      if (
        Array.isArray(this.item.children) &&
        this.item.children.length === this.item.havechild
      ) {
        this.$store.commit("UPDATE_GROUP_VALUES", {
          sheet_id: this.sheet_id,
          id: this.item.id,
          isSubElementsExpanded: this.item.isSubElementsExpanded > 1 ? 0 : 2
        });
      } else {
        return this.$store
          .dispatch("FETCH_GROUPS", {
            sheet_id: this.sheet_id,
            parent_id: this.item.id
          })
          .then(count => {
            this.$store.commit("UPDATE_GROUP_VALUES", {
              sheet_id: this.sheet_id,
              id: this.item.id,
              isSubElementsExpanded: this.item.isSubElementsExpanded > 1 ? 0 : 2
            });
          })
          .catch(err => {
            console.warn(err);
          });
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
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2);
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
