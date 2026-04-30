const db = require('../../utils/supabase')
const { TEMOJI, CATS, FREQS } = require('../../utils/constants')

Page({
  data: {
    editId: null,
    taskEmojis: TEMOJI,
    cats: CATS,
    freqs: FREQS,
    form: { name: '', description: '', emoji: TEMOJI[0], category: '习惯', frequency: 'daily', stars: 3 },
    showTplPicker: false,
    tplCats: ['全部', ...CATS],
    activeTplCat: '全部',
    templates: [],
    filteredTpls: [],
  },

  onLoad(options) {
    const templates = getApp().globalData.templates.filter((t) => t.is_builtin)
    this.setData({ templates, filteredTpls: templates })
    if (options.id) {
      const task = getApp().globalData.tasks.find((t) => t.id === options.id)
      if (task) {
        this.setData({
          editId: options.id,
          form: { name: task.name, description: task.description || '', emoji: task.emoji, category: task.category, frequency: task.frequency, stars: task.stars },
        })
        wx.setNavigationBarTitle({ title: '编辑任务' })
      }
    }
  },

  onNameInput(e) { this.setData({ 'form.name': e.detail.value }) },
  onDescInput(e) { this.setData({ 'form.description': e.detail.value }) },
  onSelectEmoji(e) { this.setData({ 'form.emoji': e.currentTarget.dataset.emoji }) },
  onSelectCat(e) { this.setData({ 'form.category': e.currentTarget.dataset.cat }) },
  onSelectFreq(e) { this.setData({ 'form.frequency': e.currentTarget.dataset.freq }) },
  onStarsInput(e) { this.setData({ 'form.stars': e.detail.value }) },
  onStarsFocus() { this.setData({ 'form.stars': '' }) },
  onStarsBlur() { this.setData({ 'form.stars': parseInt(this.data.form.stars) || 3 }) },

  // ---- 模板选择 ----
  onOpenTplPicker() { this.setData({ showTplPicker: true }) },
  onCloseTplPicker() { this.setData({ showTplPicker: false }) },

  onFilterTplCat(e) {
    const cat = e.currentTarget.dataset.cat
    const { templates } = this.data
    const filteredTpls = cat === '全部' ? templates : templates.filter((t) => t.category === cat)
    this.setData({ activeTplCat: cat, filteredTpls })
  },

  onSelectTpl(e) {
    const id = e.currentTarget.dataset.id
    const tpl = this.data.templates.find((t) => t.id === id)
    if (!tpl) return
    this.setData({
      form: { name: tpl.name, description: tpl.description || '', emoji: tpl.emoji, category: tpl.category, frequency: tpl.frequency, stars: tpl.stars },
      showTplPicker: false,
    })
  },

  async onSave() {
    const { form, editId } = this.data
    if (!form.name.trim()) { wx.showToast({ title: '请输入任务名称', icon: 'none' }); return }
    const app = getApp()
    if (editId) {
      await db.updateTask(editId, { name: form.name, description: form.description, emoji: form.emoji, category: form.category, frequency: form.frequency, stars: form.stars })
      app.globalData.tasks = app.globalData.tasks.map((t) => t.id === editId ? { ...t, ...form } : t)
    } else {
      const rows = await db.createTask({ parent_id: app.globalData.parent.id, ...form, sort_order: app.globalData.tasks.length })
      const task = Array.isArray(rows) ? rows[0] : rows
      app.globalData.tasks = [...app.globalData.tasks, task]
    }
    wx.showToast({ title: '任务已保存 ✓', icon: 'none' })
    wx.navigateBack()
  },
})
