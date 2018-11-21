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

	tasksList (state) {
		return state[state.activeTasksList.list].list
	},

	context: state => id => {
		//debugger
		const context = state[state.activeTasksList.list].context
		const foundContext = context.find(el => el.id === id)
		if (foundContext) {
			return foundContext.tags
		} else {
			return []
		}
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
