const { LEVELS, FREQS } = require('./constants')

const today = () => new Date().toISOString().slice(0, 10)

const getLevel = (stars) => [...LEVELS].reverse().find((l) => stars >= l.min) || LEVELS[0]

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了💤'
  if (h < 11) return '早上好！☀️'
  if (h < 14) return '中午好！🌤'
  if (h < 18) return '下午好！🌈'
  return '晚上好！🌙'
}

const todayDow = () => new Date().getDay()

const isTaskToday = (t) => {
  const d = todayDow()
  if (t.frequency === 'daily') return true
  if (t.frequency === 'weekday') return d >= 1 && d <= 5
  if (t.frequency === 'saturday') return d === 6
  if (t.frequency === 'sunday') return d === 0
  return true
}

const getFreqLabel = (k) => FREQS.find((f) => f.k === k)?.l || '每天'

const fallbackPraise = (name) => {
  const list = [
    `完成"${name}"，你真的超级棒！⭐`,
    `太厉害啦！小英雄又达成任务！🚀`,
    `你做到了！为你鼓掌！👏`,
    `今天又进步了，好棒棒！🌟`,
    `哇哦！你真的太厉害了！🎉`,
  ]
  return list[Math.floor(Math.random() * list.length)]
}

module.exports = { today, getLevel, getGreeting, isTaskToday, getFreqLabel, fallbackPraise }
