# 山田凉（QQBot on PupBot）

## 食用方法

1. 根据 [快速上手](https://www.pupbot.cn/start/online.html) 部署 PupBot
2. 将本项目文件添加到对应位置，添加完成后目录结构大致如下：
```
$BOT_ROOT
├── app.js
├── config.json
├── data/
│   ├── img-cache/  <--- 由本项目提供
│   ├── oicq/
│   └── plugins/
├── LICENSE
├── logs/
├── Makefile        <--- 由本项目提供
├── node_modules/
├── package.json
├── package-lock.json
├── plugins/        <--- 由本项目提供
└── README.md
```
3. 通过 `make start` 启动 bot，因为 Makefile 内定义了插件所需的 `BOT_ROOT`
