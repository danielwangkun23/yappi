const db = require('../../utils/supabase')
const { CATS, CAT_EMOJI, CAT_COLOR } = require('../../utils/constants')
const { today } = require('../../utils/helpers')

Page({
  data: {
    curChild: {},
    monthLabel: '',
    stats: { totalTasks: 0, totalStars: 0, maxStreak: 0, rate: '-' },
    catRows: [],
    ledger: [],       // 合并流水
    activeTab: 'stats', // stats | ledger
  },

  _year: 0,
  _month: 0,

  onShow() {
    const app = getApp()
    this.setData({ curChild: app.globalData.curChild || {} })
    const now = new Date()
    this._year = now.getFullYear()
    this._month = now.getMonth() + 1
    this._loadReport()
  },

  onPrevMonth() {
    this._month--
    if (this._month < 1) { this._month = 12; this._year-- }
    this._loadReport()
  },

  onNextMonth() {
    this._month++
    if (this._month > 12) { this._month = 1; this._year++ }
    this._loadReport()
  },

  onTabSwitch(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    if (e.currentTarget.dataset.tab === 'stats') {
      wx.nextTick(() => {
        const { _year: y, _month: m } = this
        const daysInPeriod = new Date(y, m, 0).getDate()
        // rebuild dateCounts from ledger
        const dateCounts = {}
        this.data.ledger.filter(l => l.type === 'earn').forEach(l => {
          dateCounts[l.date] = (dateCounts[l.date] || 0) + 1
        })
        this._drawTrend(y, m, daysInPeriod, dateCounts)
      })
    }
  },

  async _loadReport() {
    const { curChild } = this.data
    if (!curChild.id) return

    const y = this._year
    const m = this._month
    const mStr = String(m).padStart(2, '0')
    const start = `${y}-${mStr}-01`
    const now = new Date()
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1
    const lastDay = new Date(y, m, 0).getDate()
    const end = isCurrentMonth ? today() : `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`
    const daysInPeriod = Math.floor((new Date(end) - new Date(start)) / 86400000) + 1

    this.setData({ monthLabel: `${y}年${m}月` })

    const [logs, redemptions] = await Promise.all([
      db.getLogsByMonth(curChild.id, start, end),
      db.getRedemptionsByMonth(curChild.id, start + 'T00:00:00', end + 'T23:59:59'),
    ])
    const reportLogs = logs || []
    const reportRedemptions = redemptions || []
    const tasks = getApp().globalData.tasks || []
    const rewards = getApp().globalData.rewards || []

    // ---- 统计 ----
    const totalTasks = reportLogs.length
    const totalStars = reportLogs.reduce((s, l) => s + (l.stars_earned || 0), 0)

    const dateCounts = {}
    reportLogs.forEach((l) => { dateCounts[l.done_date] = (dateCounts[l.done_date] || 0) + 1 })
    const dates = Object.keys(dateCounts).sort()
    let maxStreak = 0, cur = 0
    for (let i = 0; i < dates.length; i++) {
      if (i > 0) {
        const prev = new Date(dates[i - 1])
        prev.setDate(prev.getDate() + 1)
        cur = prev.toISOString().slice(0, 10) === dates[i] ? cur + 1 : 1
      } else { cur = 1 }
      maxStreak = Math.max(maxStreak, cur)
    }

    const dailyCount = tasks.filter((t) => t.frequency === 'daily').length
    const benchmark = dailyCount * daysInPeriod
    const rate = benchmark > 0 ? Math.round(totalTasks / benchmark * 100) + '%' : '-'
    this.setData({ stats: { totalTasks, totalStars, maxStreak, rate } })

    // ---- 分类 ----
    const catRows = []
    CATS.forEach((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat)
      if (!catTasks.length) return
      const catBenchmark = catTasks.reduce((s, t) => {
        const days = t.frequency === 'daily' ? daysInPeriod
          : t.frequency === 'weekday' ? Math.ceil(daysInPeriod * 5 / 7)
          : Math.ceil(daysInPeriod / 7)
        return s + days
      }, 0)
      const catDone = reportLogs.filter((l) => l.category === cat).length
      const pct = Math.min(100, catBenchmark > 0 ? Math.round(catDone / catBenchmark * 100) : 0)
      catRows.push({ cat, emoji: CAT_EMOJI[cat], color: CAT_COLOR[cat], done: catDone, benchmark: catBenchmark, pct })
    })
    this.setData({ catRows: catRows.filter((r) => r.benchmark > 0) })

    // ---- 流水 ----
    const earnItems = reportLogs.map((l) => ({
      type: 'earn',
      icon: l.task_id ? '⭐' : '🎁',
      title: l.task_name || '任务完成',
      amount: l.stars_earned || 0,
      date: l.done_date,
      dateLabel: l.done_date ? l.done_date.slice(5) : '',
    })).sort((a, b) => b.date.localeCompare(a.date))

    const spendItems = reportRedemptions.map((r) => {
      const reward = rewards.find((rw) => rw.id === r.reward_id)
      const ts = r.redeemed_at || ''
      return {
        type: 'spend',
        icon: reward?.emoji || '🎀',
        title: reward?.name || '兑换奖励',
        amount: -(reward?.cost || 0),
        date: ts.slice(0, 10),
        dateLabel: ts.slice(5, 10),
      }
    }).sort((a, b) => b.date.localeCompare(a.date))

    // 合并按日期降序
    const ledger = [...earnItems, ...spendItems].sort((a, b) => b.date.localeCompare(a.date))
    this.setData({ ledger })

    wx.nextTick(() => this._drawTrend(y, m, daysInPeriod, dateCounts))
  },

  _drawTrend(y, m, days, dailyMap) {
    const mStr = String(m).padStart(2, '0')
    wx.createSelectorQuery().in(this).select('#trend-chart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]?.node) return
      const canvas = res[0].node
      const W = res[0].width || 300
      const H = 120
      const dpr = wx.getWindowInfo?.()?.pixelRatio || 2
      canvas.width = W * dpr
      canvas.height = H * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const vals = Array.from({ length: days }, (_, i) => {
        const d = String(i + 1).padStart(2, '0')
        return dailyMap[`${y}-${mStr}-${d}`] || 0
      })
      const max = Math.max(...vals, 1)
      const barW = Math.floor((W - 20) / days) - 1

      vals.forEach((v, i) => {
        const h = Math.max(4, Math.round(v / max * (H - 20)))
        const x = 10 + i * (barW + 1)
        ctx.fillStyle = v > 0 ? '#9B6BFF' : '#EDE8F8'
        ctx.fillRect(x, H - 10 - h, barW, h)
      })

      ctx.fillStyle = '#9B8FAE'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ;[1, Math.ceil(days / 2), days].forEach((d) => {
        const x = 10 + (d - 1) * (barW + 1) + barW / 2
        ctx.fillText(d + '日', x, H - 1)
      })
    })
  },
})
