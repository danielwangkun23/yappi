const auth = require('./utils/auth')
const db = require('./utils/supabase')

App({
  globalData: {
    parent: null,
    children: [],
    curChild: null,
    tasks: [],
    rewards: [],
    templates: [],
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
