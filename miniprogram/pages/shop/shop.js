const db = require('../../utils/supabase')

Page({
  data: {
    curChild: {},
    rewards: [],
    redeemedIds: [],
  },

  onShow() {
    const app = getApp()
    this.setData({ curChild: app.globalData.curChild || {} })
    this._loadRedemptions()
  },

  async _loadRedemptions() {
    const { curChild } = this.data
    if (!curChild.id) return
    const rows = await db.getRedemptions(curChild.id)
    const redeemedIds = (rows || []).map((r) => r.reward_id)
    const rewards = (getApp().globalData.rewards || []).map((r) => ({
      ...r,
      redeemed: redeemedIds.includes(r.id),
      cantAfford: (this.data.curChild.stars || 0) < r.cost && !redeemedIds.includes(r.id),
    }))
    this.setData({ rewards, redeemedIds })
  },

  async onRedeem(e) {
    const rid = e.currentTarget.dataset.id
    const { rewards, curChild, redeemedIds } = this.data
    const reward = rewards.find((r) => r.id === rid)
    if (!reward) return

    if (reward.redeemed) {
      wx.showToast({ title: '今天已兑换过啦！', icon: 'none' })
      return
    }
    if ((curChild.stars || 0) < reward.cost) {
      wx.showToast({ title: '星星不够哦，继续加油！💪', icon: 'none' })
      return
    }

    const newStars = curChild.stars - reward.cost
    const updatedChild = { ...curChild, stars: newStars }
    const newRedeemedIds = [...redeemedIds, rid]
    const updatedRewards = rewards.map((r) =>
      r.id === rid ? { ...r, redeemed: true, cantAfford: false } : {
        ...r,
        cantAfford: newStars < r.cost && !newRedeemedIds.includes(r.id),
      }
    )

    this.setData({ curChild: updatedChild, rewards: updatedRewards, redeemedIds: newRedeemedIds })
    getApp().globalData.curChild = updatedChild
    getApp().globalData.children = getApp().globalData.children.map((c) =>
      c.id === curChild.id ? updatedChild : c
    )

    wx.showToast({ title: `成功兑换：${reward.name} 🎉`, icon: 'none' })

    await Promise.all([
      db.createRedemption({
        child_id: curChild.id,
        reward_id: rid,
        reward_name: reward.name,
        stars_cost: reward.cost,
      }),
      db.updateChild(curChild.id, { stars: newStars }),
    ])
  },
})
