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
		//debugger
		state[state.activeUsersList.list].list = state[state.activeUsersList.list].list.concat(data)
		state[state.activeUsersList.list].offset = state[state.activeUsersList.list].offset + data.length
	},
	SET_ACTIVE_USERS_LIST: (state, activeID) => {
		let temp = state.activeUsersList

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
