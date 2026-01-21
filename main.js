import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp(App)
  
  const whiteList = [
      '/pages/login/login',
      '/pages/register/register'
  ]

  function checkLogin() {
      const token = uni.getStorageSync('uni_id_token')
      const expired = uni.getStorageSync('login_expired')
      const now = Date.now()
      
      // 检查是否有token且未过期
      if (token && expired && now < expired) {
          return true
      }
      
      // 验证失败，清理过期数据
      try {
          uni.removeStorageSync('uni_id_token')
          uni.removeStorageSync('userInfo')
          uni.removeStorageSync('login_expired')
      } catch(e) {}
      
      return false
  }

  // 挂载到全局，供 App.vue 使用
  uni.$checkLogin = checkLogin
  uni.$whiteList = whiteList

  const list = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']
  list.forEach(item => {
      uni.addInterceptor(item, {
          invoke(e) {
              const url = e.url.split('?')[0]
              // 检查是否在白名单
              if (whiteList.includes(url)) {
                  return true
              }
              if (!checkLogin()) {
                  uni.reLaunch({
                      url: '/pages/login/login'
                  })
                  return false
              }
              return true
          },
          fail(err) {
              console.log(err)
          }
      })
  })

  return {
    app
  }
}
// #endif