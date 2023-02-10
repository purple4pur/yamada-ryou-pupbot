const { PupPlugin, segment, http } = require('@pupbot/core')
const { exec } = require('child_process')

const plugin = new PupPlugin('shell', '0.1.0')

const BOT_ROOT = process.env.BOT_ROOT

plugin.onMounted(() => {
  const cmd = /^\/sh(.*)/

  plugin.onAdminMatch(cmd, event => {
    const raw = event.raw_message
    const match = raw.match(cmd)

    let command = match[1]
    if (!command) {
      return event.reply('/sh <command>')
    }
    command = 'cd ' + BOT_ROOT + '; ' + command.trim()

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return event.reply(error.message)
      }
      if (stderr) {
        return event.reply(stderr)
      }
      return event.reply(stdout)
    })
  })
})

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2