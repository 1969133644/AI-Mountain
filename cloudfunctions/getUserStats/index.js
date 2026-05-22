// cloudfunctions/getUserStats/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const $ = db.command.aggregate

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const [cks, favs] = await Promise.all([
    db.collection('checkins').where({ _openid: OPENID }).get(),
    db.collection('favorites').where({ _openid: OPENID }).count()
  ])
  return {
    checkins:   cks.data,
    favCount:   favs.total,
    checkinIds: cks.data.map(c => c.mountain_id)
  }
}
