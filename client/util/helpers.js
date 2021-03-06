/* Функция объединяет массив прикладных элементов с массивом настроек
	к каждому прикладному элементу добавляются значения его настроек отображения
*/
export function getElements(arr, sheets, cb) {
	let result = [];

	for (let i = 0; i < arr.length; i++) {
		const sheet = sheets.sh.find(x => x.el.id === arr[i].id);

		if (sheet) {
			if (cb(arr[i], sheet, sheets)) {
				result.push(Object.assign({}, arr[i], sheet));
			}

			if (Object.prototype.hasOwnProperty.call(arr[i], 'children') && arr[i].children.length > 0) {
				result[result.length - 1].children = getElements(arr[i].children, sheets, cb);
			}
		}
	}

	return result;
}

export function recursiveFind(arr, cb) {
	let result = {
		index: null,
		element: null
	};

	for (let i = 0; i < arr.length; i++) {
		if (cb(arr[i])) {
			result.index = i;
			result.element = arr[i];
		} else if (arr[i].children && arr[i].children.length > 0) {
			result = recursiveFind(arr[i].children, cb);
		}

		if (result.element) break;
	}

	return result;
}

export function isNumeric(n) {
	// eslint-disable-next-line
	return !isNaN(parseFloat(n)) && isFinite(n);
}

export function recursiveSet(sheet, key, value) {
	for (let i = 0; i < sheet.length; i++) {
		if (Object.prototype.hasOwnProperty.call(sheet[i], key)) {
			sheet[i][key] = value;
		}

		if (sheet[i].children && sheet[i].children.length > 0) {
			recursiveSet(sheet[i].children, key, value);
		}
	}
}

export function findGroup(grp, id) {
	let result;

	for (let i = 0; i < grp.length; i++) {
		if (grp[i].children && grp[i].children.length > 0) {
			if (grp[i].id === id) {
				result = grp[i];
			} else {
				result = findGroup(grp[i].children, id);
			}
		} else {
			if (grp[i].id === id) {
				result = grp[i];
			}
		}

		if (result) break;
	}

	return result;
}

/** Return tree depth
 *(Top) - depth 1
 *    (Child) - depth 2
 *    (Child) - depth 2
 *          (Child) - depth 3
 *return 3
 *---- OR ----
 *(Child) - depth 1
 *      (Child) - depth 2
 *return 2
 */
export function treeDepth(tree) {
	let depth = 1;
	let childrenDepth = 0;

	if (tree.children && tree.children.length) {
		for (let i = 0; i < tree.children.length; i++) {
			let stepDepth = treeDepth(tree.children);
			if (stepDepth > childrenDepth) childrenDepth = stepDepth;
		}
	}

	return depth + childrenDepth;
}

/* Return string constants from binary value
	type_el: (aka widget max 16 widgets 2^15)
		1  - divider		0000001
		2  - activity		0000010
		4  - task				0000100
		8  - groups			0001000
		16 - users			0010000
		32 - post-notes	0100000
		64 - images			1000000
*/
export function typeForSheet(value) {
	if (value & 2) {
		return { type_el: 'activity-sheet', icon: 'A' };
	}

	if (value & 4) {
		return { type_el: 'tasks-sheet', icon: 'T' };
	}

	if (value & 8) {
		return { type_el: 'groups-sheet', icon: 'G' };
	}

	if (value & 16) {
		return { type_el: 'users-sheet', icon: 'U' };
	}

	if (value & 32) {
		return { type_el: 'posts-sheet', icon: 'P' };
	}

	if (value & 64) {
		return { type_el: 'images-sheet', icon: 'I' };
	}

	return undefined;
}

export function sheetNameForType(value) {
	switch (value) {
		case 'activity-sheet':
			return 2;
		case 'tasks-sheet':
			return 4;
		case 'groups-sheet':
			return 8;
		case 'users-sheet':
			return 16;
		case 'posts-sheet':
			return 32;
		case 'images-sheet':
			return 64;
		default:
			return undefined;
	}
}

export function typeForLayout(value) {
	if (value & 2) {
		return 'manage-sheet';
	}

	if (value & 4) {
		return 'property-sheet';
	}

	if (value & 8) {
		return 'list-sheet';
	}

	return undefined;
}

export function layoutNameForType(value) {
	switch (value) {
		case 'manage-sheet':
			return 2;
		case 'property-sheet':
			return 4;
		case 'list-sheet':
			return 8;
		default:
			return undefined;
	}
}

/**
 *	Get sheets_conditions
 * condition:
 *	1 - group_id
 *	2 - user_id
 *	3 - parent_id
 *	4 - task_id
 *	... others
 */
export function conditionsForSheet(conditions, values) {
	const result = {
		group_id: null,
		userId: null,
		parent_id: null,
		task_id: null
	};

	for (let i = 0; i < conditions.length; i++) {
		if (values.length > 0) {
			switch (conditions[i]) {
				case 1:
					result.group_id = JSON.parse(values[i]);
					break;
				case 2:
					result.userId = JSON.parse(values[i]);
					break;
				case 3:
					result.parent_id = JSON.parse(values[i]);
					break;
				case 4:
					result.task_id = JSON.parse(values[i]);
					break;
				default:
					break;
			}
		}
	}

	return result;
}

export function visionsForSheet(visions, values) {
	const result = {
		activityStatus: {
			Assigned: true,
			Started: true,
			Completed: true,
			Suspended: true,
			Canceled: true,
			Continued: true,
			Removed: true
		}
	};

	for (let i = 0; i < visions.length; i++) {
		if (values.length > 0) {
			switch (visions[i]) {
				case 1:
					result.activityStatus = JSON.parse(values[i], (key, value) => {
						if (key === '') {
							return value;
						}
						return value === 'true';
					});
					break;
				default:
					break;
			}
		}
	}

	return result;
}

/**
 * Статусы активностей, иконки из MaterialDesign и разрешенные
 * действия относительно выбранного статуса
 */
export const activityStatus = [
	{
		name: 'Assigned', // Назначено - 0
		action: 'Assign', // Назначить
		icon: 'queue',
		allowedActions: [1, 4]
	},
	{
		name: 'Started', // Начато - 1
		action: 'Start', // Начать
		icon: 'play_circle_filled',
		allowedActions: [3, 2, 4]
	},
	{
		name: 'Completed', // Завершено - 2
		action: 'Complete', // Завершить
		icon: 'done',
		allowedActions: [0]
	},
	{
		name: 'Suspended', // Приостановлено - 3
		action: 'Suspend', // Приостановить
		icon: 'pause',
		allowedActions: [5, 2, 4]
	},
	{
		name: 'Canceled', // Отменено - 4
		action: 'Cancel', // Отклонить
		icon: 'cancel',
		allowedActions: [0]
	},
	{
		name: 'Continued', // Продолжено - 5
		action: 'Continue', // Продолжить
		icon: 'play_arrow',
		allowedActions: [3, 2, 4]
	},
	{
		name: 'Removed', // Удалено - 6
		action: 'Remove', // Удалить
		icon: 'delete',
		allowedActions: []
	}
];
