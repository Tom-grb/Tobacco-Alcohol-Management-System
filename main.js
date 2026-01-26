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

  // [新增] 全局拦截 uniCloud.importObject，处理 Token 失效
  const originalImportObject = uniCloud.importObject
  uniCloud.importObject = function(name, options) {
      // 默认开启 customUI，防止官方未捕获的错误弹窗干扰用户体验
      options = options || {}
      if (options.customUI === undefined) {
          options.customUI = true
      }

      const obj = originalImportObject.call(uniCloud, name, options)
      return new Proxy(obj, {
          get(target, prop) {
              const val = target[prop]
              if (typeof val === 'function') {
                  return async function(...args) {
                      try {
                          return await val.apply(target, args)
                      } catch (err) {
                           // 确保 err 是对象，防止访问属性报错
                           if (err) {
                               // 检查后端返回的特定错误码 TOKEN_INVALID 或相关错误信息
                               const isAuthError = err.errCode === 'TOKEN_INVALID' || 
                                                  (err.message && (
                                                      err.message.includes('登录校验失败') || 
                                                      err.message.includes('未登录') || 
                                                      err.message.includes('用户不存在')
                                                  ));
                               
                               if (isAuthError) {
                                   console.log('全局拦截到认证失效:', err.message);
                                   uni.showToast({ title: '登录失效，请重新登录', icon: 'none' })
                                   
                                   try {
                                      uni.removeStorageSync('uni_id_token')
                                      uni.removeStorageSync('userInfo')
                                      uni.removeStorageSync('login_expired')
                                   } catch(e) {}
                                   
                                   setTimeout(() => {
                                       uni.reLaunch({ url: '/pages/login/login' })
                                   }, 1500)
                               }
                           }
                           
                           throw err
                      }
                  }
              }
              return val
          }
      })
  }

  return {
    app
  }
}
// #endif