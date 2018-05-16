import {
  fetchUser,
  fetchItems,
  fetchIdsByType
} from '../api'

import config from '../config'

const logRequests = !!config.DEBUG_API

const DBTgmUsers = [
  { 
    id: '0',
    username: 'Add telegram user',
    phonenumber: '',
    api_id: '',
    api_hash: '',
    app_title: '',
    testConfiguration: '',
    prodConfiguration: '',
    rsaPublicKey: '',
    publicKeys: ''
  },
  { 
    id: '1',
    username: '@Bruian',
    phonenumber: '+79059765151',
    api_id: '210118',
    api_hash: 'b3152203114a2c22224d6121b4fdca00',
    app_title: 'Teleprox',
    testConfiguration: '140.154.167.40:443',
    prodConfiguration: '140.154.167.50:443',
    rsaPublicKey: `-----BEGIN RSA PUBLIC KEY-----
    MIIBCgKCAQEAwVACPi9w23mF3tBkdZz+zwrzKOaaQdr01vAbU4E1pvkfj4sqDsm6
    lyDONSe89sxoD/xCS9Y0hkkC3gtL1tSfTlgCMOOul9lcixlEKzwKENj1Yz/s7daS
    an9tqwsbfUV/nqgbhGX81v/+7RFAEd+RwFnK7a+XYl9sluzHRyVVaTTveB2GazTw
    Efzk2DWgkBfuml8OREmvfra13bkHZJTKX4EQSjBbbdJ2ZXIsRrYOXfaA+xayEGB+
    8hdlLmAjbC3faigxX0CDqWeR1yFL9kwd9P0NsZRPsmoqVwMbMu7mStFai6aIhc3n
    Slv8kg9qv1m6XHVQY3PnEw2QQtqSIXklHwIDAQAB
    -----END RSA PUBLIC KEY-----`,
    publicKeys: ''
  },
  {
    id: '2',
    username: '@Masya',
    phonenumber: '+79059765454',
    api_id: '210109',
    api_hash: 'b3659223121a2c22254d61e1b6fdca00',
    app_title: 'TeleMasya',
    testConfiguration: '149.155.177.40:443',
    prodConfiguration: '149.155.157.50:443',
    rsaPublicKey: '',
    publicKeys: ''
  }
]

const idss = ['0', '1', '2']

function fetch(child) {
  logRequests && console.log(`fetching ${child}...`)
  return new Promise((resolve, reject) => {
    const val = DBTgmUsers.find((element, index, array) => {
      if (`item/${element.id}` == child) return true
    })
    
    if (val) {
      val.__lastUpdated = Date.now()
      logRequests && console.log(`fetched ${child}.`)
      resolve(val)
    } else {
      reject
    }
  })
}

function fetchTgmItem(id) {
  return fetch(`item/${id}`)
}

function fetchTgmUserIds() {
  return new Promise((resolve, reject) => {
    resolve(idss)
  })
}

function fetchTgmItems(ids) {
  return Promise.all(ids.map(id => fetchTgmItem(id)))
}

export default {
  FETCH_TGMUSER_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
    commit('SET_ACTIVE_TYPE', { type })
    return fetchTgmUserIds()
      .then(ids => commit('SET_LIST', { type, ids }))
      .then(() => dispatch('ENSURE_TGMUSER_ACTIVE_ITEMS'))
  },

  ENSURE_TGMUSER_ACTIVE_ITEMS: ({ dispatch, getters }) => {
    return dispatch('FETCH_TGMUSER_ITEMS', {
      ids: getters.activeIds
    })
  },

  FETCH_TGMUSER_ITEMS: ({ commit, state }, { ids }) => {
    const now = Date.now()
    ids = ids.filter(id => {
      const item = state.items[id]
      if (!item) {
        return true
      }
      if (now - item.__lastUpdated > 1000 * 60 * 3) {
        return true
      }
      return false
    })

    if (ids.length) {
      return fetchTgmItems(ids).then(items => commit('SET_ITEMS', { items }))
    } else {
      return Promise.resolve()
    }
  },

  ADD_TGMUSER_ITEM: ({ commit, state }, obj) => {
    debugger

    idss.push(idss.length.toString())
    obj.id = idss[idss.length - 1]

    commit('SET_LIST', { type: state.activeType, ids: idss })
    commit('SET_ITEM', obj)

    return true
  },

  DELETE_TGMUSER_ITEM: ({ commit, state }, item) => {
    debugger

    const idx = idss.find((element) => { return element == item.id })
    idss.splice(idx, 1)

    commit('SET_LIST', { type: state.activeType, ids: idss })
    commit('DELETE_ITEM', item)
  },

  // ensure data for rendering given list type
  FETCH_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
    commit('SET_ACTIVE_TYPE', { type })
    return fetchIdsByType(type)
      .then(ids => commit('SET_LIST', { type, ids }))
      .then(() => dispatch('ENSURE_ACTIVE_ITEMS'))
  },

  // ensure all active items are fetched
  ENSURE_ACTIVE_ITEMS: ({ dispatch, getters }) => {
    return dispatch('FETCH_ITEMS', {
      ids: getters.activeIds
    })
  },

  FETCH_ITEMS: ({ commit, state }, { ids }) => {
    // on the client, the store itself serves as a cache.
    // only fetch items that we do not already have, or has expired (3 minutes)
    const now = Date.now()
    ids = ids.filter(id => {
      const item = state.items[id]
      if (!item) {
        return true
      }
      if (now - item.__lastUpdated > 1000 * 60 * 3) {
        return true
      }
      return false
    })
    if (ids.length) {
      return fetchItems(ids).then(items => commit('SET_ITEMS', { items }))
    } else {
      return Promise.resolve()
    }
  },

  FETCH_USER: ({ commit, state }, { id }) => {
    return state.users[id]
      ? Promise.resolve(state.users[id])
      : fetchUser(id).then(user => commit('SET_USER', { id, user }))
  }
}
