<template>
  <map class="map" 
    :style="{ height: height + 'px' }" 
    :latitude="config.latitude" 
    :longitude="config.longitude" 
    :markers="config.markers">
  </map>
</template>

<script>
export default {
  name: 'MapBackground',
  props: {
    height: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true,
      default: () => ({
        latitude: 30.572815,
        longitude: 104.066801,
        markers: []
      })
    }
  }
}
</script>

<style>
.map {
  width: 100%;
  transition: height 0.3s ease;
}
</style>