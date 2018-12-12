import Vue from 'vue'
import { recursiveFind, findGroup } from '../util/helpers'

/* use only for api srv mutations */
function setApiStatus(state, status, error) {
	if (state.logStatus) {
		state.apiStatus.push({ status, error })
	}
}

export default {
	//*** API Status mutation */
	API_ERROR: (state, error) => {
		setApiStatus(state, 'error', error)
	},

	//*** Authentication mutations */
	AUTH_REQUEST: (state) => {
		setApiStatus(state, 'AUTH_REQUEST', null)
	},
	AUTH_SUCCESS: (state, token) => {
		setApiStatus(state, 'AUTH_SUCCESS', null)

		state.auth.token = token
	},
	AUTH_LOGOUT: (state) => {
		setApiStatus(state, 'AUTH_LOGOUT', null)

		state.auth.token = null
		state.mainUser = Object.assign({}, state.default.mainUser)
		state.theUser = {}
		state.theGroup = {}
		state.activeUsersList = { text: "all", id: 0, list: 'usersListAll', visible: true, condition: [] }
		state.availableUsersList = [
			{ text: "my", id: 1, list: 'usersListMy', visible: true, condition: ['user_id'] },
			{ text: "group", id: 2, list: 'usersListGroup', visible: false, condition: ['user_id', 'group_id'] }
		]
		state.usersListAll.list = []
		state.usersListAll.offset = 0
		state.usersListMy.list = []
		state.usersListMy.offset = 0
		state.usersListGroup.list = []
		state.usersListGroup.offset = 0
	},

	//*** Registration mutations */
	REG_REQUEST: (state) => {
		setApiStatus(state, 'REG_REQUEST', null)
	},
	REG_SUCCESS: (state, token) => {
		setApiStatus(state, 'REG_SUCCESS', null)

		state.auth.token = token
	},

	//*** Main mutations */
	MAINUSER_REQUEST: (state) => {
		setApiStatus(state, 'MAINUSER_REQUEST', null)
	},
	MAINUSER_SUCCESS: (state, user) => {
		setApiStatus(state, 'MAINUSER_SUCCESS', null)

		state.mainUser = Object.assign({}, user)
	},
	MAINGROUPS_SUCCESS: (state, groups) => {
		setApiStatus(state, 'MAINGROUPS_SUCCESS', null)

		//debugger
		state.mainGroups = groups

		let hierarchicalRows = []
		function constructHierarchy (rows, parentId) {
			let hRows = [], record

			for (let i = 0; i < rows.length; i++) {
				record = {
					id: rows[i].id,
					name: rows[i].name,
					label: rows[i].name,
					parent: rows[i].parent,
					level: rows[i].level,
					group_type: rows[i].group_type,
					user_type: rows[i].user_type,
					children: rows[i].children
				}
				//Object.assign({}, rows[i])

				if ((parentId === null && record.parent === null) || (record.parent === parentId)) {
					if (record.children) {
						const innerRows = constructHierarchy(record.children, record.id)
						if (innerRows.length > 0) {
							record.children = innerRows
						}
					}

					hRows.push(record)
				}
			}

			return hRows
		}
		hierarchicalRows = constructHierarchy(groups, null)

		state.mainGroupsMini = hierarchicalRows
	},

	CHANGE_APP_READY: (state, ready) => {
		state.appReady = ready
	},

	//*** TheUser mutations */
	THEUSER_REQUEST: (state) => {
		setApiStatus(state, 'THEUSER_REQUEST', null)
	},
	THEUSER_SUCCESS: (state, user) => {
		setApiStatus(state, 'THEUSER_SUCCESS', null)
		//debugger
		if (state.mainUser.id === user.id) {
			state.theUser = state.mainUser
		} else {
			state.theUser = Object.assign({}, user)
		}
	},

	//*** Users list mutations */
	SET_USERS_LIST: (state, data) => {
		setApiStatus(state, 'SET_USERS_LIST', null)

		data.forEach(el => el.loadingButton = false)
		state[state.activeUsersList.list].list = state[state.activeUsersList.list].list.concat(data)
		state[state.activeUsersList.list].offset = state[state.activeUsersList.list].offset + data.length
	},
	SET_ACTIVE_USERS_LIST: (state, activeID) => {
		let temp = state.activeUsersList

		state.activeUsersList = state.availableUsersList.splice(state.availableUsersList.findIndex(el => el.id == activeID), 1)[0]
		if (temp.id > -1) {
			if (temp.id === 0) {
				state.availableUsersList.unshift(temp)
			} else {
				let fIndex = state.availableUsersList.findIndex(el => el.id > temp.id)
				if (fIndex > -1) {
					state.availableUsersList.splice(fIndex, 0, temp)
				} else {
					state.availableUsersList.push(temp)
				}
			}
		}
	},
	SET_PARAMS_USERS_LIST: (state, params) => {
		const ul = state[state.activeUsersList.list]

		for (const key in params) {
			if (ul.hasOwnProperty(key)) {
				ul[key] = params[key]
			}
		}
	},
	RESET_USERS_LIST: (state) => {
		const ul = state[state.activeUsersList.list]
		ul.list = []
		ul.offset = 0
		ul.limit = 10
		ul.searchText = ''
	},
	RESET_INACTIVE_USERS_LIST: (state) => {
		let ul
		for (let i = 0; i < state.availableUsersList.length; i++) {
			ul = state[state.availableUsersList[i].list]
			ul.list = []
			ul.offset = 0
			ul.limit = 10
			ul.searchText = ''
		}
	},
	UPDATE_VALUES_USERS_LIST: (state, values) => {
		setApiStatus(state, 'UPDATE_VALUES_USERS_LIST', null)

		const ul = state[state.activeUsersList.list]
		const idx = ul.list.findIndex(el => el.id == values.id)
		const element = ul.list[idx]
		for (const key in values) {
			if (key === 'id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = values[key]
				//Vue.set(ul.list, idx, element)
			}
		}
	},
	REMOVE_VALUES_USERS_LIST: (state, values) => {
		setApiStatus(state, 'REMOVE_VALUES_USERS_LIST', null)

		const ul = state[state.activeUsersList.list]
		const idx = ul.list.findIndex(el => el.id == values.id)
		ul.list.splice(idx, 1)
	},

	//*** Groups list mutations */
	SET_GROUPS_LIST: (state, data) => {
		setApiStatus(state, 'SET_GROUPS_LIST', null)

		state[state.activeGroupsList.list].list = state[state.activeGroupsList.list].list.concat(data)
		state[state.activeGroupsList.list].offset = state[state.activeGroupsList.list].offset + data.length
	},
	SET_ACTIVE_GROUPS_LIST: (state, activeID) => {
		let temp = state.activeGroupsList

		state.activeGroupsList = state.availableGroupsList.splice(state.availableGroupsList.findIndex(el => el.id == activeID), 1)[0]
		if (temp.id > -1) {
			if (temp.id === 0) {
				state.availableGroupsList.unshift(temp)
			} else {
				let fIndex = state.availableGroupsList.findIndex(el => el.id > temp.id)
				if (fIndex > -1) {
					state.availableGroupsList.splice(fIndex, 0, temp)
				} else {
					state.availableGroupsList.push(temp)
				}
			}
		}
	},
	SET_SUBGROUPS: (state, data) => {
		setApiStatus(state, 'SET_SUBGROUPS', null)

		const gl = state[state.activeGroupsList.list]
		let fIndex = -1

		for (let i = 0; i < data.length; i++) {
			/*
			fIndex = state.subgroupsCache.findIndex(el => el.id === data[i].id)
			if (fIndex === -1) {
				state.subgroupsCache.push(data[i])
			}
			*/

			fIndex = gl.list.findIndex(el => el.id === data[i].id)
			if (fIndex > -1) {
				gl.list[fIndex].children = data[i].children
			}
		}
	},
	SET_PARAMS_GROUPS_LIST: (state, params) => {
		const gl = state[state.activeGroupsList.list]

		for (const key in params) {
			if (gl.hasOwnProperty(key)) {
				gl[key] = params[key]
			}
		}
	},
	RESET_GROUPS_LIST: (state) => {
		const gl = state[state.activeGroupsList.list]
		gl.list = []
		gl.offset = 0
		gl.limit = 10
		gl.searchText = ''
	},
	RESET_INACTIVE_GROUPS_LIST: (state) => {
		setApiStatus(state, 'RESET_INACTIVE_GROUPS_LIST', null)

		let gl
		for (let i = 0; i < state.availableGroupsList.length; i++) {
			gl = state[state.availableGroupsList[i].list]
			gl.list = []
			gl.offset = 0
			gl.limit = 10
			gl.searchText = ''
		}
	},
	UPDATE_VALUES_GROUPS_LIST: (state, values) => {
		setApiStatus(state, 'UPDATE_VALUES_GROUPS_LIST', null)

		const gl = state[state.activeGroupsList.list]
		const idx = gl.list.findIndex(el => el.id == values.id)
		const element = gl.list[idx]
		for (const key in values) {
			if (key === 'id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = values[key]
			}
		}
	},
	REMOVE_VALUES_GROUPS_LIST: (state, values) => {
		setApiStatus(state, 'REMOVE_VALUES_GROUPS_LIST', null)

		const gl = state[state.activeGroupsList.list]
		const idx = gl.list.findIndex(el => el.id == values.id)
		gl.list.splice(idx, 1)
	},

	//*** Tasks mutations */
	SET_TASKS: (state, obj) => {
		//debugger
		setApiStatus(state, 'SET_TASKS', null)

		const activeList = state.listOfList.find(el => el.list_id === obj.list_id)
		const taskList = activeList.list
		const data = obj.data

		let prevGroupId, prevParentId, prevParent
		for (let i = 0; i < data.length; i++) {
			if (prevGroupId !== data[i].group_id && data[i].parent === 0) {
				let grp = findGroup(state.mainGroups, data[i].group_id)
				taskList.push({ isDivider: true,
					group_id: data[i].group_id,
					name: grp.name,
					isActive: false })
				prevGroupId = data[i].group_id
			}

			if (data[i].task_id) {
				switch (data[i].task_id) {
					case 1:
						data[i].context = ['maus', 'santa']
						break
					case 3:
						data[i].context = ['klaus', 'ganta']
						break
					default:
						data[i].context = new Array
						break
				}
			}

			data[i].isShowed = (data[i].level > 1) ? false : true
			data[i].isSubtaskExpanded = 0
			data[i].isExpanded = false
			data[i].isActive = false
			data[i].level = 1

			if (data[i].parent === 0) {
				activeList.offset++
				taskList.push(data[i])
			} else {
				if (!prevParentId) {
					if (prevParent !== data[i].parent) {
						prevParent = recursiveFind(taskList, el => el.task_id === data[i].parent)
					}
				}

				if (prevParent) {
					data[i].level = prevParent.level + 1
					prevParent.children.push(data[i])
				}
			}
		}

		//activeList.offset = activeList.offset + data.length
	},

	SET_ACTIVE_TASKS_LIST: (state, activeID) => {
		let temp = state.activeTasksList

		state.activeTasksList = state.availableTasksList.splice(state.availableTasksList.findIndex(el => el.id == activeID), 1)[0]
		if (temp.id > -1) {
			if (temp.id === 0) {
				state.availableTasksList.unshift(temp)
			} else {
				let fIndex = state.availableTasksList.findIndex(el => el.id > temp.id)
				if (fIndex > -1) {
					state.availableTasksList.splice(fIndex, 0, temp)
				} else {
					state.availableTasksList.push(temp)
				}
			}
		}
	},

	//values must contain task_id of element task_id:id
	UPDATE_TASK_VALUES: (state, obj) => {
		const activeList = state.listOfList.find(el => el.list_id === obj.list_id)
		let taskList = activeList.list
		const element = recursiveFind(taskList, el => el.task_id === obj.task_id)

		for (const key in obj) {
			if (key === 'task_id' || key === 'reorder' || key === 'list_id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = obj[key]
			}
		}
	},

	SET_ACTIVE_TASK: (state, obj) => {
		const activeList = state.listOfList.find(el => el.list_id === obj.list_id)
		let activedTask = recursiveFind(activeList.list, el => el.isActive === true)
		if (activedTask) {
			activedTask.isActive = false
		}

		let activeTask = recursiveFind(activeList.list, el => el.task_id === obj.task_id)
		if (activeTask) {
			activeTask.isActive = true
		}
	},

	UPDATE_LUST_CONDITION: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id)

		for (const key in options) {
			if (key === 'list_id') continue

			activeList.condition[key] = options[key]
		}
	},

	//*** Other mutations */
  SET_ACTIVE_TYPE: (state, { type }) => {
    state.activeType = type
  },
  SET_LIST: (state, { type, ids }) => {
    state.lists[type] = ids
  },
  SET_ITEMS: (state, { items }) => {
    items.forEach(item => {
      if (item) {
        Vue.set(state.items, item.id, item)
      }
    })
  },
  SET_TGMUSER_ITEMS: (state, { items }) => {
    items.forEach(item => {
      if (item) {
        const idx = state.theItems.findIndex((element) => { item.id == element.id })

        Vue.set(state.theItems, idx == -1 ? state.theItems.length : idx, item)
      }
    })
  },
  SET_TGMUSER_ITEM: (state, item) => {
    const idx = state.theItems.findIndex((element) => { item.id == element.id })

    Vue.set(state.theItems, idx == -1 ? state.theItems.length : idx, item)
  },
  DELETE_ITEM: (state, item) => {
    var items = state.theItems
    items.splice(items.indexOf(item), 1)
  },
  SET_USER: (state, { id, user }) => {
    Vue.set(state.users, id, user || false) /* false means user not found */
  }
}

		/*
		let item = state.availableUsersList.find(el => el.id == activeID)
		if (item.condition) {
			for (const key in item.condition) {
				if (item.condition.hasOwnProperty(key)) {
					//const element = item.condition[key];
					switch (key) {
						case 'id':
							item.condition[key] = state.mainUser.id
							break
						case 'user_id':
							item.condition[key] = state.user.id
							break
						case 'group_id':
							item.condition[key] = state.group.id
							break
					}
				}
			}
		}
		*/
