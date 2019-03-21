<template>
  <div id="app">
    <template v-if="appReady">
      <v-app id="inspire" class="app">
        <app-drawer v-model="drawer" class="app--drawer"></app-drawer>
        <!-- <app-toolbar v-model="drawer" v-bind:authDialog.sync="authDialog" class="app--toolbar"></app-toolbar> -->
        <v-content>
          <!-- Page Header -->
          <div class="mt-0 pb-0" v-if="isAuth" style="display: flex;">
            <v-btn style="margin: auto .5em; min-width: 40px;" small @click="drawer = !drawer">
              <v-icon>menu</v-icon>
            </v-btn>

            <v-btn
              style="margin: auto .2em; min-width: 40px;"
              :color="currentLayerClass"
              small
              @click="onClickLayer"
            >
              <v-icon>plus_one</v-icon>
            </v-btn>

            <div class="sheetSelector" v-for="(item, index) in sheetTypes" :key="index">
              <v-menu
                v-model="item.selected"
                :close-on-content-click="true"
                :nudge-right="40"
                lazy
                transition="scale-transition"
                offset-y
                full-width
              >
                <v-btn slot="activator" small :color="selectorColor(item.type_el)">{{item.name}}</v-btn>
                <v-list>
                  <v-list-tile
                    v-for="(selector, ind) in selectorData(item.type_el)"
                    :key="ind"
                    @click="onMenuSelect(selector)"
                  >
                    <v-list-tile-avatar v-if="selector.icon">
                      <v-icon>apps</v-icon>
                    </v-list-tile-avatar>
                    <v-list-tile-title>{{ selector.name }}</v-list-tile-title>
                  </v-list-tile>
                </v-list>
              </v-menu>
            </div>

            <v-spacer></v-spacer>
            <a class="hidden-sm-and-down app-title" href="/">inTask.me</a>
          </div>

          <div class="mt-0 pb-0" v-if="isAuth" style="display: flex;">
            <v-spacer></v-spacer>

            <div class="workDate">
              <v-menu
                v-model="workDateMenu"
                :close-on-content-click="false"
                :nudge-right="40"
                lazy
                transition="scale-transition"
                offset-y
                full-width
                min-width="290px"
              >
                <a slot="activator" href="#">Work date: {{workDate}}</a>
                <v-date-picker v-model="workDate" @input="workDateMenu = false"></v-date-picker>
              </v-menu>
            </div>
          </div>

          <transition name="fade" mode="out-in">
            <div class="page-wrapper">
              <router-view class="view"></router-view>
            </div>
          </transition>

          <!-- App Footer -->
          <v-footer app>
            <span class="pl-2">inTask.me</span>
            <v-spacer></v-spacer>
            <span class="pr-2">&copy; 2018</span>
          </v-footer>
        </v-content>

        <MessageDialog v-model="messageDialog"></MessageDialog>
      </v-app>
    </template>

    <template v-else>
      <div class="appLoading">
        <div>Application loaded...</div>
        <div class="atom-spinner">
          <div class="spinner-inner">
            <div class="spinner-line"></div>
            <div class="spinner-line"></div>
            <div class="spinner-line"></div>
            <!--Chrome renders little circles malformed :(-->
            <div class="spinner-circle">&#9679;</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import AppDrawer from "./components/AppDrawer.vue";
import SheetManager from "./components/SheetManager.vue";
import MessageDialog from "./views/MessageDialog.vue";
import moment from "moment";
//#2195f3

function getUserByToken(store, done) {
  const storage = process.env.VUE_ENV === "server" ? null : window.localStorage;
  if (storage && storage.getItem("token")) {
    store
      .dispatch("MAINUSER_REQUEST")
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
  } else {
    done();
  }
}

export default {
  name: "App",
  components: {
    AppDrawer,
    SheetManager,
    MessageDialog
  },
  data: () => ({
    messageDialog: false,
    drawer: false,
    settingsDrawer: false,
    workDateMenu: false,
    usersMenu: false,
    groupsMenu: false,
    tasksMenu: false,
    sheetTypes: [
      {
        type_el: "users-sheet",
        selected: false,
        name: "users"
      },
      {
        type_el: "groups-sheet",
        selected: false,
        name: "groups"
      },
      {
        type_el: "tasks-sheet",
        selected: false,
        name: "tasks"
      }
    ]
  }),
  created() {
    /* При создании главного окна приложения, необходимо получить состояние пользователя от сервера.
			Если это возможно и у нас есть токен пользователя в localStorage.
			Однако прежде всего необходимо обработать ситуацию, когда приложение получает url /verified с
			токеном верификации в query. Это означает, что пользователь перешел по ссылке полученной в
			письме, которое отправил сервер в запросе подтверждения регистрации пользователя. Этот токен
			отправляется приложением auth-серверу для процедуры подтверждения верификации пользователя.
		*/
    if (this.$route.matched.some(record => record.meta.action === "verified")) {
      // Перешли по маршруту верификации
      if (this.$route.query.token) {
        // Получили токен верификации регистрации, и вызвали action аутентификации
        this.$store
          .dispatch("AUTH_REQUEST", { verifytoken: this.$route.query.token })
          .then(() => {
            // Получили данные пользователя успешно, отобразим об этом диалоговое сообщение
            this.messageDialog = true;
            // Отобразим по маршруту домашнюю страницу
            // После перехода установим флаг, что приложение готово к работе
            return this.$router.push(
              { name: "main-sheets" },
              () => {
                this.$store.commit("CHANGE_APP_READY", true);
              },
              () => {
                this.$store.commit("CHANGE_APP_READY", true);
              }
            );
          })
          .catch(err => {
            //this.message = err.error_description
            console.log(err.error_description);
          });
      }
    } else {
      /* Перешли по стандартным маршрутам или просто в корневой маршрут приложения, получим состо-
				яние пользователя, если на клиенте храниться свежий токен пользователя в localStorage.
				Если токена нет или он просрочен, то приложение перейдет на домашнюю страницу */
      getUserByToken(this.$store, err => {
        if (err) {
          return this.$router.push(
            { name: "home" },
            () => {
              this.$store.commit("CHANGE_APP_READY", true);
            },
            () => {
              this.$store.commit("CHANGE_APP_READY", true);
            }
          );
        }

        if (!this.$store.getters.isAuth) {
          this.$router.push(
            { name: "home" },
            () => {
              this.$store.commit("CHANGE_APP_READY", true);
            },
            () => {
              this.$store.commit("CHANGE_APP_READY", true);
            }
          );
        } else {
          this.$store.commit("CHANGE_APP_READY", true);
          this.$router.push({ name: "main-sheets" });
        }
      });
    }
  },
  computed: {
    currentLayerClass() {
      return this.$store.state.mainUser.layout === 2 ? "primary" : "";
    },
    appReady() {
      return this.$store.state.appReady;
    },
    isAuth() {
      return this.$store.getters.isAuth;
    },
    workDate: {
      get() {
        // return this.$store.getters.workDateIsoStr;
        if (this.$store.state.mainUser.workDate) {
          return moment(this.$store.state.mainUser.workDate).format(
            "YYYY-MM-DD"
          );
        }

        return moment().format("YYYY-MM-DD");
      },
      set(value) {
        this.$store.commit("UPDATE_MAIN_USER", {
          workDate: moment(value).toDate()
        });
      }
    }
  },
  methods: {
    selectorData(type_el) {
      let result = this.$store.state.sheets
        .filter(el => el.type_el === type_el)
        .sort((a, b) => a.callsCount - b.callsCount);

      if (result.length > 3) {
        result = result.slice(0, 2);
      }

      result = result.map(el => {
        return {
          name: el.name,
          icon: false,
          type_layout: "list-sheet",
          position: 1,
          type_el: el.type_el,
          sheet_id: el.sheet_id,
          element_id: ""
        };
      });

      result.push({
        name: "All",
        icon: true,
        type_layout: "manage-sheet",
        position: 1,
        type_el,
        sheet_id: "",
        element_id: ""
      });

      return result;
    },
    selectorColor(type_el) {
      const activeLayout = this.$store.getters.generalLayout;
      let result = "";

      if (activeLayout && activeLayout.type_el === type_el) {
        result = "primary";
      }

      return result;
    },
    onMenuSelect: function(selector) {
      this.$store.dispatch("ADD_LAYOUT", Object.assign({}, selector));
    },
    onClickLayer: function() {
      this.$store.dispatch("UPDATE_MAIN_USER", {
        layout: this.$store.state.mainUser.layout === 2 ? 1 : 2
      });
    }
  },
  props: {
    source: String
  }
};
</script>

<style lang="stylus">
.fade-enter-active, .fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter, .fade-leave-active {
  opacity: 0;
}

.setting-fab {
  top: 50% !important;
  right: 0;
  border-radius: 0;
}

.page-wrapper {
  min-height: calc(100vh - 64px - 50px - 81px);
}

@media (max-width: 860px) {
  .header .inner {
    padding: 15px 30px;
  }
}

@media (max-width: 600px) {
  .header {
    .inner {
      padding: 15px;
    }

    a {
      margin-right: 1em;
    }

    .github {
      display: none;
    }
  }
}

.appLoading {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-flow: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  overflow: auto;
}
</style>

<style lang="css">
.app-title {
  font-size: 20px;
  font-weight: 500px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  margin: 0.7em 0.5em;
}

.workDate {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  margin-right: 0.5em;
  margin-bottom: 0.6em;
}

.sheetSelector {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  margin: auto 0.1em;
}
</style>
