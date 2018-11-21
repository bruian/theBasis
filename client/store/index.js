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
	},
	mainGroup: {
		group_id: 0,
		user_type: 1,
		name: 'personal',
		parent: null,
		creating: 1,
		reading: 1,
		updating: 1,
		deleting: 1,
		task_creating: 1,
		task_reading:1 ,
		task_updating: 1,
		task_deleting: 1,
		group_type: 2,
		haveChild: 0
	}
}

export function createStore () {
  return new Vuex.Store({
    state: {
			default: { mainUser: def.mainUser }, //?
			/* -APPLICATION STATE- */
			appReady: false,				//if True - appliacation loaded and ready to render
			logStatus: true,				//ON/OFF api status logging
			apiStatus: [],			 		//log api status
			//apiError: [], 			  //log api error (from server)

			/* -AUTHENTICATED STATUS -*/
			auth: {	token: ''	},

			/* -LOGGED USERS DATAS- *//* api request: /auth-user */
			mainUser: Object.assign({}, def.mainUser),
			mainUsers: [],
			mainUsersMini: [],
			mainGroups: [],
			mainGroupsMini: [],
			mainContext: [],

			/* -SELECTED DATAS- */
			theUser: {},

			theGroup: {
				id: 0
			},

			theTask: {
				id: null
			},

			subgroupsCache: [],

			/* -USERS LIST DATAS- *//* api request: /users or /users/:id */
			activeUsersList: { text: 'all', whose: 'all', id: 0, list: 'usersListAll', visible: true, condition: [] },
			availableUsersList: [
				{ text: 'my', whose: 'user', id: 1, list: 'usersListMy', visible: true, condition: ['user_id'] },
				{ text: 'group', whose: 'group', id: 2, list: 'usersListGroup', visible: false, condition: ['user_id', 'group_id'] }
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

			/* -GROUPS LIST DATAS- *//* api request: /groups or /groups/:id */
			activeGroupsList: { text: 'all', whose: 'all', id: 0, list: 'groupsListAll', visible: true, condition: [] },
			availableGroupsList: [
				{ text: 'my', whose: 'user', id: 1, list: 'groupsListMy', visible: true, condition: ['user_id'] }
			],
			groupsListAll: {
				list: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},
			groupsListMy: {
				list: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},

			/* -TASKS LIST DATAS- *//* api request: /tasks */
			activeTasksList: { text: 'all', whose: 'user', id: 0, list: 'tasksList', visible: true, condition: [] },
			availableTasksList: [
				{ text: 'complete', whose: 'user', id: 0, list: 'tasksList', visible: true, condition: [] }
			],
			tasksList: {
				list: [],
				context: [{
					id: 1,
					tags: ['maus', 'santa']
				},{
					id: 3,
					tags: ['klaus', 'ganta']
				}],
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
