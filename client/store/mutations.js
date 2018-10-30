import Vue from 'vue'

export default {
	//*** API Status mutation */
	API_ERROR: (state, error) => {
		state.apiStatus = 'error'
		state.apiError = error
	},

	//*** Authentication mutations */
	AUTH_REQUEST: (state) => {
		state.apiStatus = 'AUTH_REQUEST'
		state.apiError = null
	},
	AUTH_SUCCESS: (state, token) => {
		state.apiStatus = 'AUTH_SUCCESS'
		state.apiError = null

		state.auth.token = token
	},
	AUTH_LOGOUT: (state) => {
		state.apiStatus = 'AUTH_LOGOUT'
		state.apiError = null

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
		state.apiStatus = 'REG_REQUEST'
		state.apiError = null
	},
	REG_SUCCESS: (state, token) => {
		state.apiStatus = 'REG_SUCCESS'
		state.apiError = null

		state.auth.token = token
	},

	//*** MainUser mutations */
	MAINUSER_REQUEST: (state) => {
		state.apiStatus = 'MAINUSER_REQUEST'
		state.apiError = null
	},
	MAINUSER_SUCCESS: (state, user) => {
		state.apiStatus = 'MAINUSER_SUCCESS'
		state.apiError = null

		state.mainUser = Object.assign({}, user)
	},

	CHANGE_APP_READY: (state, ready) => {
		state.appReady = ready
	},

	//*** TheUser mutations */
	THEUSER_REQUEST: (state) => {
		state.apiStatus = 'THEUSER_REQUEST'
		state.apiError = null
	},
	THEUSER_SUCCESS: (state, user) => {
		state.apiStatus = 'THEUSER_SUCCESS'
		state.apiError = null
		//debugger
		if (state.mainUser.id === user.id) {
			state.theUser = state.mainUser
		} else {
			state.theUser = Object.assign({}, user)
		}
	},

	//*** Users list mutations */
	SET_USERS_LIST: (state, data) => {
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
		const ul = state[state.activeUsersList.list]
		const idx = ul.list.findIndex(el => el.id == values.id)
		ul.list.splice(idx, 1)
	},

	//*** Groups list mutations */
	SET_GROUPS_LIST: (state, data) => {
		//data.forEach(el => el.loadingButton = false)
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
	SET_PARAMS_GROUPS_LIST: (state, params) => {
		const ul = state[state.activeGroupsList.list]

		for (const key in params) {
			if (ul.hasOwnProperty(key)) {
				ul[key] = params[key]
			}
		}
	},
	RESET_GROUPS_LIST: (state) => {
		const ul = state[state.activeGroupsList.list]
		ul.list = []
		ul.offset = 0
		ul.limit = 10
		ul.searchText = ''
	},
	RESET_INACTIVE_GROUPS_LIST: (state) => {
		let ul
		for (let i = 0; i < state.availableGroupsList.length; i++) {
			ul = state[state.availableGroupsList[i].list]
			ul.list = []
			ul.offset = 0
			ul.limit = 10
			ul.searchText = ''
		}
	},
	UPDATE_VALUES_GROUPS_LIST: (state, values) => {
		const ul = state[state.activeGroupsList.list]
		const idx = ul.list.findIndex(el => el.id == values.id)
		const element = ul.list[idx]
		for (const key in values) {
			if (key === 'id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = values[key]
			}
		}
	},
	REMOVE_VALUES_GROUPS_LIST: (state, values) => {
		const ul = state[state.activeGroupsList.list]
		const idx = ul.list.findIndex(el => el.id == values.id)
		ul.list.splice(idx, 1)
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
