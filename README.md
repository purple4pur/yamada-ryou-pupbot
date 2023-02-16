# 山田凉（QQBot on PupBot）

## 食用方法

1. 根据 [快速上手](https://www.pupbot.cn/start/online.html) 部署 PupBot
2. 将本项目文件添加到对应位置，添加完成后目录结构大致如下：
```
$BOT_ROOT
├── app.js
├── config.json
├── data/
│   ├── appid/      <--- 由本项目提供
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
3. 确保已安装下列应用：`curl`，`vim`，`jq`
4. 确保 bot 目录内已安装下列 npm 包：`image-downloader`，`fast-xml-parser`
5. 通过 `make start` 启动 bot，因为 Makefile 内定义了插件所需的 `BOT_ROOT`

## 插件命令一览

### 主动触发命令

**特别注意：以 `/` 开头的命令仅限 bot 管理员触发**

| 命令 | 说明 | 示例 |
|---|---|---|
| `ping` | 测试 bot 在线状态，返回一句凉的台词 | `ping` |
| `roll` | 给出一个 0-100 的随机数，也可指定上界 | `roll`, `roll300` |
| `给点` | 随机发送一张插画，可指定标签/排行榜/pid等 | `给点`, `给点原神`, `给点id34844544`, `给点月榜`, `给点随机` |
| `游戏新闻` | 给出最近一条游戏新闻 | `游戏新闻477160` |
| `游戏查询` | 根据游戏名查询 id，id 可用于 `游戏新闻` 命令 | `游戏查询muse dash` |
| `/sh` | 远程执行命令 | `/sh pwd` |
| `/给点 status` | 返回已缓存图片数量 | `/给点 status` |
| `/给点 ls` | 列出所有已缓存文件名，或本地查询指定 id | `/给点 ls`, `/给点 ls 34844544` |
| `/给点 rm` | 删除指定 id 的本地缓存 | `/给点 rm 34844544` |

### 被动触发效果

| 触发条件 | 效果 |
|---|---|
| 文字包含AV号/BV号/b23.tv短链接，或出现 b 站分享卡片 | 发送视频基本信息（封面/标题/UP主/直链等） |
