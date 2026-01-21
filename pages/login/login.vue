<template>
  <view class="page-container">
    <view class="content-wrapper">
      <view class="header-section">
        <text class="title">登录</text>
        <text class="subtitle">欢迎使用烟酒管理系统</text>
      </view>
      
      <view class="form-section">
        <view class="input-wrapper">
          <input 
            class="custom-input" 
            v-model="formData.username" 
            placeholder="用户名" 
            placeholder-class="placeholder-style"
          />
        </view>
        
        <view class="input-wrapper">
          <input 
            class="custom-input" 
            type="password" 
            v-model="formData.password" 
            placeholder="密码" 
            placeholder-class="placeholder-style"
          />
        </view>
      </view>
      
      <view class="action-section">
        <button 
          class="login-btn" 
          hover-class="login-btn-hover" 
          @click="handleLogin" 
          :loading="loading"
        >
          登 录
        </button>
        
        <view class="footer-links">
          <text class="link-text" @click="goToRegister">创建新账号</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';

const formData = reactive({
  username: '',
  password: ''
});

const loading = ref(false);

const goToRegister = () => {
    uni.navigateTo({
        url: '/pages/register/register'
    })
}

const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
  
  loading.value = true;
  try {
    const fzhUser = uniCloud.importObject('fzh-user');
    const res = await fzhUser.login({
      username: formData.username,
      password: formData.password
    });
    
    // console.log('Login res:', res);

    if (res.token) {
      uni.setStorageSync('uni_id_token', res.token);
      uni.setStorageSync('userInfo', res.userInfo);
      
      // 设置1个月的过期时间 (30天 * 24小时 * 60分 * 60秒 * 1000毫秒)
      const expiredTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
      uni.setStorageSync('login_expired', expiredTime);

      uni.showToast({ title: '登录成功', icon: 'success' });
      
      // Delay for toast logic
      setTimeout(() => {
          uni.reLaunch({
              url: '/pages/index/index'
          })
      }, 1500)
    } else {
         // 处理可能的无token情况, 抛出异常由catch捕获
         throw new Error(res.msg || '登录失败');
    }

  } catch (e) {
    console.error(e);
    uni.showToast({
      title: e.errMsg || e.message || '登录失败，请重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
/* 苹果风格设计系统 */
$primary-color: #007AFF; /* Apple System Blue */
$bg-color: #FFFFFF;
$text-main: #1D1D1F;
$text-secondary: #86868B;
$input-bg: #F5F5F7;
$error-color: #FF3B30;

.page-container {
  min-height: 100vh;
  background-color: $bg-color;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.content-wrapper {
  width: 100%;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
}

/* Header Animation */
.header-section {
  margin-bottom: 80rpx;
  animation: fadeInDown 0.8s ease-out;
  
  .title {
    font-size: 64rpx;
    font-weight: 700;
    color: $text-main;
    display: block;
    margin-bottom: 16rpx;
    letter-spacing: -1px;
  }
  
  .subtitle {
    font-size: 30rpx;
    color: $text-secondary;
    font-weight: 400;
  }
}

/* Form Styles */
.form-section {
    width: 100%;
    margin-bottom: 60rpx;
    animation: fadeInUp 0.8s ease-out 0.2s backwards;
}

.input-wrapper {
    margin-bottom: 32rpx;
    
    .custom-input {
        width: 100%;
        height: 112rpx;
        background-color: $input-bg;
        border-radius: 24rpx; /* iOS Squircle-ish */
        padding: 0 32rpx;
        font-size: 34rpx;
        color: $text-main;
        box-sizing: border-box;
        border: 2rpx solid transparent;
        transition: all 0.3s ease;
        
        &:focus {
            background-color: #fff;
            border-color: rgba($primary-color, 0.4);
            box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
        }
    }
}

.placeholder-style {
    color: #aeaeb2;
}

/* Button & Actions */
.action-section {
    animation: fadeInUp 0.8s ease-out 0.4s backwards;
    width: 100%;
}

.login-btn {
    width: 100%;
    height: 108rpx;
    background-color: $primary-color;
    border-radius: 54rpx;
    color: #fff;
    font-size: 34rpx;
    font-weight: 600;
    line-height: 108rpx;
    text-align: center;
    border: none;
    box-shadow: 0 10rpx 30rpx rgba($primary-color, 0.3);
    margin-bottom: 40rpx;
    transition: transform 0.1s scale, box-shadow 0.2s;
    
    &::after {
        border: none;
    }
}

.login-btn-hover {
    transform: scale(0.98);
    box-shadow: 0 6rpx 20rpx rgba($primary-color, 0.25);
    opacity: 0.9;
}

.footer-links {
    display: flex;
    justify-content: center;
    
    .link-text {
        font-size: 28rpx;
        color: $primary-color;
        font-weight: 500;
        padding: 20rpx;
    }
}

/* Keyframe Animations */
@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
