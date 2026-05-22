// utils/storage.js — 本地缓存：收藏与打卡
const FAV_KEY = 'mtn_favorites'
const CK_KEY = 'mtn_checkins'

function safeArray(raw) {
  return Array.isArray(raw) ? raw : []
}

function getFavorites() {
  return safeArray(wx.getStorageSync(FAV_KEY))
}

function normalizeCheckins(raw) {
  const list = safeArray(raw)
  return list.map(item =>
    typeof item === 'string' ? { id: item, at: null } : item
  ).filter(item => item && item.id)
}

function getCheckinRecords() {
  return normalizeCheckins(wx.getStorageSync(CK_KEY))
}

function getCheckins() {
  return getCheckinRecords().map(r => r.id)
}

function toggleFavorite(id) {
  const list = getFavorites()
  const idx = list.indexOf(id)
  if (idx === -1) list.push(id)
  else list.splice(idx, 1)
  wx.setStorageSync(FAV_KEY, list)
}

function addCheckin(id) {
  const list = getCheckinRecords()
  if (!list.find(r => r.id === id)) {
    list.push({ id, at: new Date().toISOString().slice(0, 10) })
    wx.setStorageSync(CK_KEY, list)
  }
}

function removeCheckin(id) {
  const list = getCheckinRecords()
  const filtered = list.filter(r => r.id !== id)
  wx.setStorageSync(CK_KEY, filtered)
}

function toggleCheckin(id) {
  const list = getCheckinRecords()
  const idx = list.findIndex(r => r.id === id)
  if (idx === -1) {
    list.push({ id, at: new Date().toISOString().slice(0, 10) })
  } else {
    list.splice(idx, 1)
  }
  wx.setStorageSync(CK_KEY, list)
}

module.exports = {
  getFavorites,
  getCheckins,
  getCheckinRecords,
  toggleFavorite,
  addCheckin,
  removeCheckin,
  toggleCheckin
}
