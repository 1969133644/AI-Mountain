// cloudfunctions/getWeather/index.js
const cloud = require('wx-server-sdk')
const got = require('got')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const DEFAULT_HOST = 'https://qj2tuqcxxr.re.qweatherapi.com'
const BATCH_CONCURRENCY = 5

async function fetchNow(KEY, HOST, lat, lng) {
  const url = `${HOST}/v7/weather/now`
  const { body } = await got(url, {
    searchParams: { location: `${lng},${lat}`, key: KEY, lang: 'zh', unit: 'm' },
    responseType: 'json',
    timeout: { request: 12000 }
  })
  return body
}

exports.main = async (event) => {
  const KEY = process.env.QWEATHER_KEY
  const HOST = (process.env.QWEATHER_HOST || DEFAULT_HOST).replace(/\/$/, '')

  if (!KEY) {
    return { code: '500', msg: '未配置 QWEATHER_KEY' }
  }

  // 批量：首页卡片一次拉取多座山天气
  if (event.batch && Array.isArray(event.locations)) {
    const data = {}
    let idx = 0
    const list = event.locations

    const worker = async () => {
      while (idx < list.length) {
        const i = idx++
        const { id, lat, lng } = list[i]
        if (lat == null || lng == null) continue
        try {
          const body = await fetchNow(KEY, HOST, lat, lng)
          if (body.code === '200' && body.now) {
            data[id] = {
              temp: body.now.temp,
              text: body.now.text,
              icon: body.now.icon
            }
          }
        } catch (err) {
          console.error(`batch weather ${id}:`, err.message)
        }
      }
    }

    await Promise.all(
      Array.from({ length: BATCH_CONCURRENCY }, () => worker())
    )
    return { code: '200', data }
  }

  const { lat, lng, type = 'now' } = event
  if (lat == null || lng == null) {
    return { code: '400', msg: '缺少 lat / lng' }
  }

  const path = type === '7d' || type === '15d' ? 'weather/7d' : 'weather/now'
  const url = `${HOST}/v7/${path}`

  try {
    const { body } = await got(url, {
      searchParams: { location: `${lng},${lat}`, key: KEY, lang: 'zh', unit: 'm' },
      responseType: 'json',
      timeout: { request: 15000 }
    })
    return body
  } catch (err) {
    console.error('getWeather 请求失败:', err.message)
    return { code: '500', msg: err.message || '和风天气请求失败' }
  }
}
