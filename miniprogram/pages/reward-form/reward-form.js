const db = require('../../utils/supabase')
const { REMOJI } = require('../../utils/constants')

Page({
  data: {
    editId: null,
    rewardEmojis: REMOJI,
    form: { name: '', emoji: REMOJI[0], cost: 20 },
  },

  onLoad(options) {
    if (options.id) {
      const reward = getApp().globalData.rewards.find((r) => r.id === options.id)
      if (reward) {
        this.setData({ editId: options.id, form: { name: reward.name, emoji: reward.emoji, cost: reward.cost } })
        wx.setNavigationBarTitle({ title: '编辑奖励' })
      }
    }
  },

  onNameInput(e) { this.setData({ 'form.name': e.detail.value }) },
  onSelectEmoji(e) { this.setData({ 'form.emoji': e.currentTarget.dataset.emoji }) },
  onCostInput(e) { this.setData({ 'form.cost': e.detail.value }) },
  onCostFocus() { this.setData({ 'form.cost': '' }) },
  onCostBlur() { this.setData({ 'form.cost': parseInt(this.data.form.cost) || 20 }) },

  async onSave() {
    const { form, editId } = this.data
    if (!form.name.trim()) { wx.showToast({ title: '请输入奖励名称', icon: 'none' }); return }
    const app = getApp()
    if (editId) {
      await db.updateReward(editId, form)
      app.globalData.rewards = app.globalData.rewards.map((r) => r.id === editId ? { ...r, ...form } : r)
    } else {
      const rows = await db.createReward({ parent_id: app.globalData.parent.id, ...form, sort_order: app.globalData.rewards.length })
      const reward = Array.isArray(rows) ? rows[0] : rows
      app.globalData.rewards = [...app.globalData.rewards, reward]
    }
    wx.showToast({ title: '奖励已保存 ✓', icon: 'none' })
    wx.navigateBack()
  },
})
