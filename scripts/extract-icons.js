const fs = require('fs')
const c = fs.readFileSync('miniprogram/styles/tabler-icons.wxss', 'utf8')
const names = [
  'mountain', 'heart', 'arrow-left', 'map-pin', 'cloud-sun', 'calendar',
  'sun', 'cloud', 'cloud-rain', 'cloud-storm', 'snowflake', 'mist',
  'search', 'settings', 'route', 'map-pin-check', 'share',
  'adjustments-horizontal', 'arrows-sort', 'check', 'x'
]
names.forEach(n => {
  const re = new RegExp(`\\.ti-${n.replace(/-/g, '\\-')}:before\\{content:"(\\\\[^"]+)"`)
  const m = c.match(re)
  console.log(n, m ? m[1] : '?')
})
