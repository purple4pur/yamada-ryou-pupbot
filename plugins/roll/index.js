const { PupPlugin, segment, http } = require('@pupbot/core')
const { randInt } = require('../common.js')

const plugin = new PupPlugin('roll', '0.1.0')

plugin.onMounted(() => {
  const cmd = /^\s*roll(\s*\d+)?/

  plugin.onMatch(cmd, event => {
    const raw = event.raw_message

    let max = raw.match(cmd)[1]
    max = (max) ? parseInt(max) : 100

    const num = randInt(0, max)
    event.reply([num.toString()])
  })
})

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2