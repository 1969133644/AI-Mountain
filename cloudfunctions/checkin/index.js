// cloudfunctions/checkin/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async ({ mountain_id, mountain_name, province, location }) => {
  const { OPENID } = cloud.getWXContext()
  // 防重：同一山同一人只打卡一次
  const exist = await db.collection('checkins').where({ _openid: OPENID, mountain_id }).count()
  if (exist.total > 0) return { ok: false, msg: '已打卡过该山岳' }
  const res = await db.collection('checkins').add({
    data: { mountain_id, mountain_name, province, location: location || null, checkin_at: db.serverDate() }
  })
  return { ok: true, id: res._id }
}
