import config from '../config'
import Vue from 'vue'
import { treeDepth, recursiveFind } from '../util/helpers'
//import querystring from 'querystring'

const logRequests = !!config.DEBUG_API
const storage = (process.env.VUE_ENV === 'server') ? null : window.localStorage

const mainPacket = [{
	fetchQuery: {
		url: 'main-user',
		method: 'GET',
		headers: { packet: 0 }
	},
	mutations: ['MAINUSER_SUCCESS', 'THEUSER_SUCCESS']
},{
	fetchQuery: {
		url: 'groups',
		method: 'GET',
		params: { whose: 'main' },
		headers: { packet: 1 }
	},
	mutations: ['MAINGROUPS_SUCCESS']
}]

function getTokensFromSessionStorage() {
	const tokens = { access_token: '', refresh_token: '' }
	if (storage && storage.getItem('access_token')) {
		tokens.access_token = storage.getItem('access_token')
	}

	if (storage && storage.getItem('refresh_token')) {
		tokens.refresh_token = storage.getItem('refresh_token')
	}

	return tokens
}

async function fetchSrv(query) {
	const headers = { 'content-type': 'application/x-www-form-urlencoded',
										'Authorization': 'Bearer ' + getTokensFromSessionStorage().access_token }
	let axiosData = Object.assign({}, query)
	if (axiosData.headers) {
		axiosData.headers = Object.assign(axiosData.headers, headers)
	} else {
		axiosData.headers = headers
	}

	try {
		let dataFromSrv = await Vue.axios(axiosData)
		if (dataFromSrv.data.action && (dataFromSrv.data.action === 'token' || dataFromSrv.data.action === 'refreshed')) {
			storage.setItem('access_token', dataFromSrv.data.access_token)
			commit('AUTH_SUCCESS', dataFromSrv.data.access_token)

			//have received a new token and do it again for our data
			axiosData.headers.Authorization = 'Bearer ' + dataFromSrv.data.access_token
			dataFromSrv = await Vue.axios(axiosData)
		}

		return Promise.resolve(dataFromSrv.data)
	} catch (err) {
		if (Array.isArray(err.response.data) && err.response.data.length > 0) {
			commit('API_ERROR', err.response.data)

			if (err.response.data[0].action && err.response.data[0].action === 'error') {
				if (err.response.data[0].name === 'TokenExpiredError') {
					storage.removeItem('access_token')
					commit('AUTH_LOGOUT')
				}
			}
		}

		throw err
	}
}

let userPartID = 0, groupPartID = 0, taskPartID = 0

export default {
	/*** USERS LIST actions */
	FETCH_USERS_LIST: ({ commit, state }) => {
		const activeList = state.activeUsersList.list
		const searchText = state[activeList].searchText
		const fetchQuery = {
			url: 'users',
			method: 'GET',
			params: {
				like: (searchText) ? searchText : '',
				whose: state.activeUsersList.whose
			},
			headers: { limit: state[activeList].limit, offset: state[activeList].offset, partid: ++userPartID }
		}

		const condition = state.activeUsersList.condition
		for (let i = 0; i < condition.length; i++) {
			switch (condition[i]) {
				case 'user_id':
					fetchQuery.url += '/' + state.theUser.id
					//params.id = state.theUser.id
					break
				case 'group_id':
					fetchQuery.params.group_id = state.theGroup.id
					break
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(0)
			} else {
				console.log(`actions partID: srv-${dataFromSrv.partid} glb-${userPartID}`)
				commit('SET_USERS_LIST', dataFromSrv.data)
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	LINK_USERS_LIST: ({ commit, state }, id) => {
		const fetchQuery = {
			url: 'users',
			method: 'POST',
			params: {
				user_id: id,
			}
		}

		commit('UPDATE_VALUES_USERS_LIST', { id, loadingButton: true })

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'rejected_addusers') {
				return Promise.resolve(0)
			} else {
				console.log('user linked')
				commit('UPDATE_VALUES_USERS_LIST', { id, friend: 1, loadingButton: false })
				commit('RESET_INACTIVE_USERS_LIST')
			}
		}).catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	UNLINK_USERS_LIST: ({ commit, state }, id) => {
		const fetchQuery = {
			url: 'users',
			method: 'DELETE',
			params: {
				user_id: id
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'rejected_deleteusers') {
				return Promise.resolve(0)
			} else {
				console.log('user unlinked')
				commit('REMOVE_VALUES_USERS_LIST', { id })
				commit('RESET_INACTIVE_USERS_LIST')
			}
		}).catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	/*** GROUPS LIST actions */
	FETCH_GROUPS_LIST: ({ commit, state }) => {
		//debugger
		const activeList = state.activeGroupsList.list
		const searchText = state[activeList].searchText
		const fetchQuery = {
			url: 'groups',
			method: 'GET',
			params: {
				like: (searchText) ? searchText : '',
				whose: state.activeGroupsList.whose
			},
			headers: { limit: state[activeList].limit, offset: state[activeList].offset, partid: ++groupPartID }
		}

		const condition = state.activeGroupsList.condition
		for (let i = 0; i < condition.length; i++) {
			switch (condition[i]) {
				case 'user_id':
					fetchQuery.params.user_id = state.theUser.id
					break
				case 'group_id':
					fetchQuery.url += '/' + state.theGroup.id
					break
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(0)
			} else {
				console.log(`actions partID: srv-${dataFromSrv.partid} glb-${groupPartID}`)
				commit('SET_GROUPS_LIST', dataFromSrv.data)
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	FETCH_SUBGROUPS: ({ commit, state }, group_id) => {
		const activeList = state.activeGroupsList.list
		const searchText = state[activeList].searchText
		const fetchQuery = {
			url: 'groups',
			method: 'GET',
			params: {
				like: (searchText) ? searchText : '',
				whose: 'group'
			}
		}

		fetchQuery.url += '/' + group_id

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(0)
			} else {
				commit('SET_SUBGROUPS', dataFromSrv.data)
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	LINK_GROUPS_LIST: ({ commit, state }, id) => {
		const fetchQuery = {
			url: 'groups',
			method: 'POST',
			params: {
				group_id: id,
			}
		}

		commit('UPDATE_VALUES_GROUPS_LIST', { id, loadingButton: true })

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'rejected_linkgroups') {
				return Promise.resolve(0)
			} else {
				console.log('group linked')
				commit('UPDATE_VALUES_GROUPS_LIST', { id, friend: 1, loadingButton: false })
				commit('RESET_INACTIVE_GROUPS_LIST')
			}
		}).catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	UNLINK_GROUPS_LIST: ({ commit, state }, id) => {
		const fetchQuery = {
			url: 'groups',
			method: 'DELETE',
			params: {
				group_id: id
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'rejected_unlinkgroups') {
				return Promise.resolve(0)
			} else {
				console.log('group unlinked')
				commit('REMOVE_VALUES_GROUPS_LIST', { id })
				commit('RESET_INACTIVE_GROUPS_LIST')
			}
		}).catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	//*** TASKS LIST actions */
	FETCH_TASKS: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id)
		const fetchQuery = {
			url: 'tasks',
			method: 'GET',
			params: {},
			headers: { limit: activeList.limit, offset: activeList.offset, partid: ++taskPartID }
		}

		// apply global condition
		for (const key in activeList.condition) {
			if (activeList.condition[key] === null) continue

			switch (key) {
				case 'group_id':
					fetchQuery.params.group_id = activeList.condition[key]
					break
				case 'user_id':
					fetchQuery.params.user_id = activeList.condition[key]
					break
				case 'parent_id':
					fetchQuery.params.parent_id = activeList.condition[key]
					break
				case 'task_id':
					fetchQuery.params.task_id =  activeList.condition[key]
					break
				case 'searchText':
					fetchQuery.params.searchText = activeList.condition[key]
					break
				default:
					break
			}
		}

		// apply local condition
		for (const key in options) {
			if (key === 'list_id') continue

			fetchQuery.params[key] = options[key]
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(0)
			} else {
				console.log(`actions partID: srv-${dataFromSrv.partid} glb-${taskPartID}`)
				commit('SET_TASKS', { list_id: options.list_id, data: dataFromSrv.data })
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	REORDER_TASKS: ({ commit, state }, options) => {
		// options = {
		// 	oldIndex,
		// 	newIndex,
		// 	fromParent,
		// 	toParent,
		// 	list_id
		// }
		debugger

		const activeList = state.listOfList.find(el => el.list_id === options.list_id)
		const taskList = activeList.list

		let fromTask, toTask, fromParent, toParent, newGroupId,
			isBefore = (options.oldIndex > options.newIndex)

		if (options.fromParent === 0) {
			fromTask = taskList[options.oldIndex]
		} else {
			fromParent = recursiveFind(taskList, el => el.task_id === options.fromParent)
			fromTask = fromParent.children[options.oldIndex]
		}

		if (options.toParent === 0) {
			if (taskList.length === options.newIndex) {
				toTask = taskList[options.newIndex - 1]
				newGroupId = toTask.group_id
				toTask = null
				isBefore = true
			} else {
				toTask = taskList[options.newIndex]
				if (toTask.isDivider) {
					newGroupId = toTask.group_id
					if (options.newIndex === 0) {
						toTask = null
						isBefore = false
					} else {
						//Если элемент перемещается выше своей позиции, иначе ниже
						if (options.oldIndex > options.newIndex) {
							toTask = taskList[options.newIndex - 1]
							newGroupId = toTask.group_id
							isBefore = false
						} else {
							if (taskList.length > options.newIndex + 1) {
								isBefore = true
								toTask = taskList[options.newIndex + 1]
							} else {
								//достигнут конец списка
								toTask = null
							}
						}
					}
				}
			}
		} else {
			toParent = recursiveFind(taskList, el => el.task_id === options.toParent)
			if (toParent.children.length === options.newIndex) {
				toTask = toParent.children[options.newIndex - 1]
			} else {
				toTask = toParent.children[options.newIndex]
			}

			if ( ((fromTask.parent === 0) && (toTask.parent !== 0)) ||
					 ((fromTask.parent !== 0) && (toTask.parent === 0)) ) {
				newGroupId = fromTask.group_id
			} else {
				newGroupId = toTask.group_id
			}

			//newGroupId = toParent.task_id
		}

		if (toTask !== null) {
			if ( ((fromTask.parent !== 0) && (toTask.parent !== 0)) &&
		  			(fromTask.parent === toTask.parent) ) {
				if (fromTask.group_id !== toTask.group_id) {
					return Promise.resolve(false)
				}
			}
		}

		//Определим куда переместить задачау (до или после)
		//при перемещении между разными родителями
		if (toTask !== null && options.toParent !== options.fromParent) {
			if (fromTask.parent === toTask.task_id) {
				isBefore = true
			} else {
				if (toTask.parent === 0) {
					//Если до новой позиции сразу стоит разделитель группы, то ставим на позицию выше
					if (options.newIndex > 0 && taskList[options.newIndex - 1].isDivider) {
						isBefore = true
					}
				} else {
					isBefore = !(options.newIndex === toParent.children.length)
				}
			}
		}

		if (newGroupId === undefined) {
			newGroupId = toTask.group_id
		}

		const fetchQuery = {
			url: 'tasks/order',
			method: 'POST',
			params: {
				group_id: newGroupId,
				task_id: fromTask.task_id,
				position: (toTask === null) ? null : toTask.task_id,
				isBefore: isBefore,
				parent_id: (toParent === undefined) ? 0 : toParent.task_id
			}
		}
//return Promise.resolve(true)
		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			debugger
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				let movedItem

				if (options.fromParent === 0) {
					movedItem = taskList.splice(options.oldIndex, 1)[0]
				} else {
					movedItem = fromParent.children.splice(options.oldIndex, 1)[0]
					fromParent.havechild--
				}

				if (options.toParent === 0) {
					taskList.splice((options.newIndex === 0) ? 1 : options.newIndex, 0, movedItem)
				} else {
					//toParent = recursiveFind(taskList, el => el.task_id === options.toParent)
					if (toParent.children.length === options.newIndex) {
						if (toParent.children.length > 0) {
							toParent.children.splice(options.newIndex, 0, movedItem)
						} else {
							toParent.children.splice(0, 0, movedItem)
						}
					} else {
						if (toParent.children[options.newIndex].group_id === movedItem.group_id) {
							toParent.children.splice(options.newIndex, 0, movedItem)
						} else {
							toParent.children.splice(0, 0, movedItem)
						}
					}

					toParent.havechild++
				}

				movedItem.level = ((toParent === undefined) ? 0 : toParent.level) + 1
				if (movedItem.children && movedItem.children.length > 0) {
					for (let i = 0; i < movedItem.children.length; i++) {
						const subItem = movedItem.children[i]
						subItem.level = subItem.level + 1
						if (subItem.children && subItem.children.length > 0) {
							for (let j = 0; j < subItem.children.length; j++) {
								subItem.children[j].level = subItem.children[j].level + 1;
							}
						}
					}
				}

				//изменение значения группы на новую группу, если она задана
				if (newGroupId !== undefined) {
					commit('UPDATE_TASK_VALUES', { list_id: options.list_id, task_id: movedItem.task_id, group_id: newGroupId })
				}

				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	//*** User actions */
	MAINUSER_REQUEST: ({ commit, state }) => {
		commit('MAINUSER_REQUEST')

		return Promise.all([
			fetchSrv(mainPacket[0].fetchQuery),
			fetchSrv(mainPacket[1].fetchQuery)
		]).then(datasFromSrv => {
			//debugger
			for (const dataFromSrv of datasFromSrv) {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(0)
				} else {
					if (!state.auth.token) {
						//if need refressh token in store
						commit('AUTH_SUCCESS', getTokensFromSessionStorage().access_token)
					}

					for (let mutation of mainPacket[dataFromSrv.packet].mutations) {
						commit(mutation, dataFromSrv.data)
					}

					Promise.resolve(1)
				}
			}
		})
		.catch((err) => {
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	//*** Authentication actions */
	AUTH_REQUEST: ({ commit, dispatch }, user) => {
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

			commit('AUTH_REQUEST')

			Vue.axios(axiosData)
			.then((res) => {
				const token = res.data

				storage.setItem('access_token', token.access_token)
				commit('AUTH_SUCCESS', token.access_token)

				//we have token, then we can log in user
				dispatch('MAINUSER_REQUEST')
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

				commit('API_ERROR', errorData)
				storage.removeItem('access_token')
				reject(errorData)
			})
		})
	},

	//*** Registration actions */
	REG_REQUEST: ({ commit, dispatch }, userData) => {
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

			commit('REG_REQUEST')

			Vue.axios(axiosData)
			.then((res) => {
				const token = res.data

				storage.setItem('access_token', token.access_token)
				commit('REG_SUCCESS', token.access_token)
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

				commit('API_ERROR', errorData)
				storage.removeItem('access_token')
				reject(errorData)
			})
		})
	},

	//*** LogOut actions */
	AUTH_LOGOUT: ({ commit, state }) => {
		return new Promise((resolve, reject) => {
			const axiosData = {
				url: 'oauth2/logout',
				method: 'GET',
				headers: { 'content-type': 'application/x-www-form-urlencoded',
									 'Authorization': 'Bearer ' + state.auth.token }
			}

			commit('AUTH_REQUEST')

			Vue.axios(axiosData)
			.then((res) => {
				storage.removeItem('access_token')
				commit('AUTH_LOGOUT')

				//we have token, then we can log in user
				resolve(res)
			})
			.catch((err) => {
				commit('API_ERROR', err.response.data)

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
