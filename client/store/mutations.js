import mTypes from './mutation-types'
import Vue from 'vue'

export default {
	//*** API Status mutation */
	[mTypes.API_ERROR]: (state, error) => {
		state.apiStatus = 'error'
		state.apiError = error
	},
	//*** Authentication mutations */
	[mTypes.AUTH_REQUEST]: (state) => {
		state.apiStatus = mTypes.AUTH_REQUEST
		state.apiError = null
	},
	[mTypes.AUTH_SUCCESS]: (state, token) => {
		state.apiStatus = mTypes.AUTH_SUCCESS
		state.apiError = null

		state.auth.token = token
	},
	[mTypes.AUTH_LOGOUT]: (state) => {
		state.apiStatus = mTypes.AUTH_LOGOUT
		state.apiError = null

		state.auth.token = null
	},
	//*** Registration mutations */
	[mTypes.REG_REQUEST]: (state) => {
		state.apiStatus = mTypes.REG_REQUEST
		state.apiError = null
	},
	[mTypes.REG_SUCCESS]: (state, token) => {
		state.apiStatus = mTypes.REG_SUCCESS
		state.apiError = null

		state.auth.token = token
	},
	//*** User mutations */
	[mTypes.USER_REQUEST]: (state) => {
		state.apiStatus = mTypes.USER_REQUEST
		state.apiError = null
	},
	[mTypes.USER_SUCCESS]: (state, user) => {
		state.apiStatus = mTypes.USER_SUCCESS
		state.apiError = null

		state.theUser = user
	},
	CHANGE_APP_READY: (state, ready) => {
		state.appReady = ready
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
