<template>
  <v-dialog v-model="localValue" width="500px">
    <v-card class="elevation-12">
      <v-toolbar dark color="primary" v-if="formState < 2">
        <v-toolbar-title>
          <a
            class="login-header"
            v-bind:class="[formState == 0 ? 'active-login-header' : '']"
            href
            @click.prevent="formState=0"
          >Login</a>
          <span v-if="activeRegistration">|</span>
          <a
            class="login-header"
            v-bind:class="[formState == 1 ? 'active-login-header' : '']"
            href
            @click.prevent="formState=1"
            v-if="activeRegistration"
          >Registration</a>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <v-btn icon @click="$emit('input', false)" slot="activator">
            <v-icon>cancel</v-icon>
          </v-btn>
          <span>Закрыть</span>
        </v-tooltip>
      </v-toolbar>

      <v-card v-if="formState === 0">
        <v-container style="margin-bottom: -50px;">
          <v-flex xs12 ma-0>
            <v-text-field
              prepend-icon="person"
              name="email"
              v-model="email"
              label="E-mail"
              required
              :error-messages="emailErrors"
              @input="$v.email.$touch()"
              @blur="$v.email.$touch()"
              @keyup.enter="onSubmit"
            ></v-text-field>
            <v-text-field
              prepend-icon="lock"
              name="password"
              v-model="password"
              label="Password"
              :append-icon="passwordShow ? 'visibility_off' : 'visibility'"
              :rules="[rules.required, rules.min]"
              :type="passwordShow ? 'text' : 'password'"
              @click:append="passwordShow = !passwordShow"
              @keyup.enter="onSubmit"
            ></v-text-field>
            <v-card-actions>
              <v-slide-y-transition>
                <v-card-text v-show="message">{{ message }}</v-card-text>
              </v-slide-y-transition>
              <v-spacer v-show="!message"></v-spacer>
              <v-btn color="primary" :loading="fetching" type="button" @click.native="submit">Login</v-btn>
            </v-card-actions>
          </v-flex>
        </v-container>

        <svg viewBox="0 0 120 28">
          <defs>
            <path
              id="wave"
              d="M 0,10 C 30,10 30,15 60,15 90,15 90,10 120,10 150,10 150,15 180,15 210,15 210,10 240,10 v 28 h -240 z"
            ></path>
          </defs>
          <use id="wave3" class="wave" xlink:href="#wave" x="0" y="-2"></use>
          <use id="wave2" class="wave" xlink:href="#wave" x="0" y="0"></use>
          <use id="wave1" class="wave" xlink:href="#wave" x="0" y="1"></use>
        </svg>
      </v-card>

      <v-card v-if="formState === 1">
        <v-layout style="margin-bottom: -30px;">
          <v-flex xs8>
            <v-card-title primary-title>
              <div>
                <div class="headline">Регистрация - это просто!</div>
                <div>Заполните поля вашими данными</div>
                <v-text-field
                  prepend-icon="person"
                  name="email"
                  v-model="email"
                  label="Ваш E-mail"
                  required
                  :error-messages="emailErrors"
                  @input="$v.email.$touch()"
                  @blur="$v.email.$touch()"
                ></v-text-field>
                <v-text-field
                  prepend-icon="lock"
                  name="password"
                  v-model="password"
                  hint="Рекомендуется всегда использовать надежный пароль"
                  label="Введите пароль"
                  :append-icon="passwordShow ? 'visibility_off' : 'visibility'"
                  :rules="[rules.required, rules.min]"
                  :type="passwordShow ? 'text' : 'password'"
                  @click:append="passwordShow = !passwordShow"
                ></v-text-field>
                <v-text-field
                  prepend-icon="lock"
                  name="verifyingPassword"
                  v-model="verifyingPassword"
                  label="Повторите пароль"
                  :append-icon="passwordShow ? 'visibility_off' : 'visibility'"
                  :rules="[rules.required, rules.min, rules.sameAs]"
                  :type="passwordShow ? 'text' : 'password'"
                  @click:append="passwordShow = !passwordShow"
                ></v-text-field>
              </div>
            </v-card-title>
            <v-btn
              color="primary"
              type="button"
              :loading="fetching"
              v-bind:disabled="isEmailAndPasswordFilled || fetching"
              @click.native="submit"
              style="position: absolute; top: 220px; right: 19px;"
            >Регистрация</v-btn>
          </v-flex>
          <v-flex xs4 mt-4>
            <v-img src="./public/RocketLaunchW.svg" height="200px" contain></v-img>
          </v-flex>
        </v-layout>
        <v-slide-y-transition>
          <v-card-text v-show="message">{{ message }}</v-card-text>
        </v-slide-y-transition>
        <svg viewBox="0 0 120 28">
          <defs>
            <path
              id="wave"
              d="M 0,10 C 30,10 30,15 60,15 90,15 90,10 120,10 150,10 150,15 180,15 210,15 210,10 240,10 v 28 h -240 z"
            ></path>
          </defs>
          <use id="wave3" class="wave" xlink:href="#wave" x="0" y="-2"></use>
          <use id="wave2" class="wave" xlink:href="#wave" x="0" y="0"></use>
          <use id="wave1" class="wave" xlink:href="#wave" x="0" y="1"></use>
        </svg>
      </v-card>

      <v-card v-if="formState === 2">
        <v-layout>
          <v-card>
            <v-card-title primary-title>
              <div>
                <div class="headline">Поздравляем!</div>
                <p class="grey--text">Вы успешно зарегистрированы</p>

                <p>
                  На ваш e-mail {{ email }} выслано письмо с активацией аккаунта,
                  пожалуйста следуйте инструкциям в письме
                </p>
                <p>До активации аккаунта вам предоставлен временный доступ</p>
              </div>
            </v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="$emit('input', false)"
                slot="activator"
                type="button"
              >OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-layout>
      </v-card>
    </v-card>
  </v-dialog>
</template>

<script>
import { validationMixin } from "vuelidate";
import {
  required,
  email,
  maxLength,
  minLength,
  sameAs
} from "vuelidate/lib/validators";
import config from "../config";

export default {
  mixins: [validationMixin],
  validations: {
    email: { required, email },
    password: { required, minLength: minLength(6) },
    verifyingPassword: { required, sameAsPassword: sameAs("password") }
  },
  name: "Login",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: function() {
    return {
      localValue: this.value,
      email: "",
      password: "",
      passwordShow: false,
      activeRegistration: config.activeRegistration,
      verifyingPassword: "",
      rules: {
        required: v => !!v || "Необходимо заполнить",
        min: v => v.length >= 6 || "Минимум 6 символов",
        sameAs: v => v === this.password || "Пароли должны совпадать"
      },
      formState: 0, //0 - show Login form; 1 - show Register form; 2 - show Congrats form;
      fetching: false, //true - show load animation on button
      message: "" //not empty - show message string at form
    };
  },
  watch: {
    formState: function() {
      this.message = "";
    },
    value: function() {
      this.localValue = this.value;
    },
    localValue: function() {
      this.$emit("input", this.localValue);
    }
  },
  computed: {
    isEmailAndPasswordFilled() {
      return this.$v.$invalid;
    },
    emailErrors() {
      const errors = [];
      if (!this.$v.email.$dirty) return errors;
      !this.$v.email.email && errors.push("Введите правильный e-mail");
      !this.$v.email.required && errors.push("Требуется e-mail");

      return errors;
    }
  },
  methods: {
    onSubmit() {
      if (this.$v.email.email || this.password) this.submit();
    },
    submit() {
      const { email, password } = this;

      this.fetching = true;
      this.message = "";

      if (this.formState) {
        this.$store
          .dispatch("REG_REQUEST", { email, password })
          .then(() => {
            this.fetching = false;
            this.formState = 2;
          })
          .catch(err => {
            this.message = err.message;
            this.fetching = false;
          });
      } else {
        this.$store
          .dispatch("AUTH_REQUEST", { email, password })
          .then(() => {
            this.fetching = false;
            this.$emit("input", false);
            this.$router.push({ name: "main-sheets" });
          })
          .catch(err => {
            this.message = err.message;
            this.fetching = false;
          });
      }
    }
  }
};
</script>

<style lang="stylus">
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.sv-title {
  width: 100%;
}

.wave {
  animation: wave 3s linear;
  animation-iteration-count: infinite;
  fill: #007bff;
}

#wave2 {
  animation-duration: 5s;
  animation-direction: reverse;
  opacity: 0.6;
}

#wave3 {
  animation-duration: 7s;
  opacity: 0.3;
}

@keyframes wave {
  to {
    transform: translateX(-100%);
  }
}

.login-header {
  color: white;
}

.active-login-header {
  text-decoration: underline;
}
</style>
