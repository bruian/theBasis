import Vue from 'vue';
import qs from 'qs';
import querystring from 'querystring';
import { decode } from 'jsonwebtoken';
import config from '../config';

import { recursiveFind, findGroup } from '../util/helpers';

const dbg = !!config.DEBUG_API;
const storage = process.env.VUE_ENV === 'server' ? null : window.localStorage;

const mainPacket = [
	{
		fetchQuery: {
			url: 'main-user',
			method: 'GET',
			params: { packet: 0 },
		},
		mutations: ['MAIN_USER_SUCCESS', 'THEUSER_SUCCESS'],
	},
	{
		fetchQuery: {
			url: 'groups',
			method: 'GET',
			params: { packet: 1 },
		},
		mutations: ['MAIN_GROUPS_SUCCESS'],
	},
	{
		fetchQuery: {
			url: 'contexts',
			method: 'GET',
			params: { packet: 2 },
		},
		mutations: ['MAIN_CONTEXTS_SUCCESS'],
	},
	{
		fetchQuery: {
			url: 'sheets',
			method: 'GET',
			params: { packet: 3 },
		},
		mutations: ['SHEETS_SUCCESS'],
	},
];

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
			url: `http://${config.authHost}:${config.authPort}/auth/refresh`,
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
			},
			data: qs.stringify({
				refreshToken: tokens.refreshToken,
			}),
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
		Authorization: `Bearer ${tokens.token}`,
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
		debugger;
		if (Array.isArray(err.response.data) && err.response.data.length > 0) {
			commit('API_ERROR', err.response.data);

			// if (err.response.data[0].action && err.response.data[0].action === 'error') {
			// 	if (err.response.data[0].name === 'TokenExpiredError') {
			// 		storage.removeItem('token');
			// 		commit('AUTH_LOGOUT');
			// 	}
			// }
		}

		throw err;
	}
}

let userPartID = 0;
let groupPartID = 0;
let taskPartID = 0;

export default {
	/* -----------------------------------Authentication actions------------------------------------ */

	AUTH_REQUEST: ({ commit, dispatch }, user) => {
		return new Promise((resolve, reject) => {
			const bodyData = {
				email: user.email,
				password: user.password,
				client: 'browser:inTask',
			};

			const axiosData = {
				url: `http://${config.authHost}:${config.authPort}/auth/login`,
				data: qs.stringify(bodyData),
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
				},
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
						caller: 'REG_REQUEST',
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
					redirectUri: 'http://192.168.1.37:8080/',
				},
				userData,
			);

			let axiosData = {
				url: `http://${config.authHost}:${config.authPort}/auth/registration`,
				data: qs.stringify(bodyData),
				method: 'POST',
			};

			Vue.axios(axiosData)
				.then(res => {
					commit('REG_SUCCESS', res.data);

					return resolve(true);
				})
				.catch(err => {
					let errorData = {
						message: 'Упс! Неожиданная ошибка сервера!',
						caller: 'REG_REQUEST',
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
				url: `http://${config.authHost}:${config.authPort}/auth/logout`,
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					Authorization: `Bearer ${state.auth.token}`,
				},
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
						caller: 'REG_REQUEST',
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

	/* ------------------------------------------MAIN USER------------------------------------------ */

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

		return Promise.all([
			fetchSrv(mainPacket[0].fetchQuery, commit, commonTokens),
			fetchSrv(mainPacket[1].fetchQuery, commit, commonTokens),
			fetchSrv(mainPacket[2].fetchQuery, commit, commonTokens),
			fetchSrv(mainPacket[3].fetchQuery, commit, commonTokens),
		])
			.then(datasFromSrv => {
				Array.prototype.forEach.call(datasFromSrv, dataFromSrv => {
					if (Object.prototype.hasOwnProperty.call(dataFromSrv, 'data')) {
						// if (!state.auth.token) {
						// 	commit('AUTH_SUCCESS', getTokensFromSessionStorage().token);
						// }

						Array.prototype.forEach.call(mainPacket[dataFromSrv.packet].mutations, mutation => {
							commit(mutation, dataFromSrv.data);
						});

						Promise.resolve(1);
					}
				});
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

	/* -------------------------------------USERS SHEET action-------------------------------------- */

	FETCH_USERS_SHEET: ({ commit, state }) => {
		const activeSheet = state.activeUsersSheet.sheet;
		const searchText = state[activeSheet].searchText;
		const fetchQuery = {
			url: 'users',
			method: 'GET',
			params: {
				like: searchText,
				whose: state.activeUsersSheet.whose,
			},
			headers: {
				limit: state[activeSheet].limit,
				offset: state[activeSheet].offset,
				partid: ++userPartID,
			},
		};

		const condition = state.activeUsersSheet.condition;
		for (let i = 0; i < condition.length; i++) {
			switch (condition[i]) {
				case 'user_id':
					fetchQuery.url += `/${state.theUser.id}`;
					break;
				case 'group_id':
					fetchQuery.params.group_id = state.theGroup.id;
					break;
				default:
					break;
			}
		}

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(0);
				} else {
					console.log(`actions partID: srv-${dataFromSrv.partid} glb-${userPartID}`);
					commit('SET_USERS_SHEET', dataFromSrv.data);
					return Promise.resolve(dataFromSrv.data.length);
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

	LINK_USERS_SHEET: ({ commit }, id) => {
		const fetchQuery = {
			url: 'users',
			method: 'POST',
			params: {
				user_id: id,
			},
		};

		commit('UPDATE_VALUES_USERS_SHEET', { id, loadingButton: true });

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'rejected_addusers') {
					return Promise.resolve(0);
				} else {
					console.log('user linked');

					commit('UPDATE_VALUES_USERS_SHEET', { id, friend: 1, loadingButton: false });
					commit('RESET_INACTIVE_USERS_SHEET');
					return Promise.resolve(1);
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

	UNLINK_USERS_SHEET: ({ commit }, id) => {
		const fetchQuery = {
			url: 'users',
			method: 'DELETE',
			params: {
				user_id: id,
			},
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'rejected_deleteusers') {
					return Promise.resolve(0);
				} else {
					console.log('user unlinked');

					commit('REMOVE_VALUES_USERS_SHEET', { id });
					commit('RESET_INACTIVE_USERS_SHEET');
					return Promise.resolve(1);
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

	/* -------------------------------------GROUPS SHEET action------------------------------------- */

	FETCH_GROUPS_SHEET: ({ commit, state }) => {
		const activeSheet = state.activeGroupsSheet.sheet;
		const searchText = state[activeSheet].searchText;
		const fetchQuery = {
			url: 'groups',
			method: 'GET',
			params: {
				like: searchText,
				whose: state.activeGroupsSheet.whose,
			},
			headers: {
				limit: state[activeSheet].limit,
				offset: state[activeSheet].offset,
				partid: ++groupPartID,
			},
		};

		const condition = state.activeGroupsSheet.condition;
		for (let i = 0; i < condition.length; i++) {
			switch (condition[i]) {
				case 'user_id':
					fetchQuery.params.user_id = state.theUser.id;
					break;
				case 'group_id':
					fetchQuery.url += `/${state.theGroup.id}`;
					break;
				default:
					break;
			}
		}

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(0);
				} else {
					console.log(`actions partID: srv-${dataFromSrv.partid} glb-${groupPartID}`);

					commit('SET_GROUPS_SHEET', dataFromSrv.data);
					return Promise.resolve(dataFromSrv.data.length);
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

	FETCH_SUBGROUPS: ({ commit, state }, group_id) => {
		const activeSheet = state.activeGroupsSheet.sheet;
		const searchText = state[activeSheet].searchText;
		const fetchQuery = {
			url: 'groups',
			method: 'GET',
			params: {
				like: searchText,
				whose: 'group',
			},
		};

		fetchQuery.url += `/${group_id}`;

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(0);
				} else {
					commit('SET_SUBGROUPS', dataFromSrv.data);
					return Promise.resolve(dataFromSrv.data.length);
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

	LINK_GROUPS_SHEET: ({ commit }, id) => {
		const fetchQuery = {
			url: 'groups',
			method: 'POST',
			params: {
				group_id: id,
			},
		};

		commit('UPDATE_VALUES_GROUPS_SHEET', { id, loadingButton: true });

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'rejected_linkgroups') {
					return Promise.resolve(0);
				} else {
					console.log('group linked');

					commit('UPDATE_VALUES_GROUPS_SHEET', { id, friend: 1, loadingButton: false });
					commit('RESET_INACTIVE_GROUPS_SHEET');
					return Promise.resolve(1);
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

	UNLINK_GROUPS_SHEET: ({ commit }, id) => {
		const fetchQuery = {
			url: 'groups',
			method: 'DELETE',
			params: {
				group_id: id,
			},
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'rejected_unlinkgroups') {
					return Promise.resolve(0);
				} else {
					console.log('group unlinked');

					commit('REMOVE_VALUES_GROUPS_SHEET', { id });
					commit('RESET_INACTIVE_GROUPS_SHEET');
					return Promise.resolve(1);
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

	/* -------------------------------------TASKS SHEET action-------------------------------------- */

	FETCH_TASKS: ({ commit, state }, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);

		let isRefresh = false;
		if (Object.prototype.hasOwnProperty.call(options, 'refresh') && options.refresh) {
			activeSheet.limit = 10;
			activeSheet.offset = 0;
			isRefresh = true;
		}

		const fetchQuery = {
			url: 'tasks',
			method: 'GET',
			params: { limit: activeSheet.limit, offset: activeSheet.offset },
		};

		// apply global condition
		Object.keys(activeSheet.condition).forEach(key => {
			if (activeSheet.condition[key] !== null) {
				switch (key) {
					case 'group_id':
						fetchQuery.params.group_id = activeSheet.condition[key];
						break;
					case 'userId':
						fetchQuery.params.userId = activeSheet.condition[key];
						break;
					case 'parent_id':
						fetchQuery.params.parent_id = activeSheet.condition[key];
						break;
					case 'task_id':
						fetchQuery.params.task_id = activeSheet.condition[key];
						break;
					case 'like':
						fetchQuery.params.like = activeSheet[key];
						break;
					default:
						break;
				}
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
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(0);
				} else {
					console.log(`actions partID: srv-${dataFromSrv.partid} glb-${taskPartID}`);
					commit('SET_TASKS', {
						sheet_id: options.sheet_id,
						refresh: isRefresh,
						data: dataFromSrv.data,
					});
					return Promise.resolve(dataFromSrv.data.length);
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

	/** Создание нового элемента в списке sheet принадлежащему множеству списков sheets по sheet_id
	 * обязательные входящие опции: options = { sheet_id:string, isSubelement:bool, isStart:bool }
	 */
	CREATE_ELEMENT: ({ commit, state }, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const thisSheet = activeSheet.sheet;

		let group_id;
		let parent_id = 0;

		/* Определим, что добавляется элемент или субэлемент */
		if (options.isSubelement) {
			const activeElement = recursiveFind(thisSheet, el => el.isActive).element;
			if (activeElement) {
				if (activeElement.level < 3) {
					parent_id = activeElement.task_id;
					group_id = activeElement.group_id;
				} else {
					return Promise.reject(new Error({ message: 'Maximum is 3 levels' }));
				}
			} else {
				return Promise.reject(new Error({ message: 'To add an unselected item' }));
			}
		} else {
			if (thisSheet.length > 0) {
				group_id = thisSheet[0].group_id;
			} else {
				/* Если список элементов пуст, найдем primary group в которую по-умолчанию добавим элемент */
				group_id = state.mainGroups.find(el => el.group_type === 1).id;
			}
		}

		const fetchQuery = {
			url: 'tasks',
			method: 'POST',
			data: qs.stringify({
				group_id,
				parent_id,
				start: new Date().toISOString(),
				isStart: options.isStart,
			}),
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(0);
				} else {
					console.log(`Actions add item recieve datas:`);

					commit('SET_TASKS', {
						sheet_id: options.sheet_id,
						data: dataFromSrv.data,
						isStart: options.isStart,
					});
					return Promise.resolve(dataFromSrv.data.length);
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

	/** Удаление текущего элемента в списке sheet принадлежащему множеству списков sheets по sheet_id
	 * обязательные входящие опции: options = { sheet_id:string }
	 */
	DELETE_ELEMENT: ({ commit, state }, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const thisSheet = activeSheet.sheet;

		let task_id = null;
		let group_id = null;

		const activeElement = recursiveFind(thisSheet, el => el.isActive).element;
		if (activeElement) {
			if (activeElement.havechild) {
				return Promise.reject(
					new Error({ message: 'I can not delete an element containing other elements' }),
				);
			}

			task_id = activeElement.task_id;
			group_id = activeElement.group_id;
		} else {
			return Promise.resolve('No item selected for deletion');
		}

		const fetchQuery = {
			url: 'tasks',
			method: 'DELETE',
			data: qs.stringify({
				task_id,
				group_id,
			}),
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					commit('DELETE_TASK', { sheet_id: options.sheet_id, task_id });
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

	/** Перемещение элементов в списке sheet принадлежащему множеству списков sheets по sheet_id
	 * обязательные входящие опции: options = {	oldIndex,	newIndex,	fromParent,	toParent,	sheet_id }
	 * Эта action - функция меняет позицию на клиенте и на сервере по различным правилам:
	 * - на клиенте список древовидной структуры, а на сервере плоский - поэтому индексация разная
	 * - на клиенте в списке присутствуют dividers, которые делят список на группы, на сервере нет
	 * dividers индексация не совпадает, только порядок следования в разрезе группы
	 * - порядок следования на сервере задается следованием групп в порядке возрастания id-группы
	 * (т.е. порядка создания) и соотношением чисел p/q которое задает порядок внутри этой группы
	 * - клиент ориентирует положение элемента относительно idx, сервер относительно id элементов
	 * */
	REORDER_TASKS: ({ commit, state }, options) => {
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const taskSheet = activeSheet.sheet;
		// if (options.fromParent_id === 0) options.fromParent_id = null;
		// if (options.toParent_id === 0) options.toParent_id = null;

		let fromTask;
		let toTask;
		let fromParent;
		let toParent;
		let newGroupId;
		let isBefore = options.oldIndex > options.newIndex;

		if (options.fromParent_id === null) {
			fromTask = taskSheet[options.oldIndex];
		} else {
			fromParent = recursiveFind(taskSheet, el => el.task_id === options.fromParent_id).element;
			fromTask = fromParent.children[options.oldIndex];
		}
		fromTask.consistency = 1;

		if (options.toParent_id === null) {
			if (taskSheet.length === options.newIndex) {
				toTask = taskSheet[options.newIndex - 1];
				newGroupId = toTask.group_id;
				toTask = null;
				isBefore = true;
			} else {
				toTask = taskSheet[options.newIndex];
				if (toTask.isDivider) {
					newGroupId = toTask.group_id;
					if (options.newIndex === 0) {
						toTask = null;
						isBefore = false;
					} else {
						// Если элемент перемещается выше своей позиции, иначе ниже
						if (options.oldIndex > options.newIndex) {
							toTask = taskSheet[options.newIndex - 1];
							newGroupId = toTask.group_id;
							isBefore = false;
						} else {
							if (taskSheet.length > options.newIndex + 1) {
								isBefore = true;
								toTask = taskSheet[options.newIndex + 1];
							} else {
								// Достигнут конец списка
								toTask = null;
							}
						}
					}
				}
			}
		} else {
			toParent = recursiveFind(taskSheet, el => el.task_id === options.toParent_id).element;
			if (!toParent.children || toParent.children.length === 0) {
				toTask = null;
				newGroupId = fromTask.group_id;
			} else {
				if (toParent.children.length === options.newIndex) {
					toTask = toParent.children[options.newIndex - 1];
				} else {
					toTask = toParent.children[options.newIndex];
				}

				if (
					(fromTask.parent === null && toTask.parent !== null) ||
					(fromTask.parent !== null && toTask.parent === null)
				) {
					newGroupId = fromTask.group_id;
				} else {
					newGroupId = toTask.group_id;
				}
			}
		}

		/* Проверка на перемещение элемента внутри родителя за пределы своей группы
			т.к. вложенные элементы не содержат divider разделение по группам идёт только
			в порядке сортировки элементов */
		if (toTask !== null) {
			if (fromTask.parent !== null && toTask.parent !== null && fromTask.parent === toTask.parent) {
				if (fromTask.group_id !== toTask.group_id) {
					fromTask.consistency = 0;
					return Promise.resolve(false);
				}
			}
		}

		// Определим куда переместить задачау (до или после) при перемещении между разными родителями
		if (toTask !== null && options.toParent_id !== options.fromParent_id) {
			if (fromTask.parent !== null && fromTask.parent === toTask) {
				isBefore = true;
			} else {
				if (toTask.parent === null) {
					// Если до новой позиции сразу стоит разделитель группы, то ставим на позицию выше
					isBefore = true;
				} else {
					isBefore = !(options.newIndex === toParent.children.length);
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
				toTask = fromTask.parent;
				isBefore = false;
				newGroupId = fromTask.parent.group_id;
			}
		}

		/* Серверу всегда необходимо передавать в запрос id группы новой позиции элемента */
		if (newGroupId === undefined) {
			newGroupId = toTask.group_id;
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
			data: qs.stringify({
				group_id: newGroupId,
				task_id: fromTask.task_id,
				position: toTask === null ? null : toTask.task_id,
				isBefore,
				start: new Date().toISOString(),
				parent_id: toParent === undefined ? 0 : toParent.task_id,
			}),
		};

		function recalculationDepth(el, level) {
			let res = 0;
			el.level = level;

			if (el.children && el.children.length > 0) {
				for (let i = 0; i < el.children.length; i++) {
					let locRes = recalculationDepth(el.children[i], level + 1);
					if (locRes > res) {
						res = locRes;
					}
				}
			} else {
				res = level;
			}

			if (res) el.depth = res - level + 1;

			return res;
		}

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					let movedItem;

					if (options.fromParent_id === null) {
						movedItem = taskSheet.splice(options.oldIndex, 1)[0];
					} else {
						movedItem = fromParent.children.splice(options.oldIndex, 1)[0];
						fromParent.havechild--;
					}

					if (movedItem) movedItem.isShowed = true;

					if (options.toParent_id === null) {
						taskSheet.splice(options.newIndex === 0 ? 1 : options.newIndex, 0, movedItem);
					} else {
						if (!toParent.children) {
							Vue.set(toParent, 'children', []);
							Vue.set(toParent.children, 0, movedItem);
						} else if (toParent.children.length === options.newIndex) {
							if (toParent.children.length > 0) {
								toParent.children.splice(options.newIndex, 0, movedItem);
							} else {
								toParent.children.splice(0, 0, movedItem);
							}
						} else {
							if (
								toParent.children[options.newIndex > 0 ? options.newIndex - 1 : options.newIndex]
									.group_id === movedItem.group_id
							) {
								toParent.children.splice(options.newIndex, 0, movedItem);
							} else {
								toParent.children.splice(0, 0, movedItem);
							}
						}

						toParent.havechild++;
						toParent.isSubtaskExpanded = 2;
					}

					// eslint-disable-next-line
					movedItem.parent = toParent ? toParent : null;

					let tempParent;
					let tempParentTwo;

					if (fromParent) {
						tempParent = fromParent;
						while (tempParent.parent) {
							tempParent = tempParent.parent;
						}

						if (tempParent) {
							recalculationDepth(tempParent, 1, 0);
						}
					}

					// eslint-disable-next-line
					tempParentTwo = toParent ? toParent : movedItem;
					while (tempParentTwo.parent) {
						tempParentTwo = tempParentTwo.parent;
					}

					if (tempParentTwo) {
						recalculationDepth(tempParentTwo, 1, 0);
					} else {
						recalculationDepth(movedItem, 1, 0);
					}

					// изменение значения группы на новую группу, если она задана
					if (newGroupId !== undefined) {
						commit('UPDATE_TASK_VALUES', {
							sheet_id: options.sheet_id,
							task_id: movedItem.task_id,
							group_id: newGroupId,
						});
						if (dataFromSrv.activity_data) {
							commit('SET_ACTIVITY', {
								sheet_id: options.sheet_id,
								task_id: movedItem.task_id,
								data: dataFromSrv.activity_data,
							});
						}
					}

					movedItem.consistency = 0;
					return Promise.resolve(true);
				}
			})
			.catch(err => {
				fromTask.consistency = 2;

				if (err.response.data) {
					commit('API_ERROR', { message: err.message, data: err.response.data });
					return Promise.reject(new Error({ message: err.message, data: err.response.data }));
				} else {
					commit('API_ERROR', { message: err.message, data: null });
					return Promise.reject(new Error({ message: err.message, data: null }));
				}
			});
	},

	/** options = { sheet_id, task_id, group_id } */
	UPDATE_TASK_GROUP: ({ commit, state }, options) => {
		let activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let taskSheet = activeSheet.sheet;
		let element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element;

		element.consistency = 1;

		const fetchQuery = {
			url: 'tasks/order',
			method: 'PUT',
			data: qs.stringify({
				group_id: options.group_id,
				task_id: element.task_id,
				position: null,
				isBefore: false,
				start: new Date().toISOString(),
				parent_id: element.parent ? element.parent.task_id : null,
			}),
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					let idxGroup = -1;
					let idxTask = -1;
					let movedItem;

					/* Для элементов первого уровня существуют разделы групп с задачами,
					 перемещение происходит по этим разделам
					 Для уровней ниже применяется распределение по группам без разделов */
					if (element.level === 1) {
						/* Необходимо найти divider он будет являться началом размещения задачи в новой группе */
						idxTask = taskSheet.findIndex(el => el.task_id === options.task_id);
						movedItem = taskSheet.splice(idxTask, 1)[0];

						idxGroup = taskSheet.findIndex(el => el.group_id === options.group_id && el.isDivider);
						if (idxGroup === -1) {
							const group = findGroup(state.mainGroups, options.group_id);
							// Такой разделитель не найден, значит необходимо создать новый
							idxGroup = taskSheet.push({
								isDivider: true,
								group_id: options.group_id,
								name: group.name,
								isActive: false,
							});
						}
						idxGroup++;

						taskSheet.splice(idxGroup, 0, movedItem);
					} else {
						/* Для элементов последующих уровней необходимо найти самый первый элемент
						 принадлежащий искомой группе и поместить нашу задачу выше этого элемента */
						idxTask = element.parent.children.findIndex(el => el.task_id === options.task_id);
						movedItem = element.parent.children.splice(idxTask, 1)[0];

						idxGroup = element.parent.children.findIndex(el => el.group_id === options.group_id);
						idxGroup = idxGroup === -1 || idxGroup === 0 ? 0 : idxGroup--;

						element.parent.children.splice(idxGroup, 0, movedItem);
					}

					// изменение значения группы на новую группу
					commit('UPDATE_TASK_VALUES', {
						sheet_id: options.sheet_id,
						task_id: movedItem.task_id,
						group_id: options.group_id,
					});
					commit('SET_ACTIVITY', {
						sheet_id: options.sheet_id,
						task_id: movedItem.task_id,
						data: dataFromSrv.activity_data,
					});

					movedItem.consistency = 0;
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

	/** options = { sheet_id, task_id, ...values } */
	UPDATE_TASK_VALUES: ({ commit, state }, options) => {
		let activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let taskSheet = activeSheet.sheet;
		let element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element;
		let values = {
			task_id: options.task_id,
		};

		element.consistency = 1;

		Object.keys(options).forEach(key => {
			if (key !== 'task_id' && key !== 'sheet_id') {
				if (Object.prototype.hasOwnProperty.call(element, key)) {
					values[key] = options[key];
					element[key] = options[key];
				}
			}
		});

		const fetchQuery = {
			url: 'tasks',
			method: 'PUT',
			data: querystring.stringify(values),
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				} else {
					// изменение значения группы на новую группу
					// commit('UPDATE_TASK_VALUES', options)

					element.consistency = 0;
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

	ADD_TASK_CONTEXT: ({ commit, state }, options) => {
		let activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let taskSheet = activeSheet.sheet;
		let element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element;
		let values = {
			task_id: options.task_id,
		};

		element.consistency = 1;

		if ('context_id' in options) {
			values.context_id = options.context_id;
		}

		if ('context_value' in options) {
			values.context_value = options.context_value;
		}

		const fetchQuery = {
			url: 'contexts',
			method: 'POST',
			data: querystring.stringify(values),
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
		let element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element;
		let values = {
			task_id: options.task_id,
		};

		element.consistency = 1;

		if ('context_id' in options) {
			values.context_id = options.context_id;
		}

		const fetchQuery = {
			url: 'contexts',
			method: 'DELETE',
			data: querystring.stringify(values),
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
		let activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		let taskSheet = activeSheet.sheet;
		let element = recursiveFind(taskSheet, el => el.task_id === options.task_id).element;

		if (!element) return Promise.reject(new Error({ message: 'task element not found' }));
		element.consistency = 1;

		const fetchQuery = {
			url: 'activity',
			method: 'GET',
			params: { task_id: element.task_id, type_el: 2, limit: 100, offset: 0 },
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(null);
				} else {
					element.consistency = 0;
					commit('SET_ACTIVITY', { sheet_id: options.sheet_id, data: dataFromSrv.data });
					return Promise.resolve(dataFromSrv.data.length);
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

	/**
	 * @func CREATE_ACTIVITY_ELEMENT
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
	CREATE_ACTIVITY_ELEMENT: ({ commit, state }, options) => {
		// Получим элемент задачи относительно которой добавляется активность
		const activeSheet = state.sheets.find(el => el.sheet_id === options.sheet_id);
		const thisSheet = activeSheet.sheet;
		const activeElement = recursiveFind(thisSheet, el => el.task_id === options.task_id).element;

		let status;
		let start;
		let group_id = activeElement.group_id;

		activeElement.consistency = 1;

		// Определим меняется ли статус задачи или это обычное добавление активности
		// Т.к. статус должен обязательно включать время смены, то заранее его зададим
		if (Object.prototype.hasOwnProperty.call(options, 'status')) {
			status = options.status;
			start = new Date().toISOString();
		}

		// Убедимся не было ли передано иное время смены, отличное от автоматического
		if (Object.prototype.hasOwnProperty.call(options, 'start')) {
			start = options.start;
		}

		const fetchQuery = {
			url: 'activity',
			method: 'POST',
			data: qs.stringify({
				group_id,
				type_el: 2,
				task_id: activeElement.task_id,
				start,
				status,
			}),
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(null);
				} else {
					activeElement.consistency = 0;
					commit('SET_ACTIVITY', {
						sheet_id: options.sheet_id,
						task_id: options.task_id,
						data: dataFromSrv.data,
					});
					return Promise.resolve(dataFromSrv.data.length);
				}
			})
			.catch(err => {
				activeElement.consistency = 2;

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
	 * @func UPDATE_SHEETS_VALUES
	 * @param { VUEX action parametres: Object }
	 * @param { { id, field, value }: Object } - options
	 * @returns { function(...args): Promise }
	 * @description Функция для обновление элементов в списке
	 */
	UPDATE_SHEETS_VALUES: ({ commit, dispatch }, options) => {
		const values = {
			id: options.id,
		};

		values[options.field] = options.value;

		const fetchQuery = {
			url: 'sheets',
			method: 'PUT',
			data: qs.stringify(values),
		};

		return fetchSrv(fetchQuery, commit)
			.then(dataFromSrv => {
				if (dataFromSrv.code && dataFromSrv.code === 'no_datas') {
					return Promise.resolve(false);
				}

				commit('UPDATE_SHEETS_VALUES', dataFromSrv.data);

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
			url: 'sheets',
			method: 'POST',
			data: querystring.stringify(values),
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
			url: 'sheets',
			method: 'DELETE',
			data: qs.stringify({
				id: options.id,
			}),
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

							dispatch('FETCH_TASKS', { sheet_id: thisSheet.sheet_id, refresh: true })
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
	},
};
