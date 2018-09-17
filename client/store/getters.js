export default {
	//*** Authentication getters */
	isAuth: state => !!state.auth.token,
	authStatus: state => state.auth.status,
	user: state => state.user,

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
