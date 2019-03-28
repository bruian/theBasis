<template>
  <div>
    <section>
      <v-parallax src="./public/screen1_1920_1080.jpg" height="600">
        <v-layout column align-center justify-center class="white--text">
          <!--v-img src="./public/Rocket.svg" alt="inTask.me" height="100"></v-img-->
          <h1 class="white--text mb-2 display-1 text-xs-center">inTask.me</h1>
          <div class="subheading mb-3 text-xs-center">Невероятный менеджер задач для вас</div>
          <v-btn class="blue lighten-2 mt-5" dark large @click="onLoginDialog">Войти</v-btn>
        </v-layout>
      </v-parallax>
    </section>

    <section>
      <v-layout column wrap class="my-5" align-center>
        <v-flex xs12 sm4 class="my-3">
          <div class="text-xs-center">
            <h2 class="headline">Вам известен секрет личного успеха?</h2>
            <span class="subheading">и каков краеугольный камень успешных и великих людей</span>
            <!-- <p>{{offsetTop}}</p> -->
          </div>
        </v-flex>

        <v-flex xs12>
          <v-container grid-list-xl>
            <v-layout row wrap align-center>
              <v-flex xs12 md4 :class="citatesClass" v-scroll="handleScroll">
                <v-card class="elevation-2" transparent>
                  <v-card-text class="text-xs-center">
                    <v-icon x-large class="blue--text text--lighten-2">build</v-icon>
                  </v-card-text>

                  <v-card-title primary-title class="layout justify-center">
                    <div class="headline text-xs-center">Интеллект</div>
                  </v-card-title>

                  <v-card-text>
                    Все выдающиеся достижения человечества являются плодом его интеллектуальной работы. И не важно что это - искусство,
                    наука, религия или любая иная общественная деятельность. Без развитого интеллекта ни о каких значимых результатах, не
                    может быть и речи.
                  </v-card-text>
                </v-card>
              </v-flex>

              <v-flex xs12 md4 :class="citatesClass" v-scroll="handleScroll">
                <v-card class="elevation-2 transparent">
                  <v-card-text class="text-xs-center">
                    <v-icon x-large class="blue--text text--lighten-2">flash_on</v-icon>
                  </v-card-text>

                  <v-card-title primary-title class="layout justify-center">
                    <div class="headline text-xs-center">Эффективность</div>
                  </v-card-title>

                  <v-card-text>
                    Понятие эффективности в основном сводится к умению наиболее выгодно использовать доступные ресурсы. Каждый человек
                    с рождения обладает важнейшим и ограниченным ресурсом - своим временем, а некоторым из людей доводится возможность
                    распоряжаться и чужим временем. То насколько правильно человек распоряжается временем является прямым следствием его
                    эффективности.
                  </v-card-text>
                </v-card>
              </v-flex>

              <v-flex xs12 md4 :class="citatesClass" v-scroll="handleScroll">
                <v-card class="elevation-2 transparent">
                  <v-card-text class="text-xs-center">
                    <v-icon x-large class="blue--text text--lighten-2">flag</v-icon>
                  </v-card-text>

                  <v-card-title primary-title class="layout justify-center">
                    <div class="headline">Дисциплина</div>
                  </v-card-title>

                  <v-card-text>
                    Пожалуй самый важный навык успешного человека. Победителями становятся в первую очередь посредством дисциплны.
                    Без неё возможны лишь посредственные результаты. И это главный секрет успеха большинства выдающихся людей.
                    За ширмой успеха в подавляющем большинстве случаев стоит упорный труд, и дисциплина в нем играет важную роль.
                  </v-card-text>
                  <v-card-text>
                    <cite>Дисциплина - это не ограничение свободы. Это отсечение всего лишнего.</cite>
                    <pre>Брюс Ли</pre>
                  </v-card-text>
                </v-card>
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
      </v-layout>
    </section>

    <section>
      <v-parallax src="./public/screen3_1600_900.jpg" height="430">
        <v-layout column align-center justify-center>
          <div
            class="headline white--text mb-3 text-xs-center"
          >Дисциплина и эффективное управление временем</div>
          <em>Этим навыкам и посвящается данный менеджер задач</em>
          <p></p>
        </v-layout>
      </v-parallax>
    </section>

    <section>
      <v-container grid-list-xl>
        <v-layout row wrap justify-center class="my-5">
          <v-flex xs12 sm4>
            <v-card class="elevation-0 transparent">
              <v-card-title primary-title class="layout justify-center">
                <div class="headline">Общая информация</div>
              </v-card-title>

              <v-card-text>
                Данный проект находится в стадии активной разработки. На текущий момент реализован базовый концепт системы,
                относительно которого будет реализован весь остальной функционал. К сожалению регистрация и использование
                продукта пока не представляется возможным, т.к. проходит отладка кода, тестирование компонентов, проработка
                механизмом и обкатка методологии.
              </v-card-text>
              <v-card-text>
                Для самых любопытных дана возможность ознакомиться с продуктом в стадии разработки. Для этого можно воспользоваться
                тестировочным аккаунтом.
                <p>
                  <i>login:</i>test@intask.me
                  <br>
                  <i>password:</i>testcom
                </p>
              </v-card-text>
            </v-card>
          </v-flex>

          <v-flex xs12 sm4 offset-sm1>
            <v-card class="elevation-0 transparent">
              <v-card-title primary-title class="layout justify-center">
                <div class="headline">Контакты</div>
              </v-card-title>

              <v-card-text>Предложения и пожелания, а так же вопросы для обсуждения можно направить по следующим контактам</v-card-text>

              <v-list class="transparent">
                <v-list-tile>
                  <v-list-tile-action>
                    <v-icon class="blue--text text--lighten-2">phone</v-icon>
                  </v-list-tile-action>

                  <v-list-tile-content>
                    <v-list-tile-title>8-905-976-54-53</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>

                <v-list-tile>
                  <v-list-tile-action>
                    <v-icon class="blue--text text--lighten-2">email</v-icon>
                  </v-list-tile-action>

                  <v-list-tile-content>
                    <v-list-tile-title>bruianio@gmail.com</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </v-list>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </section>

    <!-- <v-container justify-center grid-list-md>
      <v-card>
        <v-layout>
          <h1></h1>
          <v-flex xs6>
            <v-card-title primary-title>
              <div>
                <div class="headline">Meet the incredible task manager - inTask.me</div>
                <div>Maus.club &copy designed</div>
                <div>(2018)</div>
              </div>
            </v-card-title>
          </v-flex>
          <v-flex xs4></v-flex>
        </v-layout>

        <v-divider light></v-divider>

        <v-card-actions class="pa-3">
          Estimate your chaos
          <v-spacer></v-spacer>
          <v-icon>star_border</v-icon>
          <v-icon>star_border</v-icon>
          <v-icon>star_border</v-icon>
          <v-icon>star_border</v-icon>
          <v-icon>star_border</v-icon>
        </v-card-actions>
      </v-card>
    </v-container>-->

    <Login v-model="authDialog"></Login>
  </div>
</template>

<script>
import Login from "./Login.vue";

export default {
  components: {
    Login
  },
  data: () => ({
    authDialog: false,
    offsetTop: 0,
    showCitates: false,
    slideCitates: false
  }),
  asyncData({ store, route }) {
    return;
  },
  computed: {
    citatesClass() {
      return {
        boxiOne: !this.showCitates,
        boxiTwo: this.showCitates
      };
    }
  },
  methods: {
    onLoginDialog() {
      this.authDialog = true;
    },
    // handleScroll: function(evt, el) {
    handleScroll: function(evt) {
      // this.offsetTop = window.scrollY;
      if (window.scrollY > 300) {
        this.showCitates = true;
        // el.setAttribute(
        //   "style",
        //   "opacity: 1; transform: translate3d(0, -20px, 0)"
        // );
      }

      let isCitates = window.scrollY > 500;
      this.slideCitates = isCitates;

      return isCitates;
    }
  }
};
</script>

<style lang="css">
.boxiOne {
  opacity: 0;
  transform: translateZ(0);
  margin-top: 20px;
  /* perspective: 1000px; */
  backface-visibility: hidden;
  background: rgba(255, 255, 255, 0.1);
  transition: 1.5s all cubic-bezier(0.39, 0.575, 0.565, 1);
}

.boxiTwo {
  opacity: 1;
  transform: translate3d(0, -20px, 0);
  backface-visibility: hidden;
  background: rgba(255, 255, 255, 0.1);
  transition: 1.5s all cubic-bezier(0.39, 0.575, 0.565, 1);
}
</style>
