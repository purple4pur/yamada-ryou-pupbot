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
    let name = raw.match(cmdSearch)[2]?.trim()

    if (!name || name === '') {
      return event.reply('游戏查询<全部或部分*英文原名*>，如【游戏查询muse dash】，支持 PCRE 正则')
    }
    //
    // if use '^' then skip leading appid
    name = name.replace(/^\^/, '^\\d+   ')

    //
    // find game name in the data file, in a safe way
    const child = await spawnSync('grep', ['-Pi', name, APPID_DATA_FILE])
    const result = child.output[1].toString('utf8')

    //
    // found nothing
    if (result === '') {
      return event.reply('(>_<) 找不到结果哦，试着用更准确的描述吧！')
    }
    const lines = result.split('\n').length - 1
    //
    // found too many results
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
    //
    // validate [num] input, fix to 1 if invalid
    if (!num || num < 1) {
      num = 1
    } else {
      num = parseInt(num)
    }

    //
    // querying news by appid
    // reference : https://developer.valvesoftware.com/wiki/Steam_Web_API#GetNewsForApp_.28v0002.29
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
    const count = response?.data?.appnews?.count
    if (!news) {
      return event.reply(`(>_<) 找不到游戏 (${appid}) 的新闻哦，试着用【游戏查询】命令来查找其他游戏id吧！`)
    }
    if (count < num) {
      event.reply(`一共只有 ${count} 条新闻哦，将给出最旧一则新闻`)
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
 * Convert Steam BBCode and basic HTML to plain text and images
 */
function toMessage(content) { // {{{
  content = content.replaceAll(/(.)\n(.)/g, '$1$2')
  content = content
    //
    // bare and old steam image url ==> {STEAM_CLAN_IMAGE} link
    .replaceAll(/https?:\/\/.*?public\/images\/clans(.*?\.(?:jpg|png|gif))/g, '[img]{STEAM_CLAN_IMAGE}$1[/img]')
    //
    // Steam BBCode
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
    .replaceAll(/\[previewyoutube=(\w+).*?previewyoutube\]/g, 'https://youtu.be/$1\n')
    .replaceAll('’', '\'')
    .replaceAll(/\[url=(https?:\/\/\S+?)](.*?)\[\/url\]/g, '$2 ($1) ')
    //
    // basic HTML
    .replaceAll(/<br.*?\/?>/g, '\n')
    .replaceAll(/<\/?p>/g, '\n')
    .replaceAll('&apos;', '\'')
    .replaceAll(/<a.*?href=['"](.*?)["'].*?>(.*?)<\/a>/g, '$2 ($1) ')
    .replaceAll(/<img.*?src=['"](.*?)["'].*?\/?>/g, '{IMG_START}###$1{IMG_END}')

  let msg = content.split(/\[\/?img\]|{IMG_(?:START|END)}/)
  msg.forEach((str, index, msg) => {
    if (str.startsWith('{STEAM_CLAN_IMAGE}')) {
      const url = str.replace('{STEAM_CLAN_IMAGE}', IMG_URL_BASE)
      msg[index] = segment.image(url)
    } else if (str.startsWith('###')) {
      const url = str.replace('###', '')
      msg[index] = segment.image(url)
    }
  })
  return msg
} // }}}

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2