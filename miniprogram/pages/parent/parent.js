const db = require('../../utils/supabase')
const auth = require('../../utils/auth')
const { today, getFreqLabel } = require('../../utils/helpers')
const { CATS, CAT_EMOJI, CAT_COLOR } = require('../../utils/constants')

Page({
  data: {
    parent: {},
    curChild: {},
    children: [],
    tasksByCat: [],
    rewards: [],
    adjReason: '',
    adjAmount: 5,
  },

  onShow() {
    const app = getApp()
    this.setData({
      parent: app.globalData.parent || {},
      curChild: app.globalData.curChild || {},
      children: app.globalData.children || [],
      rewards: app.globalData.rewards || [],
    })
    this._buildTasksByCat(app.globalData.tasks || [])
  },

  _buildTasksByCat(tasks) {
    const byCat = []
    CATS.forEach((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat).map((t) => ({
        ...t, freqLabel: getFreqLabel(t.frequency),
      }))
      if (catTasks.length) byCat.push({ cat, emoji: CAT_EMOJI[cat], color: CAT_COLOR[cat], tasks: catTasks })
    })
    this.setData({ tasksByCat: byCat })
  },

  // ---- 孩子 ----
  onOpenAddChild() { wx.navigateTo({ url: '/pages/child-form/child-form' }) },

  async onDeleteChild(e) {
    const { id, name } = e.currentTarget.dataset
    const res = await new Promise((resolve) => wx.showModal({ title: '确认删除', content: `确定删除 ${name} 的所有数据吗？`, success: resolve }))
    if (!res.confirm) return
    await db.deleteChild(id)
    const app = getApp()
    app.globalData.children = app.globalData.children.filter((c) => c.id !== id)
    if (app.globalData.curChild?.id === id) {
      app.globalData.curChild = app.globalData.children[0] || null
    }
    this.setData({ children: app.globalData.children, curChild: app.globalData.curChild || {} })
    wx.showToast({ title: '已删除', icon: 'none' })
  },

  // ---- 任务 ----
  onOpenAddTask() { wx.navigateTo({ url: '/pages/task-form/task-form' }) },
  onOpenEditTask(e) { wx.navigateTo({ url: `/pages/task-form/task-form?id=${e.currentTarget.dataset.id}` }) },

  async onDeleteTask(e) {
    const id = e.currentTarget.dataset.id
    const res = await new Promise((resolve) => wx.showModal({ title: '确认删除', content: '确定删除这个任务吗？', success: resolve }))
    if (!res.confirm) return
    await db.softDeleteTask(id)
    const app = getApp()
    app.globalData.tasks = app.globalData.tasks.filter((t) => t.id !== id)
    this._buildTasksByCat(app.globalData.tasks)
    wx.showToast({ title: '已删除', icon: 'none' })
  },

  // ---- 奖励 ----
  onOpenAddReward() { wx.navigateTo({ url: '/pages/reward-form/reward-form' }) },
  onOpenEditReward(e) { wx.navigateTo({ url: `/pages/reward-form/reward-form?id=${e.currentTarget.dataset.id}` }) },

  async onDeleteReward(e) {
    const id = e.currentTarget.dataset.id
    const res = await new Promise((resolve) => wx.showModal({ title: '确认删除', content: '确定删除吗？', success: resolve }))
    if (!res.confirm) return
    await db.softDeleteReward(id)
    const app = getApp()
    app.globalData.rewards = app.globalData.rewards.filter((r) => r.id !== id)
    this.setData({ rewards: app.globalData.rewards })
    wx.showToast({ title: '已删除', icon: 'none' })
  },

  // ---- 星星调整 ----
  onAdjReasonInput(e) { this.setData({ adjReason: e.detail.value }) },
  onAdjAmountInput(e) { this.setData({ adjAmount: e.detail.value }) },
  onAdjAmountFocus() { this.setData({ adjAmount: '' }) },
  onAdjAmountBlur() { this.setData({ adjAmount: parseInt(this.data.adjAmount) || 5 }) },

  async onAdjStars(e) {
    const dir = parseInt(e.currentTarget.dataset.dir)
    const { curChild, adjAmount, adjReason } = this.data
    if (!curChild.id) { wx.showToast({ title: '请先选择孩子', icon: 'none' }); return }
    if (dir === -1 && curChild.stars < adjAmount) { wx.showToast({ title: '星星不足，无法扣除', icon: 'none' }); return }
    const newStars = curChild.stars + dir * adjAmount
    const newTotal = dir === 1 ? curChild.total_stars + adjAmount : curChild.total_stars
    const updatedChild = { ...curChild, stars: newStars, total_stars: newTotal }
    const app = getApp()
    app.globalData.curChild = updatedChild
    app.globalData.children = app.globalData.children.map((c) => c.id === curChild.id ? updatedChild : c)
    this.setData({ curChild: updatedChild, children: app.globalData.children, adjReason: '' })
    await Promise.all([
      db.updateChild(curChild.id, { stars: newStars, total_stars: newTotal }),
      db.createLog({ child_id: curChild.id, task_id: null, task_name: adjReason || '家长调整', category: '其他', stars_earned: dir * adjAmount, done_date: today() }),
    ])
    wx.showToast({ title: dir === 1 ? `+${adjAmount} 颗星星已添加 ⭐` : `-${adjAmount} 颗星星已扣除`, icon: 'none' })
  },

  // ---- 退出 ----
  async onLogout() {
    const res = await new Promise((resolve) => wx.showModal({ title: '退出登录', content: '确定退出登录吗？', success: resolve }))
    if (!res.confirm) return
    auth.logout()
    getApp().globalData = { parent: null, children: [], curChild: null, tasks: [], rewards: [], templates: [] }
    wx.reLaunch({ url: '/pages/auth/auth' })
  },
})
