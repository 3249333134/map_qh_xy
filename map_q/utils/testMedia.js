export const TEST_MEDIA_VERSION = 2
export const TEST_VIDEOS = [
  { id: 'demo-video-street', title: '城市街道 · 测试视频', url: 'https://samplelib.com/mp4/sample-5s-360p.mp4', duration: 5, cover: '/static/video-demo/street.jpg' },
  { id: 'demo-video-bus', title: '公园旁的巴士 · 测试视频', url: 'https://samplelib.com/mp4/sample-10s-360p.mp4', duration: 10, cover: '/static/video-demo/bus.jpg' }
]
export const TEST_IMAGES = [
  'https://samplelib.com/jpeg/sample-city-park-400x300.jpg',
  'https://samplelib.com/jpeg/sample-birch-400x300.jpg'
]
export function getTestVideo(index) {
  const sample = TEST_VIDEOS[index % TEST_VIDEOS.length]
  return { ...sample, _id: sample.id, name: sample.title, type: 'video', videoUrl: sample.url,
    demoVersion: TEST_MEDIA_VERSION, author: { id: 'demo-author', name: '素材预览', avatar: '' },
    location: { type: 'Point', coordinates: index % 2 ? [104.066, 30.657] : [104.07, 30.66] },
    locationName: '测试定位点（非素材拍摄地）', address: '成都演示定位点', likes: 0, plays: 0, tags: ['测试素材'] }
}
