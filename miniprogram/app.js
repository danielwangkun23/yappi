const auth = require('./utils/auth')
const db = require('./utils/supabase')

const GUEST_DATA = {
  parent: { id: 'guest', username: '体验账号' },
  curChild: { id: 'guest-child', name: '小勇士', avatar: '🦁', stars: 28, total_stars: 86, streak: 5 },
  children: [{ id: 'guest-child', name: '小勇士', avatar: '🦁', stars: 28, total_stars: 86, streak: 5 }],
  tasks: [
    { id: 't1', name: '阅读30分钟', description: '读课外书或绘本', emoji: '📚', category: '学习', stars: 5, frequency: 'daily', is_active: true, sort_order: 0 },
    { id: 't2', name: '完成作业', description: '认真独立完成作业', emoji: '📝', category: '学习', stars: 6, frequency: 'weekday', is_active: true, sort_order: 1 },
    { id: 't3', name: '刷牙洁净', description: '早晚各刷2分钟', emoji: '🦷', category: '习惯', stars: 3, frequency: 'daily', is_active: true, sort_order: 2 },
    { id: 't4', name: '早睡早起', description: '按时上床不赖床', emoji: '💤', category: '习惯', stars: 3, frequency: 'daily', is_active: true, sort_order: 3 },
    { id: 't5', name: '帮忙做家务', description: '帮爸爸妈妈做家务', emoji: '🧹', category: '品德', stars: 4, frequency: 'daily', is_active: true, sort_order: 4 },
    { id: 't6', name: '户外运动', description: '跑步/骑车/跳绳', emoji: '🏃', category: '运动', stars: 5, frequency: 'daily', is_active: true, sort_order: 5 },
  ],
  rewards: [
    { id: 'r1', name: '看动画片', emoji: '📺', cost: 20, is_active: true, sort_order: 0 },
    { id: 'r2', name: '吃冰淇淋', emoji: '🍦', cost: 30, is_active: true, sort_order: 1 },
    { id: 'r3', name: '去公园玩', emoji: '🏞️', cost: 50, is_active: true, sort_order: 2 },
    { id: 'r4', name: '买新玩具', emoji: '🎮', cost: 80, is_active: true, sort_order: 3 },
  ],
  templates: [],
}

App({
  globalData: {
    parent: null,
    children: [],
    curChild: null,
    tasks: [],
    rewards: [],
    templates: [],
    isGuest: false,
  },

  onLaunch() {
    this.initSession()
  },

  async initSession() {
    try {
      const parent = await auth.restoreSession()
      if (!parent) {
        wx.reLaunch({ url: '/pages/auth/auth' })
        return
      }
      this.globalData.parent = parent
      this.globalData.isGuest = false
      await this.loadCoreData()

      if (!this.globalData.children.length) {
        wx.reLaunch({ url: '/pages/wizard/wizard' })
      } else {
        const cid = wx.getStorageSync('yappi_cid')
        this.globalData.curChild =
          this.globalData.children.find((c) => c.id === cid) ||
          this.globalData.children[0]
        wx.reLaunch({ url: '/pages/home/home' })
      }
    } catch (e) {
      wx.reLaunch({ url: '/pages/auth/auth' })
    }
  },

  enterGuestMode() {
    this.globalData.isGuest = true
    this.globalData.parent = GUEST_DATA.parent
    this.globalData.curChild = GUEST_DATA.curChild
    this.globalData.children = GUEST_DATA.children
    this.globalData.tasks = GUEST_DATA.tasks
    this.globalData.rewards = GUEST_DATA.rewards
    this.globalData.templates = GUEST_DATA.templates
    wx.reLaunch({ url: '/pages/home/home' })
  },

  async loadCoreData() {
    const pid = this.globalData.parent.id
    const [children, tasks, rewards, templates] = await Promise.all([
      db.getChildren(pid),
      db.getTasks(pid),
      db.getRewards(pid),
      db.getTemplates(pid),
    ])
    this.globalData.children = children || []
    this.globalData.tasks = tasks || []
    this.globalData.rewards = rewards || []
    this.globalData.templates = templates || []
  },
})
