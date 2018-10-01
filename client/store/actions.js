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
	//*** User actions */
	[mTypes.USER_REQUEST]: ({ commit, dispatch }, token) => {
		return new Promise((resolve, reject) => {
			const axiosData = {
				url: 'user',
				method: 'GET',
				headers: { 'content-type': 'application/x-www-form-urlencoded',
									 'Authorization': 'Bearer ' + token }
			}

			commit(mTypes.USER_REQUEST)
			//debugger
			//Request from server
			//If the token is close to expiration, we will get a new token
			//else we get the requested data
			Vue.axios(axiosData)
			.then((res) => {
				//debugger
				const data = res.data
				if (data.action && data.action === 'refreshed') {
					storage.setItem('access_token', data.access_token)
					commit(mTypes.AUTH_SUCCESS, data.access_token)

					//have received a new token and do it again for our data
					axiosData.headers.Authorization = 'Bearer ' + data.access_token
					return Vue.axios(axiosData)
				} else {
					//if you did not receive an update token, then we will pass the
					//server response to the next handler
					commit(mTypes.AUTH_SUCCESS, token)

					return Promise.resolve(res)
				}
			})
			.then((res) => {
				//debugger
				const data = res.data
				commit(mTypes.USER_SUCCESS, data)

				resolve(res)
			})
			.catch((err) => {
				commit(mTypes.API_ERROR, err.response.data)

				reject(err.response.data)
			})
		})
	},

	//*** Authentication actions */
	[mTypes.AUTH_REQUEST]: ({ commit, dispatch }, user) => {
		return new Promise((resolve, reject) => {
			let axiosData = {}

			if (user.verifytoken) {
				axiosData = {
					url: 'oauth2/verifytoken',
					method: 'POST',
					headers: { 'content-type': 'application/x-www-form-urlencoded',
										 'Authorization': 'Bearer ' + user.verifytoken }
				}
			} else {
				const bodyData = {
					grant_type: 'password',
					scope: '*',
					client_name: 'WebBrowser'
				}

				axiosData = {
					url: 'oauth2/login',
					data: bodyData,
					method: 'POST',
					auth: user
				}
			}

			commit(mTypes.AUTH_REQUEST)

			Vue.axios(axiosData)
			.then((res) => {
				const token = res.data

				storage.setItem('access_token', token.access_token)
				commit(mTypes.AUTH_SUCCESS, token.access_token)

				//we have token, then we can log in user
				dispatch(mTypes.USER_REQUEST, token.access_token)
				resolve(res)
			})
			.catch((err) => {
				let errorData = {}
				if (err.response) {
					errorData = err.response.data
				} else {
					errorData.name = err.name
					switch(err.name) {
						case 'InvalidCharacterError':
							errorData.error_description = 'Неверный пароль. Используйте для пароля латинские символы.'
							break
						default:
							errorData.error_description = 'Unknown error'
					}
				}

				commit(mTypes.API_ERROR, errorData)
				storage.removeItem('access_token')
				reject(errorData)
			})
		})
	},

	//*** Registration actions */
	[mTypes.REG_REQUEST]: ({ commit, dispatch }, userData) => {
		return new Promise((resolve, reject) => {
			const payload = {
				username: '',
				scope: '*',
				client_name: 'WebBrowser'
			}
			const bodyData = Object.assign(payload, userData)
			let axiosData = {
				url: 'oauth2/registration',
				data: bodyData,
				method: 'POST'
			}

			commit(mTypes.REG_REQUEST)

			Vue.axios(axiosData)
			.then((res) => {
				const token = res.data

				storage.setItem('access_token', token.access_token)
				commit(mTypes.REG_SUCCESS, token.access_token)
				resolve(res)
			})
			.catch((err) => {
				let errorData = {}
				if (err.response) {
					errorData = err.response.data
				} else {
					errorData.name = err.name
					switch(err.name) {
						case 'InvalidCharacterError':
							errorData.error_description = 'Неверный пароль. Используйте для пароля латинские символы.'
							break
						default:
							errorData.error_description = 'Unknown error'
					}
				}

				commit(mTypes.API_ERROR, errorData)
				storage.removeItem('access_token')
				reject(errorData)
			})
		})
	},

	//*** LogOut actions */
	[mTypes.AUTH_LOGOUT]: ({ commit, state }) => {
		return new Promise((resolve, reject) => {
			const axiosData = {
				url: 'oauth2/logout',
				method: 'GET',
				headers: { 'content-type': 'application/x-www-form-urlencoded',
									 'Authorization': 'Bearer ' + state.auth.token }
			}

			commit(mTypes.AUTH_REQUEST)

			Vue.axios(axiosData)
			.then((res) => {
				storage.removeItem('access_token')
				commit(mTypes.AUTH_LOGOUT)

				//we have token, then we can log in user
				//dispatch(mTypes.USER_REQUEST)
				resolve(res)
			})
			.catch((err) => {
				commit(mTypes.API_ERROR, err.response.data)

				storage.removeItem('access_token')
				reject(err.response.data)
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
