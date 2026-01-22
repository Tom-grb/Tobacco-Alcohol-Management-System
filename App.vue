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
                setTimeout(() => {
                    // 如果检查函数未定义，说明App可能未初始化完毕，不做处理，避免误判
                    if (typeof uni.$checkLogin !== 'function') return;

                    // 使用 global 挂载的检测函数
                    const isLogin = uni.$checkLogin();
                    
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
                        // 修正：增加对 currentPath 的有效性检测，防止页面栈获取失败导致误跳
                        if (currentPath && !whiteList.includes(currentPath)) {
                             uni.reLaunch({
                                url: '/pages/login/login'
                            })
                        }
                    }
                }, 200) 
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
