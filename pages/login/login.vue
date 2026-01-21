<template>
  <view class="container">
    <view class="header">
      <text class="title">欢迎登录</text>
    </view>
    
    <view class="form-item">
      <input class="input" v-model="formData.username" placeholder="请输入用户名" />
    </view>
    
    <view class="form-item">
      <input class="input" type="password" v-model="formData.password" placeholder="请输入密码" />
    </view>
    
    <button class="btn-primary" @click="handleLogin" :loading="loading">登录</button>
    
    <view class="footer">
      <text class="link" @click="goToRegister">没有账号？去注册</text>
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

const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  
  loading.value = true;
  try {
    const fzhUser = uniCloud.importObject('fzh-user');
    const res = await fzhUser.login({
      username: formData.username,
      password: formData.password
    });
    
    if (res.token) {
      uni.setStorageSync('uni_id_token', res.token); // 使用常见命名兼容
      uni.setStorageSync('userInfo', res.userInfo);
      uni.showToast({ title: '登录成功', icon: 'success' });
      
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/index/index' });
      }, 1500);
    }
  } catch (e) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/register/register' });
};
</script>

<style lang="scss">
.container {
  padding: 40px 20px;
}
.header {
  margin-bottom: 40px;
  .title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
}
.form-item {
  margin-bottom: 20px;
  .input {
    height: 50px;
    border-bottom: 1px solid #eee;
    font-size: 16px;
  }
}
.btn-primary {
  margin-top: 30px;
  background-color: #007aff;
  color: #fff;
  border-radius: 25px;
}
.footer {
  margin-top: 20px;
  text-align: center;
  .link {
    color: #007aff;
    font-size: 14px;
  }
}
</style>
