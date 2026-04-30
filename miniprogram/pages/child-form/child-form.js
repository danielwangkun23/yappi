const db = require('../../utils/supabase')
const { AVATARS } = require('../../utils/constants')

Page({
  data: {
    avatars: AVATARS,
    form: { name: '', avatar: AVATARS[0] },
  },

  onNameInput(e) { this.setData({ 'form.name': e.detail.value }) },
  onSelectAvatar(e) { this.setData({ 'form.avatar': e.currentTarget.dataset.avatar }) },

  async onSave() {
    const { form } = this.data
    if (!form.name.trim()) { wx.showToast({ title: '请输入孩子名字', icon: 'none' }); return }
    const app = getApp()
    const rows = await db.createChild(app.globalData.parent.id, form.name.trim(), form.avatar)
    const child = Array.isArray(rows) ? rows[0] : rows
    app.globalData.children = [...app.globalData.children, child]
    wx.showToast({ title: `${child.name} 已添加 🎉`, icon: 'none' })
    wx.navigateBack()
  },
})
