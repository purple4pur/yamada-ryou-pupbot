const { PupPlugin, segment, http } = require('@pupbot/core')
const { randInt } = require('../common.js')

const plugin = new PupPlugin('roll', '0.1.0')

plugin.onMounted(() => {
  const cmd = /^\s*roll(\s*\d+)?/

  plugin.onMatch(cmd, event => {
    const raw = event.raw_message

    let max = raw.match(cmd)[1]
    if (!max)
      max = 100
    else
      max = Number(max)

    const num = randInt(0, max)
    let ret = num.toString()
    if (num < max/10) {
      ret = '才' + ret + '，杂鱼~ 杂鱼~'
    }
    event.reply(ret)
  })
})

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2