const { PupPlugin, segment, http } = require('@pupbot/core')
const { spawnSync } = require('child_process')
const { BOT_ROOT, timestampToDate } = require('../common.js')

const plugin = new PupPlugin('steam', '0.1.0')

const QUERY_URL = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002'
const IMG_URL_BASE = 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/clans'

const APPID_DATA_FILE = BOT_ROOT + '/data/appid/appid_name.txt'

plugin.onMounted(() => {
  const cmdSearch = /^\s*游戏(搜索|查询)(.*)/
  const cmdNews = /^\s*游戏(更新|新闻)(\s*\d+)?(\s+\d+)?/

  plugin.onMatch(cmdSearch, async event => { // {{{
    const raw = event.raw_message
    const name = raw.match(cmdSearch)[2]?.trim()

    if (!name || name === '') {
      return event.reply('游戏查询<全部或部分游戏名>，如【游戏查询muse dash】')
    }

    const child = await spawnSync('grep', [name, APPID_DATA_FILE, '-i'])
    const result = child.output[1].toString('utf8')

    if (result === '') {
      return event.reply('(>_<) 找不到结果哦，试着用更准确的描述吧！')
    }
    const lines = result.split('\n').length - 1
    if (lines > 70) {
      return event.reply(`(>_<) 结果太多啦（共 ${lines} 行），试着用更准确的描述吧！`)
    }
    event.reply(result)
  }) // }}}

  plugin.onMatch(cmdNews, async event => { // {{{
    const raw = event.raw_message
    const match = raw.match(cmdNews)

    let appid = match[2]
    if (!appid) {
      return event.reply('游戏新闻<游戏id> [第n条新闻]，如：【游戏新闻477160】\n游戏id请参考steam页面地址，或通过【游戏查询】命令')
    } else {
      appid = parseInt(appid)
    }

    let num = match[3]
    if (!num || num < 1) {
      num = 1
    } else {
      num = parseInt(num)
    }

    const response = await http.get(
      QUERY_URL,
      { params : {
          appid : appid,
          count : num,
          format : 'json'
      }},
      { timeout : 10000 }
    )

    const news = response?.data?.appnews?.newsitems?.at(-1)
    if (!news) {
      return event.reply(`(>_<) 找不到游戏 (${appid}) 的新闻哦，试着用【游戏查询】命令来查找其他游戏id吧！`)
    }
    event.reply([
      '游戏名：' + await spawnSync('grep', [`^${appid}`, APPID_DATA_FILE]).output[1].toString('utf8').trim() + '\n',
      '标题：' + news.title + '\n',
      '日期：' + timestampToDate(news.date) + '\n',
      '链接：' + news.url
    ])
    event.reply(toMessage(news.contents))
  })
}) // }}}

/**
 * Convert Steam BBCode to plain text and images
 */
function toMessage(content) { // {{{
  content = content.replaceAll(/(.)\n(.)/g, '$1$2')
  content = content
    .replaceAll(/\[h1\](.*?)\[\/h1\]/g, '====== $1 ======\n')
    .replaceAll(/\[h2\](.*?)\[\/h2\]/g, '::::: $1 :::::\n')
    .replaceAll(/\[h3\](.*?)\[\/h3\]/g, '---- $1 ----\n')
    .replaceAll(/\[b\](.*?)\[\/b\]/g, '*$1*')
    .replaceAll(/\[i\](.*?)\[\/i\]/g, '*$1*')
    .replaceAll('[list]', '')
    .replaceAll('[olist]', '')
    .replaceAll('[*]', '\n   * ')
    .replaceAll('[/list]', '\n')
    .replaceAll('[/olist]', '\n')
    .replaceAll(/\[previewyoutube=(\w+).*?previewyoutube\]/g, 'youtu.be/$1\n')
    .replaceAll('’', '\'')
    .replaceAll(/\[url=(https?:\/\/\S+?)](.*?)\[\/url\]/g, '$2 ($1)')

  let msg = content.split(/\[img\]|\[\/img\]/)
  msg.forEach((str, index, msg) => {
    if (str.startsWith('{STEAM_CLAN_IMAGE}')) {
      const url = str.replace('{STEAM_CLAN_IMAGE}', IMG_URL_BASE)
      msg[index] = segment.image(url)
    }
  })
  return msg
} // }}}

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2