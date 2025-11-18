Component({
  data: {
    selected: 0,
    publishIndex: 2,
    list: [
      { pagePath: '/pages/index/index', text: '首页', iconPath: '/static/tabbar/home.png', selectedIconPath: '/static/tabbar/home-active.png' },
      { pagePath: '/pages/service/index', text: '服务', iconPath: '/static/tabbar/service.png', selectedIconPath: '/static/tabbar/service-active.png' },
      { pagePath: '/pages/plus/index', text: '发布', iconPath: '/static/tabbar/plus.png', selectedIconPath: '/static/tabbar/plus-active.png', type: 'publish' },
      { pagePath: '/pages/message/index', text: '消息', iconPath: '/static/tabbar/message.png', selectedIconPath: '/static/tabbar/message-active.png' },
      { pagePath: '/pages/my/index', text: '我的', iconPath: '/static/tabbar/my.png', selectedIconPath: '/static/tabbar/my-active.png' }
    ]
  },

  attached() {
    this.updateSelected()
  },

  pageLifetimes: {
    show() {
      this.updateSelected()
    }
  },

  methods: {
    // 路径统一：确保带前导斜杠
    normalize(path) {
        if (!path) return '';
        return path.startsWith('/') ? path : '/' + path;
    },

    updateSelected() {
        try {
            const pages = getCurrentPages();
            const page = pages[pages.length - 1];
            const route = this.normalize(page.route);
            const idx = this.data.list.findIndex(i => this.normalize(i.pagePath) === route);
            this.setData({ selected: idx >= 0 ? idx : 0 });

            // 记录当前选中的 Tab，供 plus 页返回使用
            try {
              const app = getApp();
              if (app && app.globalData) app.globalData.prevTabPath = route;
            } catch (e2) {}
        } catch (e) {
            this.setData({ selected: 0 });
        }
    },

    onTap(e) {
        const rawIndex = e.currentTarget.dataset.index;
        const index = typeof rawIndex === 'number' ? rawIndex : Number(rawIndex);
        if (!Number.isFinite(index)) {
            console.warn('Invalid tab index:', rawIndex);
            return;
        }
        const item = this.data.list[index];
        if (!item) {
            console.warn('Invalid tab item at index:', index);
            return;
        }

        // 中间“发布”：仅触发弹窗，不进行页面跳转
        if (index === Number(this.data.publishIndex)) {
            // 仅在点击“+”时触发弹窗：优先直接驱动 App.vue 响应式状态
            try {
                const app = getApp();
                if (app && app.$vm && typeof app.$vm.showPublishOverlay !== 'undefined') {
                    app.$vm.showPublishOverlay = true;
                    // 同步全局标记，供页面挂载点感知
                    if (app.globalData) app.globalData.showPublishOverlay = true;
                    return;
                }
            } catch (err) {}
            // 备选：事件总线（若上面不可用）
            try {
                if (typeof uni !== 'undefined' && uni.$emit) {
                    uni.$emit('showPublishOverlay');
                }
            } catch (err2) {}
            // 最终兜底：写入全局标记，页面挂载点将轮询同步
            try {
                const app = getApp();
                if (app && app.globalData) app.globalData.showPublishOverlay = true;
            } catch (e3) {}
            return;
        }

        // 其他 Tab：切换并用数字更新选中态
        const url = this.normalize(item.pagePath);
        if (!url) {
            console.warn('Missing pagePath for tab item:', item);
            return;
        }

        try { if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync('contentArea.categoryActionExpanded', false); } catch (e) {}
        try { if (typeof uni !== 'undefined' && uni.$emit) uni.$emit('collapseExpandableBars'); } catch (e2) {}

        const setSelected = () => this.setData({ selected: index });

        if (typeof wx !== 'undefined' && wx.switchTab) {
            wx.switchTab({
                url,
                success: setSelected,
                fail: (err) => {
                    console.warn('wx.switchTab 失败，尝试使用 uni.switchTab: ', err);
                    if (typeof uni !== 'undefined' && uni.switchTab) {
                        uni.switchTab({
                            url,
                            success: setSelected,
                            fail: (e2) => console.error('uni.switchTab 也失败: ', e2)
                        });
                    }
                }
            });
        } else if (typeof uni !== 'undefined' && uni.switchTab) {
            uni.switchTab({ url, success: setSelected });
        } else {
            // 非小程序环境降级
            if (typeof uni !== 'undefined' && uni.reLaunch) uni.reLaunch({ url });
            setSelected();
        }
    }
  }
})
