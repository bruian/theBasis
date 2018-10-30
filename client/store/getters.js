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

	// conditionValues: state => condition => {
	// 	let values

	// 	if (condition) {
	// 		switch (condition) {
	// 			case 'id':
	// 				values = state.mainUser.id
	// 				break
	// 			case 'user_id':
	// 				values = state.user.id
	// 				break
	// 			case 'group_id':
	// 				values = state.group.id
	// 				break
	// 		}
	// 	}

	// 	return values
	// },

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
