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
selectedSheet: '', //TEMPORARY. Need move to main user
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

			subgroupsCache: [],

			/* -USERS SHEET DATAS- *//* api request: /users or /users/:id */
			activeUsersSheet: { text: 'all', whose: 'all', id: 0, sheet: 'usersSheetAll', visible: true, condition: [] },
			availableUsersSheet: [
				{ text: 'my', whose: 'user', id: 1, sheet: 'usersSheetMy', visible: true, condition: ['user_id'] },
				{ text: 'group', whose: 'group', id: 2, sheet: 'usersSheetGroup', visible: false, condition: ['user_id', 'group_id'] }
			],
			usersSheetAll: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},
			usersSheetMy: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},
			usersSheetGroup: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},

			/* -GROUPS SHEET DATAS- *//* api request: /groups or /groups/:id */
			activeGroupsSheet: { text: 'all', whose: 'all', id: 0, sheet: 'groupsSheetAll', visible: true, condition: [] },
			availableGroupsSheet: [
				{ text: 'my', whose: 'user', id: 1, sheet: 'groupsSheetMy', visible: true, condition: ['user_id'] }
			],
			groupsSheetAll: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},
			groupsSheetMy: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: ''
			},

			theSheet: 0,
			listOfList: [
				{
					sheet_id: 'main-tasks',
					condition: {
						group_id: null,
						user_id: null,
						parent_id: null,
						task_id: null,
						searchText: null
					},
					selectedSheet: true,
					selectedItem: null,
					sheet: [],
					limit: 10,
					offset: 0,
				}
			],

			mainSheets: [
			],

			sheets: [],
    },
    actions,
    mutations,
    getters
  })
}
