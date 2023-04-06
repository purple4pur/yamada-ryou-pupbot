const download = require('image-downloader')
const fs = require('fs')
const { PupPlugin, segment, http } = require('@pupbot/core')
const { XMLParser } = require('fast-xml-parser')
const { exec } = require('child_process')
const { BOT_ROOT, choice } = require('../common.js')

const plugin = new PupPlugin('pixiv', '0.1.0')

const IMG_CACHE_DIR = BOT_ROOT + '/data/img-cache/'

plugin.onMounted(() => {
  const cmd = /^\s*(精准|精确)?给点\s*(\S+)?/

  //
  // admin commands start with '/'
  // reference : https://www.npmjs.com/package/pupbot-plugin-soutu
  plugin.onAdminCmd('/给点', (event, params) => { // {{{
    const [cmd, target] = params

    if (!cmd || !['status', 'ls', 'rm', 'sh'].includes(cmd)) {
      return event.reply('/给点 status\n/给点 ls [pid]\n/给点 rm <pid>\n/给点 sh <cmd>')
    }

    const files = fs.readdirSync(IMG_CACHE_DIR)
    const localImgs = files.filter(file => /\.img$/.test(file))

    switch (cmd) {
      case 'status':
        return event.reply('已缓存 ' + localImgs.length + ' 张图')
        break
      case 'ls':
        if (target) {
          const name = target + '.img'
          if (localImgs.includes(name))
            return event.reply(name)
          else
            return event.reply('未找到 ' + name)
        }
        return event.reply(localImgs.join(', '))
        break
      case 'rm':
        if (!target) {
          return event.reply('/给点 rm <pid>')
        }
        const name = target + '.img'
        if (localImgs.includes(name)) {
          fs.unlinkSync(IMG_CACHE_DIR + name)
          return event.reply('已删除 ' + name)
        } else {
          return event.reply('未找到 ' + name)
        }
        break
      case 'sh':
        if (!target) {
          return event.reply('/给点 sh <cmd>')
        }
        const command = 'cd ' + IMG_CACHE_DIR + '; ' + target.trim()
        exec(command, (error, stdout, stderr) => {
          if (error) {
            return event.reply(error.message)
          }
          if (stderr) {
            return event.reply(stderr)
          }
          return event.reply(stdout)
        })
        break
      default:
        return event.reply('/给点 status\n/给点 ls [pid]\n/给点 rm <pid>\n/给点 sh <cmd>')
    }
  }) // }}}

  plugin.onMatch(cmd, async (event) => {
    const raw = event.raw_message
    const match = raw.match(cmd)
    const isRealSearch = !!match[1]
    const tag = match[2]
    const bareID = tag?.match(/p?id(\d+)/i)?.[1]
    const isRandom = (tag === '随机')

    let data

    //
    // match : 给点id123456
    if (bareID) {
      data = {
        pid: bareID,
        imgUrls: pid2urls(bareID)
      }

    //
    // match : 给点随机
    } else if (isRandom) {
      const files = fs.readdirSync(IMG_CACHE_DIR)
      const localImgs = files.filter(file => /\.img$/.test(file))
      const localImg = choice(localImgs)
      const id = localImg.slice(0, -4)
      event.reply('随机发送已缓存图片：' + id)

      data = {
        pid: id,
        imgUrls: pid2urls(id)
      }

    } else {
      //
      // match : 精确给点
      if (isRealSearch) {
        return event.reply('【精确给点】已失效。')
        //--if (!tag) {
        //--  return event.reply('精确给点+tag，如【精确给点原神】')
        //--}
        //--data = await parseMoedogSearch(event, tag)

      //
      // match : 给点
      } else if (!tag) {
        data = await parseLolicon(event, tag)

      } else {
        switch (tag) {
          //
          // match : 给点月榜
          case '日榜':
            data = await parseRss(event, 'daily')
            break
          case '周榜':
            data = await parseRss(event, 'weekly')
            break
          case '月榜':
            data = await parseRss(event, 'monthly')
            break
          //
          // match : 给点原神
          default:
            console.log('trying anosu api ...')
            data = await parseAnosuSearch(event, tag)
            if (!data) {
              console.log('trying lolicon api ...')
              data = await parseLolicon(event, tag)
            }
        }
      }

      if (!data) {
        return event.reply('(>_<) 给不出来！请参考 pixiv 热门 tag 哦')
      }
      const text = data.title + '\n' + data.pid
      event.reply(text)
    }
    console.log(data)

    //
    // download image if needed, and get local image path
    const [localImg, localPid] = await prepareImage(event, data.imgUrls, data.pid)
    const img = segment.image('file://' + localImg)
    event.reply(img)
      .catch(err => {
        console.log(err)
        event.reply('(>_<) 图片发送失败，请尝试私聊发送【给点id' + localPid + '】')
      })
  })
})

/**
 * Parse pixiv ranking rss to data
 *   type : 'daily' / 'weekly' / 'monthly'
 * reference : https://rakuen.thec.me/PixivRss/
 */
async function parseRss(event, type) { // {{{
  const url = 'https://rakuen.thec.me/PixivRss/' + type + '-20'

  let success = true
  const response = await http.get(url, {timeout: 10000})
    .catch(err => {
      console.log(err.message)
      event.reply(`(>_<) 大概超时了！`)
      success = false
    })
  if (!success) return null

  if (response.status !== 200) {
    return null
  }
  const xml = response.data

  const parser = new XMLParser()
  const feed = parser.parse(xml)
  const items = feed.rss.channel.item

  if (items.length === 0) {
    return null
  }
  const chosen = choice(items)
  return {
    title: chosen.title,
    pid: chosen.guid,
    imgUrls: pid2urls(chosen.guid)
  }
} // }}}

/**
 * Parse LoliconAPI response to data
 *   tag : if not present, query a random image
 * reference : https://api.lolicon.app/#/setu
 */
async function parseLolicon(event, tag) { // {{{
  const url = 'https://api.lolicon.app/setu/v2'

  const params = (tag) ? {tag: tag} : {}
  let success = true
  const response = await http.get(url, {params: params, timeout: 10000})
    .catch(err => {
      console.log(err.message)
      event.reply(`(>_<) 大概超时了！`)
      success = false
    })
  if (!success) return null

  if (response.status !== 200) {
    return null
  }
  const items = response.data.data
  if (items.length === 0) {
    return null
  }
  const chosen = choice(items)
  return {
    title: chosen.title,
    pid: chosen.pid,
    imgUrls: [chosen.urls.original].concat( pid2urls(chosen.pid, chosen.ext) )
  }
} // }}}

/**
 * Parse MoedogPixivAPI response to data
 *   tag : keyword in search
 * reference : https://api.moedog.org/pixiv/v2.html
 */
async function parseMoedogSearch(event, tag) { // {{{
  const url = 'https://api.moedog.org/pixiv/v2'

  const params = {
    type: 'search',
    word: tag
  }
  let success = true
  const response = await http.get(url, {params: params, timeout: 10000})
    .catch(err => {
      console.log(err.message)
      event.reply(`(>_<) 大概超时了！`)
      success = false
    })
  if (!success) return null

  if (response.status !== 200) {
    return null
  }
  const json = response.data
  const preItems = json.illusts
  let items = []
  for (const i of preItems) {
    //
    // we only need safe-for-work illustrations
    if (i.type === 'illust') {
      let isR18 = false
      for (const tag of i.tags) {
        if (tag.name === 'R-18') {
          isR18 = true
          break
        }
      }
      if (!isR18)
        items.push(i)
    }
  }

  if (items.length === 0) {
    return null
  }
  const chosen = choice(items)
  return {
    title: chosen.title,
    pid: chosen.id,
    imgUrls: pid2urls(chosen.id)
  }
} // }}}

/**
 * Parse AnosuPixivAPI response to data
 *   tag : keyword in search
 * reference : https://docs.anosu.top/
 */
async function parseAnosuSearch(event, tag) { // {{{
  const url = 'https://image.anosu.top/pixiv/json'

  const params = {keyword: tag}
  let success = true
  const response = await http.get(url, {params: params, timeout: 10000})
    .catch(err => {
      console.log(err.message)
      event.reply(`(>_<) 大概超时了！`)
      success = false
    })
  if (!success) return null

  if (response.status !== 200) {
    return null
  }
  const item = response.data?.at(0)
  if (!item) {
    return null
  }
  return {
    title: item.title,
    pid: item.pid,
    //
    // fix : jitsu.top connection timeout
    imgUrls: [item.url.replace(/\/\/.*?jitsu\.top/, '//i.pixiv.re')]
      .concat( pid2urls(item.pid, item.ext) )
  }
} // }}}

/**
 * Return pixiv image proxy urls by given pid
 */
function pid2urls(pid, ext) { // {{{
  if (!ext)
    ext = 'jpg'
  return [
    'https://i.pixiv.nl/' + pid + '.' + ext,
    'https://i.pixiv.re/' + pid + '.' + ext,
    'https://pixiv.nl/' + pid + '.' + ext,
    'https://pixiv.shojo.cn/' + pid
  ]
} // }}}

/**
 * Return local image path (download first if needed)
 */
async function prepareImage(event, imgUrls, pid) { // {{{
  const filePath = IMG_CACHE_DIR + pid + '.img'

  //
  // queried image has not been cached locally
  if (!fs.existsSync(filePath)) {
    event.reply('尝试缓存图片中...')
    let success = false

    //
    // try urls one by one
    for (const imgUrl of imgUrls) {
      console.log('trying "' + imgUrl + '" ...')
      await downloadImage(imgUrl, filePath)
        .then(() => {
          success = true
        })
        .catch(err => {
          //--console.log(err)
        })
      if (success)
        break
    }
  }

  //
  // check again and the image has been cached successfully
  if (fs.existsSync(filePath)) {
    return [filePath, pid]

  //
  // failed to cache, return random cached image
  } else {
    const files = fs.readdirSync(IMG_CACHE_DIR)
    const localImgs = files.filter(file => /\.img$/.test(file))
    const localImg = choice(localImgs)

    event.reply('(>_<) 缓存失败，api受限/连接超时/r18，将随机发送已缓存图片：' + localImg.slice(0, -4))
    return [IMG_CACHE_DIR + localImg, localImg.slice(0, -4)]
  }
} // }}}

/**
 * warpper for image downloader
 */
async function downloadImage(url, filepath) { // {{{
  return await download.image({
    url: url,
    dest: filepath
  })
} // }}}

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2