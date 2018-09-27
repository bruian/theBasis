import Vue from 'vue'
import Vuex from 'vuex'
import actions from './actions'
import mutations from './mutations'
import getters from './getters'

Vue.use(Vuex)

export function createStore () {
  return new Vuex.Store({
    state: {
			apiStatus: 'success',										//ok
			apiError: null, 												//ok
			theUser: { username:'', email: '' },		//ok
			appReady: false,												//ok
      activeType: null,
      itemsPerPage: 20,
      items: {/* [id: number]: Item */},
      users: {/* [id: string]: User */},
      theItems: [/* [id: number]: Item */],
      lists: {
        tgmUsers: [],
        top: [/* number */],
        new: [],
        show: [],
        ask: [],
        job: []
      },
      client_id: 'webxx090518',
			client_secret: 'abc123456',
			auth: {
				token: ''														//ok
			}
    },
    actions,
    mutations,
    getters
  })
}
