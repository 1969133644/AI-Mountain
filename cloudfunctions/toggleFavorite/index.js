// cloudfunctions/toggleFavorite/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async ({ mountain_id, action }) => {
  const { OPENID } = cloud.getWXContext()
  if (action === 'add') {
    await db.collection('favorites').add({ data: { mountain_id, created_at: db.serverDate() } })
    return { ok: true, action: 'added' }
  } else {
    await db.collection('favorites').where({ _openid: OPENID, mountain_id }).remove()
    return { ok: true, action: 'removed' }
  }
}
