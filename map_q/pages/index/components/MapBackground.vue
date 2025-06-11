<template>
  <view class="map-container" :style="{ height: height + 'px' }">
    <map
      class="map"
      :latitude="config.latitude"
      :longitude="config.longitude"
      :markers="config.markers"
      :scale="16"
      show-location
      :subkey="mapKey"
    ></map>
    
    <!-- 添加位置刷新按钮 -->
    <view class="location-btn" @tap="refreshLocation">
      <text class="location-icon">📍</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    height: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      mapKey: 'ISSBZ-BQA6T-J2SXF-VSDGE-A7NZ5-U4B3K'
    }
  },
  methods: {
    refreshLocation() {
      this.$emit('refresh-location')
    }
  }
}
</script>

<style>
.map-container {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.map {
  width: 100%;
  height: 100%;
}

.location-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
}

.location-icon {
  font-size: 24px;
}
</style>