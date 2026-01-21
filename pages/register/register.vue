<template>
  <view class="container">
    <view class="header">
      <text class="title">创建账号</text>
    </view>
    
    <view class="form-item">
      <input class="input" v-model="formData.username" placeholder="请输入用户名" />
    </view>
    
    <view class="form-item">
      <input class="input" type="password" v-model="formData.password" placeholder="请输入密码 (8-20位，含字母数字)" />
    </view>

    <view class="form-item">
        <input class="input" type="password" v-model="formData.confirmPassword" placeholder="请确认密码" />
      </view>
    
    <button class="btn-primary" @click="handleRegister" :loading="loading">注册</button>
    
    <view class="footer">
      <text class="link" @click="goBack">已有账号？去登录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

const loading = ref(false);

const handleRegister = async () => {
    // 基础校验
  if (!formData.username || !formData.password) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }

  // 密码一致性校验
  if (formData.password !== formData.confirmPassword) {
      uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return;
  }

  // 密码复杂度前端预校验 (Cloud object also checks this)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,20}$/;
  if (!passwordRegex.test(formData.password)) {
    uni.showToast({ title: '密码需8-20位且包含字母和数字', icon: 'none' });
    return;
  }
  
  loading.value = true;
  try {
    const fzhUser = uniCloud.importObject('fzh-user');
    const res = await fzhUser.register({
      username: formData.username,
      password: formData.password
    });
    
    if (res.uid) {
      uni.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => {
        // 注册成功后返回登录页，自动填入账号
        uni.navigateBack();
      }, 1500);
    }
  } catch (e) {
    uni.showToast({ title: e.message || '注册失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
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
