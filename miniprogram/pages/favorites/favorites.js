// pages/favorites/favorites.js
const mountains = require('../../data/mountains.js')
const { getFavorites } = require('../../utils/storage.js')

Page({
  data: { list: [] },

  onShow() {
    const favs = getFavorites()
    const list = mountains.filter(m => favs.indexOf(m.id) >= 0)
    this.setData({ list })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  }
})
