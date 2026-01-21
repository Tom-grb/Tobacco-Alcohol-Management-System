<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.checkLoginState()
		},
		onShow: function() {
			console.log('App Show')
            this.checkLoginState()
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			checkLoginState() {
                // 使用 setTimeout 确保 getCurrentPages 可以获取到路由栈
                // 在 H5 刷新时，onShow 比页面加载早，所以需要短暂延时
                setTimeout(() => {
                    // 使用 global 挂载的检测函数
                    const isLogin = uni.$checkLogin ? uni.$checkLogin() : false
                    
                    const pages = getCurrentPages()
                    let currentPath = ''
                    if (pages.length > 0) {
                        const page = pages[pages.length - 1]
                        currentPath = '/' + (page.route || page.__route__) // 兼容不同平台
                    }
                    
                    // 白名单
                    const whiteList = uni.$whiteList || ['/pages/login/login', '/pages/register/register']

                    if (isLogin) {
                        // 情况1: 已登录
                        // 如果依然停留在登录/注册页，则自动进入首页
                        if (currentPath && whiteList.includes(currentPath)) {
                            uni.reLaunch({
                                url: '/pages/index/index'
                            })
                        }
                    } else {
                        // 情况2: 未登录 (或已过期)
                        // 如果当前页面不是白名单页面，强制回登录页
                        // 如果 currentPath 为空，通常是App刚启动还没渲染完页面，或者默认就是首页(login)，暂时忽略
                        if (currentPath && !whiteList.includes(currentPath)) {
                             uni.reLaunch({
                                url: '/pages/login/login'
                            })
                        }
                    }
                }, 200) // 200ms 延时足够页面栈初始化
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
