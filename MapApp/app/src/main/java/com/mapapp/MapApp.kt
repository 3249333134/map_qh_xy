package com.mapapp

import android.app.Application

class MapApp : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        // 高德地图隐私设置
        // 需要先设置隐私合规相关配置
        // 在实际项目中，请根据高德地图文档进行隐私设置
    }

    companion object {
        lateinit var instance: MapApp
            private set
    }
}
