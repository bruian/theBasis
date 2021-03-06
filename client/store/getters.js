const moment = require('moment');

function findEl(el, id) {
	let result;

	for (let i = 0; i < el.length; i++) {
		if (el[i].id === id) {
			result = el[i];
		} else if (el[i].children && el[i].children.length > 0) {
			result = findEl(el[i].children, id);
		}

		if (result) break;
	}

	return result;
}

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

	listGroupsHierarchy: state => group_id => {
		const topGroup = findEl(state.Groups, group_id);
		let listGroups = [group_id];

		function getChildren(chld, id) {
			let result = [];

			for (let i = 0; i < chld.length; i++) {
				if (chld[i].parent.id === id) {
					result.push(chld[i].id);
					if (chld[i].children && chld[i].children.length > 0) {
						result = result.concat(getChildren(chld[i].children, chld[i].id));
					}
				}
			}

			return result;
		}

		listGroups = listGroups.concat(getChildren(topGroup.children, group_id));
		return listGroups;
	},

	listTasksHierarchy: state => task_id => {
		const topTask = findEl(state.Tasks, task_id);
		let listTasks = [task_id];

		function getChildren(chld, id) {
			let result = [];

			for (let i = 0; i < chld.length; i++) {
				if (chld[i].parent.id === id) {
					result.push(chld[i].id);

					if (Object.prototype.hasOwnProperty.call(chld, 'children')) {
						if (chld[i].children && chld[i].children.length > 0) {
							result = result.concat(getChildren(chld[i].children, chld[i].id));
						}
					}
				}
			}

			return result;
		}

		if (Object.prototype.hasOwnProperty.call(topTask, 'children')) {
			listTasks = listTasks.concat(getChildren(topTask.children, task_id));
		}

		return listTasks;
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
		return findEl(state.Groups, id);
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
