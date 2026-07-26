export const debounce = (fn, delay = 300) => {
  let timer = null
  const debounced = function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debounced
}

export const throttle = (fn, delay = 300) => {
  let lastTime = 0
  let timer = null
  const throttled = function(...args) {
    const now = Date.now()
    const remaining = delay - (now - lastTime)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return throttled
}
