<template>
  <div class="activity-container">
    <div class="activity-divider-body" v-if="item.isDivider">
      <div class="activity-divider-clmn1">
        <p>Дата: {{ item.name }}</p>
      </div>
    </div>

    <div v-bind:class="classObject" v-if="!item.isDivider && item.isShowed" @click="onBodyClick">
      <div class="activity-clmn2">
        <div v-bind:class="{ 'itm-handle': true, 'itm-handle-active': item.isActive }"></div>
        <VCircle dot small :color="itemIndicator(item.consistency)"></VCircle>
      </div>

      <div class="activity-clmn2">
        <v-tooltip bottom class="activity-status">
          <v-icon
            v-bind:class="{ 'status-ico': true, 'status-ico-active': (item.status === 1 || item.status === 5) && item.ends === null }"
            slot="activator"
          >{{ statusIcon(item.status) }}</v-icon>
          <span>{{ statusName(item.status) }}</span>
        </v-tooltip>
        <v-tooltip bottom class="activity-status" v-show="(item.note) && (item.note.length > 0)">
          <v-icon v-bind:class="{ 'status-ico': true }" slot="activator">subject</v-icon>
          <span>Содержит примечание</span>
        </v-tooltip>
      </div>

      <div class="activity-clmn3">
        <itmTextArea disabled v-model="item.name" :min-height="21" :max-height="84">
          <v-tooltip bottom class="activity-status" v-show="item.singular">
            <v-icon v-bind:class="{ 'status-ico': true }" slot="activator">call_merge</v-icon>
            <span>Singular</span>
          </v-tooltip>
        </itmTextArea>
        <div class="dateStartEnd">
          <div v-show="progress" class="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <v-tooltip v-show="!progress" top slot="activator">
            <date-picker
              v-if="isDateChangeShow"
              slot="activator"
              v-model="startDateTime"
              lang="ru"
              type="datetime"
              format="YYYY-MM-DD hh:mm:ss"
              mini
              confirm
              :asynCall="asyncDateTime()"
              :first-day-of-week="1"
              @confirm="onDateStartChange"
              :popupStyle="{ top: '60px', left: '45px' }"
            >{{ getTime('start') }}</date-picker>
            <div v-else slot="activator">{{ getTime('start') }}</div>
            <span>Старт</span>
          </v-tooltip>
          &nbsp;|&nbsp;{{ getTime('ends') }}
          <v-icon
            v-bind:class="{ 'status-ico': true, 'status-ico-active': (item.status === 1 || item.status === 5) && item.ends === null }"
            v-show="item.ends === null"
          >schedule</v-icon>&nbsp;|&nbsp;
          <v-tooltip top>
            <span
              slot="activator"
              class="activity-duration"
            >{{ getDuration(item.start, item.ends) }}</span>
            <span>Время затрачено</span>
          </v-tooltip>
          <v-tooltip bottom>
            <span slot="activator" class="activity-duration">&nbsp;in {{ groupName(item.group_id) }}</span>
            <span>Группа с id {{item.group_id}}</span>
          </v-tooltip>
        </div>
      </div>

      <div class="activity-clmn4">
        <v-icon
          @click="onExpandMore(item)"
          class="expand-ico"
          slot="activator"
          color="primary"
        >{{ (item.isExpanded) ? "unfold_less" : "unfold_more" }}</v-icon>
        <v-icon class="expand-ico" color="primary" dark>more_horiz</v-icon>
      </div>
    </div>

    <div class="activity-expander" v-show="item.isExpanded">
      <v-tabs slot="extension" slider-color="primary" v-model="currentTab">
        <v-tabs-slider></v-tabs-slider>
        <v-tab v-for="(tab, index) in tabs" :key="index">{{ tab.name }}</v-tab>
      </v-tabs>
      <v-tabs-items v-model="currentTab">
        <v-tab-item v-for="(tab, index) in tabs" :key="index">
          <component v-bind:is="currentTabComponent" :item="item" :sheet_id="sheet.sheet_id"></component>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </div>
</template>

<script>
import itmTextArea from "../itmTextArea.vue";
import VCircle from "../../VCircle/VCircle.js";
import { isNumeric, activityStatus } from "../../../util/helpers.js";
import DatePicker from "../../vue2-datepicker/lib";

import moment from "moment";
import draggable from "vuedraggable";

const tabs = [
  {
    name: "Note",
    component: () => import("../itemElements/NoteElement.vue")
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

export default {
  name: "activity-item",
  components: {
    VCircle,
    itmTextArea,
    draggable,
    DatePicker
  },
  props: ["item", "sheet"],
  data: () => ({
    direction: "right",
    hover: false,
    transition: "slide-x-transition",
    tabs: tabs,
    currentTab: 1,
    timeoutID: null,
    startDateMenu: false,
    /* dt */
    timePickerOptions: {
      start: "00:00",
      step: "00:30",
      end: "23:30"
    },
    progress: false
  }),
  computed: {
    currentTabComponent: function() {
      return this.tabs[this.currentTab].component;
    },
    classObject() {
      const classObj = {
        "activity-body": true,
        active: this.item.isActive,
        passive: !this.item.isActive
      };

      return classObj;
    },
    startDateTime: {
      get() {
        return moment(this.item.start).format("YYYY-MM-DD HH:mm:ss");
      },
      set(value) {}
    },
    isDateChangeShow: function() {
      if (
        this.sheet.restrictions &&
        Object.prototype.hasOwnProperty.call(this.sheet.restrictions, "id")
      ) {
        if (this.sheet.restrictions.id === this.item.id) {
          return true;
        }
      }

      return false;
    }
  },
  watch: {
    currentTab() {
      if (this.tabs[this.currentTab].name === "Activity") {
      }
    }
  },
  mounted() {},
  beforeDestroy() {
    // clearTimeout(this.timeoutID)
  },
  methods: {
    asyncDateTime: function() {
      return (resolve, reject) => {
        const those = this;
        those.progress = true;

        this.$store
          .dispatch("AMOVE_RESTRICTIONS", { id: this.item.id })
          .then(dt => {
            const data = {
              "not-before": null,
              "not-after": null
            };

            if (Object.prototype.hasOwnProperty.call(dt, "restrictions_data")) {
              if (
                Array.isArray(dt.restrictions_data) &&
                dt.restrictions_data.length > 0
              ) {
                data["not-before"] = new Date(dt.restrictions_data[0].start);
              }
            }

            resolve(data);
            those.progress = false;
          })
          .catch(err => {
            console.warn(err);
          });
      };
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
    itemIndicator: function(itm) {
      const status = ["success", "yellow", "error"];
      return status[itm];
    },
    getDraggableOptions: function() {
      return { group: this.sheet.sheet_id, handle: ".itm-handle" };
    },
    onBodyClick: function() {
      this.$store.commit("SELECT_ELEMENT", {
        sheet_id: this.sheet.sheet_id,
        id: this.item.id
      });
    },
    getTime: function(value) {
      let val;
      if (value === "start") {
        val = this.item.start === null ? moment() : moment(this.item.start);
        return val.format("HH:mm:ss");
      } else if (value === "ends") {
        val = this.item.ends === null ? moment() : moment(this.item.ends);
        if (val.isSame(this.item.start, "day")) {
          return val.format("HH:mm:ss");
        } else {
          return val.format("DD.MM HH:mm:ss");
        }
      }

      // return val.calendar(null, {
      //   sameDay: "HH:mm:ss",
      //   lastDay: "[Yesterday] HH:mm:ss",
      //   lastWeek: "[Last] dddd HH:mm:ss",
      //   sameElse: "DD/MM/YYYY HH:mm:ss"
      // });
    },
    onDateStartChange(value) {
      const dispatchObject = {
        fromId: this.item.id,
        sheet_id: this.sheet.sheet_id,
        start: value
      };

      this.$store.dispatch("REORDER_ELEMENTS", dispatchObject).catch(err => {
        console.warn(err);
      });
    },
    groupName: function(id) {
      const group = this.$store.getters.groupById(id);
      return group.name;
    },
    getDuration(start, ends) {
      const end = ends === null ? moment() : moment(ends);
      return moment.duration(end.diff(moment(start))).humanize();
    },
    onExpandMore() {
      if (!this.item.isExpanded) {
        this.currentTab = 0;
      }

      this.$store.commit("UPDATE_ELEMENT", {
        sheet_id: this.sheet.sheet_id,
        id: this.item.id,
        isExpanded: !this.item.isExpanded
      });
    }
  }
};
</script>

<style lang="css">
.activity-container {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin-bottom: 0.1em;
}

.activity-body {
  margin-top: 0.3em;
  margin-right: 0.3em;
  margin-left: 0.3em;
  display: flex;
  flex-flow: row nowrap;
  background-color: #f8f9fa;
  /* box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2); */
}

.activity-body:hover,
.activity-body:focus,
.activity-body:active {
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(0, 0, 0, 0.1) inset;
}

.activity-clmn1 {
  align-self: flex-start;
  width: 50px;
  min-height: 47px;
}

.activity-clmn1 .v-btn--floating.v-btn--small {
  height: 35px;
  width: 35px;
  outline: none;
}

.v-speed-dial--direction-right {
  z-index: 1;
}

.activity-clmn2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  margin: 2px 2px 2px 0px;
}

.activity-clmn3 {
  flex: 1 1 auto;
  margin: 2px 1px 1px 1px;
}

.activity-clmn4 {
  margin: 1px 2px 2px 1px;
  display: flex;
  flex-flow: column;
  align-content: space-between;
}

.activity-duration {
  font-size: 12px;
  padding-top: 2px;
  padding-left: 1px;
}

/* .activity-status .v-icon {

} */

.status-ico {
  font-size: 1.1rem;
  width: 24px;
  color: #788c9ee5;
}

.status-ico-active {
  color: #5dc282 !important;
}

.activity-id {
  flex: 2;
  font-size: 0.9rem;
  font-size: 12px;
  padding-top: 2px;
  padding-left: 3px;
  text-align: center;
}

.activity-expander {
  margin-left: 0.3em;
  margin-right: 0.3em;
  margin-top: 1px;
}

.activity-expander .v-tabs__bar {
  background: none;
}

.activity-expander .v-tabs__container {
  height: auto;
}

.activity-expander .v-card {
  background: none;
  border: none;
}

.activity-divider-body {
  margin-top: 0.2em;
  display: flex;
  flex-flow: row nowrap;
  border-top: 1px solid #b3d4fc;
}

.activity-divider-body p {
  margin: 0.2em;
}

.activity-divider-clmn1 {
  align-self: center;
  min-height: 20px;
}

.dateStartEnd {
  display: flex;
  flex-direction: row nowrap;
  align-items: center;
}

.dt-input {
  display: none;
}

.lds-ellipsis {
  /* display: inline-block; */
  display: flex;
  align-items: center;
  position: relative;
  width: 58px;
  height: 16px;
}
.lds-ellipsis div {
  position: absolute;
  /* top: 27px; */
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007bff;
  animation-timing-function: cubic-bezier(0, 1, 1, 0);
}
.lds-ellipsis div:nth-child(1) {
  left: 6px;
  animation: lds-ellipsis1 0.6s infinite;
}
.lds-ellipsis div:nth-child(2) {
  left: 6px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(3) {
  left: 26px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(4) {
  left: 45px;
  animation: lds-ellipsis3 0.6s infinite;
}
@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(19px, 0);
  }
}
</style>
