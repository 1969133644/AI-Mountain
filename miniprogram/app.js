// app.js
App({
  onLaunch() {
    try {
      if (wx.cloud && wx.cloud.init) {
        wx.cloud.init({
          env: 'cloud1-d8g7841jkdde845ac',
          traceUser: true
        })
      }
    } catch (e) {
      console.error('云开发初始化失败', e)
    }
  }
})
