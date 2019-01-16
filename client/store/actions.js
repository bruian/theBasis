import config from '../config'
import Vue from 'vue'
import { recursiveFind, findGroup } from '../util/helpers'
import querystring from 'querystring'

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
},{
	fetchQuery: {
		url: 'contexts',
		method: 'GET',
		headers: { packet: 2 }
	},
	mutations: ['MAINCONTEXTS_SUCCESS']
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

	/** Создание нового элемента в списке list принадлежащему множеству списков listOfList по list_id
	 * обязательные входящие опции: options = { list_id:string, isSubelement:bool, isStart:bool }
	 */
	CREATE_ELEMENT: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id)
		const thisList = activeList.list

		let group_id, parent_id = 0

		/* Определим, что добавляется элемент или субэлемент */
		if (options.isSubelement) {
			const activeElement = recursiveFind(thisList, el => el.isActive).element
			if (activeElement) {
				if (activeElement.level < 3) {
					parent_id = activeElement.task_id
					group_id = activeElement.group_id
				} else {
					return Promise.reject('Maximum is 3 levels')
				}
			} else {
				return Promise.reject('To add an unselected item')
			}
		} else {
			if (thisList.length > 0) {
				group_id = thisList[0].group_id
			} else {
				/* Если список элементов пуст, найдем primary group в которую по-умолчанию добавим элемент */
				group_id = state.mainGroups.find(el => el.group_type === 1).id
			}
		}

		const fetchQuery = {
			url: 'tasks',
			method: 'POST',
			params: {
				group_id: group_id,
				parent_id: parent_id,
				start: new Date().toISOString(),
				isStart: options.isStart
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(0)
			} else {
				console.log(`Actions add item recieve datas:`)
				commit('SET_TASKS', { list_id: options.list_id, data: dataFromSrv.data, isStart: options.isStart })
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	/** Удаление текущего элемента в списке list принадлежащему множеству списков listOfList по list_id
	 * обязательные входящие опции: options = { list_id:string }
	 */
	DELETE_ELEMENT: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id)
		const thisList = activeList.list

		let task_id = null, group_id = null

		const activeElement = recursiveFind(thisList, el => el.isActive).element
		if (activeElement) {
			if (activeElement.havechild) {
				return Promise.reject('I can not delete an element containing other elements')
			}

			task_id = activeElement.task_id
			group_id = activeElement.group_id
		} else {
			return Promise.resolve('No item selected for deletion')
		}

		const fetchQuery = {
			url: 'tasks',
			method: 'DELETE',
			params: {
				task_id: task_id,
				group_id: group_id
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				commit('DELETE_TASK', { list_id: options.list_id, task_id: task_id })
				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	/** Перемещение элементов в списке list принадлежащему множеству списков listOfList по list_id
	 * обязательные входящие опции: options = {	oldIndex,	newIndex,	fromParent,	toParent,	list_id }
	 * Эта action - функция меняет позицию на клиенте и на сервере по различным правилам:
	 * - на клиенте список древовидной структуры, а на сервере плоский - поэтому индексация разная
	 * - на клиенте в списке присутствуют dividers, которые делят список на группы, на сервере нет
	 * dividers индексация не совпадает, только порядок следования в разрезе группы
	 * - порядок следования на сервере задается следованием групп в порядке возрастания id-группы
	 * (т.е. порядка создания) и соотношением чисел p/q которое задает порядок внутри этой группы
	 * - клиент ориентирует положение элемента относительно idx, сервер относительно id элементов
	 * */
	REORDER_TASKS: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id)
		const taskList = activeList.list
		if (options.fromParent_id === 0) options.fromParent_id = null
		if (options.toParent_id === 0) options.toParent_id = null

		let fromTask, toTask, fromParent, toParent, newGroupId,
			isBefore = (options.oldIndex > options.newIndex)

		if (options.fromParent_id === null) {
			fromTask = taskList[options.oldIndex]
		} else {
			fromParent = recursiveFind(taskList, el => el.task_id === options.fromParent_id).element
			fromTask = fromParent.children[options.oldIndex]
		}
		fromTask.consistency = 1

		if (options.toParent_id === null) {
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
			toParent = recursiveFind(taskList, el => el.task_id === options.toParent_id).element
			if (!toParent.children || toParent.children.length === 0) {
				toTask = null
				newGroupId = fromTask.group_id
			} else {
				if (toParent.children.length === options.newIndex) {
					toTask = toParent.children[options.newIndex - 1]
				} else {
					toTask = toParent.children[options.newIndex]
				}

				if ( ((fromTask.parent === null) && (toTask.parent !== null)) ||
						 ((fromTask.parent !== null) && (toTask.parent === null)) ) {
					newGroupId = fromTask.group_id
				} else {
					newGroupId = toTask.group_id
				}
			}
		}

		/* Проверка на перемещение элемента внутри родителя за пределы своей группы
			т.к. вложенные элементы не содержат divider разделение по группам идёт только
			в порядке сортировки элементов */
		if (toTask !== null) {
			if ( ((fromTask.parent !== null) && (toTask.parent !== null)) &&
		  			(fromTask.parent === toTask.parent) ) {
				if (fromTask.group_id !== toTask.group_id) {
					fromTask.consistency = 0
					return Promise.resolve(false)
				}
			}
		}

		//Определим куда переместить задачау (до или после) при перемещении между разными родителями
		if (toTask !== null && options.toParent_id !== options.fromParent_id) {
			if (fromTask.parent !== null && fromTask.parent === toTask) {
				isBefore = true
			} else {
				if (toTask.parent === null) {
					//Если до новой позиции сразу стоит разделитель группы, то ставим на позицию выше
					//if (options.newIndex > 0 && taskList[options.newIndex - 1].isDivider) {
						isBefore = true
					//}
				} else {
					isBefore = !(options.newIndex === toParent.children.length)
				}
			}
		}

		/* Особое поведение при перемещение из родителя при помощи кнопки на панели инструментов
			это обусловлено тем, что при нажатии кнопки не задается новая позиция элемента, как при
			перетаскивании с помощью drag&drop, она всегда по-умолчанию сразу следует после родительского
			элемента. В этом случае группы, у новой позиции и родителя старой позиции, должны совпадать.
			А значит при несовпадении групп, у перемещаемого элемента меняется группа на группу рядом
			стоящего предыдущего элемента, что бы не нарушался порядок следования. Если же сохранять группу,
			то положение нового элемента должно будет соответствовать положению dividers в списке, а это
			может быть положение вне поля видимости списка и элемент потеряется из виду.
		*/
		if ('move_out' in options && options.move_out === true) {
			// if (fromTask.parent && fromTask.parent.group_id !== fromTask.group_id) {
			// }
			if (fromTask.parent) {
				toTask = fromTask.parent
				isBefore = false
				newGroupId = fromTask.parent.group_id
			}
		}

		/* Серверу всегда необходимо передавать в запрос id группы новой позиции элемента */
		if (newGroupId === undefined) {
			newGroupId = toTask.group_id
		}

		/* api сервера размещает элементы в списке по следующим правилам:
			Все атрибуты обязательны
			а) Необходимо указать <group_id>, id группы относительно которой позиционируется элемент
			б) Необходимо указать <task_id>, id перемещаемого элемента
			в) Необходимо указать <position>, id элемента на который помещается перемещаемый элемент,
				значения: null - предполагает начало списка при isBefore = false
									null - предполагает конец списка при isBefore = true
									id - предполагает id элемента относительно которого будет позиционироваться
									новый элемент
			г) Необходимо указать <isBefore>, позиционирование относительно <position>
				значения: true - до элемента (before)
									false - после элемента (after)
			д) Необходимо указать <parent_id>, id родителя новой позиции перемещаемого элемента,
				если верхний уровень то значение 0
		*/
		const fetchQuery = {
			url: 'tasks/order',
			method: 'PUT',
			params: {
				group_id: newGroupId,
				task_id: fromTask.task_id,
				position: (toTask === null) ? null : toTask.task_id,
				isBefore: isBefore,
				parent_id: (toParent === undefined) ? 0 : toParent.task_id
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				let movedItem

				if (options.fromParent_id === null) {
					movedItem = taskList.splice(options.oldIndex, 1)[0]
				} else {
					movedItem = fromParent.children.splice(options.oldIndex, 1)[0]
					fromParent.havechild--
				}

				if (movedItem) movedItem.isShowed = true

				if (options.toParent_id === null) {
					taskList.splice((options.newIndex === 0) ? 1 : options.newIndex, 0, movedItem)
				} else {
					if (!toParent.children) {
						Vue.set(toParent, 'children', new Array)
						Vue.set(toParent.children, 0, movedItem)
					} else if (toParent.children.length === options.newIndex) {
						if (toParent.children.length > 0) {
							toParent.children.splice(options.newIndex, 0, movedItem)
						} else {
							toParent.children.splice(0, 0, movedItem)
						}
					} else {
						if (toParent.children[(options.newIndex > 0) ? options.newIndex - 1 : options.newIndex].group_id === movedItem.group_id) {
							toParent.children.splice(options.newIndex, 0, movedItem)
						} else {
							toParent.children.splice(0, 0, movedItem)
						}
					}

					toParent.havechild++
					toParent.isSubtaskExpanded = 2
				}

				movedItem.parent = (toParent) ? toParent : null

				function recalculationDepth(el, level) {
					let res = 0
					el.level = level

					if (el.children && el.children.length > 0) {
						for (let i = 0; i < el.children.length; i++) {
							let locRes = recalculationDepth(el.children[i], level + 1)
							if (locRes > res) {
								res = locRes
							}
						}
					} else {
						res = level
					}

					if (res)
						el.depth = (res - level) + 1

					return res
				}
				//debugger

				let tempParent, tempParentTwo
				if (fromParent) {
					tempParent = fromParent
					while(tempParent.parent) {
						tempParent = tempParent.parent
					}

					if (tempParent) {
						recalculationDepth(tempParent, 1, 0)
					}
				}

				tempParentTwo = (toParent) ? toParent : movedItem
				while(tempParentTwo.parent) {
					tempParentTwo = tempParentTwo.parent
				}

				if (tempParentTwo) {
					recalculationDepth(tempParentTwo, 1, 0)
				} else {
					recalculationDepth(movedItem, 1, 0)
				}

				//изменение значения группы на новую группу, если она задана
				if (newGroupId !== undefined) {
					commit('UPDATE_TASK_VALUES', { list_id: options.list_id, task_id: movedItem.task_id, group_id: newGroupId })
				}

				movedItem.consistency = 0
				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			movedItem.consistency = 2
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	/** options = { list_id, task_id, group_id } */
	UPDATE_TASK_GROUP: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id),
		taskList = activeList.list,
		element = recursiveFind(taskList, el => el.task_id === options.task_id).element
		element.consistency = 1

		const fetchQuery = {
			url: 'tasks/order',
			method: 'PUT',
			params: {
				group_id: options.group_id,
				task_id: element.task_id,
				position: null,
				isBefore: false,
				parent_id: (element.parent) ? element.parent.task_id : 0
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				let idxGroup = -1, idxTask = -1, movedItem
				/* Для элементов первого уровня существуют разделы групп с задачами,
					 перемещение происходит по этим разделам
					 Для уровней ниже применяется распределение по группам без разделов */
				if (element.level === 1) {
					/* Необходимо найти divider он будет являться началом размещения задачи
						 в новой группе */
					idxTask = taskList.findIndex(el => el.task_id == options.task_id)
					movedItem = taskList.splice(idxTask, 1)[0]

					idxGroup = taskList.findIndex(el => (el.group_id === options.group_id && el.isDivider))
					if (idxGroup === -1) {
						const group = findGroup(state.mainGroups, options.group_id)
						//Такой разделитель не найден, значит необходимо создать новый
						idxGroup = taskList.push({ isDivider: true,
							group_id: options.group_id,
							name: group.name,
							isActive: false })
					}
					idxGroup++

					taskList.splice(idxGroup, 0, movedItem)
				} else {
					/* Для элементов последующих уровней необходимо найти самый первый элемент
						 принадлежащий искомой группе и поместить нашу задачу выше этого элемента */
					//debugger
					idxTask = element.parent.children.findIndex(el => el.task_id == options.task_id)
					movedItem = element.parent.children.splice(idxTask, 1)[0]

					idxGroup = element.parent.children.findIndex(el => (el.group_id === options.group_id))
					idxGroup = (idxGroup === -1 || idxGroup === 0) ? 0 : idxGroup--

					element.parent.children.splice(idxGroup, 0, movedItem)
				}

				//изменение значения группы на новую группу
				commit('UPDATE_TASK_VALUES', { list_id: options.list_id, task_id: movedItem.task_id, group_id: options.group_id })

				movedItem.consistency = 0
				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	/** options = { list_id, task_id, ...values } */
	UPDATE_TASK_VALUES: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id),
					taskList = activeList.list,
					element = recursiveFind(taskList, el => el.task_id === options.task_id).element,
					values = {}

		element.consistency = 1
		//debugger

		for (const key in options) {
			if (key === 'task_id' || key === 'list_id') continue

			if (element.hasOwnProperty(key)) {
				values[key] = options[key]
				element[key] = options[key]
			}
		}

		const fetchQuery = {
			url: 'tasks',
			method: 'PUT',
			params: {
				task_id: options.task_id,
			},
			data: querystring.stringify(values)
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				//изменение значения группы на новую группу
				//commit('UPDATE_TASK_VALUES', options)

				element.consistency = 0
				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			element.consistency = 2
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})

	},

	ADD_TASK_CONTEXT: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id),
					taskList = activeList.list,
					element = recursiveFind(taskList, el => el.task_id === options.task_id).element,
					values = {}

		element.consistency = 1

		if ('context_id' in options) {
			values.context_id = options.context_id
		}

		if ('context_value' in options) {
			values.context_value = options.context_value
		}

		const fetchQuery = {
			url: 'contexts',
			method: 'POST',
			params: {
				task_id: options.task_id
			},
			data: querystring.stringify(values)
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			element.consistency = 0

			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				const data = Object.assign({}, dataFromSrv.data)
				data.list_id = options.list_id

				commit('ADD_TASK_CONTEXT', data)
				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			element.consistency = 2
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	REMOVE_TASK_CONTEXT: ({commit, state}, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id),
					taskList = activeList.list,
					element = recursiveFind(taskList, el => el.task_id === options.task_id).element,
					values = {}

		element.consistency = 1

		if ('context_id' in options) {
			values.context_id = options.context_id
		}

		const fetchQuery = {
			url: 'contexts',
			method: 'DELETE',
			params: {
				task_id: options.task_id
			},
			data: querystring.stringify(values)
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			element.consistency = 0

			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(false)
			} else {
				const data = Object.assign({}, dataFromSrv.data)
				data.list_id = options.list_id

				commit('REMOVE_TASK_CONTEXT', data)
				return Promise.resolve(true)
			}
		})
		.catch((err) => {
			debugger
			element.consistency = 2
			commit('API_ERROR', err.response.data)
			return Promise.reject(err.response.data)
		})
	},

	/** options = { list_id, task_id } */
	FETCH_ACTIVITY: ({ commit, state }, options) => {
		const activeList = state.listOfList.find(el => el.list_id === options.list_id),
			taskList = activeList.list,
			element = recursiveFind(taskList, el => el.task_id === options.task_id).element

		if (!element) return Promise.reject(null)

		const fetchQuery = {
			url: 'activity',
			method: 'GET',
			params: { task_id: element.task_id,	group_id: element.group_id, type_el: 1 },
			headers: { limit: 100, offset: 0 }
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(null)
			} else {
				commit('SET_ACTIVITY', { list_id: options.list_id, task_id: options.task_id, data: dataFromSrv.data })
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			if (err.response.data) {
				commit('API_ERROR', { message: err.message, data: err.response.data })
				return Promise.reject({ message: err.message, data: err.response.data })
			} else {
				commit('API_ERROR', { message: err.message, data: null })
				return Promise.reject({ message: err.message, data: null })
			}

			debugger
		})
	},

	/***
	 * @func CREATE_ACTIVITY_ELEMENT
	 * @param { VUEX action parametres: Object }
	 * @param { { list_id, task_id, ...other options }: Object } - options
	 * @returns { function(...args): Promise }
	 * @description Функция для создания элемента активности, а так-же изменения статуса
	 * у задачи, если в options переданы "task_id" и "status".
	 * 	Процедура изменения статуса включает в себя 3 этапа:
	 * 	1) Если имеется активность с "task_id" отличным от переданного в options.task_id
	 *  и у этой активности "user_id" соответсвует "mainUser_id", а так же "ends" имеет
	 * 	значение "null" и "status" имеет значения "Started-1" или "Continued-5", тогда в
	 * 	такой активности "ends" присваивается значение "options.start". В DB обновляется
	 * 	значениe этой активности.
	 * 	1.1) Берется task_id активности из п.1. и создается новая активность для которой
	 * 	присваивается значение статуса "Suspended-3", а для атрибута "start" присваивае-
	 * 	тся значение "options.start". Активность создается в DB.
	 * 	2) Ищется активность с "task_id" соответствующая "options.task_id". У этой акти-
	 * 	вности значение атрибута в "ends" присваивается "options.start". В DB обновляет-
	 * 	ся значениe этой активности.
	 * 	2.1) Содается новая активность с "task_id" значением из "options.task_id" и зна-
	 * 	чением "start" равным "options.start". Активность создается в DB.
	 * 	3) Пересчитывается значение "duration" у задач из пункта 1 и 2. Обновляются ста-
	 * 	тусы иконок
	*/
	CREATE_ACTIVITY_ELEMENT: ({ commit, state }, options) => {
		//Получим элемент задачи относительно которой добавляется активность
		const activeList = state.listOfList.find(el => el.list_id === options.list_id)
		const thisList = activeList.list
		const activeElement = recursiveFind(thisList, el => el.task_id === options.task_id).element

		let status, start, group_id = activeElement.group_id

		//Определим меняется ли статус задачи или это обычное добавление активности
		//Т.к. статус должен обязательно включать время смены, то заранее его зададим
		if (options.hasOwnProperty('status')) {
			status = options.status
			start = new Date().toISOString()
		}

		//Убедимся не было ли передано иное время смены, отличное от автоматического
		if (options.hasOwnProperty('start')) {
			values.start = options.start
		}

		const fetchQuery = {
			url: 'activity',
			method: 'POST',
			params: {
				group_id: group_id,
				type_el: 1,
				task_id: activeElement.task_id,
				start: start,
				status: status
			}
		}

		return fetchSrv(fetchQuery)
		.then((dataFromSrv) => {
			if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
				return Promise.resolve(null)
			} else {
				commit('SET_ACTIVITY', { list_id: options.list_id, task_id: options.task_id, data: dataFromSrv.data })
				return Promise.resolve(dataFromSrv.data.length)
			}
		})
		.catch((err) => {
			if (err.response.data) {
				commit('API_ERROR', { message: err.message, data: err.response.data })
				return Promise.reject({ message: err.message, data: err.response.data })
			} else {
				commit('API_ERROR', { message: err.message, data: null })
				return Promise.reject({ message: err.message, data: null })
			}

			debugger
		})
	},

	//*** User actions */
	MAINUSER_REQUEST: ({ commit, state }) => {
		commit('MAINUSER_REQUEST')

		return Promise.all([
			fetchSrv(mainPacket[0].fetchQuery),
			fetchSrv(mainPacket[1].fetchQuery),
			fetchSrv(mainPacket[2].fetchQuery)
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
	REG_REQUEST: ({ commit }, userData) => {
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
}
