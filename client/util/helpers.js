export function recursiveFind(list, cb) {
	let result

	for (let i = 0; i < list.length; i++) {
		if (cb(list[i])) {
			result = list[i]
		} else if (list[i].children && list[i].children.length > 0) {
			result = recursiveFind(list[i].children, cb)
		}

		if (result) break
	}

	return result
}

export function recursiveSet(list, key, value) {
	for (let i = 0; i < list.length; i++) {
		if (list[i].hasOwnProperty(key)) {
			list[i][key] = value
		}

		if (list[i].children && list[i].children.length > 0) {
			recursiveSet(list[i].children, key, value)
		}
	}
}

export function findGroup(mainGroups, id) {
	let result

	for (let i = 0; i < mainGroups.length; i++) {
		if (mainGroups[i].children && mainGroups[i].children.length > 0) {
			if (mainGroups[i].id === id) {
				result = mainGroups[i]
			} else {
				result = findGroup(mainGroups[i].children, id)
			}
		} else {
			if (mainGroups[i].id === id) {
				result = mainGroups[i]
			}
		}

		if (result) break
	}

	return result
}

/*** Return tree depth
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
	let depth = 1

	if (tree.children && tree.children.length) {
		let childrenDepth = 0
		for (let i = 0; i < tree.children.length; i++) {
			let stepDepth = treeDepth(tree.children)
			if (stepDepth > childrenDepth) childrenDepth = stepDepth
		}
	}

	return depth + childrenDepth
}