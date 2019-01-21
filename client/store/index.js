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
		friend: 0,
		layout: 2 // 1 - "one-column", 2 - "two-column"
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
		el_creating: 1,
		el_reading:1 ,
		el_updating: 1,
		el_deleting: 1,
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
layout: 2, //TEMPORARY. Need move to main user
			/* -AUTHENTICATED STATUS -*/
			auth: {	token: ''	},

			/* -LOGGED USERS DATAS- *//* api request: /auth-user */
			mainUser: Object.assign({}, def.mainUser),
			mainUsers: [],
			mainUsersMini: [],
			mainGroups: [],
			mainGroupsMini: [],
			mainContexts: [],
			mainExistingContexts: {},

			/* -SELECTED DATAS- */
			theUser: {},

			theGroup: {
				id: 0
			},

			theTask: {
				task_id: 0
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

			theList: 0,
			listOfList: [
				{
					list_id: 'main-tasks',
					condition: {
						group_id: null,
						user_id: null,
						parent_id: null,
						task_id: null,
						searchText: null
					},
					selectedList: true,
					selectedItem: null,
					list: [],
					limit: 10,
					offset: 0,
				}
			],

			mainSheets: [
				{ id: 1, icon: 'T', component: 'task-listH', list_id: 'main-tasks', visible: true, layout: 1, name: 'Me tasked' },
				{ id: 2, icon: 'T', component: 'task-listV', list_id: 'main-tasks', visible: true, layout: 2, name: 'Me tasked' },
				{ id: 3, icon: 'G', component: 'groups-listV', list_id: 'main-groups', visible: true, layout: 2, name: 'Me groups' },
				{ id: 4, icon: 'T', component: 'task-listV', list_id: 'main-tasks', visible: true, layout: 2, name: 'Me tasked' },
				{ id: 5, icon: 'T', component: 'task-listV', list_id: 'main-tasks', visible: false, layout: 2, name: 'Me tasked' },
			]
    },
    actions,
    mutations,
    getters
  })
}
