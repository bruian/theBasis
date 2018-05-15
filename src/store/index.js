import Vue from 'vue'
import Vuex from 'vuex'
import actions from './actions'
import mutations from './mutations'
import getters from './getters'

Vue.use(Vuex)

export function createStore () {
  return new Vuex.Store({
    state: {
      activeType: null,
      itemsPerPage: 20,
      items: {/* [id: number]: Item */},
      users: {/* [id: string]: User */},
      theItems: {/* [id: number]: Item */},
      lists: {
        tgmUsers: [],
        top: [/* number */],
        new: [],
        show: [],
        ask: [],
        job: []
      },
      client_id: 'webxx090518',
      client_secret: 'abc123456'
    },
    actions,
    mutations,
    getters
  })
}
