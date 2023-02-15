/**
 * Define BOT_ROOT from environment
 */
const BOT_ROOT = process.env.BOT_ROOT

/**
 * Return a random integer within [min,max)
 */
function randInt(min, max) { // {{{
  if (min === max && max === 0) {
    max = 1
  }
  return Math.floor( Math.random() * (max - min) + min )
} // }}}

/**
 * Choose a random item of the given array
 */
function choice(arr) { // {{{
  return arr[randInt(0, arr.length)]
} // }}}

/**
 * Convert ab,cde to a.b万
 */
function fulldigitToReadable(num) { // {{{
  if (num >= 10000) {
    num = Math.floor(num/1000) / 10
    return num + '万'
  } else {
    return num
  }
} // }}}

/**
 * Convert timestamp to YYYY年M月D日
 */
function timestampToDate(timestamp) { // {{{
  let date = new Date(timestamp * 1000)
  return date.getFullYear() + '年' + ( date.getMonth()+1 ) + '月' + date.getDate() + '日'
} // }}}

module.exports = { BOT_ROOT, randInt, choice, fulldigitToReadable, timestampToDate }

// vim: shiftwidth=2 tabstop=2 softtabstop=2
