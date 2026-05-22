// pages/index/index.js
const mountains = require("../../data/mountains.js")
const { getCheckins, getFavorites, toggleFavorite } = require("../../utils/storage.js")
const { getNowWeather, iconCodeToClass } = require("../../utils/weather.js")

const WEATHER_CONCURRENCY = 3

const TAG_COLOR = {
  "五岳": "green",
  "四大佛山": "purple",
  "世界遗产": "teal",
  "5A景区": "blue",
  "雪山冰川": "amber",
  "道教名山": "coral"
}

function getBgColor(tags) {
  for (const t of tags) {
    if (TAG_COLOR[t]) return TAG_COLOR[t]
  }
  return "gray"
}

const ALL_TAGS = ["全部", "五岳", "四大佛山", "世界遗产", "5A景区", "雪山冰川", "道教名山", "已打卡"]

Page({
  data: {
    tags: ALL_TAGS,
    activeTag: "全部",
    sortBy: "default",
    allList: [],
    filteredList: [],
    loadError: ""
  },

  onLoad() {
    try {
      this.initList()
      this.loadCardWeathers()
    } catch (e) {
      console.error("首页加载失败", e)
      this.setData({ loadError: "页面加载失败，请重新编译" })
    }
  },

  onShow() {
    this.refreshStatus()
  },

  initList() {
    const checkins = getCheckins()
    const favorites = getFavorites()
    const list = mountains.map(m => ({
      ...m,
      bgColor: getBgColor(m.tags),
      checkedIn: checkins.includes(m.id),
      favorited: favorites.includes(m.id),
      weather: { text: "加载中", temp: "--", icon: "ti-cloud" },
      imageLoaded: false
    }))
    this.setData({ allList: list })
    this.applyFilter()
  },

  // 与详情页相同：逐座调用云函数，加载完一张更新一张（避免批量云函数超时）
  async loadCardWeathers() {
    if (this._loadingWeather) return
    this._loadingWeather = true

    const snapshot = this.data.allList.slice()
    let ptr = 0

    const worker = async () => {
      while (ptr < snapshot.length) {
        const m = snapshot[ptr++]
        let weather
        try {
          const now = await getNowWeather(m.coords.lat, m.coords.lng)
          weather = {
            text: now.text,
            temp: now.temp,
            icon: iconCodeToClass(now.icon)
          }
        } catch (e) {
          console.error(`卡片天气 ${m.name}:`, e.message)
          weather = { text: "暂无", temp: "--", icon: "ti-cloud" }
        }
        this.patchCardWeather(m.id, weather)
      }
    }

    try {
      await Promise.all(
        Array.from({ length: WEATHER_CONCURRENCY }, () => worker())
      )
    } finally {
      this._loadingWeather = false
    }
  },

  patchCardWeather(id, weather) {
    const patch = list => list.map(m => (m.id === id ? { ...m, weather } : m))
    this.setData({
      allList: patch(this.data.allList),
      filteredList: patch(this.data.filteredList)
    })
  },

  refreshStatus() {
    const checkins = getCheckins()
    const favorites = getFavorites()
    const updated = this.data.allList.map(m => ({
      ...m,
      checkedIn: checkins.includes(m.id),
      favorited: favorites.includes(m.id)
    }))
    this.setData({ allList: updated })
    this.applyFilter()
  },

  applyFilter() {
    const { allList, activeTag, sortBy } = this.data
    const checkins = getCheckins()
    let list = activeTag === "全部"
      ? allList
      : activeTag === "已打卡"
        ? allList.filter(m => checkins.includes(m.id))
        : allList.filter(m => m.tags.includes(activeTag))

    if (sortBy === "altitude") {
      list = [...list].sort((a, b) => b.altitude - a.altitude)
    }
    this.setData({ filteredList: list })
  },

  onTagTap(e) {
    this.setData({ activeTag: e.currentTarget.dataset.tag })
    this.applyFilter()
  },

  sortToggle() {
    const sortBy = this.data.sortBy === "default" ? "altitude" : "default"
    this.setData({ sortBy })
    this.applyFilter()
  },

  toggleFav(e) {
    const { id } = e.currentTarget.dataset
    toggleFavorite(id)
    this.refreshStatus()
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  onImageLoad(e) {
    const { id } = e.currentTarget.dataset
    const patch = list => list.map(m => (m.id === id ? { ...m, imageLoaded: true } : m))
    this.setData({
      allList: patch(this.data.allList),
      filteredList: patch(this.data.filteredList)
    })
  },

  onImageError(e) {
    const { id } = e.currentTarget.dataset
    const patch = list => list.map(m => (m.id === id ? { ...m, imageLoaded: true } : m))
    this.setData({
      allList: patch(this.data.allList),
      filteredList: patch(this.data.filteredList)
    })
  }
})
