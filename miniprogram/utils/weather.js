// utils/weather.js — 通过云函数请求和风天气（Key 放在云开发环境变量，不暴露在前端）

function callWeather(lat, lng, type) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getWeather',
      data: { lat, lng, type },
      success: res => {
        const data = res.result
        console.log('天气云函数返回:', JSON.stringify(data))
        if (data && data.code === '200') {
          resolve(data)
        } else {
          reject(new Error((data && (data.msg || data.code)) || '天气数据异常'))
        }
      },
      fail: err => {
        console.error('天气云函数 fail:', err)
        reject(new Error(err.errMsg || '云函数调用失败，请确认已上传并部署 getWeather'))
      }
    })
  })
}

async function getNowWeather(lat, lng) {
  const data = await callWeather(lat, lng, 'now')
  const now = data.now
  return {
    temp: now.temp,
    text: now.text,
    icon: now.icon,
    humidity: now.humidity,
    windScale: now.windScale,
    vis: now.vis
  }
}

/** 批量实时天气，locations: [{ id, lat, lng }] → { [id]: { temp, text, icon } } */
function getBatchNowWeather(locations) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getWeather',
      data: { batch: true, locations },
      success: res => {
        const data = res.result
        if (data && data.code === '200' && data.data) {
          resolve(data.data)
        } else {
          reject(new Error((data && (data.msg || data.code)) || '批量天气异常'))
        }
      },
      fail: err => reject(new Error(err.errMsg || '云函数调用失败'))
    })
  })
}

async function get15DForecast(lat, lng) {
  const data = await callWeather(lat, lng, '7d')
  return (data.daily || []).map(d => ({
    fxDate: d.fxDate,
    tempMax: d.tempMax,
    tempMin: d.tempMin,
    textDay: d.textDay,
    iconDay: d.iconDay
  }))
}

function iconCodeToClass(code) {
  const c = Number(code)
  if (c === 100) return 'ti-sun'
  if ([101, 102, 103].includes(c)) return 'ti-cloud-sun'
  if (c === 104) return 'ti-cloud'
  if (c >= 300 && c <= 313) return 'ti-cloud-rain'
  if (c >= 314 && c <= 399) return 'ti-cloud-storm'
  if (c >= 400 && c <= 499) return 'ti-snowflake'
  if (c >= 500 && c <= 599) return 'ti-mist'
  return 'ti-cloud'
}

module.exports = { getNowWeather, getBatchNowWeather, get15DForecast, iconCodeToClass }
