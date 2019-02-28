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

/* Data structure
	sheets: [
		{
			icon: ("G", "T", "U", "A"),
			id: Number,
			layout: Number,
			limit: Number,
			offset: Number,
			name: String,
			owner_id: 1,
			like: String,
			selectedItem: link to Object,
			service: Boolean,
			sheet_id: String,
			type_el: ("groups-sheet", "tasks-sheet", "users-sheet", "activity-sheet"),
			user_id: Number,
			visible: Boolean,
			condition: {
				group_id: String,
				parent_id: String,
				task_id: String,
				userId: Number
			},
			sh: [{
				isDivider: Boolean,
				isShowed: Boolean,
				isSubElementExpanded: Number,
				isExpanded: Boolean,
				isActive: Boolean,
				consistency: Number,
				el: link to datas
			}]
		}
	],
	Tasks: [
		{
			id: String,
			parent: String,
			...
		}
	]
*/

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
			mainExistingContexts: {},

			/* -SELECTED DATAS- */
			theUser: {},

			updateQueue: [],

			Tasks: [],
			Groups: [],
			Users: [],
			Activity: [],
			Contexts: [],

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
