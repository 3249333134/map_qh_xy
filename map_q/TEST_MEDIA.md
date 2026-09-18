# 联调测试素材

来源：https://samplelib.com/sample-mp4.html 和 https://samplelib.com/sample-jpeg.html 。仅接入既有演示数据模式，真实接口数据不变。

两段 MP4：城市街道（5 秒、360p）、公园旁的巴士（10 秒、360p）。两张 JPEG：河畔公园、林间步道（400×300）。这两张图片仅用于图文卡片。视频封面从各自视频第 1 秒提取，保存在 static/video-demo，合计约 180 KB。地图坐标沿用本地演示点，不代表素材真实拍摄地。

素材地址集中在 utils/testMedia.js。使用 HTTPS 远程媒体，不增加小程序主包体积。微信开发者工具可关闭合法域名校验进行本地联调；真机需配置 samplelib.com 相应合法域名，或迁移至自己的 HTTPS 媒体域名。

视频固定 ID 为 demo-video-street、demo-video-bus，演示流只有这两条，素材版本为 2。视频使用远程地址，下载用于截帧的临时文件不打入小程序包。
