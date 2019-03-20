import Vue from 'vue';
import moment from 'moment';
import { recursiveFind, typeForSheet, conditionsForSheet, visionsForSheet } from '../util/helpers';

const storage = process.env.VUE_ENV === 'server' ? null : window.localStorage;

/* use only for api srv mutations */
function setApiStatus(state, status, error) {
	if (state.logStatus) {
		state.apiStatus.push({ status, error });
	}
}

export default {
	/* API Status mutation */
	API_ERROR: (state, error) => {
		setApiStatus(state, 'error', error);
	},

	/* Authentication mutations */
	AUTH_SUCCESS: (state, data) => {
		storage.setItem('token', data.token);
		storage.setItem('refreshToken', data.refreshToken);

		state.auth.token = data.token;
		state.auth.refreshToken = data.refreshToken;
	},

	AUTH_REFRESH_SUCCESS: (state, data) => {
		storage.setItem('token', data.token);
		storage.setItem('refreshToken', data.refreshToken);

		state.auth.token = data.token;
		state.auth.refreshToken = data.refreshToken;
	},

	AUTH_LOGOUT: state => {
		storage.removeItem('token');
		storage.removeItem('refreshToken');

		state.auth.token = null;
		state.auth.refreshToken = null;

		// state.mainUser = Object.assign({}, state.default.mainUser);
		state.mainUser = {};
		state.updateQueue = [];

		state.Activity = [];
		state.Contexts = [];
		state.Groups = [];
		state.Tasks = [];
		state.Users = [];

		state.additionalSheet = [];
		state.generalSheet = [];

		state.selectedSheet = null;
		state.sheets = [];

		state.apiStatus = [];
	},

	/* Registration mutations */
	REG_SUCCESS: (state, data) => {
		storage.setItem('token', data.token);
		storage.setItem('refreshToken', data.refreshToken);

		state.auth.token = data.token;
		state.auth.refreshToken = data.refreshToken;
	},

	/* Main mutations */
	MAINUSER_REQUEST: state => {
		setApiStatus(state, 'MAINUSER_REQUEST', null);
	},

	SET_MAIN_USER: (state, data) => {
		if (Array.isArray(data) && data.length === 1) {
			state.mainUser = Object.assign({}, data[0]);

			// user client conditions
			Vue.set(state.mainUser, 'workDate', moment().toDate());
			Vue.set(state.mainUser, 'layout', 2);

			setApiStatus(state, 'SET_MAIN_USER', null);
		} else {
			setApiStatus(state, 'SET_MAIN_USER', data);
		}
	},

	UPDATE_MAIN_USER: (state, data) => {
		Object.keys(data).forEach(key => {
			if (key === 'selectedSheetManager') {
				state.selectedSheetManager = data[key];
			} else if (key === 'selectedSheet') {
				if (data[key] === '' || data[key] === null) {
					state.selectedSheet = null;
				} else {
					state.selectedSheet = state.sheets.find(el => el.sheet_id === data[key]);
				}
			} else {
				if (Object.prototype.hasOwnProperty.call(state.mainUser, key)) {
					state.mainUser[key] = data[key];
				}
			}
		});
	},

	CHANGE_APP_READY: (state, ready) => {
		state.appReady = ready;
	},

	/* -------------------------------------ELEMENT mutations------------------------------------- */

	/*
	 * @func SET_ELEMENTS
	 * @param {Object} state - VUEX store
	 * @param {Object} options - mutation options
	 * @description Sheet data mutation
	 * options - { sheet_id: String, data: Array, action: String, refresh: Bool(optional) }
	 */
	SET_ELEMENTS: (state, options) => {
		// Функция сортировки
		function sortSheetSternBrocot(a, b) {
			if (a.group_id > b.group_id) {
				return 1;
			} else if (a.group_id === b.group_id) {
				return a.p / a.q - b.p / b.q;
			} else {
				return -1;
			}
		}

		function sortSheetDateTime(a, b) {
			if (a.start > b.start) return -1;
			if (a.start < b.start) return 1;
			return 0;

			// return new Date(b.start) - new Date(a.start);
		}

		/* При загрузке данных с сервера получается два набор данных
			theDatas - хранит загруженные элементы для всех sheet,
			theSheet - хранит ссылки на загруженные элементы, а так же их сортировку в разрезе каждого sheet
		 */
		const datas = options.data;
		if (!Array.isArray(datas) || datas.length === 0) {
			return;
		}

		let theDatas;
		const sortElements = [];
		let rootResort = false;

		/* По id определяется тип sheet, позже по этому типу будет обработан массив sheets */
		// const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id); 12.03.19 21:18

		// switch (theSheet.type_el) { 12.03.19 21:18
		switch (options.type_el) {
			case 'tasks-sheet':
				theDatas = state.Tasks;
				break;
			case 'groups-sheet':
				theDatas = state.Groups;
				break;
			case 'users-sheet':
				theDatas = state.Users;
				break;
			case 'activity-sheet':
				theDatas = state.Activity;
				break;
			default:
				break;
		}

		// if (!Object.prototype.hasOwnProperty.call(theSheet, 'sh')) {
		// 	// Если нет такого свойства, то оно создается
		// 	theSheet.sh = [];
		// } 12.03.19 21:18

		// if (Object.prototype.hasOwnProperty.call(options, 'refresh') && options.refresh) {
		// 	// Если в опциях получено свойство refresh и оно true, то необходимо обновить полностью данные
		// 	theSheet.sh = [];
		// 	theDatas = [];
		// } 12.03.19 21:18

		let tempParent;
		let tempParent_id;
		let existElement = -1;
		let newLevel;

		for (let i = 0; i < datas.length; i++) {
			let newData = false;
			let { index, element: data } = recursiveFind(theDatas, el => el.id === datas[i].id);

			if (data) {
				// По хорошему к данным бы добавить хэш сумму, которая бы говорила изменились данные или нет
				// Когда данные уже есть в основном массиве, то они просто обновляются вновь поступившими,
				// без изменения структуры массива

				// Проверка необходимости пересчета уровня у вложенных уже существующих элементов
				if (
					Object.prototype.hasOwnProperty.call(datas[i], 'level') &&
					data.level !== datas[i].level
				) {
					newLevel = datas[i].level;
				}

				if (Object.prototype.hasOwnProperty.call(datas[i], 'parent')) {
					// Если уже есть данные, но при этом родители у существующих на клиенте отличаются от
					// родителей пришедших с сервера, то необходимо на клиенте обновить структуру данных
					const curParId = data.parent ? data.parent.id : null;
					if (curParId !== datas[i].parent) {
						if (curParId === null) {
							data = theDatas.splice(index, 1)[0];
						} else {
							const { element } = recursiveFind(theDatas, el => el.id === curParId);
							data = element.children.splice(index, 1)[0];
						}

						if (newLevel) {
							if (data.children) {
								for (let x = 0; x < data.children.length; x++) {
									data.children[x].level = newLevel + 1;
									if (data.children[x].children) {
										for (let y = 0; y < data.children[x].children.length; y++) {
											data.children[x].children[y].level = newLevel + 2;
										}
									}
								}
							}
						}
						newData = true;
					}
				}

				if (
					Object.prototype.hasOwnProperty.call(datas[i], 'p') &&
					Object.prototype.hasOwnProperty.call(datas[i], 'q')
				) {
					if (data.p !== datas[i].p || data.q !== datas[i].q) {
						if (data.parent) {
							if (sortElements.findIndex(el => el === data.parent.children) === -1)
								sortElements.push(data.parent.children);
						} else {
							rootResort = true;
						}
					}
				} else if (Object.prototype.hasOwnProperty.call(datas[i], 'start')) {
					if (data.start !== datas[i].start) {
						rootResort = true;
					}
				}

				Object.keys(datas[i]).forEach(key => {
					data[key] = datas[i][key];
				});
			} else {
				newData = true;
				data = Object.assign({}, datas[i]);
			}

			state.sheets.forEach(xSheet => {
				// if (xSheet.type_el === theSheet.type_el) { 12.03.19 21:18
				if (xSheet.type_el === options.type_el) {
					let shData = xSheet.sh.find(x => x.el.id === data.id);

					let isShowed = true;
					if (Object.prototype.hasOwnProperty.call(data, 'parent') && data.parent !== null) {
						const pid = typeof data.parent === 'string' ? data.parent : data.parent.id;
						const shParentData = xSheet.sh.find(x => x.el.id === pid);
						isShowed = shParentData.isSubElementsExpanded === 2;
					}

					if (shData) {
						shData.isShowed = isShowed;
					} else {
						shData = {
							isDivider: false,
							isShowed,
							isSubElementsExpanded: 0,
							isExpanded: false,
							isActive: false,
							/* shows the consistency of information
								0 - consistently
								1 - refresh
								2 - not consistently */
							consistency: 0,
							el: data
						};

						if (!Object.prototype.hasOwnProperty.call(xSheet, 'sh')) {
							// Если нет такого свойства, то оно создается
							xSheet.sh = [];
						}

						xSheet.sh.push(shData);
						if (Object.prototype.hasOwnProperty.call(data, 'parent')) {
							if (data.parent === null) xSheet.offset++;
						} else {
							xSheet.offset++;
						}
					}
				}
			});

			// Установка, специфичных для tasks-sheet, значений
			// if (theSheet.type_el === 'tasks-sheet') { 12.03.19 21:18
			if (options.type_el === 'tasks-sheet') {
				data.context = state.Contexts.filter(el => el.task_id === data.id).map(cont => {
					return cont.value;
				});
				if (!data.context) data.context = [];

				if (!data.activity) data.activity = [];

				if (data.status === 1 || data.status === 5) {
					data.duration = data.duration + (new Date() - new Date(data.start));
				}
			}

			if (newData) {
				if (!Object.prototype.hasOwnProperty.call(data, 'parent') || data.parent === null) {
					theDatas.push(data);
					rootResort = true;
				} else {
					if (!tempParent || tempParent_id !== data.parent) {
						const pid = typeof data.parent === 'string' ? data.parent : data.parent.id;
						tempParent = recursiveFind(theDatas, el => el.id === pid).element;
						tempParent_id = tempParent.id;
						if (!Object.prototype.hasOwnProperty.call(tempParent, 'children')) {
							Vue.set(tempParent, 'children', []);
						}

						sortElements.push(tempParent.children);
					}

					if (tempParent) {
						data.parent = tempParent;

						existElement = tempParent.children.findIndex(el => el.id === data.id);
						if (existElement === -1) {
							tempParent.children.push(data);
						} else {
							Vue.set(tempParent.children, existElement, newData);
						}
					}
				}
			} else {
				if (Object.prototype.hasOwnProperty.call(data, 'parent') && data.parent) {
					const pid = typeof data.parent === 'string' ? data.parent : data.parent.id;
					tempParent = recursiveFind(theDatas, el => el.id === pid).element;
					data.parent = tempParent;
				}
			}

			if (Object.prototype.hasOwnProperty.call(data, 'parent')) {
				let tmpDepth = 2;
				let tmpParent = data.parent;
				while (tmpParent !== null) {
					if (tmpParent.depth < tmpDepth) {
						tmpParent.depth = tmpDepth;
					}

					tmpParent = tmpParent.parent;
					tmpDepth++;
				}
			}
		}

		if (rootResort) {
			// if (theSheet.type_el === 'activity-sheet') { 12.03.19 21:18
			if (options.type_el === 'activity-sheet') {
				theDatas.sort(sortSheetDateTime);
			} else {
				theDatas.sort(sortSheetSternBrocot);
			}
		}

		sortElements.forEach(arr => {
			arr.sort(sortSheetSternBrocot);
		});

		setApiStatus(state, 'SET_ELEMENTS', null);
	},

	/*
	 * @func DELETE_ELEMENTS
	 * @param {Object} state - VUEX store
	 * @param {Object} options - mutation options
	 * @description Sheet data mutation
	 * options - { sheet_id: String, data: Array, action: String, refresh: Bool(optional) }
	 */
	DELETE_ELEMENTS: (state, options) => {
		// const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);

		let theDatas;
		switch (options.type_el) {
			case 'tasks-sheet':
				theDatas = state.Tasks;
				break;
			case 'groups-sheet':
				theDatas = state.Groups;
				break;
			case 'users-sheet':
				theDatas = state.Users;
				break;
			case 'activity-sheet':
				theDatas = state.Activity;
				break;
			default:
				break;
		}

		Array.prototype.forEach.call(options.data, data => {
			const { index, element } = recursiveFind(theDatas, x => x.id === data.id);

			state.sheets.forEach(xSheet => {
				if (options.type_el === xSheet.type_el) {
					xSheet.offset--;
					const shIndex = xSheet.sh.findIndex(x => x.el.id === data.id);
					xSheet.sh.splice(shIndex, 1);
					xSheet.selectedItem = null;
				}
			});

			if (Object.prototype.hasOwnProperty.call(element, 'parent')) {
				if (element.parent === null) {
					theDatas.splice(index, 1);
				} else if (element.parent.children && element.parent.children.length > 0) {
					element.parent.children.splice(index, 1);
				}

				let tempDepth = 2;
				let tempParent = element.parent;
				while (tempParent !== null) {
					if (tempParent.children.length === 0) {
						tempDepth = 1;
						tempParent.depth = tempDepth;
						tempDepth++;
					} else {
						tempParent.depth = tempDepth;
					}

					tempParent = tempParent.parent;
				}
			} else {
				theDatas.splice(index, 1);
			}
		});

		setApiStatus(state, 'DELETE_ELEMENTS', null);
	},

	// values must contain id
	UPDATE_ELEMENT: (state, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const shData = recursiveFind(activeSheet.sh, x => x.el.id === options.id).element;

		Object.keys(options).forEach(key => {
			if (key !== 'id' && key !== 'sheet_id') {
				if (Object.prototype.hasOwnProperty.call(shData, key)) {
					shData[key] = options[key];

					if (key === 'isSubElementsExpanded') {
						activeSheet.sh.forEach(x => {
							if (x.el.parent === shData.el) {
								x.isShowed = options[key] === 2;
							}
						});
					}
				}

				if (Object.prototype.hasOwnProperty.call(shData.el, key)) {
					shData.el[key] = options[key];
				}
			}
		});

		setApiStatus(state, 'UPDATE_ELEMENT', null);
	},

	SELECT_ELEMENT: (state, options) => {
		// Сброс всех выделений
		state.selectedSheet = null;
		state.selectedSheetsManager = false;

		Array.prototype.forEach.call(state.sheets, sheet => {
			if (sheet.selectedItem) {
				sheet.selectedItem.isActive = false;
			}

			sheet.selectedItem = null;
		});

		// options === null is select sheets manager
		if (options === null) {
			state.selectedSheetsManager = true;
		} else if (Object.prototype.hasOwnProperty.call(options, 'sheet_id')) {
			const thisSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);

			if (Object.prototype.hasOwnProperty.call(options, 'id')) {
				thisSheet.selectedItem = recursiveFind(thisSheet.sh, x => x.el.id === options.id).element;
				thisSheet.selectedItem.isActive = true;
			} else {
				state.selectedSheet = thisSheet;
			}
		}
	},

	/* --------------------------------------Contexts mutations------------------------------------- */

	MAIN_CONTEXTS_SUCCESS: (state, data) => {
		let existingContexts = [];
		state.Contexts = data;

		for (let i = 0; i < data.length; i++) {
			if (existingContexts.findIndex(el => el === data[i].value) === -1) {
				existingContexts.push(data[i].value);
			}
		}
		state.mainExistingContexts = Object.assign({}, existingContexts);

		if (!Array.isArray(state.Contexts)) state.Contexts = [];

		setApiStatus(state, 'MAIN_CONTEXTS_SUCCESS', null);
	},

	// eslint-disable-next-line
	ADD_TASK_CONTEXT: (state, options) => {},

	// eslint-disable-next-line
	REMOVE_TASK_CONTEXT: (state, options) => {},

	/* --------------------------------------ACTIVITY mutations------------------------------------- */

	SET_ACTIVITY: (state, { data }) => {
		// const theSheet = state.sheets.find(el => el.sheet_id === sheet_id);
		// const taskSheet = theSheet.sh;
		let element;
		let taskDuration;
		let taskStatus;

		// Обновление активностей и статусов задач информацией полученной в options.data
		Array.prototype.forEach.call(data, activity => {
			// Для каждой задачи обновляется свой список активностей, тут меняется задача для обновления
			if (!element || element.id !== activity.task_id) {
				// Если уже был получен элемент задачи, то перед получением нового элемента, старый
				// необходимо обновить значениями duration и status
				if (element) {
					element.duration = taskDuration;
					element.status = taskStatus;
				}

				// Получается элемент задачи из списка задач на клиенте, инициализируется заново список
				// активностей, инициализируются переменные duration и status
				element = recursiveFind(state.Tasks, el => el.id === activity.task_id).element;
				element.activity = [];

				taskDuration = 0;
				taskStatus = element.status;
			}

			// Накопительно считается duration для активностей со статусом "Started-1" или "Continued-5"
			if (activity.status === 1 || activity.status === 5) {
				let ends = activity.ends ? new Date(activity.ends) : new Date();
				taskDuration = taskDuration + (ends - new Date(activity.start));
			}

			// Обновляется статус ориентируясь на задачу с открытой датой завершения
			if (activity.ends === null) {
				taskStatus = activity.status;
			}

			// Заполняется список активностей у выбранной задачи
			element.activity.push(activity);
			element.activity[element.activity.length - 1].start = new Date(activity.start);
			if (activity.ends)
				element.activity[element.activity.length - 1].ends = new Date(activity.ends);
		});

		// Обновляются значения duration и status у последней задачи, которая не обновилась из-за
		// завершения цикла
		if (element) {
			element.duration = taskDuration;
			element.status = taskStatus;
		}
	},

	SET_RESTRICTIONS: (state, options) => {
		state.sheets.forEach(xSheet => {
			if (xSheet.type_el === 'activity-sheet') {
				// const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
				if (Array.isArray(options.data) && options.data.length > 0) {
					xSheet.restrictions = Object.assign({}, options.data[0]);
				} else {
					xSheet.restrictions = null;
				}
			}
		});
	},

	/* --------------------------------------Sheets mutations--------------------------------------- */

	SET_SHEETS: (state, data) => {
		let sheet;

		for (let i = 0; i < data.length; i++) {
			sheet = state.sheets.find(x => x.sheet_id === data[i].id);

			if (!sheet) {
				const type_obj = typeForSheet(data[i].type_el);
				const condition = conditionsForSheet(data[i].conditions, data[i].conditionvalues);
				const vision = visionsForSheet(data[i].visions, data[i].visionvalues);

				sheet = {
					id: state.sheets.length + 1,
					sheet_id: data[i].id,
					selectedItem: null,
					sh: [],
					limit: 10,
					offset: 0,
					like: '',
					condition,
					vision,
					service: false, // Такие элементы не отображаются в списке настроек sheets
					type_el: type_obj.type_el,
					icon: type_obj.icon,
					user_id: data[i].user_id,
					owner_id: data[i].owner_id,
					name: data[i].name,
					visible: data[i].visible,
					layout: data[i].layout,
					infiniteId: +new Date(),
					consistency: 0,
					callsCount: 0 // Количество вызовов данного листа. Из них 3 листа с наибольшим количеством
					// вызовов, помещаются в меню выбора листов
				};

				state.sheets.push(sheet);
			} else {
				/* eslint-disable no-loop-func */
				Object.keys(data[i]).forEach(key => {
					if (key === 'type_el') {
						const type_obj = typeForSheet(data[i].type_el);
						Vue.set(sheet, key, type_obj.type_el);
						Vue.set(sheet, 'icon', type_obj.icon);
					} else if (key === 'conditions') {
						const condition = conditionsForSheet(data[i].conditions, data[i].conditionvalues);
						Vue.set(sheet, 'condition', condition);
						sheet.infiniteId += 1;
					} else if (key === 'visions') {
						const vision = visionsForSheet(data[i].visions, data[i].visionvalues);
						Vue.set(sheet, 'vision', vision);
						sheet.infiniteId += 1;
					} else if (key !== 'id' && key !== 'conditionvalues' && key !== 'visionvalues') {
						// sheet[key] = data[i][key];
						Vue.set(sheet, key, data[i][key]);
					}
				});
				/* eslint-enable no-loop-func */
			}
		}

		setApiStatus(state, 'SET_SHEETS', null);
	},

	UPDATE_SHEET_VALUES: (state, data) => {
		let conditionKey = [];
		let conditionValue = [];

		Array.prototype.forEach.call(data, dataItem => {
			if (Object.prototype.hasOwnProperty.call(dataItem, 'id')) {
				let thisSheet = state.sheets.find(el => el.sheet_id === dataItem.id);
				if (thisSheet) {
					Object.keys(dataItem).forEach(key => {
						if (key === 'condition') {
							conditionKey.push(dataItem[key]);
						} else if (key === 'value') {
							conditionValue.push(dataItem[key]);
						} else if (key !== 'id') {
							if (Object.prototype.hasOwnProperty.call(thisSheet, key)) {
								thisSheet[key] = dataItem[key];
							}
						}
					});

					if (conditionKey) {
						let conditions = conditionsForSheet(conditionKey, conditionValue);
						Object.keys(conditions).forEach(key => {
							if (conditions[key] !== null) {
								thisSheet.condition[key] = conditions[key];
							}
						});
					}
				}
			}
		});
	},

	DELETE_SHEET_ELEMENT: (state, data) => {
		if (Object.prototype.hasOwnProperty.call(data, 'id')) {
			let index = state.sheets.findIndex(el => el.sheet_id === data.id);
			if (index !== -1) {
				state.sheets.splice(index, 1);
			}

			index = state.sheets.findIndex(el => el.sheet_id === data.id);
			if (index !== -1) {
				state.sheets.splice(index, 1);
			}

			// Пересчёт id у элементов коллекции
			for (let i = 0; i < state.sheets.length; i++) {
				state.sheets[i].id = i + 1;
			}
		}
	},

	MOVE_SHEET_ELEMENT: (state, data) => {
		if (
			Object.prototype.hasOwnProperty.call(data, 'index') &&
			Object.prototype.hasOwnProperty.call(data, 'UP')
		) {
			let res;
			let deletedElement = state.sheets.splice(data.index, 1)[0];

			if (data.UP) {
				if (data.index - 1 >= 0) {
					res = state.sheets.splice(data.index - 1, 0, deletedElement);
				}
			} else {
				if (data.index + 1 < state.sheets.length) {
					res = state.sheets.splice(data.index + 1, 0, deletedElement);
				} else {
					res = state.sheets.push(deletedElement);
				}
			}

			if (res !== undefined) {
				// Пересчёт id у элементов коллекции
				for (let i = 0; i < state.sheets.length; i++) {
					state.sheets[i].id = i + 1;
				}
			}
		}
	},

	/* -------------------------------------LAYOUT mutations-------------------------------------- */

	SET_LAYOUTS: (state, data) => {
		Object.keys(data).forEach(layout => {
			if (layout === 'generalSheet' || layout === 'additionalSheet') {
				for (let i = 0; i < data[layout].length; i++) {
					let currItem = state[layout].find(el => el.id === data[layout][i].id);

					if (!currItem) {
						const type_obj = typeForSheet(data[layout][i].type_el);

						currItem = {
							id: data[layout][i].id,
							layout: data[layout][i].layout,
							type_el: type_obj.type_el,
							sheet_id: data[layout][i].sheet_id
						};

						state[layout].push(currItem);
					} else {
						Object.keys(data[layout]).forEach(key => {
							Vue.set(state[layout], key, data[layout][i][key]);
						});
					}
				}
			}
		});

		setApiStatus(state, 'SET_LAYOUTS', null);
	},

	REMOVE_LAYOUT: (state, data) => {
		if (Object.prototype.hasOwnProperty.call(data, 'id')) {
			let index = state.generalSheet.findIndex(el => el.id === data.id);
			if (index !== -1) {
				state.generalSheet.splice(index, 1);
			}

			index = state.additionalSheet.findIndex(el => el.id === data.id);
			if (index !== -1) {
				state.additionalSheet.splice(index, 1);
			}
		}
	},

	/* --------------------------------------QUEUE mutations-------------------------------------- */

	ADD_QUEUE: (state, data) => {
		const queue = {
			id: state.updateQueue.length,
			sheet_id: null,
			element_id: null,
			data: null,
			method: null,
			processed: false
		};

		Object.keys(data).forEach(key => {
			if (Object.prototype.hasOwnProperty.call(queue, key)) {
				queue[key] = data[key];
			}
		});

		state.updateQueue.push(queue);
	},

	DELETE_QUEUE: (state, id) => {
		let index = state.updateQueue.findIndex(el => el.id === id);
		if (index !== -1) {
			state.updateQueue.splice(index, 1);
		}
	}
};
