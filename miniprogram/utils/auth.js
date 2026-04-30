// 微信登录 + openid 绑定
const db = require('./supabase')

const EDGE_FN_URL = 'https://xmuzltaebuxhmjzadujn.supabase.co/functions/v1/wx-login'
const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXpsdGFlYnV4aG1qemFkdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTAzNTUsImV4cCI6MjA5Mjk4NjM1NX0.r6T-mhBYLGQS-lM0TmGhSRUZhfnh14eyPkcMfNMUzm8'

// 用 wx.login code 换取 openid
const getOpenid = (code) =>
  new Promise((resolve, reject) => {
    wx.request({
      url: EDGE_FN_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SKEY}`,
      },
      data: { code },
      success: (res) => {
        if (res.data?.openid) resolve(res.data.openid)
        else reject(new Error(res.data?.error || '获取 openid 失败'))
      },
      fail: reject,
    })
  })

// 完整登录流程：wx.login → openid → 查/建 parent
const login = () =>
  new Promise((resolve, reject) => {
    wx.login({
      success: async ({ code }) => {
        try {
          const openid = await getOpenid(code)
          const rows = await db.getParentByOpenid(openid)
          if (rows && rows.length > 0) {
            wx.setStorageSync('yappi_openid', openid)
            wx.setStorageSync('yappi_pid', rows[0].id)
            resolve({ parent: rows[0], isNew: false })
          } else {
            resolve({ openid, isNew: true })
          }
        } catch (e) {
          reject(e)
        }
      },
      fail: reject,
    })
  })

// 注册新账号
const register = async (username, openid) => {
  const rows = await db.createParent(username, openid)
  const parent = Array.isArray(rows) ? rows[0] : rows
  wx.setStorageSync('yappi_openid', openid)
  wx.setStorageSync('yappi_pid', parent.id)
  return parent
}

// 从缓存恢复会话
const restoreSession = async () => {
  const pid = wx.getStorageSync('yappi_pid')
  if (!pid) return null
  const openid = wx.getStorageSync('yappi_openid')
  if (!openid) return null
  const rows = await db.getParentByOpenid(openid)
  return rows && rows.length > 0 ? rows[0] : null
}

const logout = () => {
  wx.removeStorageSync('yappi_pid')
  wx.removeStorageSync('yappi_openid')
  wx.removeStorageSync('yappi_cid')
}

module.exports = { login, register, restoreSession, logout }
