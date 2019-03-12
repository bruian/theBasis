import Vue from 'vue';
import qs from 'qs';
import { decode } from 'jsonwebtoken';
import moment from 'moment';
import config from '../config';

import { recursiveFind } from '../util/helpers';

const dbg = !!config.DEBUG_API;
const storage = process.env.VUE_ENV === 'server' ? null : window.localStorage;

const authPort = config.authWOPort ? '' : `:${config.authPort}`;
const authURL = `http://${config.authHost}${authPort}/auth/`;

const apiPort = config.apiWOPort ? '' : `:${config.apiPort}`;
const apiURL = `http://${config.apiHost}${apiPort}/api/`;

const mainPacket = [
	{
		fetchQuery: {
			url: 'main-user',
			method: 'GET',
			params: { packet: 0 }
		},
		mutations: ['SET_MAIN_USER']
	},
	{
		fetchQuery: {
			url: 'groups',
			method: 'GET',
			params: { packet: 1 }
		},
		mutations: ['MAIN_GROUPS_SUCCESS']
	},
	{
		fetchQuery: {
			url: 'contexts',
			method: 'GET',
			params: { packet: 2 }
		},
		mutations: ['MAIN_CONTEXTS_SUCCESS']
	},
	{
		fetchQuery: {
			url: 'sheets',
			method: 'GET',
			params: { packet: 3 }
		},
		mutations: ['SHEETS_SUCCESS']
	}
];

function workDateCurrTime(workDate) {
	const time = moment();

	return moment(workDate).set({
		hour: time.get('hour'),
		minute: time.get('minute'),
		second: time.get('second'),
		millisecond: time.get('millisecond')
	});
}

function getTokensFromSessionStorage() {
	const tokens = { token: '', refreshToken: '' };
	if (storage && storage.getItem('token')) {
		tokens.token = storage.getItem('token');
	}

	if (storage && storage.getItem('refreshToken')) {
		tokens.refreshToken = storage.getItem('refreshToken');
	}

	return tokens;
}

/**
 * @func getTokens
 * @returns {Object} - access and refresh tokens
 * @description Функция выдаёт токены авторизации для каждого запроса к API, а так же проверяет
 * срок жизни выдаваемых токенов и если срок истекает, то обновляет их запросом к аутентификационному
 * API и выдаёт уже обновлённые токены. В случае неудачи бросает exception.
 * В итоге имеется 3 сценария:
 * 1) Извлечение токенов из хранилища и проверка их жизненного срока. В случае валидности, токен
 * возвращается вызывающей функции.
 * 2) Для access токенов, чей срок истёк делается refresh запрос к серверу Auth. В случае получения
 * новых токенов, они сохраняются в хранилище и возвращаются вызывающей функции.
 * 3) Если попытка обновления не удалась, тогда выбрасывается exception, а вызывающая функция дожна
 * принять и обработать такой exception операцией logout
 */
async function getTokens(commit) {
	let tokens = getTokensFromSessionStorage();
	const decodedToken = decode(tokens.token);

	if (!decodedToken) {
		throw new Error('Invalid tokens');
	}

	if (new Date() / 1000 >= decodedToken.exp) {
		const axiosData = {
			url: `${authURL}refresh`,
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			data: qs.stringify({
				refreshToken: tokens.refreshToken
			})
		};

		try {
			const newTokens = await Vue.axios(axiosData);
			commit('AUTH_REFRESH_SUCCESS', newTokens.data);

			tokens = Object.assign({}, newTokens.data);
		} catch (err) {
			throw err;
		}
	}

	return tokens;
}

async function fetchSrv(query, commit, argTokens) {
	let tokens;
	try {
		if (argTokens) {
			tokens = Object.assign({}, argTokens);
		} else {
			tokens = await getTokens(commit);
		}
	} catch (err) {
		commit('AUTH_LOGOUT');

		throw err;
	}

	const headers = {
		'content-type': 'application/x-www-form-urlencoded',
		Authorization: `Bearer ${tokens.token}`
	};

	let axiosData = Object.assign({}, query);

	if (axiosData.headers) {
		axiosData.headers = Object.assign(axiosData.headers, headers);
	} else {
		axiosData.headers = headers;
	}

	try {
		let dataFromSrv = await Vue.axios(axiosData);

		return Promise.resolve(dataFromSrv.data);
	} catch (err) {
		// debugger;
		// if (Array.isArray(err.response.data) && err.response.data.length > 0) {
		commit('API_ERROR', err.response.data);
		// }

		throw err;
	}
}

export default {
	/* ----------------------------------Authentication actions----------------------------------- */

	AUTH_REQUEST: ({ commit, dispatch }, user) => {
		return new Promise((resolve, reject) => {
			const bodyData = {
				email: user.email,
				password: user.password,
				client: 'browser:inTask'
			};

			const axiosData = {
				url: `${authURL}login`,
				data: qs.stringify(bodyData),
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				}
			};

			Vue.axios(axiosData)
				.then(res => {
					commit('AUTH_SUCCESS', res.data);

					// we have token, then we can log in user
					dispatch('MAINUSER_REQUEST');
					return resolve(res);
				})
				.catch(err => {
					debugger;
					let errorData = {
						message: 'Упс! Неожиданная ошибка сервера!',
						caller: 'REG_REQUEST'
					};

					if (err.response) {
						switch (err.response.data) {
							case 'UserNotFound':
								errorData.message = 'Не найден пользователь с таким e-mail';
								break;
							case 'UserConditionWrongEmail':
								errorData.message = 'Неверно задан e-mail. Такое бывает, проверьте внимательнее.';
								break;
							case 'NotMatchingPassword':
								errorData.message = 'Не верный пароль';
								break;
							default:
								errorData.message = err.response.data;
						}
					}

					commit('API_ERROR', errorData);
					return reject(errorData);
				});
		});
	},

	/* Registration actions */
	REG_REQUEST: ({ commit }, userData) => {
		return new Promise((resolve, reject) => {
			const bodyData = Object.assign(
				{
					client: 'browser:inTask',
					redirectUri: 'http://192.168.1.37:8080/'
				},
				userData
			);

			let axiosData = {
				url: `${authURL}registration`,
				data: qs.stringify(bodyData),
				method: 'POST'
			};

			Vue.axios(axiosData)
				.then(res => {
					commit('REG_SUCCESS', res.data);

					return resolve(true);
				})
				.catch(err => {
					let errorData = {
						message: 'Упс! Неожиданная ошибка сервера!',
						caller: 'REG_REQUEST'
					};

					if (err.response) {
						switch (err.response.data) {
							case 'UserConditionNotValid':
								errorData.message = 'Необходимо заполнить поля email и password';
								break;
							case 'UserConditionWrongEmail':
								errorData.message = 'Неверно задан e-mail. Такое бывает, проверьте внимательнее.';
								break;
							case 'UserIsExists':
								errorData.message =
									'Пользователь с таким e-mail уже существует. Если вы не регистрировались ранее, то рекомендуется обратитесь в службу поддержки help@intask.me';
								break;
							default:
								errorData.message = err.response.data;
						}
					}

					commit('API_ERROR', errorData);
					return reject(errorData);
				});
		});
	},

	/* LogOut actions */
	AUTH_LOGOUT: ({ commit, state }) => {
		return new Promise((resolve, reject) => {
			const axiosData = {
				url: `${authURL}logout`,
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					Authorization: `Bearer ${state.auth.token}`
				}
			};

			Vue.axios(axiosData)
				.then(() => {
					commit('AUTH_LOGOUT');

					// we have token, then we can log in user
					return resolve(true);
				})
				.catch(err => {
					let errorData = {
						message: 'Упс! Неожиданная ошибка сервера!',
						caller: 'REG_REQUEST'
					};

					if (err.response) {
						switch (err.response.data) {
							case 'UserConditionNotValid':
								errorData.message = 'Необходимо заполнить поля email и password';
								break;
							case 'UserConditionWrongEmail':
								errorData.message = 'Неверно задан e-mail. Такое бывает, проверьте внимательнее.';
								break;
							case 'UserIsExists':
								errorData.message =
									'Пользователь с таким e-mail уже существует. Если вы не регистрировались ранее, то рекомендуется обратитесь в службу поддержки help@intask.me';
								break;
							default:
								errorData.message = err.response.data;
						}
					}

					commit('API_ERROR', errorData);
					return reject(errorData);
				});
		});
	},

	CHECK_TOKENS: ({ commit, state }) => {
		return new Promise(async (resolve, reject) => {
			let commonTokens;
			try {
				commonTokens = await getTokens(commit);

				// Если есть валидный токен в хранилище, но нет в state приложения, тогда такой токен
				// помещается в state
				if (commonTokens.token.length > 0 && state.auth.token === '') {
					commit('AUTH_SUCCESS', commonTokens);
				}

				console.log('TOKENS CHECKED');
				return resolve(true);
			} catch (err) {
				commit('AUTH_LOGOUT');

				return reject(err);
			}
		});
	},

	/* -----------------------------------------MAIN USER----------------------------------------- */

	MAINUSER_REQUEST: async ({ commit, state }) => {
		let commonTokens;
		try {
			commonTokens = await getTokens(commit);

			// Если есть валидный токен в хранилище, но нет в state приложения, тогда такой токен
			// помещается в state
			if (commonTokens.token.length > 0 && state.auth.token === '') {
				commit('AUTH_SUCCESS', commonTokens);
			}
		} catch (err) {
			commit('AUTH_LOGOUT');

			return Promise.reject(err);
		}

		let p = Promise.resolve();
		for (let i = 0; i < mainPacket.length; i++) {
			p = p.then(
				(packet => {
					return () => {
						return fetchSrv(packet.fetchQuery, commit, commonTokens)
							.then(dataFromSrv => {
								if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'data')) {
									Array.prototype.forEach.call(
										mainPacket[dataFromSrv.packet].mutations,
										mutation => {
											commit(mutation, dataFromSrv.data);
										}
									);
								}

								return Promise.resolve(1);
							})
							.catch(err => {
								if (err.response.data) {
									commit('API_ERROR', { message: err.message, data: err.response.data });
									return Promise.reject(
										new Error({ message: err.message, data: err.response.data })
									);
								} else {
									commit('API_ERROR', { message: err.message, data: null });
									return Promise.reject(new Error({ message: err.message, data: null }));
								}
							});
					};
				})(mainPacket[i])
			);
		}

		return p;

		// return Promise.all([
		// 	fetchSrv(mainPacket[0].fetchQuery, commit, commonTokens),
		// 	fetchSrv(mainPacket[1].fetchQuery, commit, commonTokens),
		// 	fetchSrv(mainPacket[2].fetchQuery, commit, commonTokens),
		// 	fetchSrv(mainPacket[3].fetchQuery, commit, commonTokens),
		// ])
		// 	.then(datasFromSrv => {
		// 		Array.prototype.forEach.call(datasFromSrv, dataFromSrv => {
		// 			if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'data')) {
		// 				Array.prototype.forEach.call(mainPacket[dataFromSrv.packet].mutations, mutation => {
		// 					commit(mutation, dataFromSrv.data);
		// 				});

		// 				Promise.resolve(1);
		// 			}
		// 		});
		// 	})
		// 	.catch(err => {
		// 		if (err.response.data) {
		// 			commit('API_ERROR', { message: err.message, data: err.response.data });
		// 			return Promise.reject(new Error({ message: err.message, data: err.response.data }));
		// 		} else {
		// 			commit('API_ERROR', { message: err.message, data: null });
		// 			return Promise.reject(new Error({ message: err.message, data: null }));
		// 		}
		// 	});
	},

	/* --------------------------------------ELEMENTS action-------------------------------------- */

	FETCH_ELEMENTS: ({ commit, state }, options) => {
		const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);

		let isRefresh = false;
		if (Object.prototype.hasOwnProperty.call(options, 'refresh') && options.refresh) {
			theSheet.limit = 20;
			theSheet.offset = 0;
			isRefresh = true;
		}

		let apiSection = theSheet.type_el.match(/^(?!-sheet)\w+/g)[0];
		if (!apiSection) return Promise.reject(new Error({ message: 'Inappropriate sheet' }));

		const fetchQuery = {
			url: `${apiURL}${apiSection}`,
			method: 'GET',
			params: { limit: theSheet.limit, offset: theSheet.offset }
		};

		// apply global condition
		Object.keys(theSheet.condition).forEach(key => {
			if (theSheet.condition[key] !== undefined) {
				fetchQuery.params[key] = theSheet.condition[key];
			}
		});

		// apply local condition
		Object.keys(options).forEach(key => {
			if (key !== 'sheet_id' && key !== 'refresh') {
				fetchQuery.params[key] = options[key];
			}
		});

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				let dataLength = 0;
				if (apiSection === 'tasks') {
					dataLength = dataFromSrv.tasks_data.length;
				} else if (apiSection === 'groups') {
					dataLength = dataFromSrv.groups_data.length;
				} else if (apiSection === 'activity') {
					dataLength = dataFromSrv.activity_data.length;
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						refresh: isRefresh,
						data: dataFromSrv.tasks_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'groups_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'groups-sheet',
						refresh: isRefresh,
						data: dataFromSrv.groups_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						refresh: isRefresh,
						data: dataFromSrv.activity_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'restrictions_data')) {
					commit('SET_RESTRICTIONS', {
						sheet_id: options.sheet_id,
						data: dataFromSrv.restrictions_data
					});
				}

				return Promise.resolve(dataLength);
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/**
	 * Создание нового элемента в списке sheet принадлежащему множеству списков sheets по sheet_id
	 * обязательные входящие опции: options = { sheet_id:string, isSubelement:bool, isStart:bool }
	 */
	CREATE_ELEMENT: ({ commit, state }, options) => {
		const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);

		let group_id;
		let parent_id = 0;

		let apiSection = theSheet.type_el.match(/^(?!-sheet)\w+/g)[0];
		if (!apiSection) return Promise.reject(new Error({ message: 'Inappropriate sheet' }));

		/* Определим, что добавляется элемент или субэлемент */
		if (Object.prototype.hasOwnProperty.call(options, 'isSubelement')) {
			if (options.isSubelement) {
				const activeElement = recursiveFind(theSheet.sh, el => el.isActive).element;
				if (activeElement) {
					if (activeElement.el.level < 3) {
						parent_id = activeElement.el.id;
						if (theSheet.type_el === 'tasks-sheet') group_id = activeElement.el.group_id;
					} else {
						return Promise.reject(new Error({ message: 'Maximum is 3 levels' }));
					}
				} else {
					return Promise.reject(new Error({ message: 'To add an unselected item' }));
				}
			} else {
				if (theSheet.sh.length > 0) {
					if (theSheet.type_el === 'tasks-sheet') group_id = theSheet.sh[0].el.group_id;
				} else {
					/* Если список элементов пуст, найдем primary group в которую по-умолчанию добавим элемент */
					if (theSheet.type_el === 'tasks-sheet')
						group_id = state.mainGroups.find(el => el.group_type === 1).id;
				}
			}
		}

		const fetchQuery = {
			url: `${apiURL}${apiSection}`,
			method: 'POST',
			data: qs.stringify({
				group_id,
				parent_id,
				start: workDateCurrTime(state.mainUser.workDate).toISOString(),
				isStart: options.isStart
			})
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						isStart: options.isStart,
						data: dataFromSrv.tasks_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'groups_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'groups-sheet',
						isStart: options.isStart,
						data: dataFromSrv.groups_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						isStart: options.isStart,
						data: dataFromSrv.activity_data
					});
				}

				return Promise.resolve(true);
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/** options = { sheet_id, id, ...values } */
	UPDATE_ELEMENT: ({ commit, state }, options) => {
		let theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let element = theSheet.sh.find(x => x.el.id === options.id);
		let values = {
			id: options.id
		};

		let apiSection = theSheet.type_el.match(/^(?!-sheet)\w+/g)[0];
		if (!apiSection) return Promise.reject(new Error({ message: 'Inappropriate sheet' }));

		element.consistency = 1;

		Object.keys(options).forEach(key => {
			if (key !== 'id' && key !== 'sheet_id') {
				if (Object.prototype.hasOwnProperty.call(element.el, key)) {
					values[key] = options[key];
					// element.el[key] = options[key];
				}
			}
		});

		const fetchQuery = {
			url: `${apiURL}${apiSection}`,
			method: 'PUT',
			data: qs.stringify(values)
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				// изменение значения группы на новую группу
				// commit('UPDATE_ELEMENT', options);
				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						data: dataFromSrv.activity_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						data: dataFromSrv.tasks_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'groups_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'groups-sheet',
						data: dataFromSrv.groups_data
					});
				}

				element.consistency = 0;
				return Promise.resolve(true);
			})
			.catch(err => {
				element.consistency = 2;
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/**
	 * Удаление текущего элемента в списке sheet принадлежащему множеству списков sheets по sheet_id
	 * обязательные входящие опции: options = { sheet_id:string }
	 */
	DELETE_ELEMENTS: ({ commit, state }, options) => {
		const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);

		let id = null;
		let group_id = null;

		let apiSection = theSheet.type_el.match(/^(?!-sheet)\w+/g)[0];
		if (!apiSection) return Promise.reject(new Error({ message: 'Inappropriate sheet' }));

		if (theSheet.selectedItem) {
			if (theSheet.selectedItem.el.depth > 1) {
				return Promise.reject(
					new Error({ message: 'I can not delete an element containing other elements' })
				);
			}

			id = theSheet.selectedItem.el.id;
			if (theSheet.type_el === 'tasks-sheet') group_id = theSheet.selectedItem.el.group_id;
		} else {
			return Promise.resolve('No item selected for deletion');
		}

		const fetchQuery = {
			url: `${apiURL}${apiSection}`,
			method: 'DELETE',
			data: qs.stringify({
				id,
				group_id
			})
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'deleted_activity')) {
					commit('DELETE_ELEMENTS', {
						type_el: 'activity-sheet',
						data: dataFromSrv.deleted_activity
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'deleted_tasks')) {
					commit('DELETE_ELEMENTS', {
						type_el: 'tasks-sheet',
						data: dataFromSrv.deleted_tasks
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						data: dataFromSrv.activity_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						data: dataFromSrv.tasks_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'groups_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'groups-sheet',
						data: dataFromSrv.groups_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'restrictions_data')) {
					commit('SET_RESTRICTIONS', {
						sheet_id: options.sheet_id,
						data: dataFromSrv.restrictions_data
					});
				}

				return Promise.resolve(true);
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data.message });
					return Promise.reject(
						new Error({ message: err.message, data: err.response.data.message })
					);
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/** Перемещение элементов в списке sheet принадлежащему множеству списков sheets по sheet_id
	 * обязательные входящие опции: options = { fromId, toId, parentId }
	 * Эта action - функция меняет позицию на клиенте и на сервере по различным правилам:
	 * - на клиенте список древовидной структуры, а на сервере плоский - поэтому индексация разная
	 * - на клиенте в списке присутствуют dividers, которые делят список на группы, на сервере нет
	 * dividers индексация не совпадает, только порядок следования в разрезе группы
	 * - порядок следования на сервере задается следованием групп в порядке возрастания id-группы
	 * (т.е. порядка создания) и соотношением чисел p/q которое задает порядок внутри этой группы
	 * - клиент ориентирует положение элемента относительно idx, сервер относительно id элементов
	 */
	REORDER_ELEMENTS: ({ commit, state }, options) => {
		const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const fromElement = theSheet.sh.find(x => x.el.id === options.fromId);
		let toElement;

		let fetchQuery;
		let apiSection = theSheet.type_el.match(/^(?!-sheet)\w+/g)[0];
		if (!apiSection) return Promise.reject(new Error({ message: 'Inappropriate sheet' }));

		if (theSheet.type_el === 'tasks-sheet' || theSheet.type_el === 'groups-sheet') {
			toElement = theSheet.sh.find(x => x.el.id === options.toId);

			let toGroupId;
			let toParentId;
			let isBefore = true;

			fromElement.consistency = 1;
			if (toElement) toElement.consistency = 1;

			if (apiSection === 'tasks') {
				/* Серверу всегда необходимо передавать в запрос id группы новой позиции элемента */
				if (Object.prototype.hasOwnProperty.call(options, 'group_id')) {
					toGroupId = options.group_id;
				} else {
					toGroupId = fromElement.el.group_id;
				}
			}

			if (Object.prototype.hasOwnProperty.call(options, 'isBefore')) {
				isBefore = options.isBefore;
			}

			if (Object.prototype.hasOwnProperty.call(options, 'parent_id')) {
				toParentId = options.parent_id;
			} else {
				if (toElement) toParentId = toElement.el.parent.id;
			}

			/*
				api сервера размещает элементы в списке по следующим правилам:
				Все атрибуты обязательны
				а) Необходимо указать <group_id>, id группы относительно которой позиционируется элемент
				б) Необходимо указать <id>, id перемещаемого элемента
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
				е) Необходимо указать <start> дата и время изменения в формате ISO, необходимо для создания
					action по текущему изменению
			*/
			fetchQuery = {
				url: `${apiURL}${apiSection}/order`,
				method: 'PUT',
				data: qs.stringify({
					group_id: toGroupId,
					id: fromElement.el.id,
					position: toElement === undefined ? null : toElement.el.id,
					isBefore,
					start: workDateCurrTime(state.mainUser.workDate).toISOString(),
					parent_id: toParentId === null ? 0 : toParentId
				})
			};
		} else if (theSheet.type_el === 'activity-sheet') {
			fetchQuery = {
				url: `${apiURL}${apiSection}/order`,
				method: 'PUT',
				data: qs.stringify({
					id: fromElement.el.id,
					start: options.start ? options.start.toISOString() : null,
					ends: options.ends ? options.ends.toISOString() : null
				})
			};
		}

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				// изменение значения группы на новую группу
				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						data: dataFromSrv.activity_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						data: dataFromSrv.tasks_data
					});
				}

				fromElement.consistency = 0;
				if (toElement) toElement.consistency = 0;

				return Promise.resolve(true);
			})
			.catch(err => {
				fromElement.consistency = 2;
				if (toElement) toElement.consistency = 2;

				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/** options = { sheet_id, id, group_id } */
	UPDATE_TASK_GROUP: ({ commit, state }, options) => {
		let theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let dataSh = recursiveFind(theSheet.sh, x => x.el.id === options.id).element;

		dataSh.consistency = 1;

		const fetchQuery = {
			url: `${apiURL}tasks/order`,
			method: 'PUT',
			data: qs.stringify({
				group_id: options.group_id,
				id: dataSh.el.id,
				position: null,
				isBefore: false,
				start: state.mainUser.workDate.toISOString(),
				parent_id: dataSh.el.parent ? dataSh.el.parent.id : '0'
			})
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				// изменение значения группы на новую группу
				if (Object.prototype.hasOwnProperty.call(dataFromSrv.data, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						data: dataFromSrv.tasks_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv.data, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						data: dataFromSrv.activity_data
					});
				}

				dataSh.consistency = 0;
				return Promise.resolve(true);
			})
			.catch(err => {
				dataSh.consistency = 2;
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	ADD_TASK_CONTEXT: ({ commit, state }, options) => {
		let activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let taskSheet = activeSheet.sheet;
		let element = recursiveFind(taskSheet, el => el.id === options.task_id).element;
		let values = {
			task_id: options.task_id
		};

		element.consistency = 1;

		if ('context_id' in options) {
			values.context_id = options.context_id;
		}

		if ('context_value' in options) {
			values.context_value = options.context_value;
		}

		const fetchQuery = {
			url: `${apiURL}contexts`,
			method: 'POST',
			data: qs.stringify(values)
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				element.consistency = 0;

				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					const data = Object.assign({}, dataFromSrv.data);
					data.sheet_id = options.sheet_id;

					commit('ADD_TASK_CONTEXT', data);
					return Promise.resolve(true);
				}
			})
			.catch(err => {
				element.consistency = 2;

				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	REMOVE_TASK_CONTEXT: ({ commit, state }, options) => {
		let activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let taskSheet = activeSheet.sheet;
		let element = recursiveFind(taskSheet, el => el.id === options.task_id).element;
		let values = {
			task_id: options.task_id
		};

		element.consistency = 1;

		if ('context_id' in options) {
			values.context_id = options.context_id;
		}

		const fetchQuery = {
			url: `${apiURL}contexts`,
			method: 'DELETE',
			data: qs.stringify(values)
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				element.consistency = 0;

				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					const data = Object.assign({}, dataFromSrv.data);
					data.sheet_id = options.sheet_id;

					commit('REMOVE_TASK_CONTEXT', data);
					return Promise.resolve(true);
				}
			})
			.catch(err => {
				element.consistency = 2;

				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/* ----------------------------------ACTIVITY SHEET actions----------------------------------- */

	/**
	 * @func FETCH_ACTIVITY
	 * @param { VUEX action parametres: Object }
	 * @param { { sheet_id, task_id }: Object } - options
	 * @returns { function(...args): Promise }
	 * @description Функция для получения списка активностей с сервера
	 */
	FETCH_ACTIVITY: ({ commit, state }, options) => {
		let theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let element = theSheet.sh.find(x => x.el.id === options.task_id);

		if (!element) return Promise.reject(new Error({ message: 'task element not found' }));
		element.consistency = 1;

		const fetchQuery = {
			url: `${apiURL}activity`,
			method: 'GET',
			params: { task_id: element.el.id, type_el: 2, limit: 100, offset: 0 }
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				element.consistency = 0;
				commit('SET_ACTIVITY', { sheet_id: options.sheet_id, data: dataFromSrv.data });
				return Promise.resolve(dataFromSrv.data.length);
			})
			.catch(err => {
				element.consistency = 2;

				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/**
	 * @func CREATE_ACTIVITY
	 * @param { VUEX action parametres: Object }
	 * @param { { sheet_id, task_id, ...other options }: Object } - options
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
	CREATE_ACTIVITY: ({ commit, state }, options) => {
		// Получим элемент задачи относительно которой добавляется активность
		const theSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const theElement = recursiveFind(theSheet.sh, x => x.el.id === options.task_id).element;

		let status;
		let start;
		let group_id = theElement.el.group_id;

		theElement.consistency = 1;

		// Определим меняется ли статус задачи или это обычное добавление активности
		// Т.к. статус должен обязательно включать время смены, то заранее его зададим
		if (Object.prototype.hasOwnProperty.call(options, 'status')) {
			status = options.status;
			start = workDateCurrTime(state.mainUser.workDate).toISOString();
		}
		// console.log(start);

		// Убедимся не было ли передано иное время смены, отличное от автоматического
		if (Object.prototype.hasOwnProperty.call(options, 'start')) {
			start = options.start;
		}

		const fetchQuery = {
			url: `${apiURL}activity`,
			method: 'POST',
			data: qs.stringify({
				group_id,
				type_el: 2,
				task_id: theElement.el.id,
				start,
				status
			})
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				theElement.consistency = 0;

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'tasks_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'tasks-sheet',
						data: dataFromSrv.tasks_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'groups_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'groups-sheet',
						data: dataFromSrv.groups_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'activity_data')) {
					commit('SET_ELEMENTS', {
						type_el: 'activity-sheet',
						data: dataFromSrv.activity_data
					});
				}

				if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'restrictions_data')) {
					commit('SET_RESTRICTIONS', {
						sheet_id: options.sheet_id,
						data: dataFromSrv.restrictions_data
					});
				}

				return Promise.resolve(true);
			})
			.catch(err => {
				theElement.consistency = 2;

				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	AMOVE_RESTRICTIONS: ({ commit }, options) => {
		const fetchQuery = {
			url: `${apiURL}activity/restrictions`,
			method: 'GET',
			params: { id: options.id, type: 'move' }
		};

		return fetchSrv(fetchQuery)
			.then(dataFromSrv => {
				return Promise.resolve(dataFromSrv);
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/* --------------------------------------SHEETS actions--------------------------------------- */

	/**
	 * @func UPDATE_SHEET_VALUES
	 * @param { VUEX action parametres: Object }
	 * @param { { id, field, value }: Object } - options
	 * @returns { function(...args): Promise }
	 * @description Функция для обновление элементов в списке
	 */
	UPDATE_SHEET_VALUES: ({ commit, dispatch }, options) => {
		const values = {
			id: options.id
		};

		values[options.field] = options.value;

		const fetchQuery = {
			url: `${apiURL}sheets`,
			method: 'PUT',
			data: qs.stringify(values)
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				}

				commit('UPDATE_SHEET_VALUES', dataFromSrv.data);

				let needUpdateSheet = false;
				Array.prototype.forEach.call(dataFromSrv.data, dataItem => {
					/* Если изменились найстройки фильтров sheet, тогда необходимо запросить данные для sheet
						по новой у сервера */
					if (Object.prototype.hasOwnProperty.call(dataItem, 'condition')) {
						needUpdateSheet = true;
					}

					/* Так же sheet обновляется полностью, когда у него включается visible. Связанное обновление
						смежных sheet происходит только для видимых sheet */
					if (Object.prototype.hasOwnProperty.call(dataItem, 'visible') && dataItem.visible) {
						needUpdateSheet = true;
					}
				});

				if (needUpdateSheet) {
					commit('ADD_QUEUE', { sheet_id: options.id, method: 'refresh' });
					dispatch('UPDATE_QUEUE', 3);
				}

				return Promise.resolve(true);
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/**
	 * @func CREATE_SHEET_ELEMENT
	 * @param { VUEX action parametres: Object }
	 * @param { { type_el, layout, name, visible }: Object } - options
	 * @returns { function(...args): Promise }
	 * @description Функция для создания списка элементов
	 */
	CREATE_SHEET_ELEMENT: ({ commit }, options) => {
		const values = Object.assign({}, options);

		const fetchQuery = {
			url: `${apiURL}sheets`,
			method: 'POST',
			data: qs.stringify(values)
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					commit('SHEETS_SUCCESS', dataFromSrv.data);

					return Promise.resolve(true);
				}
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/**
	 * @func DELETE_SHEET_ELEMENT
	 * @param { VUEX action parametres: Object }
	 * @param { { id }: Object } - options
	 * @returns { function(...args): Promise }
	 * @description Функция для удаления списка элементов
	 */
	DELETE_SHEET_ELEMENT: ({ commit }, options) => {
		const fetchQuery = {
			url: `${apiURL}sheets`,
			method: 'DELETE',
			data: qs.stringify({
				id: options.id
			})
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					commit('DELETE_SHEET_ELEMENT', dataFromSrv.data);

					return Promise.resolve(true);
				}
			})
			.catch(err => {
				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/* ---------------------------------------QUEUE actions--------------------------------------- */

	/**
	 * @func UPDATE_QUEUE
	 * @param { VUEX action parametres: Object }
	 * @param { Number } - limit количество элементов в очереди обрабатываемых за один вызов
	 * @returns { function(...args): Promise }
	 * @description Функция для обработки очереди actions
	 */
	UPDATE_QUEUE: ({ commit, dispatch, state }, limit) => {
		let queueLimit = 0;
		let promiseResult = false;

		/* Опрос очереди с проверкой состояния actions в очереди, у каждого action есть параметр
			processed указывающий на то что action находится в асинхронном потоке обработки и пока
			не переключится в состояние false, нет нужды его обрабатывать.
			Асинхронно можно запустить не больше limit */

		for (let i = 0; i < state.updateQueue.length; i++) {
			if (queueLimit === limit) {
				// выбрасывается null, как индикатор что с очередью ничего не сделано
				return Promise.resolve(promiseResult);
			}
			queueLimit++;

			let queue = state.updateQueue[i];
			if (!queue.processed) {
				// Установка флага обработки и запуск элемента очереди на обработку
				queue.processed = true;

				if (queue.method === 'refresh') {
					// Обработка метода refresh, который говорит о необходимости обновить элементы в sheets
					let thisSheet = state.sheets.find(el => el.sheet_id === queue.sheet_id);
					if (thisSheet) {
						/* Вообще так менять значения store у vue нельзя, для этого рекомендуется использовать
							mutations, будем считать это техническим долгом */

						// thisSheet.limit = 10;
						// thisSheet.offset = 0;

						// Для соответсвующего типа sheet, вызывается свой асинхронный метод
						if (thisSheet.type_el === 'tasks-sheet') {
							promiseResult = true;

							dispatch('FETCH_ELEMENTS', { sheet_id: thisSheet.sheet_id, refresh: true })
								.then(() => {
									// Метод успешно выполнился, элемент удаляется из очереди
									commit('DELETE_QUEUE', queue.id);
								})
								.catch(err => {
									// eslint-disable-next-line
									dbg && console.warn(err);

									return Promise.reject(err);
								});
						}
					}
				}
			}
		}

		// выбрасывается null, как индикатор что с очередью ничего не сделано
		return Promise.resolve(promiseResult);
	}
};
