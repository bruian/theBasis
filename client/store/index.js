import Vue from 'vue';
import Vuex from 'vuex';
import actions from './actions';
import mutations from './mutations';
import getters from './getters';

Vue.use(Vuex);

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
		layout: 2, // 1 - "one-column", 2 - "two-column"
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
		el_reading: 1,
		el_updating: 1,
		el_deleting: 1,
		group_type: 2,
		haveChild: 0,
	},
};

function createStore() {
	let store = new Vuex.Store({
		state: {
			default: { mainUser: def.mainUser }, // ?
			/* --------------------------------------Application state-------------------------------------- */
			appReady: false, // if true - application loaded and ready to render
			logStatus: true, // ON/OFF api status logging
			apiStatus: [], // log api status
			selectedSheetsManager: false,

			layout: 2, // TEMPORARY. Need move to main user

			/* -AUTHENTICATED STATUS -*/
			auth: { token: '', refreshToken: '' } /* api request: /auth-user */,

			/* -LOGGED USERS DATAS- */ mainUser: Object.assign({}, def.mainUser),
			mainUsers: [],
			mainUsersMini: [],
			mainGroups: [],
			mainGroupsMini: [],
			mainContexts: [],
			mainExistingContexts: {},

			/* -SELECTED DATAS- */
			theUser: {},

			theGroup: {
				id: 0,
			},

			updateQueue: [],

			subgroupsCache: [] /* api request: /users or /users/:id */,

			/* -USERS SHEET DATAS- */ activeUsersSheet: {
				text: 'all',
				whose: 'all',
				id: 0,
				sheet: 'usersSheetAll',
				visible: true,
				condition: [],
			},
			availableUsersSheet: [
				{
					text: 'my',
					whose: 'user',
					id: 1,
					sheet: 'usersSheetMy',
					visible: true,
					condition: ['user_id'],
				},
				{
					text: 'group',
					whose: 'group',
					id: 2,
					sheet: 'usersSheetGroup',
					visible: false,
					condition: ['user_id', 'group_id'],
				},
			],
			usersSheetAll: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: '',
			},
			usersSheetMy: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: '',
			},
			usersSheetGroup: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: '',
			} /* api request: /groups or /groups/:id */,

			/* -GROUPS SHEET DATAS- */ activeGroupsSheet: {
				text: 'all',
				whose: 'all',
				id: 0,
				sheet: 'groupsSheetAll',
				visible: true,
				condition: [],
			},
			availableGroupsSheet: [
				{
					text: 'my',
					whose: 'user',
					id: 1,
					sheet: 'groupsSheetMy',
					visible: true,
					condition: ['user_id'],
				},
			],
			groupsSheetAll: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: '',
			},
			groupsSheetMy: {
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: '',
			},
			/* ----------------------------------------Sheets state----------------------------------------- */
			selectedSheet: null,
			sheets: [],
		},
		actions,
		mutations,
		getters,
	});

	// Интервальное обновление токенов
	setInterval(() => {
		if (store.state.auth.token) {
			store.dispatch('CHECK_TOKENS');
		}
	}, 1000 * 60 * 5);

	// Установка опроса очереди
	// setInterval(() => {
	// 	store.dispatch('UPDATE_QUEUE', 3);
	// }, 500);

	return store;
}

export default createStore;
