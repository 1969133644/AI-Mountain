// pages/detail/detail.js
const mountains = require('../../data/mountains.js')
const { getFavorites, getCheckins, toggleFavorite, toggleCheckin } = require('../../utils/storage.js')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const TAG_COLOR = {
  '五岳': 'green', '四大佛山': 'purple', '世界遗产': 'teal',
  '5A景区': 'blue', '雪山冰川': 'amber', '道教名山': 'coral'
}

function getBgColor(tags) {
  for (const t of tags) { if (TAG_COLOR[t]) return TAG_COLOR[t] }
  return 'gray'
}

function formatLevelText(m) {
  const level = m.level || '未评级'
  if (m.heritage) return `${level} · 双遗产`
  return level
}

function formatCoords(coords) {
  return `${Number(coords.lat).toFixed(2)}°N`
}

Page({
  data: {
    mountain: null,
    imageLoaded: false,
    weather: { now: null, forecast: [] },
    weatherLoading: true,
    weatherError: false
  },

  onLoad({ id }) {
    const raw = mountains.find(m => m.id === id)
    if (!raw) { wx.navigateBack(); return }

    const checkins = getCheckins()
    const favorites = getFavorites()
    this.setData({
      mountain: {
        ...raw,
        bgColor: getBgColor(raw.tags),
        checkedIn: checkins.includes(id),
        favorited: favorites.includes(id),
        levelText: formatLevelText(raw),
        coordsText: formatCoords(raw.coords)
      }
    })

    this.loadWeather(raw)
  },

  async loadWeather(m) {
    this.setData({
      weatherLoading: true,
      weatherError: false,
      weather: { now: null, forecast: [] }
    })
    const { getNowWeather, get15DForecast, iconCodeToClass } = require('../../utils/weather.js')

    let now
    try {
      now = await getNowWeather(m.coords.lat, m.coords.lng)
    } catch (e) {
      console.error('实时天气失败:', e.message)
      this.setData({ weatherLoading: false, weatherError: true })
      wx.showToast({ title: '天气加载失败', icon: 'none' })
      return
    }

    let forecast = []
    try {
      const daily = await get15DForecast(m.coords.lat, m.coords.lng)
      forecast = daily.slice(0, 7).map((d, i) => ({
        date: d.fxDate,
        weekday: i === 0 ? '今' : i === 1 ? '明' : WEEKDAYS[new Date(d.fxDate.replace(/-/g, '/')).getDay()],
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        iconClass: iconCodeToClass(d.iconDay),
        text: d.textDay
      }))
    } catch (e) {
      console.error('预报加载失败:', e.message)
    }

    this.setData({
      weather: { now, forecast },
      weatherLoading: false,
      weatherError: false
    })
  },

  toggleFav() {
    const { mountain } = this.data
    toggleFavorite(mountain.id)
    this.setData({ 'mountain.favorited': !mountain.favorited })
  },

  doCheckin() {
    const { mountain } = this.data
    const wasCheckedIn = mountain.checkedIn
    toggleCheckin(mountain.id)
    this.setData({ 'mountain.checkedIn': !wasCheckedIn })
    if (wasCheckedIn) {
      wx.showToast({ title: `已取消打卡 ${mountain.name}`, icon: 'none' })
    } else {
      wx.showToast({ title: `打卡 ${mountain.name} 成功！`, icon: 'success' })
    }
  },

  onShareAppMessage() {
    const { mountain } = this.data
    return {
      title: `${mountain.name} · 海拔${mountain.altitude}m — 山岳志`,
      path: `/pages/detail/detail?id=${mountain.id}`
    }
  },

  goBack() { wx.navigateBack() },

  onImageLoad() {
    this.setData({ imageLoaded: true })
  }
})
