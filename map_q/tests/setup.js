export function installUniStorage() {
  const store = new Map()
  globalThis.uni = {
    getStorageSync(key) {
      return store.get(key)
    },
    setStorageSync(key, value) {
      store.set(key, value)
    },
    removeStorageSync(key) {
      store.delete(key)
    }
  }
  return store
}
