const { PupPlugin, segment, http } = require('@pupbot/core')
const { fulldigitToReadable } = require('../common.js')

const plugin = new PupPlugin('bilibili', '0.1.0')

const QUERY_URL = 'https://api.bilibili.com/x/web-interface/view'
const VIDEO_URL_ROOT = 'https://www.bilibili.com/video/'

plugin.onMounted(() => {
  //
  // match : av123456 / BV1A2b3C4d / b23.tv/1A2b3C4d
  const cmd = /[AaBb][Vv][0-9a-zA-Z]+|b23\.tv\\?\/[0-9a-zA-Z]+/

  plugin.onMatch(cmd, async (event) => {
    //
    // fix : forwarding QQ mini card will convert '/' ==> '\/'
    const raw = event.toString().replaceAll('\\/', '/')
    const match = raw.match(cmd)?.at(0)
    if (!match) {
      return
    }

    let vid = match
    let success = true
    //
    // match b23.tv/1A2b3C4d
    if (match.startsWith('b23')) {
      //
      // get 1A2b3C4d
      vid = vid.slice(7)
      //
      // match short url
      if (!vid.startsWith('BV') && !vid.startsWith('av')) {
        //
        // short url ==> real vid
        let res = await http.get('https://' + match)
          .catch(err => {
            console.log(err.message)
            event.reply(`(>_<) 大概超时了！`)
            success = false
          })
        if (!success) return
        if (res?.status !== 200) {
          return
        }
        vid = res.request?.path?.match(cmd)?.at(0)
        if (!vid) {
          return
        }
      }
    }

    const isAvid = vid.startsWith('A') || vid.startsWith('a')
    if (isAvid && !/^\d+$/.test(vid.slice(2))) {
      console.log(`Querying invalid avid : ${vid}`)
      return
    }

    //
    // get bilibili video infomation
    // reference : https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/info.md#获取视频详细信息web端
    const params = (isAvid) ? {aid: vid.slice(2)} : {bvid: vid}
    success = true
    const response = await http.get(QUERY_URL, {params: params})
      .catch(err => {
        console.log(err.message)
        event.reply(`(>_<) 大概超时了！`)
        success = false
      })
    if (!success) return

    if (response.status !== 200) {
      return
    }
    if (response.data.code !== 0) {
      console.log('Querying : ' + vid + '\n'
                + 'Code     : ' + response.data.code + '\n'
                + 'Message  : ' + response.data.message)
      return
    }

    const data = response.data.data
    const msg = [
      segment.image(data.pic), '\n',
      '标题：' + data.title, '\n',
      'UP主：' + data.owner.name, '\n',
      fulldigitToReadable(data.stat.view) + '播放 / ' + fulldigitToReadable(data.stat.like) + '点赞 / ' + fulldigitToReadable(data.stat.reply) + '评论\n',
      VIDEO_URL_ROOT + data.bvid
    ]
    event.reply(msg)
  })
})

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2