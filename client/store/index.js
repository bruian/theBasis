import Vue from 'vue'
import Vuex from 'vuex'
import actions from './actions'
import mutations from './mutations'
import getters from './getters'

Vue.use(Vuex)

const def = {
	mainUser: {
		id: 0,
		username: '',
		name: '',
		email: '',
		verified: true,
		loged: false,
		city: '',
		country: '',
		gender: '',
		phone: '',
		avatar: '',
		friend: 0
	}
}

export function createStore () {
  return new Vuex.Store({
    state: {
			default: { mainUser: def.mainUser },
			/* -APPLICATION STATE- */
			appReady: false,					 //if True - appliacation loaded and ready to render
			apiStatus: 'success',			 //last status api response (from server)
			apiError: null, 					 //last api error (from server)

			/* -AUTHENTICATED STATUS -*/
			auth: {	token: ''	},

			/* -LOGGED USERS DATAS- *//* api request: /auth-user */
			mainUser: Object.assign({}, def.mainUser),

			/* -SELECTED DATAS- */
			theUser: {},

			theGroup: {
				id: 0
			},

			/* -USERS LIST DATAS- *//* api request: /users or /users/:id */
			activeUsersList: { text: "all", whoose:'all', id: 0, list: 'usersListAll', visible: true, condition: [] },
			availableUsersList: [
				{ text: "my", whoose: 'user', id: 1, list: 'usersListMy', visible: true, condition: ['user_id'] },
				{ text: "group", whoose: 'group', id: 2, list: 'usersListGroup', visible: false, condition: ['user_id', 'group_id'] }
			],
			usersListAll: {
				list: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},
			usersListMy: {
				list: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},
			usersListGroup: {
				list: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},

			/* -OTHERS DATAS- */
      activeType: null,
      itemsPerPage: 20,
      items: {/* [id: number]: Item */},
      users: {/* [id: string]: User */},
      theItems: [/* [id: number]: Item */],
      lists: {
        tgmUsers: [],
        new: [],
        show: [],
        ask: [],
        job: []
      },
    },
    actions,
    mutations,
    getters
  })
}
