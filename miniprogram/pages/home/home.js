const db = require('../../utils/supabase')
const { CATS, CAT_EMOJI, CAT_COLOR, DAYS_CN } = require('../../utils/constants')
const { today, getLevel, getGreeting, isTaskToday, getFreqLabel, fallbackPraise } = require('../../utils/helpers')

Page({
  data: {
    curChild: {},
    greeting: '',
    level: '',
    streakDays: [],
    catTabs: [],
    curCatFilter: '全部',
    tasks: [],
    filteredTasks: [],
    todayCount: 0,
    doneCount: 0,
    todayLogIds: [],   // task_id 数组
    children: [],
    showSwitcher: false,
    showPraise: false,
    praiseTask: {},
    praiseMsg: '',
  },

  onShow() {
    const app = getApp()
    this.setData({
      curChild: app.globalData.curChild || {},
      children: app.globalData.children || [],
      tasks: app.globalData.tasks || [],
      greeting: getGreeting(),
    })
    this._refreshLogs()
  },

  async _refreshLogs() {
    const { curChild } = this.data
    if (!curChild.id) return
    if (getApp().globalData.isGuest) {
      this._buildUI()
      return
    }
    const logs = await db.getTodayLogs(curChild.id, today())
    const todayLogIds = (logs || []).map((l) => l.task_id)
    this.setData({ todayLogIds })
    this._buildUI()
  },

  _buildUI() {
    const { curChild, tasks, todayLogIds, curCatFilter } = this.data
    const level = getLevel(curChild.total_stars || 0).l
    const streakDays = this._buildStreakDays(curChild.streak || 0)
    const todayTasks = tasks.filter(isTaskToday)
    const catTabs = this._buildCatTabs(todayTasks, curCatFilter)
    const filtered = this._filterTasks(todayTasks, curCatFilter, todayLogIds)
    const doneCount = todayTasks.filter((t) => todayLogIds.includes(t.id)).length

    this.setData({
      level,
      streakDays,
      catTabs,
      filteredTasks: filtered,
      todayCount: todayTasks.length,
      doneCount,
    })
  },

  _buildStreakDays(streak) {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const isToday = i === 0
      const cls = isToday ? 'today' : i < streak ? 'done' : ''
      days.push({
        cls,
        icon: isToday ? '✨' : cls === 'done' ? '⭐' : '',
        label: isToday ? '今天' : DAYS_CN[d.getDay()],
      })
    }
    return days
  },

  _buildCatTabs(todayTasks, active) {
    const usedCats = [...new Set(todayTasks.map((t) => t.category))]
    return ['全部', ...usedCats].map((name) => ({
      name,
      emoji: CAT_EMOJI[name] || '📋',
      color: CAT_COLOR[name] || 'var(--p)',
      active: name === active,
    }))
  },

  _filterTasks(todayTasks, filter, todayLogIds) {
    const list = filter === '全部' ? todayTasks : todayTasks.filter((t) => t.category === filter)
    return list.map((t) => ({
      ...t,
      done: todayLogIds.includes(t.id),
      catColor: CAT_COLOR[t.category] || '#9B8FAE',
      freqLabel: getFreqLabel(t.frequency),
    }))
  },

  onSetCatFilter(e) {
    const cat = e.currentTarget.dataset.cat
    const { tasks, todayLogIds } = this.data
    const todayTasks = tasks.filter(isTaskToday)
    this.setData({
      curCatFilter: cat,
      catTabs: this._buildCatTabs(todayTasks, cat),
      filteredTasks: this._filterTasks(todayTasks, cat, todayLogIds),
    })
  },

  async onHandleTask(e) {
    if (getApp().globalData.isGuest) {
      wx.showModal({ title: '登录后使用', content: '登录后即可完成任务、积累星星，记录孩子的成长！', confirmText: '去登录', success: (r) => { if (r.confirm) wx.reLaunch({ url: '/pages/auth/auth' }) } })
      return
    }
    const tid = e.currentTarget.dataset.id
    const { todayLogIds, tasks, curChild } = this.data
    if (todayLogIds.includes(tid)) return

    const task = tasks.find((t) => t.id === tid)
    if (!task) return

    const newLogIds = [...todayLogIds, tid]
    const newStars = (curChild.stars || 0) + task.stars
    const newTotal = (curChild.total_stars || 0) + task.stars
    const updatedChild = { ...curChild, stars: newStars, total_stars: newTotal }

    this.setData({ todayLogIds: newLogIds, curChild: updatedChild })
    getApp().globalData.curChild = updatedChild
    // 更新 children 列表中的对应项
    const children = getApp().globalData.children.map((c) =>
      c.id === curChild.id ? updatedChild : c
    )
    getApp().globalData.children = children
    this.setData({ children })
    this._buildUI()

    // 显示表扬弹窗
    this.setData({
      showPraise: true,
      praiseTask: task,
      praiseMsg: fallbackPraise(task.name),
    })

    // 持久化
    await Promise.all([
      db.createLog({
        child_id: curChild.id,
        task_id: tid,
        task_name: task.name,
        category: task.category,
        stars_earned: task.stars,
        done_date: today(),
      }),
      db.updateChild(curChild.id, {
        stars: newStars,
        total_stars: newTotal,
        last_checkin_date: today(),
      }),
    ])
  },

  onClosePraise() {
    this.setData({ showPraise: false })
  },

  onOpenSwitcher() {
    this.setData({ showSwitcher: true })
  },

  onCloseSwitcher() {
    this.setData({ showSwitcher: false })
  },

  async onSwitchChild(e) {
    const cid = e.currentTarget.dataset.id
    const app = getApp()
    const child = app.globalData.children.find((c) => c.id === cid)
    if (!child) return
    app.globalData.curChild = child
    wx.setStorageSync('yappi_cid', cid)
    this.setData({
      curChild: child,
      showSwitcher: false,
      curCatFilter: '全部',
    })
    await this._refreshLogs()
  },
})
