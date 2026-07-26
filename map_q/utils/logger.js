export const logError = (error, context = '') => {
  const prefix = context ? `[${context}] ` : ''
  if (error && error.message) {
    console.error(`${prefix}${error.message}`, error)
  } else {
    console.error(`${prefix}`, error)
  }
}

export const logWarn = (msg, context = '') => {
  const prefix = context ? `[${context}] ` : ''
  console.warn(`${prefix}${msg}`)
}

export const safeTry = (fn, context = '', defaultValue = undefined) => {
  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      return result.catch((e) => {
        logError(e, context)
        return defaultValue
      })
    }
    return result
  } catch (e) {
    logError(e, context)
    return defaultValue
  }
}
