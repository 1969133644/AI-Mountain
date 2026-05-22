// pages/search/search.js
const mountains = require('../../data/mountains')
const { getCheckins, getFavorites } = require('../../utils/storage.js')
const TAG_COLOR = { '五岳':'green','四大佛山':'purple','世界遗产':'teal','5A景区':'blue','雪山冰川':'amber','道教名山':'coral' }

const ALL_TAGS = ["全部", "五岳", "四大佛山", "世界遗产", "5A景区", "雪山冰川", "道教名山"]
const FILTER_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'checkedIn', label: '已打卡' },
  { key: 'favorited', label: '已收藏' }
]

function bgColor(tags) { for (const t of tags) { if (TAG_COLOR[t]) return TAG_COLOR[t] } return 'gray' }

Page({
  data: {
    keyword: '',
    results: [],
    activeTag: '全部',
    activeFilter: 'all',
    tags: ALL_TAGS,
    filterOptions: FILTER_OPTIONS,
    showFilter: false
  },

  onLoad() {
    this.search()
  },

  onInput({ detail: { value } }) {
    const kw = value.trim()
    this.setData({ keyword: kw })
    this.search()
  },

  search() {
    const { keyword, activeTag, activeFilter } = this.data
    const checkins = getCheckins()
    const favorites = getFavorites()
    
    let results = mountains.filter(m => {
      // 关键词筛选
      if (keyword) {
        const kw = keyword.toLowerCase()
        if (!m.name.includes(keyword) &&
            !m.province.includes(keyword) &&
            !m.city.includes(keyword) &&
            !m.mountain_system.includes(keyword) &&
            !m.tags.some(t => t.includes(keyword))) {
          return false
        }
      }
      
      // 标签筛选
      if (activeTag !== '全部' && !m.tags.includes(activeTag)) {
        return false
      }
      
      // 状态筛选
      if (activeFilter === 'checkedIn' && !checkins.includes(m.id)) {
        return false
      }
      if (activeFilter === 'favorited' && !favorites.includes(m.id)) {
        return false
      }
      
      return true
    }).map(m => ({
      ...m,
      bgColor: bgColor(m.tags),
      checkedIn: checkins.includes(m.id),
      favorited: favorites.includes(m.id),
      imageLoaded: false
    }))
    
    this.setData({ results })
  },

  clearInput() {
    this.setData({ keyword: '' })
    this.search()
  },

  onCancel() {
    // 取消全部筛选条件
    this.setData({
      keyword: '',
      activeTag: '全部',
      activeFilter: 'all',
      showFilter: false
    })
    this.search()
    wx.navigateBack()
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ activeTag: tag })
    this.search()
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ activeFilter: filter })
    this.search()
  },

  toggleFilterPanel() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goBack() {
    wx.navigateBack()
  },

  onImageLoad(e) {
    const { id } = e.currentTarget.dataset
    const results = this.data.results.map(m => (m.id === id ? { ...m, imageLoaded: true } : m))
    this.setData({ results })
  }
})
