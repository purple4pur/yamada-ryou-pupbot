const { PupPlugin, segment, http } = require('@pupbot/core')
const { choice } = require('../common.js')

const plugin = new PupPlugin('ping', '0.1.0')

const SAYINGS = [
  'うれしくないし♡',
  'スタジオ代もノルマも４分割',
  '有識者が言っていた、オープニングでジャンプするアニメは神アニメと',
  '飲酒・喫煙・女遊び',
  'アイスは無限に食べれる',
  'もう絶対、人にお金借りません',
  'ぼっち、もてなせ',
  'どこ？「メイド服ぼっちちゃん」は？',
  'MVはぼっちを水着にしよう',
  'お前は、伝説のロックスターだ！',
]

plugin.onMounted(() => {
  const cmd = /^\s*ping/

  plugin.onMatch(cmd, event => {
    const msg = choice(SAYINGS)
    event.reply(msg)
  })
})

module.exports = { plugin }

// vim: shiftwidth=2 tabstop=2 softtabstop=2