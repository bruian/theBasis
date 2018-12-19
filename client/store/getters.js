
export default {
	//*** Authentication getters */
	isAuth: state => !!state.auth.token,
	apiStatus: state => state.apiStatus,
	token: state => state.auth.token,
	user: state => state.theUser,

	usersList (state) {
		return state[state.activeUsersList.list].list
	},

	groupsList (state) {
		return state[state.activeGroupsList.list].list
	},

	tasksList: state => list_id => {
		// const currentList = state.listOfList.find(el => el.list_id === list_id).list
		// return (currentList) ? currentList.list : []
		return state.listOfList.find(el => el.list_id === list_id).list
	},

	contextByExistingTag: state => (index) => {
		return state.mainContexts.find(el => el.value === state.mainExistingContexts[index])
	},

	contextByValue: state => (value, task_id) => {
		return state.mainContexts.find(el => el.value === value && el.task_id === task_id)
	},

	taskByIndex: state => obj => {
		const currentList = state.listOfList.find(el => el.list_id === obj.list_id).list
		return currentList[obj.index]
	},

	groupById: state => id => {
		function findGroup(mainGroups) {
			let result

			for (let i = 0; i < mainGroups.length; i++) {
				if (mainGroups[i].children && mainGroups[i].children.length > 0) {
					result = findGroup(mainGroups[i].children)
				} else {
					if (mainGroups[i].id === id) {
						result = mainGroups[i]
					}
				}

				if (result) break
			}

			return result
		}

		return findGroup(state.mainGroups)
	},

	// ids of the items that should be currently displayed based on
  // current list type and current pagination
  activeIds (state) {
    const { activeType, itemsPerPage, lists } = state

    if (!activeType) {
      return []
    }

    const page = Number(state.route.params.page) || 1
    const start = (page - 1) * itemsPerPage
    const end = page * itemsPerPage

    return lists[activeType].slice(start, end)
  },

  // items that should be currently displayed.
  // this Array may not be fully fetched.
  activeItems (state, getters) {
    return getters.activeIds.map(id => state.items[id]).filter(_ => _)
  },

  activeTgmUserItems (state, getters) {
    //return getters.activeIds.map(id => state.theItems[id])
    return getters.activeIds.map(id => state.theItems.find(el => el.id == id)).filter(_ => _)
  }
}
