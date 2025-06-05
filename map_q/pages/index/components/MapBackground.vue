<template>
  <view class="map-container" :style="{ height: height + 'px' }">
    <map
      class="map"
      :latitude="config.latitude"
      :longitude="config.longitude"
      :markers="config.markers"
      :scale="16"
      show-location
    ></map>
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
</style>