<template>
  <li class='telegram-user-item'>
    <b-card bg-variant='info' text-variant='white' :title="item.username + (item.phonenumber ? ' | ' : '') + item.phonenumber">
      <b-btn v-b-toggle="'collapse'+item.id" variant='secondary'>{{ oneButtonCaption }}</b-btn>
      <b-btn 
        v-if="formCollapse"
        @click="formCollapse =! formCollapse"
        aria-controls="'collapse'+item.id" 
        variant='secondary' 
        :aria-expanded="formCollapse ? 'true' : 'false'">{{ twoButtonCaption }}
      </b-btn>
      <b-btn 
        v-if="formCollapse && item.id > 0"
        @click="formCollapse =! formCollapse"
        aria-controls="'collapse'+item.id" 
        variant='danger' 
        :aria-expanded="formCollapse ? 'true' : 'false'">{{ threeButtonCaption }}
      </b-btn>      
      <b-collapse :id="'collapse' + item.id" v-model='formCollapse' class='mt-2'>
        <br>
        <b-form>
          <p>App configuration</p>
          <b-form-group horizontal id='apiIdGroup' label='App api_id' label-for='apiIdInput' :label-cols="2" label-size="sm">
            <b-form-input id='apiIdInput' required placeholder='Enter api_id' size="sm" v-model.trim="form.api_id"></b-form-input>
          </b-form-group>
          <b-form-group horizontal id='apiHashGroup' label='App api_hash' label-for='apiHashInput' :label-cols="2" label-size="sm">
            <b-form-input id='apiHashInput' required placeholder='Enter api_hash' size="sm" v-model.trim="form.api_hash"></b-form-input>
          </b-form-group>
          <b-form-group horizontal id='apiApptitleGroup' label='App title' label-for='apiApptitleInput' :label-cols="2" label-size="sm">
            <b-form-input id='apiApptitleInput' required placeholder='Enter app title' size="sm" v-model.trim="form.app_title"></b-form-input>
          </b-form-group>
          <p>Available MTProto servers</p>
          <b-form-group horizontal id='testConfigurationGroup' label='Test configuration' label-for='testConfigurationInput' :label-cols="2" label-size="sm">
            <b-form-input id='testConfigurationInput' required placeholder='Enter test configuration ip' size="sm" v-model.trim='form.testConfiguration'></b-form-input>
          </b-form-group>
          <b-form-group horizontal id='prodConfigurationGroup' label='Production configuration' label-for='prodConfigurationInput' :label-cols="2" label-size="sm">
            <b-form-input id='prodConfigurationInput' required placeholder='Enter production configuration ip' size="sm" v-model.trim='form.prodConfiguration'></b-form-input>
          </b-form-group>
          <p>Public keys</p>
          <b-form-group id='rsaPublicKeyGroup' label='RSA Public key' label-for='rsaPublicKeyTextarea' :label-cols="2" label-size="sm">
            <b-form-textarea id='rsaPublicKeyTextarea' v-model='form.rsaPublicKey'></b-form-textarea>
          </b-form-group>
          <b-form-group id='publicKeysGroup' label='Public keys' label-for='publicKeysTextarea' :label-cols="2" label-size="sm">
            <b-form-textarea id='publicKeysTextarea' v-model='form.publicKeys'></b-form-textarea>
          </b-form-group>
        </b-form>
      </b-collapse>
    </b-card>
  </li>
</template>

<script>
import { timeAgo } from '../util/filters'

export default {
  name: 'telegram-user-item',
  props: ['item'],
  data () {
    return {
      formCollapse: false,
      form: {
        api_id: this.item.api_id,
        api_hash: this.item.api_hash,
        app_title: this.item.app_title,
        testConfiguration: this.item.testConfiguration,
        prodConfiguration: this.item.prodConfiguration,
        rsaPublicKey: this.item.rsaPublicKey,
        publicKeys: this.item.publicKeys
      }
    }
  },
  computed: {
    oneButtonCaption: function () {
      if (this.item.id == 0) {
        return this.formCollapse ? 'Confirm' : 'Add user'
      } else {
        return this.formCollapse ? 'Confirm' : 'Edit user'
      }
    },
    twoButtonCaption: function () {
      return this.formCollapse ? 'Cancel' : ''
    },
    threeButtonCaption: function () {
      return this.formCollapse ? 'Delete' : ''
    }
  },
  // http://ssr.vuejs.org/en/caching.html#component-level-caching
  serverCacheKey: ({ item: { id, __lastUpdated, time }}) => {
    return `${id}::${__lastUpdated}::${timeAgo(time)}`
  }
}
</script>

<style lang='stylus'>
.btn-secondary
  margin-left 5px
.btn-danger
  margin-left 5px
.telegram-user-item
  background-color #fff
  padding 10px 10px 10px 20px
  border 1px solid #eee
  position relative
  line-height 20px
  .user-name
    color #ff6600
    font-size 1.1em
    font-weight 700
    top 50%
    width 30px
    text-align center
    margin-left 10px
  .phonenumber
    margin-left 10px
    font-size .85em
    color #828282
    &:hover
      color #ff6600

</style>
