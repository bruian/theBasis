const moment = require('moment');

export default {
	/* Authentication getters */
	isAuth: state => !!state.auth.token,
	apiStatus: state => state.apiStatus,
	token: state => state.auth.token,

	/**
	 * @func generalLayout
	 * @param {vuex state: Object} - state
	 * @param {vuetify breakpoint: Object } - breakpoint
	 * @returns { Object } - layout components for render
	 * @description Get the filtered components for a render in the general layouts.
	 * 	state.mainUser.layout: 1 - "one-column", 2 - "two-column"
	 */
	generalLayout: state => {
		const activeLayout = state.generalLayouts.length
			? state.generalLayouts[state.generalLayouts.length - 1]
			: undefined;

		return activeLayout;
	},

	/**
	 * @func additionalLayout
	 * @param {vuex state: Object} - state
	 * @returns { Object } - layout components for render
	 * @description Get the filtered components for a render in the additional layouts.
	 * 	state.mainUser.layout: 1 - "one-column", 2 - "two-column"
	 */
	additionalLayout: state => {
		const activeLayout = state.additionalLayouts.length
			? state.additionalLayouts[state.additionalLayouts.length - 1]
			: undefined;

		return activeLayout;
	},

	/**
	 * @func isShowAdditional
	 * @param {vuex state: Object} - state
	 * @param {vuetify breakpoint: Object } - breakpoint
	 * @returns { Boolean } - can render or can't
	 * @description Get information about the possibility of rendering an additional sheet.
	 * 	state.mainUser.layout: 1 - "one-column", 2 - "two-column"
	 */
	isShowAdditional: state => breakpoint => {
		if (state.mainUser.layout === 1) {
			return false;
		} else {
			return !breakpoint.smAndDown;
		}
	},

	// usersSheet(state) {
	// 	return state[state.activeUsersSheet.sheet].sheet;
	// },

	// groupsSheet(state) {
	// 	return state[state.activeGroupsSheet.sheet].sheet;
	// },

	tasksSheet: state => sheet_id => {
		return state.sheets.find(el => el.sheet_id === sheet_id).sheet;
	},

	contextByExistingTag: state => index => {
		return state.Contexts.find(el => el.value === state.mainExistingContexts[index]);
	},

	contextByValue: state => (value, task_id) => {
		return state.Contexts.find(el => el.value === value && el.task_id === task_id);
	},

	taskByIndex: state => obj => {
		const currentSheet = state.sheets.find(el => el.sheet_id === obj.sheet_id).sheet;
		return currentSheet[obj.index];
	},

	groupById: state => id => {
		function findGroup(grp) {
			let result;

			for (let i = 0; i < grp.length; i++) {
				if (grp[i].id === id) {
					result = grp[i];
				} else if (grp[i].children && grp[i].children.length > 0) {
					result = findGroup(grp[i].children);
				}

				if (result) break;
			}

			return result;
		}

		return findGroup(state.Groups);
	},

	mainGroups: state => {
		function getElements(arr, cb) {
			let result = [];

			for (let i = 0; i < arr.length; i++) {
				if (cb(arr[i])) {
					result.push(Object.assign({}, arr[i]));
				}

				if (
					Object.prototype.hasOwnProperty.call(arr[i], 'children') &&
					arr[i].children.length > 0
				) {
					result[result.length - 1].children = getElements(arr[i].children, cb);
				}
			}

			return result;
		}

		return getElements(state.Groups, el => el.user_id === state.mainUser.id);
	},

	mainGroupsMini: state => {
		function getElements(arr, cb) {
			let result = [];

			for (let i = 0; i < arr.length; i++) {
				if (cb(arr[i])) {
					arr[i].label = arr[i].name;
					result.push({
						id: arr[i].id,
						label: arr[i].name
					});
				}

				if (
					Object.prototype.hasOwnProperty.call(arr[i], 'children') &&
					arr[i].children.length > 0
				) {
					result[result.length - 1].children = getElements(arr[i].children, cb);
				}
			}

			return result;
		}

		return getElements(state.Groups, el => el.user_id === state.mainUser.id);
	},

	workDateIsoStr: state => {
		if (state.mainUser.workDate) {
			return moment(state.mainUser.workDate).format('YYYY-MM-DD');
		}

		return moment().format('YYYY-MM-DD');
	}
};
