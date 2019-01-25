import Vue from 'vue'
import { recursiveFind, findGroup, typeForSheet, conditionsForSheet } from '../util/helpers'

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
		state.activeUsersSheet = { text: "all", id: 0, sheet: 'usersSheetAll', visible: true, condition: [] }
		state.availableUsersSheet = [
			{ text: "my", id: 1, sheet: 'usersSheetMy', visible: true, condition: ['user_id'] },
			{ text: "group", id: 2, sheet: 'usersSheetGroup', visible: false, condition: ['user_id', 'group_id'] }
		]
		state.usersSheetAll.sheet = []
		state.usersSheetAll.offset = 0
		state.usersSheetMy.sheet = []
		state.usersSheetMy.offset = 0
		state.usersSheetGroup.sheet = []
		state.usersSheetGroup.offset = 0
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

	MAIN_USER_SUCCESS: (state, user) => {
		setApiStatus(state, 'MAIN_USER_SUCCESS', null)

		state.mainUser = Object.assign({}, user)
	},

	MAIN_GROUPS_SUCCESS: (state, groups) => {
		setApiStatus(state, 'MAIN_GROUPS_SUCCESS', null)

		//debugger
		state.mainGroups = groups
		if (!Array.isArray(state.mainGroups)) state.mainGroups = new Array

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
		if (!Array.isArray(state.mainGroupsMini)) state.mainGroupsMini = new Array
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

	//*** Users sheet mutations */
	SET_USERS_SHEET: (state, data) => {
		setApiStatus(state, 'SET_USERS_SHEET', null)

		data.forEach(el => el.loadingButton = false)
		state[state.activeUsersSheet.sheet].sheet = state[state.activeUsersSheet.sheet].sheet.concat(data)
		state[state.activeUsersSheet.sheet].offset = state[state.activeUsersSheet.sheet].offset + data.length
	},

	SET_ACTIVE_USERS_SHEET: (state, activeID) => {
		let temp = state.activeUsersSheet

		state.activeUsersSheet = state.availableUsersSheet.splice(state.availableUsersSheet.findIndex(el => el.id == activeID), 1)[0]
		if (temp.id > -1) {
			if (temp.id === 0) {
				state.availableUsersSheet.unshift(temp)
			} else {
				let fIndex = state.availableUsersSheet.findIndex(el => el.id > temp.id)
				if (fIndex > -1) {
					state.availableUsersSheet.splice(fIndex, 0, temp)
				} else {
					state.availableUsersSheet.push(temp)
				}
			}
		}
	},

	SET_PARAMS_USERS_SHEET: (state, params) => {
		const ul = state[state.activeUsersSheet.sheet]

		for (const key in params) {
			if (ul.hasOwnProperty(key)) {
				ul[key] = params[key]
			}
		}
	},

	RESET_USERS_SHEET: (state) => {
		const ul = state[state.activeUsersSheet.sheet]
		ul.sheet = []
		ul.offset = 0
		ul.limit = 10
		ul.searchText = ''
	},

	RESET_INACTIVE_USERS_SHEET: (state) => {
		let ul
		for (let i = 0; i < state.availableUsersSheet.length; i++) {
			ul = state[state.availableUsersSheet[i].sheet]
			ul.sheet = []
			ul.offset = 0
			ul.limit = 10
			ul.searchText = ''
		}
	},

	UPDATE_VALUES_USERS_SHEET: (state, values) => {
		setApiStatus(state, 'UPDATE_VALUES_USERS_SHEET', null)

		const ul = state[state.activeUsersSheet.sheet]
		const idx = ul.sheet.findIndex(el => el.id == values.id)
		const element = ul.sheet[idx]
		for (const key in values) {
			if (key === 'id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = values[key]
				//Vue.set(ul.sheet, idx, element)
			}
		}
	},

	REMOVE_VALUES_USERS_SHEET: (state, values) => {
		setApiStatus(state, 'REMOVE_VALUES_USERS_SHEET', null)

		const ul = state[state.activeUsersSheet.sheet]
		const idx = ul.sheet.findIndex(el => el.id == values.id)
		ul.sheet.splice(idx, 1)
	},

/* ---------------------------------------GROUPS mutations-------------------------------------- */

	SET_GROUPS_SHEET: (state, data) => {
		setApiStatus(state, 'SET_GROUPS_SHEET', null)

		state[state.activeGroupsSheet.sheet].sheet = state[state.activeGroupsSheet.sheet].sheet.concat(data)
		state[state.activeGroupsSheet.sheet].offset = state[state.activeGroupsSheet.sheet].offset + data.length
	},

	SET_ACTIVE_GROUPS_SHEET: (state, activeID) => {
		let temp = state.activeGroupsSheet

		state.activeGroupsSheet = state.availableGroupsSheet.splice(state.availableGroupsSheet.findIndex(el => el.id == activeID), 1)[0]
		if (temp.id > -1) {
			if (temp.id === 0) {
				state.availableGroupsSheet.unshift(temp)
			} else {
				let fIndex = state.availableGroupsSheet.findIndex(el => el.id > temp.id)
				if (fIndex > -1) {
					state.availableGroupsSheet.splice(fIndex, 0, temp)
				} else {
					state.availableGroupsSheet.push(temp)
				}
			}
		}
	},

	SET_SUBGROUPS: (state, data) => {
		setApiStatus(state, 'SET_SUBGROUPS', null)

		const gl = state[state.activeGroupsSheet.Sheet]
		let fIndex = -1

		for (let i = 0; i < data.length; i++) {
			/*
			fIndex = state.subgroupsCache.findIndex(el => el.id === data[i].id)
			if (fIndex === -1) {
				state.subgroupsCache.push(data[i])
			}
			*/

			fIndex = gl.sheet.findIndex(el => el.id === data[i].id)
			if (fIndex > -1) {
				gl.sheet[fIndex].children = data[i].children
			}
		}
	},

	SET_PARAMS_GROUPS_SHEET: (state, params) => {
		const gl = state[state.activeGroupsSheet.sheet]

		for (const key in params) {
			if (gl.hasOwnProperty(key)) {
				gl[key] = params[key]
			}
		}
	},

	RESET_GROUPS_SHEET: (state) => {
		const gl = state[state.activeGroupsSheet.sheet]
		gl.sheet = []
		gl.offset = 0
		gl.limit = 10
		gl.searchText = ''
	},

	RESET_INACTIVE_GROUPS_SHEET: (state) => {
		setApiStatus(state, 'RESET_INACTIVE_GROUPS_SHEET', null)

		let gl
		for (let i = 0; i < state.availableGroupsSheet.length; i++) {
			gl = state[state.availableGroupsSheet[i].sheet]
			gl.sheet = []
			gl.offset = 0
			gl.limit = 10
			gl.searchText = ''
		}
	},

	UPDATE_VALUES_GROUPS_SHEET: (state, values) => {
		setApiStatus(state, 'UPDATE_VALUES_GROUPS_SHEET', null)

		const gl = state[state.activeGroupsSheet.sheet]
		const idx = gl.sheet.findIndex(el => el.id == values.id)
		const element = gl.sheet[idx]
		for (const key in values) {
			if (key === 'id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = values[key]
			}
		}
	},

	REMOVE_VALUES_GROUPS_SHEET: (state, values) => {
		setApiStatus(state, 'REMOVE_VALUES_GROUPS_SHEET', null)

		const gl = state[state.activeGroupsSheet.sheet]
		const idx = gl.sheet.findIndex(el => el.id == values.id)
		gl.sheet.splice(idx, 1)
	},

/* ---------------------------------------TASKS mutations--------------------------------------- */

	SET_TASKS: (state, options) => {
		setApiStatus(state, 'SET_TASKS', null)

		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id)
		const taskSheet = activeSheet.sheet
		const tasks = options.data

		let prevGroupId, tempParent, tempParent_id, existElement = -1
		for (let i = 0; i < tasks.length; i++) {
			if (prevGroupId !== tasks[i].group_id && tasks[i].parent === 0) {
				let grp = findGroup(state.mainGroups, tasks[i].group_id)
				let divId = 'div' + grp.id

				existElement = taskSheet.findIndex(el => el.task_id === divId)
				if (existElement === -1) {
					taskSheet.push({ isDivider: true,
						task_id: divId,
						group_id: tasks[i].group_id,
						name: grp.name,
						isActive: false })
				}

				prevGroupId = tasks[i].group_id
			}

			if (tasks[i].task_id) {
				tasks[i].context = state.mainContexts.filter(el => el.task_id === tasks[i].task_id).map(cont => { return cont.value })
				if (!tasks[i].context) tasks[i].context = new Array()

				if (!tasks[i].activity) tasks[i].activity = new Array()

				if (tasks[i].status === 1 || tasks[i].status === 5) {
					tasks[i].duration = tasks[i].duration + (new Date() - new Date(tasks[i].start))
				}
			}

			//displays the task item
			tasks[i].isShowed = (tasks[i].level > 1) ? false : true
			//shows that next subtasks are revealed
			tasks[i].isSubtaskExpanded = 0
			//shows more information on the task
			tasks[i].isExpanded = false
			//shows that the task is selected
			tasks[i].isActive = false
			/* shows the consistency of information
				0 - consistently
				1 - refresh
				2 - not consistently */
			tasks[i].consistency = 0

			//ids to object link
			if (tasks[i].parent === 0) {
				tasks[i].parent = null
				tasks[i].level = 1

				existElement = taskSheet.findIndex(el => el.task_id === tasks[i].task_id)
				if (existElement === -1) {
					activeSheet.offset++
					if ('isStart' in options && options.isStart && taskSheet.length > 1) {
						taskSheet.splice(1, 0, tasks[i])
					} else {
						taskSheet.push(tasks[i])
					}
				} else {
					Vue.set(taskSheet, existElement, tasks[i])
				}
			} else {
				if (!tempParent || tempParent_id !== tasks[i].parent) {
					tempParent = recursiveFind(taskSheet, el => el.task_id === tasks[i].parent).element
					tempParent_id = tempParent.task_id
				}

				if (tempParent) {
					tasks[i].parent = tempParent
					tasks[i].level = tempParent.level + 1

					if (!tempParent.children) {
						tempParent.havechild++

						Vue.set(tempParent, 'children', new Array)
						Vue.set(tempParent.children, 0, tasks[i])
					} else {
						existElement = tempParent.children.findIndex(el => el.task_id === tasks[i].task_id)
						if (existElement === -1) {
							if ('isStart' in options && options.isStart && tempParent.children.length > 1) {
								tempParent.children.splice(1, 0, tasks[i])
							} else {
								tempParent.children.push(tasks[i])
							}
						} else {
							Vue.set(tempParent.children, existElement, tasks[i])
						}
					}
				}
			}
		}
	},

	DELETE_TASK: (state, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id)
		const taskSheet = activeSheet.sheet
		const { index, element } = recursiveFind(taskSheet, el => el.task_id === options.task_id)

		if (element.parent === null) {
			taskSheet.splice(index, 1)
		} else {
			if (element.parent.children && element.parent.children.length > 0) {
				element.parent.havechild--
				element.parent.children.splice(index, 1)
			}
		}
	},

	//values must contain task_id of element task_id:id
	UPDATE_TASK_VALUES: (state, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id)
		let taskSheet = activeSheet.sheet
		const element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element

		for (const key in options) {
			if (key === 'task_id' || key === 'sheet_id') continue

			if (element.hasOwnProperty(key)) {
				element[key] = options[key]
			}
		}
	},

	// SET_ACTIVE_TASK: (state, obj) => {
	// 	const activeSheet = state.sheets.find(el => el.sheet_id === obj.sheet_id)
	// 	let activedTask = recursiveFind(activeSheet.sheet, el => el.isActive === true).element
	// 	if (activedTask) {
	// 		activedTask.isActive = false
	// 	}

	// 	let activeTask = recursiveFind(activeSheet.sheet, el => el.task_id === obj.task_id).element
	// 	if (activeTask) {
	// 		activeTask.isActive = true
	// 		activeSheet.selectedItem = activeTask.task_id
	// 		state.selectedSheet = null
	// 	}
	// },

/* --------------------------------------Contexts mutations------------------------------------- */

	MAIN_CONTEXTS_SUCCESS: (state, contexts) => {
		setApiStatus(state, 'MAIN_CONTEXTS_SUCCESS', null)

		let existingContexts = []
		state.mainContexts = contexts

		for (let i = 0; i < contexts.length; i++) {
			if (existingContexts.findIndex(el => el === contexts[i].value) === -1) {
				existingContexts.push(contexts[i].value)
			}
		}
		state.mainExistingContexts = Object.assign({}, existingContexts)

		if (!Array.isArray(state.mainContexts)) state.mainContexts = new Array()
	},

	ADD_TASK_CONTEXT: (state, options) => {
		// const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id)
		// let taskSheet = activeSheet.sheet
		// const element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element

		//mainExistingContexts
		//mainContexts
		//element.context
	},

	REMOVE_TASK_CONTEXT: (state, options) => {

	},

/* --------------------------------------ACTIVITY mutations------------------------------------- */

	SET_ACTIVITY: (state, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id)
		const taskSheet = activeSheet.sheet
		let element, taskDuration, taskStatus

		// Обновление активностей и статусов задач информацией полученной в options.data
		for (let activity of options.data) {
			// Для каждой задачи обновляется свой список активностей, тут меняется задача для обновления
			if (!element || (element.task_id !== activity.task_id)) {
				// Если уже был получен элемент задачи, то перед получением нового элемента, старый
				// необходимо обновить значениями duration и status
				if (element) {
					element.duration = taskDuration
					element.status = taskStatus
				}

				// Получается элемент задачи из списка задач на клиенте, инициализируется заново список
				// активностей, инициализируются переменные duration и status
				element = recursiveFind(taskSheet, el => el.task_id === activity.task_id).element
				element.activity = new Array()

				taskDuration = 0
				taskStatus = element.status
			}

			// Накопительно считается duration для активностей со статусом "Started-1" или "Continued-5"
			if (activity.status === 1 || activity.status === 5) {
				let ends = (activity.ends) ? new Date(activity.ends) : new Date()
				taskDuration = taskDuration + (ends - new Date(activity.start))
			}

			// Обновляется статус ориентируясь на задачу с открытой датой завершения
			if (activity.ends === null) {
				taskStatus = activity.status
			}

			// Заполняется список активностей у выбранной задачи
			element.activity.push(activity)
			element.activity[element.activity.length - 1].start = new Date(activity.start)
			if (activity.ends) element.activity[element.activity.length - 1].ends = new Date(activity.ends)
		}

		// Обновляются значения duration и status у последней задачи, которая не обновилась из-за
		// завершения цикла
		if (element) {
			element.duration = taskDuration
			element.status = taskStatus
		}
	},

/* --------------------------------------Sheets mutations--------------------------------------- */

	MAIN_SHEETS_SUCCESS: (state, data) => {
		let mainSheet, sheet, type_obj, condition
		for (let i = 0; i < data.length; i++) {
			type_obj = typeForSheet(data[i].type_el)
			condition = conditionsForSheet(data[i].conditions, data[i].values)

			sheet = {
				sheet_id: data[i].id,
				// selectedSheet: false,
				selectedItem: null,
				sheet: [],
				limit: 10,
				offset: 0,
				searchText: '',
				condition: condition
			}

			mainSheet = {
				id: i + 1,
				sheet_id: data[i].id,
				service: false, //Такие элементы не отображаются в списке настроек sheets
				type_el: type_obj.type_el,
				icon: type_obj.icon,
				user_id: data[i].user_id,
				owner_id: data[i].owner_id,
				name: data[i].name,
				visible: data[i].visible,
				layout: data[i].layout
			}

			state.mainSheets.push(mainSheet)
			state.sheets.push(sheet)
		}
	},

	UPDATE_MAIN_SHEETS_VALUES: (state, data) => {
		for (const dataItem of data) {
			if (dataItem.hasOwnProperty('id')) {
				const thisMainSheet = state.mainSheets.find(el => el.sheet_id === dataItem.id)
				if (thisMainSheet) {
					for (const key in dataItem) {
						if (key === 'id') continue

						if (thisMainSheet.hasOwnProperty(key)) {
							thisMainSheet[key] = dataItem[key]
						}
					}
				}
			}
		}
	},

	DELETE_SHEET_ELEMENT: (state, data) => {
		if (data.hasOwnProperty('id')) {
			let index = state.mainSheets.findIndex(el => el.sheet_id === data.id)
			if (index !== -1) {
				state.mainSheets.splice(index, 1)
			}

			index = state.sheets.findIndex(el => el.sheet_id === data.id)
			if (index !== -1) {
				state.sheets.splice(index, 1)
			}

			// Пересчёт id у элементов коллекции
			for (let i = 0; i < state.mainSheets.length; i++) {
				state.mainSheets[i].id = i + 1
			}
		}
	},

	MOVE_SHEET_ELEMENT: (state, data) => {
		if (data.hasOwnProperty('index') && data.hasOwnProperty('UP')) {
			let res, deletedElement = state.mainSheets.splice(data.index, 1)[0]

			if (data.UP) {
				if (data.index - 1 >= 0) {
					res = state.mainSheets.splice(data.index - 1, 0, deletedElement)
				}
			} else {
				if (data.index + 1 < state.mainSheets.length) {
					res = state.mainSheets.splice(data.index + 1, 0, deletedElement)
				} else {
					res = state.mainSheets.push(deletedElement)
				}
			}

			if (res !== undefined) {
				// Пересчёт id у элементов коллекции
				for (let i = 0; i < state.mainSheets.length; i++) {
					state.mainSheets[i].id = i + 1
				}
			}
		}
	},

/* ----------------------------------------Other mutations-------------------------------------- */

	UPDATE_QUEUE: (state, data) => {
		const queue = {
			sheet_id: null,
			element_id: null,
			data: null,
			method: null
		}

		for (const key in data) {
			if (queue.hasOwnProperty(key)) {
				queue[key] = data[key]
			}
		}

		state.updateQueue.push(queue)
	},

	SET_SELECTED: (state, options) => {
		// Сброс всех выделений
		// debugger
		state.selectedSheet = null
		state.selectedSheetsManager = false
		for (const sheet of state.sheets) {
			if (sheet.selectedItem) {
				sheet.selectedItem.isActive = false
			}

			sheet.selectedItem = null
		}

		// options === null is select sheets manager
		if (options === null) {
			state.selectedSheetsManager = true
		} else if (options.hasOwnProperty('sheet_id')) {
			const thisSheet = state.sheets.find(el => el.sheet_id === options.sheet_id)

			if (options.hasOwnProperty('task_id')) {
				thisSheet.selectedItem = recursiveFind(thisSheet.sheet, el => el.task_id === options.task_id).element
				thisSheet.selectedItem.isActive = true
			} else {
				state.selectedSheet = thisSheet
			}
		}
	},

	SET_LAYOUT: (state, value) => {
		state.layout = parseInt(value, 10)
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
