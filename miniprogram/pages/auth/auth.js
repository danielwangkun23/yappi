const auth = require('../../utils/auth')
const db = require('../../utils/supabase')

Page({
  data: {
    loading: false,
    step: 'login',   // 'login' | 'register'
    username: '',
    errMsg: '',
    pendingOpenid: '',
  },

  onLoad() {},

  async onWxLogin() {
    if (this.data.loading) return
    this.setData({ loading: true, errMsg: '' })
    try {
      const result = await auth.login()
      if (!result.isNew) {
        // 已有账号，直接进入
        getApp().globalData.isGuest = false
        getApp().globalData.parent = result.parent
        await getApp().loadCoreData()
        const children = getApp().globalData.children
        if (!children.length) {
          wx.reLaunch({ url: '/pages/wizard/wizard' })
        } else {
          const cid = wx.getStorageSync('yappi_cid')
          getApp().globalData.curChild =
            children.find((c) => c.id === cid) || children[0]
          wx.reLaunch({ url: '/pages/home/home' })
        }
      } else {
        // 新用户，进入注册步骤
        this.setData({ step: 'register', pendingOpenid: result.openid })
      }
    } catch (e) {
      this.setData({ errMsg: '登录失败，请重试' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  async onRegister() {
    const username = this.data.username.trim()
    if (!username) {
      this.setData({ errMsg: '请输入昵称' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true, errMsg: '' })
    try {
      const parent = await auth.register(username, this.data.pendingOpenid)
      getApp().globalData.isGuest = false
      getApp().globalData.parent = parent
      wx.reLaunch({ url: '/pages/wizard/wizard' })
    } catch (e) {
      this.setData({ errMsg: '注册失败，昵称可能已被使用' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onBack() {
    this.setData({ step: 'login', errMsg: '', username: '' })
  },

  onGuestMode() {
    getApp().enterGuestMode()
  },
})
