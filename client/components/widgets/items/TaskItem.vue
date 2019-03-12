<template>
  <div class="task-container">
    <div class="task-divider-body" v-if="item.isDivider">
      <div class="task-divider-clmn1">
        <p>id: {{ item.group_id }} | Группа: {{ item.name }}</p>
      </div>
    </div>

    <div v-bind:class="classObject" v-if="!item.isDivider && item.isShowed" @click="onBodyClick">
      <div class="task-clmn2">
        <div
          v-bind:class="{ 'itm-handle': true, 'itm-handle-active': item.isActive }"
          @mousedown="dragHandleDown"
          @mouseup="dragHandleUp"
        ></div>
        <VCircle dot small :color="taskIndicator(item.consistency)"></VCircle>
      </div>

      <div class="task-clmn1">
        <v-speed-dial :direction="direction" :open-on-hover="hover" :transition="transition">
          <v-btn slot="activator" color="blue darken-2" dark fab small>
            <v-icon>playlist_add_check</v-icon>
          </v-btn>
          <template v-for="action in statusAllowedActions(item.status)">
            <v-tooltip bottom>
              <v-btn
                fab
                dark
                small
                color="blue darken-2"
                slot="activator"
                @click="onStatusChange(action)"
              >
                <v-icon>{{ statusIcon(action) }}</v-icon>
              </v-btn>
              <span>{{ statusName(action) }}</span>
            </v-tooltip>
          </template>
        </v-speed-dial>
      </div>

      <div class="task-clmn2">
        <v-tooltip bottom class="task-status">
          <v-icon style="width: 24px;" slot="activator">{{ statusIcon(item.status) }}</v-icon>
          <span>{{ statusName(item.status) }}</span>
        </v-tooltip>

        <v-icon
          @click="onExpandSubElements()"
          v-show="item.depth > 1"
          class="expand-ico"
          slot="activator"
          color="primary"
          dark
        >{{ (item.isSubElementsExpanded > 1) ? "expand_less" : "expand_more" }}</v-icon>
      </div>

      <div class="task-clmn3">
        <itmTextArea
          placeholder="Task name"
          v-model="item.name"
          :min-height="21"
          :max-height="84"
          @change="onNameChange"
        ></itmTextArea>

        <TagsInput
          :element-id="'#'+item.tid"
          v-model="contexts"
          :existing-tags="mainExistingContexts"
          @initialized="onInitialized"
          @tag-added="onTagAdded"
          @tag-removed="onTagRemoved"
          :typeahead="true"
          :placeholder="'Add a context'"
        ></TagsInput>
      </div>

      <div class="task-clmn4">
        <v-tooltip bottom>
          <div slot="activator" class="task-duration">{{ getDuration(item.duration) }}</div>
          <span>Время затрачено</span>
        </v-tooltip>

        <div class="task-id">id: {{ item.tid }}</div>

        <v-icon
          @click="onExpandMore(item)"
          class="expand-ico"
          slot="activator"
          color="primary"
          dark
        >{{ (item.isExpanded) ? "unfold_less" : "unfold_more" }}</v-icon>
        <treeselect
          v-model="item.group_id"
          placeholder="Group"
          :clearable="false"
          :multiple="false"
          :options="mainGroupsMini"
          @open="onGroupOpen"
          @input="onGroupInput"
        />
      </div>
    </div>
    <!-- task-body -->
    <div class="task-expander" v-show="item.isExpanded">
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
        <TaskItem :sheet_id="sheet_id" :item="children" @drop="onDrop"></TaskItem>
      </div>
    </draggable>
  </div>
</template>

<script>
import Treeselect from "@riophae/vue-treeselect";
import itmTextArea from "../itmTextArea.vue";
import TagsInput from "../../VoerroTagsInput/VoerroTagsInput.vue";
import VCircle from "../../VCircle/VCircle.js";
import { isNumeric, activityStatus } from "../../../util/helpers.js";

// import { VTabs } from 'vuetify/lib'

import draggable from "vuedraggable";

const tabs = [
  {
    name: "Note",
    component: () => import("../itemElements/NoteElement.vue")
  },
  {
    name: "Property",
    component: () => import("../itemElements/TaskPropertyTab.vue")
  },
  {
    name: "Activity",
    component: () => import("../itemElements/ActivityLogElement.vue")
  },
  {
    name: "List",
    component: { template: "<div>Very soon</div>" }
  },
  {
    name: "Comments",
    component: { template: "<div>Coming soon</div>" }
  }
];

// const VTabsMix = {
// 	name: 'v-tabs-modify',
// 	data: function () {
// 		return {
// 			refresh: false
// 		}
// 	},
// 	watch: {
// 		refresh: 'updateTabsView'
// 	}
// }

// const VTabsModify = VTabs.extend({
// 	mixins: [VTabsMix]
// })

export default {
  name: "task-item",
  components: {
    TaskItem: () => import("./TaskItem.vue"),
    VCircle,
    Treeselect,
    TagsInput,
    itmTextArea,
    draggable
  },
  props: ["item", "sheet_id"],
  data: () => ({
    direction: "right",
    hover: false,
    transition: "slide-x-transition",
    moreMenu: [{ title: "Add subtask" }, { title: "Collapse subtask" }],
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
    contexts: {
      get() {
        return this.item.context;
      },
      set(value) {}
    },
    mainExistingContexts() {
      return this.$store.state.mainExistingContexts;
    },
    mainGroupsMini() {
      return this.$store.state.mainGroupsMini;
    },
    classObject() {
      const classObj = {
        "task-body": true,
        "task-level-2": false,
        "task-level-3": false,
        active: this.item.isActive
      };

      if (this.item.level === 2) {
        classObj["task-level-2"] = true;
      } else if (this.item.level === 3) {
        classObj["task-level-3"] = true;
      }

      return classObj;
    }
  },
  watch: {
    currentTab() {
      if (this.tabs[this.currentTab].name === "Activity") {
        this.$store
          .dispatch("FETCH_ACTIVITY", {
            task_id: this.item.id,
            sheet_id: this.sheet_id
          })
          .catch(err => {
            console.warn(err);
          });
      }
    }
  },
  mounted() {
    // this.timeoutID = setInterval(() => {
    // 	console.log(`Tik-tik-tik: ${this.item.id}`)
    // 	this.$nextTick(() => {
    // 		demoItems[3].end = new Date()
    // 	})
    // }, 1000)
    //this.currentTab = null
  },
  beforeDestroy() {
    // clearTimeout(this.timeoutID)
  },
  methods: {
    onStatusChange: function(newStatus) {
      this.$store
        .dispatch("CREATE_ACTIVITY", {
          sheet_id: this.sheet_id,
          task_id: this.item.id,
          status: newStatus
        })
        .catch(err => {
          console.warn(err);
        });
    },
    statusIcon: function(status) {
      return activityStatus[status].icon;
    },
    statusName: function(status) {
      return activityStatus[status].name;
    },
    statusAllowedActions: function(status) {
      return activityStatus[status].allowedActions;
    },
    tagChange(slug, command) {
      let context;
      const options = {
        sheet_id: this.sheet_id,
        task_id: this.item.id
      };

      if (isNumeric(slug)) {
        context = this.$store.getters.contextByExistingTag(slug);
        if (
          command === "ADD_TASK_CONTEXT" &&
          this.item.context.findIndex(el => el === context.value) >= 0
        ) {
          return;
        }

        options.context_id = context.context_id;
      } else {
        if (command === "REMOVE_TASK_CONTEXT") {
          context = this.$store.getters.contextByValue(slug, this.item.id);
          options.context_id = context.context_id;
        } else {
          options.context_value = slug;
        }
      }

      this.$store
        .dispatch(command, options)
        .then(res => {
          console.log(`${command}: ${slug}`);
        })
        .catch(err => {
          console.warn(err);
        });
    },
    onInitialized() {
      this.isTagsInitialized = true;
    },
    onTagAdded(slug) {
      if (!this.isTagsInitialized) return;

      this.tagChange(slug, "ADD_TASK_CONTEXT");
    },
    onTagRemoved(slug) {
      this.tagChange(slug, "REMOVE_TASK_CONTEXT");
    },
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
    taskIndicator: function(itm) {
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
    onGroupOpen: function(instanceId) {
      this.groupChangeStart = true;
    },
    onGroupInput: function(value, instanceId) {
      // on default this event fired twice
      if (this.groupChangeStart) {
        // our need catch event only first time
        this.groupChangeStart = false;
        this.$store
          .dispatch("UPDATE_TASK_GROUP", {
            sheet_id: this.sheet_id,
            id: this.item.id,
            group_id: value
          })
          .catch(err => {
            console.warn(err);
            this.groupChangeStart = false;
          });
      }
    },
    onBodyClick: function() {
      this.$store.commit("SELECT_ELEMENT", {
        sheet_id: this.sheet_id,
        id: this.item.id
      });
    },
    getDuration(duration) {
      let timeDiff = duration / 1000;

      let seconds = Math.round(timeDiff % 60);
      timeDiff = Math.floor(timeDiff / 60);

      let minutes = Math.round(timeDiff % 60);
      timeDiff = Math.floor(timeDiff / 60);

      let hours = Math.round(timeDiff % 24);
      timeDiff = Math.floor(timeDiff / 24);
      hours = hours + timeDiff * 24;

      return `${hours > 9 ? "" : "0"}${hours}:${
        minutes > 9 ? "" : "0"
      }${minutes}:${seconds > 9 ? "" : "0"}${seconds}`;
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
    }
  }
};
</script>

<style lang="css">
.task-container {
  /* padding: 1em; */
  /* width: 100%; */
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin-bottom: 0.1em;
}

.task-body {
  margin-top: 0.3em;
  margin-right: 0.3em;
  margin-left: 0.3em;
  display: flex;
  flex-flow: row nowrap;
  background-color: #f8f9fa;
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2);
}

.task-body:hover,
.task-body:focus,
.task-body:active {
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2),
    /*-13px 0 15px -15px rgba(0, 0, 0, .7),
	13px 0 15px -15px rgba(0, 0, 0, .7),*/
      0 0 40px rgba(0, 0, 0, 0.1) inset;
}

.task-clmn1 {
  /* display: flex; */
  /* justify-content: space-between; */
  /* padding: 1px; */
  /* margin: 0px; */
  align-self: flex-start;
  width: 50px;
  min-height: 47px;
}

.task-clmn1 .v-btn--floating.v-btn--small {
  height: 35px;
  width: 35px;
  outline: none;
}

.v-speed-dial--direction-right {
  z-index: 1;
}

.task-clmn2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  margin: 2px 2px 2px 0px;
}

.task-clmn3 {
  flex: 1 1 auto;
  margin: 2px 1px 1px 1px;
}

.task-clmn4 {
  width: 120px;
  margin: 1px 2px 2px 1px;
  display: flex;
  flex-flow: row wrap;
  align-content: space-between;
}

/* .task-clmn2-row1 {
  width: 50px;
  border: 1px solid black;
  height: 100%;
}

.task-clmn2-row2 {
  width: 50px;
  border: 1px solid black;
} */

.task-level-2 {
  margin-left: 8px;
}

.task-level-3 {
  margin-left: 12px;
}

.task-duration {
  font-size: 12px;
  padding-top: 2px;
  padding-left: 1px;
}

.task-status .v-icon {
  color: #5dc282;
  font-size: 1.1rem;
}

.task-id {
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

.task-expander {
  margin-left: 0.3em;
  margin-right: 0.3em;
  margin-top: 1px;
}

.task-expander .v-tabs__bar {
  background: none;
}

.task-expander .v-tabs__container {
  height: auto;
}

.task-expander .v-card {
  background: none;
  border: none;
}

.vue-treeselect__control {
  height: 25px;
  padding-left: 1px;
  padding-right: 1px;
  border-radius: 3px;
}

.vue-treeselect__placeholder,
.vue-treeselect__single-value {
  font-size: 11px;
  line-height: 25px;
  padding-left: 2px;
  padding-right: 2px;
}

.vue-treeselect--searchable .vue-treeselect__input-container {
  font-size: 11px;
  padding-left: 2px;
  padding-right: 2px;
}

.task-divider-body {
  margin-top: 0.2em;
  display: flex;
  flex-flow: row nowrap;
  border-top: 1px solid #b3d4fc;
}

.task-divider-body p {
  margin: 0.2em;
}

.task-divider-clmn1 {
  align-self: center;
  min-height: 20px;
}
/* .tsk-area-el {
	flex: 1;
} */
</style>
