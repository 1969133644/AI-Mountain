// pages/profile/profile.js
const mountains = require('../../data/mountains.js')
const { getCheckinRecords, getFavorites } = require('../../utils/storage.js')

const USER_INFO_KEY = 'mtn_user_info'

const TAG_COLOR = {
  '五岳': 'green', '四大佛山': 'purple', '世界遗产': 'teal',
  '5A景区': 'blue', '雪山冰川': 'amber', '道教名山': 'coral'
}

const PROGRESS_CFG = [
  { name: '五岳', total: 5, color: '#639922' },
  { name: '四大佛山', total: 4, color: '#378ADD' },
  { name: '世界遗产', total: 10, color: '#7F77DD' },
  { name: '雪山冰川', total: 12, color: '#D85A30' }
]

function getBgColor(tags) {
  for (const t of tags) {
    if (TAG_COLOR[t]) return TAG_COLOR[t]
  }
  return 'gray'
}

function buildMountainMap() {
  const map = {}
  mountains.forEach(m => { map[m.id] = m })
  return map
}

function buildAiRecommend(ckMts) {
  const ckIds = {}
  ckMts.forEach(m => { ckIds[m.id] = true })
  const unchecked = mountains.filter(m => !ckIds[m.id])
  if (!unchecked.length || !ckMts.length) return null

  const tagWeight = {}
  ckMts.forEach(m => {
    m.tags.forEach(t => { tagWeight[t] = (tagWeight[t] || 0) + 1 })
  })

  let best = unchecked[0]
  let bestScore = -1
  unchecked.forEach(m => {
    const score = m.tags.reduce((s, t) => s + (tagWeight[t] || 0), 0)
    if (score > bestScore) {
      bestScore = score
      best = m
    }
  })

  return { suggestId: best.id, suggestName: best.name }
}

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    stats: {
      checkinCount: 0,
      favCount: 0,
      provinces: 0,
      systems: 0,
      totalMountains: mountains.length
    },
    checkinList: [],
    progress: [],
    aiRecommend: null
  },

  onShow() {
    try {
      this.loadUserInfo()
      this.buildStats()
    } catch (e) {
      console.error('我的页加载失败', e)
    }
  },

  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync(USER_INFO_KEY)
      if (userInfo && userInfo.nickName) {
        this.setData({ userInfo, isLoggedIn: true })
      } else {
        this.setData({ userInfo: null, isLoggedIn: false })
      }
    } catch (e) {
      console.error('加载用户信息失败', e)
    }
  },

  onLogin(e) {
    const { userInfo } = e.detail
    if (userInfo) {
      wx.setStorageSync(USER_INFO_KEY, userInfo)
      this.setData({ userInfo, isLoggedIn: true })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？打卡记录将保留在本地',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync(USER_INFO_KEY)
          this.setData({ userInfo: null, isLoggedIn: false })
          wx.showToast({ title: '已退出登录', icon: 'none' })
        }
      }
    })
  },

  buildStats() {
    const records = getCheckinRecords()
    const favs = getFavorites()
    const mMap = buildMountainMap()
    const ckMts = records.map(r => mMap[r.id]).filter(Boolean)

    const provinces = {}
    const systems = {}
    ckMts.forEach(m => {
      provinces[m.province] = 1
      systems[m.mountain_system] = 1
    })

    const progress = PROGRESS_CFG.map(cfg => {
      const total = mountains.filter(m => m.tags.indexOf(cfg.name) >= 0).length || cfg.total
      const done = ckMts.filter(m => m.tags.indexOf(cfg.name) >= 0).length
      return {
        ...cfg,
        done,
        total,
        pct: total ? Math.round((done / total) * 100) : 0
      }
    })

    const checkinList = records
      .map(r => {
        const m = mMap[r.id]
        if (!m) return null
        return {
          id: m.id,
          name: m.name,
          province: m.province,
          bgColor: getBgColor(m.tags),
          checkin_at: r.at || '已打卡'
        }
      })
      .filter(Boolean)
      .reverse()

    this.setData({
      stats: {
        checkinCount: records.length,
        favCount: favs.length,
        provinces: Object.keys(provinces).length,
        systems: Object.keys(systems).length,
        totalMountains: mountains.length
      },
      progress,
      checkinList,
      aiRecommend: buildAiRecommend(ckMts)
    })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goRecommend() {
    const { aiRecommend } = this.data
    if (!aiRecommend) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${aiRecommend.suggestId}` })
  }
})
