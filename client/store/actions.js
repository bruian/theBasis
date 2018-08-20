import config from '../config'
import mTypes from './mutation-types'
import Vue from 'vue'
//import querystring from 'querystring'

const logRequests = !!config.DEBUG_API
const storage = (process.env.VUE_ENV === 'server') ? null : window.localStorage

const zeroTgmUsers = {
  id: '0',
  username: 'Add telegram user',
  phonenumber: '',
  api_id: '',
  api_hash: '',
  app_title: '',
  testConfiguration: '',
  prodConfiguration: '',
  rsaPublicKey: '',
  publicKeys: ''
}

function fetchTgmItem(id) {
  return new Promise((resolve, reject) => {
    if (id == '0') {
      zeroTgmUsers.__lastUpdated = Date.now()
      return resolve(zeroTgmUsers)
    }

    logRequests && console.log(`fetching ${id}...`)
    Vue.axios.get(`/tgmUsers/${id}`)
    .then(function (response) {
      //debugger
      if (response.data.tgmUser) {
        var tgmUser = response.data.tgmUser
        tgmUser.__lastUpdated = Date.now()
        tgmUser.id = tgmUser._id
        delete tgmUser._id

        logRequests && console.log(`fetched ${id}.`)
        resolve(tgmUser)
      }
    })
    .catch(function (error) {
      //debugger
      console.error('in fetchTgmItem', error)
      reject(error)
    })
  })
}

function fetchTgmUserIds() {
  return new Promise((resolve, reject) => {
    Vue.axios.get('/tgmUsers')
    .then(function(response) {
      //debugger
      var ids = ['0']
      response.data.map((currentValue) => {
        ids.push(currentValue._id)
      })

      resolve(ids)
    })
    .catch(function(error) {
      console.error('In fetchTgmUserIds', error)
      reject(error)
    })
  })
}

function fetchTgmItems(ids) {
  return Promise.all(ids.map(id => fetchTgmItem(id)))
}

export default {
	//*** Authentication actions */
	[mTypes.AUTH_REQUEST]: ({ commit, dispatch }, user) => {
		return new Promise((resolve, reject) => {
			commit(mTypes.AUTH_REQUEST)

			Vue.axios({ url: 'auth/login', data: user, method: 'POST' })
				.then(res => {
					const token = res.data.token
					storage.setItem('theBasis-token', token)

					commit(mTypes.AUTH_SUCCESS, token)

					//we have token, then we can log in user
					//dispatch(mTypes.USER_REQUEST)
					resolve(res)
				})
				.catch(err => {
					commit(mTypes.AUTH_ERROR, err)

					storage.removeItem('user-token')
					reject(err)
				})
		})
	},

	//*** Other actions */
  ENSURE_TGMUSER_ACTIVE_ITEMS: ({ dispatch, getters }) => {
    return dispatch('FETCH_TGMUSER_ITEMS', {
      ids: getters.activeIds
    })
  },

  FETCH_TGMUSER_ITEMS: ({ commit, state }, { ids }) => {
    //debugger
    const now = Date.now()
    ids = ids.filter(id => {
      const item = state.theItems[id]
      if (!item) {
        return true
      }
      if (now - item.__lastUpdated > 1000 * 60 * 3) {
        return true
      }
      return false
    })

    if (ids.length) {
      return fetchTgmItems(ids).then(items => commit('SET_TGMUSER_ITEMS', { items }))
    } else {
      return Promise.resolve()
    }
  },

  ADD_TGMUSER_ITEM: ({ commit, state }, obj) => {
    Vue.axios.post('/tgmUsers', obj)
    .then(response => {
      var ids = state.lists[state.activeType]
      ids.push(response.data.id)
      obj.id = response.data.id

      commit('SET_LIST', { type: state.activeType, ids })
      commit('SET_TGMUSER_ITEM', obj)

      return true
    })
    .catch(function(error) {
      console.error('In ADD_TGMUSER_ITEM', error)

      return false
    })
  },

  SAVE_TGMUSER_ITEM: ({ commit, state }, obj) => {
    Vue.axios.put(`/tgmUsers/${obj.id}`, obj)
    .then(response => {
      commit('SET_TGMUSER_ITEM', obj)

      return true
    })
    .catch(function(error) {
      console.error('In SAVE_TGMUSER_ITEM', error)

      return false
    })
  },

  DELETE_TGMUSER_ITEM: ({ commit, state }, obj) => {
    Vue.axios.delete(`/tgmUsers/${obj.id}`)
    .then(response => {
      //debugger
      var ids = state.lists[state.activeType]
      const idx = ids.findIndex((element) => { return element == obj.id })
      ids.splice(idx, 1)

      commit('SET_LIST', { type: state.activeType, ids })
      commit('DELETE_ITEM', obj)
    })
    .catch(function(error) {
      console.error('In DELETE_TGMUSER_ITEM', error)

      return false
    })
  },

  // ensure data for rendering given list type
  FETCH_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
    commit('SET_ACTIVE_TYPE', { type })

    if (type == 'tgmUsers') {
      return fetchTgmUserIds(type)
      .then(ids => commit('SET_LIST', { type, ids }))
      .then(() => dispatch('ENSURE_TGMUSER_ACTIVE_ITEMS'))
    } else {
      /*
      return fetchIdsByType(type)
        .then(ids => commit('SET_LIST', { type, ids }))
        .then(() => dispatch('ENSURE_ACTIVE_ITEMS'))
      */
    }
  },
/*
  // ensure all active items are fetched
  ENSURE_ACTIVE_ITEMS: ({ dispatch, getters }) => {
    return dispatch('FETCH_ITEMS', {
      ids: getters.activeIds
    })
  },

  FETCH_ITEMS: ({ commit, state }, { ids }) => {
    // on the client, the store itself serves as a cache.
    // only fetch items that we do not already have, or has expired (3 minutes)
    const now = Date.now()
    ids = ids.filter(id => {
      const item = state.items[id]
      if (!item) {
        return true
      }
      if (now - item.__lastUpdated > 1000 * 60 * 3) {
        return true
      }
      return false
    })
    if (ids.length) {
      return fetchItems(ids).then(items => commit('SET_ITEMS', { items }))
    } else {
      return Promise.resolve()
    }
  },

  FETCH_USER: ({ commit, state }, { id }) => {
    return state.users[id]
      ? Promise.resolve(state.users[id])
      : fetchUser(id).then(user => commit('SET_USER', { id, user }))
  }
  */
}
