let originalItems = []

export function syncH5TabOverlay(open) {
  if (typeof document === 'undefined') return
  if (open && !document.body.classList.contains('creation-overlay-open')) {
    originalItems = Array.from(document.querySelectorAll('.uni-tabbar__item')).map(element => {
      const rect = element.getBoundingClientRect()
      const cssText = element.style.cssText
      return { element, cssText, rect }
    })
    originalItems.forEach(({ element, rect }) => {
      Object.assign(element.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' })
    })
  }
  document.body.classList.toggle('creation-overlay-open', Boolean(open))
  if (!open) {
    originalItems.forEach(({ element, cssText }) => { element.style.cssText = cssText })
    originalItems = []
  }
}
