<template>
  <div class="user-container">
    <div class="user-body" v-if="!item.isDivider && item.isShowed" @click="onBodyClick">
      <div class="user-clmn2">
        <div v-bind:class="{ 'itm-handle': true, 'itm-handle-active': item.isActive }"></div>
        <VCircle dot small :color="userIndicator(item.consistency)"></VCircle>
      </div>

      <div class="user-clmn1">
        <v-avatar tile :size="64">
          <img src="/public/defaultUser.png" alt="avatar">
        </v-avatar>
      </div>

      <div class="user-clmn3">
        <p>
          <b>{{item.email}}</b>
        </p>
        <p>User name</p>
        <p>id: {{ item.id }}</p>
      </div>

      <div class="user-clmn4">
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

    <!-- user-body -->
    <div class="user-expander" v-show="item.isExpanded">
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
  </div>
</template>

<script>
import ItmTextArea from "../ItmTextArea.vue";
import VCircle from "../../VCircle/VCircle.js";
import { isNumeric, activityStatus } from "../../../util/helpers.js";

const tabs = [
  {
    name: "Users rights",
    component: { template: "<div>Very soon</div>" }
  },
  {
    name: "Element rights",
    component: { template: "<div>Coming soon</div>" }
  }
];

export default {
  name: "user-item",
  components: {
    VCircle,
    ItmTextArea
  },
  props: ["item", "sheet_id"],
  data: () => ({
    direction: "right",
    hover: false,
    transition: "slide-x-transition",
    userChangeStart: false,
    tabs: tabs,
    currentTab: 1,
    timeoutID: null
  }),
  computed: {
    currentTabComponent: function() {
      return this.tabs[this.currentTab].component;
    }
  },
  watch: {
    currentTab() {
      // if (this.tabs[this.currentTab].name === "Activity") {
      // }
    }
  },
  beforeDestroy() {
    // clearTimeout(this.timeoutID)
  },
  methods: {
    userIndicator: function(itm) {
      const status = ["success", "yellow", "error"];
      return status[itm];
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

      this.$store.commit("UPDATE_USER_VALUES", {
        sheet_id: this.sheet_id,
        id: this.item.id,
        isExpanded: !this.item.isExpanded
      });
    }
  }
};
</script>

<style lang="css">
.user-container {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  margin-bottom: 0.1em;
}

.user-body {
  margin-top: 0.3em;
  margin-right: 0.3em;
  margin-left: 0.3em;
  display: flex;
  flex-flow: row nowrap;
  background-color: #f8f9fa;
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2);
}

.user-body:hover,
.user-body:focus,
.user-body:active {
  box-shadow: 0px 1px 2px 1px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(0, 0, 0, 0.1) inset;
}

.user-clmn1 {
  align-self: center;
  width: 64px;
  min-height: 47px;
  margin: 0.3em;
}

.user-clmn1 .v-btn--floating.v-btn--small {
  height: 35px;
  width: 35px;
  outline: none;
}

.user-clmn2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  margin: 2px 2px 2px 0px;
}

.user-clmn3 {
  flex: 1 1 auto;
  margin: 2px 1px 1px 1px;
}

.user-clmn3 p {
  margin-bottom: 2px;
}

.user-clmn4 {
  margin: 1px 2px 2px 1px;
  display: flex;
  flex-flow: column;
  align-content: space-between;
}

.user-duration {
  font-size: 12px;
  padding-top: 2px;
  padding-left: 1px;
}

.user-status .v-icon {
  color: #5dc282;
  font-size: 1.1rem;
}

.user-id {
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

.user-expander {
  margin-left: 0.3em;
  margin-right: 0.3em;
  margin-top: 1px;
}

.user-expander .v-tabs__bar {
  background: none;
}

.user-expander .v-tabs__container {
  height: auto;
}

.user-expander .v-card {
  background: none;
  border: none;
}
</style>
