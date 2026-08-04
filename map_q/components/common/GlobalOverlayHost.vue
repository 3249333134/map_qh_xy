<template>
  <view id="globalOverlayHost" class="global-overlay-host">
    <PublishOverlay :show="visible" @close="closeHandler" />
  </view>
</template>

<script>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import PublishOverlay from '../PublishOverlay.vue'

export default {
  name: 'GlobalOverlayHost',
  components: {
    PublishOverlay
  },
  setup() {
    const visible = ref(false)
    let _pollTimer = null
    const instance = getCurrentInstance()

    const _startPolling = () => {
      _stopPolling()
      _pollTimer = setInterval(() => {
        try {
          const app = getApp()
          if (app && app.globalData) {
            if (app.globalData.showPublishOverlay && !visible.value) {
              showHandler()
            } else if (!app.globalData.showPublishOverlay && visible.value) {
              hideHandler()
            }
          }
        } catch (e) {}
      }, 50)
    }

    const _stopPolling = () => {
      if (_pollTimer) {
        clearInterval(_pollTimer)
        _pollTimer = null
      }
    }

    const _syncTabBar = open => {
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        const tabBar = page?.getTabBar?.()
        if (tabBar?.setData) tabBar.setData({ publishOpen: Boolean(open) })
      } catch (e) {}
      try { uni.$emit(open ? 'publishOverlayOpened' : 'publishOverlayClosed') } catch (e) {}
    }

    const showHandler = () => {
      visible.value = true
      _syncTabBar(true)
      try {
        const app = getApp()
        if (app && app.globalData) app.globalData.showPublishOverlay = true
      } catch (e) {}
    }

    const hideHandler = () => {
      visible.value = false
      _syncTabBar(false)
      try {
        const app = getApp()
        if (app && app.globalData) app.globalData.showPublishOverlay = false
      } catch (e) {}
    }

    const closeHandler = () => {
      visible.value = false
      _syncTabBar(false)
      try {
        const app = getApp()
        if (app && app.globalData) app.globalData.showPublishOverlay = false
      } catch (e) {}
      try { uni.$emit('hidePublishOverlay') } catch (e2) {}
    }

    const onShowPublish = () => {
      showHandler()
    }

    const onHidePublish = () => {
      hideHandler()
    }

    onMounted(() => {
      try {
        const app = getApp()
        if (app) {
          app.globalData.__overlayHost = {
            showHandler,
            hideHandler
          }
        }
      } catch (e) {}
      try {
        const pages = getCurrentPages()
        const page = pages[pages.length - 1]
        if (page) {
          page.__overlayHost = {
            showHandler,
            hideHandler
          }
          if (page.$vm) {
            page.$vm.__overlayHost = {
              showHandler,
              hideHandler
            }
          }
        }
      } catch (e) {}
      try {
        const app = getApp()
        if (app && app.globalData && app.globalData.showPublishOverlay) {
          visible.value = true
        }
      } catch (e2) {}
      try { uni.$on('showPublishOverlay', onShowPublish) } catch (e) {}
      try { uni.$on('hidePublishOverlay', onHidePublish) } catch (e) {}
      _startPolling()
    })

    onUnmounted(() => {
      _stopPolling()
      try {
        const app = getApp()
        if (app && app.globalData && app.globalData.__overlayHost) {
          app.globalData.__overlayHost = null
        }
      } catch (e) {}
      try { uni.$off('showPublishOverlay', onShowPublish) } catch (e) {}
      try { uni.$off('hidePublishOverlay', onHidePublish) } catch (e) {}
    })

    return {
      visible,
      showHandler,
      hideHandler,
      closeHandler
    }
  }
}
</script>

<style>
.global-overlay-host {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Keep the real custom tab bar above the scrim so its + button becomes
     the single, position-stable × close control while the overlay is open. */
  z-index: 9000;
  pointer-events: none;
}
</style>
