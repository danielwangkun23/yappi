// Supabase 客户端封装 - 所有数据库操作集中在此
const SURL = 'https://xmuzltaebuxhmjzadujn.supabase.co'
const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXpsdGFlYnV4aG1qemFkdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTAzNTUsImV4cCI6MjA5Mjk4NjM1NX0.r6T-mhBYLGQS-lM0TmGhSRUZhfnh14eyPkcMfNMUzm8'

// 通用请求封装
const req = (method, path, body) =>
  new Promise((resolve, reject) => {
    wx.request({
      url: `${SURL}/rest/v1/${path}`,
      method,
      header: {
        apikey: SKEY,
        Authorization: `Bearer ${SKEY}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : '',
      },
      data: body,
      success: (res) => resolve(res.data),
      fail: reject,
    })
  })

const get = (path) => req('GET', path)
const post = (path, body) => req('POST', path, body)
const patch = (path, body) => req('PATCH', path, body)
const del = (path) => req('DELETE', path)

// ---- Parents ----
const getParentByOpenid = (openid) =>
  get(`parents?openid=eq.${encodeURIComponent(openid)}&limit=1`)

const createParent = (username, openid) =>
  post('parents', { username, openid, pin: '' })

const updateParentPin = (id, pin) =>
  patch(`parents?id=eq.${id}`, { pin })

// ---- Children ----
const getChildren = (parentId) =>
  get(`children?parent_id=eq.${parentId}&order=created_at`)

const createChild = (parentId, name, avatar) =>
  post('children', { parent_id: parentId, name, avatar, stars: 0, total_stars: 0, streak: 0 })

const updateChild = (id, data) =>
  patch(`children?id=eq.${id}`, data)

const deleteChild = (id) =>
  del(`children?id=eq.${id}`)

// ---- Tasks ----
const getTasks = (parentId) =>
  get(`tasks?parent_id=eq.${parentId}&is_active=eq.true&order=sort_order`)

const createTask = (data) => post('tasks', data)

const updateTask = (id, data) =>
  patch(`tasks?id=eq.${id}`, data)

const softDeleteTask = (id) =>
  patch(`tasks?id=eq.${id}`, { is_active: false })

// ---- Task Templates ----
const getTemplates = (parentId) =>
  get(`task_templates?or=(parent_id.eq.${parentId},is_builtin.eq.true)&order=created_at`)

const createTemplate = (data) => post('task_templates', data)

// ---- Rewards ----
const getRewards = (parentId) =>
  get(`rewards?parent_id=eq.${parentId}&is_active=eq.true&order=sort_order`)

const createReward = (data) => post('rewards', data)

const updateReward = (id, data) =>
  patch(`rewards?id=eq.${id}`, data)

const softDeleteReward = (id) =>
  patch(`rewards?id=eq.${id}`, { is_active: false })

// ---- Task Logs ----
const getTodayLogs = (childId, date) =>
  get(`task_logs?child_id=eq.${childId}&done_date=eq.${date}&select=task_id`)

const getLogCount = (childId) =>
  get(`task_logs?child_id=eq.${childId}&select=id`)

const getLogsByMonth = (childId, start, end) =>
  get(`task_logs?child_id=eq.${childId}&done_date=gte.${start}&done_date=lte.${end}`)

const createLog = (data) => post('task_logs', data)

// ---- Redemptions ----
const getRedemptions = (childId) =>
  get(`redemptions?child_id=eq.${childId}&select=reward_id`)

const getRedemptionsByMonth = (childId, start, end) =>
  get(`redemptions?child_id=eq.${childId}&redeemed_at=gte.${start}&redeemed_at=lte.${end}&order=redeemed_at.desc`)

const createRedemption = (data) => post('redemptions', data)

module.exports = {
  getParentByOpenid, createParent, updateParentPin,
  getChildren, createChild, updateChild, deleteChild,
  getTasks, createTask, updateTask, softDeleteTask,
  getTemplates, createTemplate,
  getRewards, createReward, updateReward, softDeleteReward,
  getTodayLogs, getLogCount, getLogsByMonth, createLog,
  getRedemptions, getRedemptionsByMonth, createRedemption,
}
