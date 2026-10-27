# PLC 应用技术教学网站

这是一个简体中文 PLC 教学微动画网站，包含上升沿/下降沿、计数器、触点与线圈、点动与长动、台车自动往返和水位数据链等内容。

## 本地查看

直接打开根目录的 `index.html`。部分三维页面使用 Three.js CDN，需要网络连接。

## 台车三维内容

- `lessons/control/trolley-3d.html`：三维动画与可交互结构模型。
- `trolley-prototype/index.html`：独立的台车自动往返交互式三维原型。

## 静态部署

将仓库根目录作为静态网站根目录部署；`index.html` 是网站首页，子页面和媒体文件使用相对路径。

## 水位三维交互原型

- `water-level-3d/index.html`：水位数据链单文件三维模型，Three.js 与样式已内嵌，可直接静态托管。


## 台车自动往返控制 3D 教学动画

- `lessons/control/trolley-auto-animation/index.html`：视频播放页，并链接到网页动画版。
- 页面只收录成品 MP4、网页动画所需的 HTML/CSS/JS 和封面；未收录渲染调试脚本、临时截图及重复源模型。

## 水位数据链 3D 教学动画

- `lessons/control/water-level-3d-animation/index.html`：视频播放页，附网页动画版与字幕下载。
- 只收录成品 MP4、动画页面依赖文件、封面和字幕；略去分镜、渲染脚本、模型原件及多余关键帧。

