const { PupPlugin, segment, http } = require('@pupbot/core')

const plugin = new PupPlugin('bilibili', '0.1.0')

const QUERY_URL = 'https://api.bilibili.com/x/web-interface/view'
const VIDEO_URL_ROOT = 'https://www.bilibili.com/video/'

plugin.onMounted(() => {
  const cmd = /[AaBb][Vv][0-9a-zA-Z]+|b23\.tv\\?\/[0-9a-zA-Z]+/

  plugin.onMatch(cmd, async (event) => {
    const raw = event.toString().replaceAll('\\/', '/')
    const match = raw.match(cmd)?.at(0)
    if (!match) {
      return
    }

    let vid = match
    if (match.startsWith('b23')) {
      vid = vid.slice(7)
      if (!vid.startsWith('BV') && !vid.startsWith('av')) {
        let res = await http.get('https://' + match)
        if (res?.status !== 200) {
          return
        }
        vid = res.request?.path?.match(cmd)?.at(0)
        if (!vid) {
          return
        }
      }
    }

    const isAvid = ( vid.startsWith('A') || vid.startsWith('a') ) ? true : false

    let params = {}
    if (isAvid) {
      params = {aid: vid.slice(2)}
    } else {
      params = {bvid: vid}
    }
    const response = await http.get(QUERY_URL, {params: params})

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
      VIDEO_URL_ROOT + data.bvid
    ]
    event.reply(msg)
  })
})

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2