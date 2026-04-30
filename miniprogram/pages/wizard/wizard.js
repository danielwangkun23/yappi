const db = require('../../utils/supabase')
const { AVATARS, CATS, DEFAULT_REWARDS } = require('../../utils/constants')

Page({
  data: {
    step: 1,
    childName: '',
    avatars: AVATARS,
    selAvatar: AVATARS[0],
    templates: [],
    tplCats: ['全部', ...CATS],
    activeTplCat: '全部',
    filteredTpls: [],
    selTplIds: [],
    loading: false,
  },

  onLoad() {
    const templates = getApp().globalData.templates.filter((t) => t.is_builtin)
    this.setData({ templates, filteredTpls: templates })
  },

  onNameInput(e) {
    this.setData({ childName: e.detail.value })
  },

  onSelectAvatar(e) {
    this.setData({ selAvatar: e.currentTarget.dataset.avatar })
  },

  onNextStep() {
    if (!this.data.childName.trim()) {
      wx.showToast({ title: '请输入孩子的名字', icon: 'none' })
      return
    }
    this.setData({ step: 2 })
  },

  onFilterTplCat(e) {
    const cat = e.currentTarget.dataset.cat
    const { templates } = this.data
    const filtered = cat === '全部' ? templates : templates.filter((t) => t.category === cat)
    this.setData({ activeTplCat: cat, filteredTpls: filtered })
  },

  onToggleTpl(e) {
    const id = e.currentTarget.dataset.id
    let { selTplIds } = this.data
    if (selTplIds.includes(id)) {
      selTplIds = selTplIds.filter((x) => x !== id)
    } else {
      selTplIds = [...selTplIds, id]
    }
    this.setData({ selTplIds })
  },

  async onFinish() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const app = getApp()
      const parentId = app.globalData.parent.id
      const name = this.data.childName.trim() || '小宝贝'

      // 创建孩子
      const childRows = await db.createChild(parentId, name, this.data.selAvatar)
      const child = Array.isArray(childRows) ? childRows[0] : childRows

      // 从选中模板创建任务
      if (this.data.selTplIds.length > 0) {
        const selTpls = this.data.templates.filter((t) => this.data.selTplIds.includes(t.id))
        for (let i = 0; i < selTpls.length; i++) {
          const t = selTpls[i]
          await db.createTask({
            parent_id: parentId,
            name: t.name,
            description: t.description,
            emoji: t.emoji,
            category: t.category,
            stars: t.stars,
            frequency: t.frequency,
            sort_order: i,
          })
        }
      }

      // 创建默认奖励
      for (const r of DEFAULT_REWARDS) {
        await db.createReward({ parent_id: parentId, ...r })
      }

      // 刷新全局数据
      await app.loadCoreData()
      app.globalData.curChild = app.globalData.children.find((c) => c.id === child.id) || app.globalData.children[0]
      wx.setStorageSync('yappi_cid', app.globalData.curChild.id)

      wx.reLaunch({ url: '/pages/home/home' })
    } catch (e) {
      wx.showToast({ title: '设置失败，请重试', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onSkip() {
    this.onFinish()
  },
})
