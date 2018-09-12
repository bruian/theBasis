import mTypes from './mutation-types'
import Vue from 'vue'

export default {
	//*** Authentication mutations */
	[mTypes.AUTH_REQUEST]: (state) => {
		state.auth.status = 'loading'
	},
	[mTypes.AUTH_SUCCESS]: (state, token) => {
		state.auth.status = 'success'
		state.auth.token = token
	},
	[mTypes.AUTH_ERROR]: (state) => {
		state.auth.status = 'error'
	},
	//*** Registration mutations */
	[mTypes.REG_REQUEST]: (state) => {
		state.auth.status = 'loading'
	},
	[mTypes.REG_SUCCESS]: (state, token) => {
		state.auth.status = 'success'
		state.auth.token = token
	},
	[mTypes.REG_ERROR]: (state) => {
		state.auth.status = 'error'
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
