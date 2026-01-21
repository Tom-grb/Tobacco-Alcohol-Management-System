<template>
  <view class="page-container">
    <!-- 顶部区域：搜索与导航 -->
    <view class="sticky-header" :class="{ 'search-active': isSearchMode }">
      <!-- 只有在非搜索模式下才显示的大标题 -->
      <view class="header-title-bar" :style="{ opacity: isSearchMode ? 0 : 1, height: isSearchMode ? '0px' : 'auto' }">
        <text class="large-title">工作台</text>
        <view class="user-profile">
            <!-- 模拟头像 -->
            <view class="avatar-circle">A</view>
        </view>
      </view>

      <!-- 搜索栏容器 -->
      <view class="search-bar-container">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            type="text" 
            placeholder="搜索香烟或酒水" 
            placeholder-class="placeholder-text"
            @focus="enterSearchMode"
            v-model="keyword"
          />
        </view>
        
        <!-- 取消按钮，点击搜索框时出现 -->
        <text class="cancel-btn" @click="exitSearchMode">取消</text>
      </view>
    </view>

    <!-- 搜索模式下的覆盖层 -->
    <view class="search-overlay" v-if="isSearchMode">
        <view class="empty-search-state">
            <text class="empty-text">输入关键词开始搜索...</text>
        </view>
    </view>

    <!-- 主展示区域 -->
    <scroll-view scroll-y class="main-content" v-else>
      
      <!-- 核心功能卡片 (导入) -->
      <view class="card-group">
        <view class="action-card primary-card" hover-class="card-hover" @click="handleImport">
          <view class="card-icon-bg icon-blue">
            <text class="emoji-icon">📄</text>
          </view>
          <view class="card-info">
            <text class="card-title">导入烟草单据</text>
            <text class="card-subtitle">支持图片识别与文件导入</text>
          </view>
          <view class="arrow-icon">></view>
        </view>
      </view>

      <!-- Grid 功能区 (添加商品) -->
      <view class="section-header">
        <text class="section-title">商品管理</text>
      </view>
      
      <view class="grid-group">
        <view class="grid-card" hover-class="card-hover" @click="handleAddCigarette">
          <view class="grid-icon-box bg-orange">
            <text class="emoji-large">🚬</text>
          </view>
          <text class="grid-title">添加香烟</text>
          <text class="grid-desc">库存入录</text>
        </view>

        <view class="grid-card" hover-class="card-hover" @click="handleAddWine">
          <view class="grid-icon-box bg-purple">
            <text class="emoji-large">🍷</text>
          </view>
          <text class="grid-title">添加酒水</text>
          <text class="grid-desc">品类管理</text>
        </view>
      </view>

      <!-- 列表功能区 (导出数据) -->
      <view class="section-header">
        <text class="section-title">数据报表</text>
      </view>

      <view class="list-group">
        <view class="list-item" hover-class="list-hover" @click="handleExportCigarette">
          <view class="item-left">
            <view class="small-icon-box bg-green">
              <text class="emoji-small">📊</text>
            </view>
            <text class="item-title">导出香烟数据</text>
          </view>
          <text class="list-arrow">></text>
        </view>
        
        <view class="divider"></view>
        
        <view class="list-item" hover-class="list-hover" @click="handleExportWine">
          <view class="item-left">
            <view class="small-icon-box bg-indigo">
              <text class="emoji-small">📈</text>
            </view>
            <text class="item-title">导出酒水数据</text>
          </view>
          <text class="list-arrow">></text>
        </view>
      </view>
      
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isSearchMode: false,
      keyword: ''
    };
  },
  methods: {
    enterSearchMode() {
      this.isSearchMode = true;
      // 可以在这里隐藏tabbar，视觉效果更好
      uni.hideTabBar();
    },
    exitSearchMode() {
      this.isSearchMode = false;
      this.keyword = '';
      uni.showTabBar();
      // 收起键盘
      uni.hideKeyboard();
    },
    // 功能占位函数
    handleImport() {
      uni.showToast({ title: '点击了导入单据', icon: 'none' });
    },
    handleAddCigarette() {
      uni.showToast({ title: '点击了添加香烟', icon: 'none' });
    },
    handleAddWine() {
      uni.showToast({ title: '点击了添加酒水', icon: 'none' });
    },
    handleExportCigarette() {
      uni.showToast({ title: '点击了导出香烟', icon: 'none' });
    },
    handleExportWine() {
      uni.showToast({ title: '点击了导出酒水', icon: 'none' });
    }
  }
};
</script>

<style lang="scss" scoped>
/* 
  Apple Style Design System 
  Designed for readability, touch targets, and smooth motion.
*/

$bg-color: #F2F2F7;
$card-bg: #FFFFFF;
$text-primary: #1C1C1E;
$text-secondary: #8E8E93;
$theme-blue: #007AFF;
$separator-color: #E5E5EA;

.page-container {
  min-height: 100vh;
  background-color: $bg-color;
  display: flex;
  flex-direction: column;
}

/* Header Styles */
.sticky-header {
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 32rpx 20rpx;
  border-bottom: 0.5px solid rgba(0,0,0,0);
  transition: all 0.3s ease;
  
  &.search-active {
     background-color: $bg-color; // 搜索模式下可以全屏白或者灰色
  }
}

.header-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  overflow: hidden;
  transition: all 0.3s ease;
  
  .large-title {
    font-size: 68rpx;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -1px;
  }
  
  .avatar-circle {
      width: 72rpx;
      height: 72rpx;
      background-color: #E5E5EA;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: $text-secondary;
  }
}

.search-bar-container {
  display: flex;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
}

.search-input-wrapper {
  flex: 1;
  background-color: rgba(118, 118, 128, 0.12);
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  transition: all 0.3s ease;
  
  .search-icon {
    font-size: 32rpx;
    margin-right: 12rpx;
    opacity: 0.5;
  }
  
  .search-input {
    flex: 1;
    font-size: 34rpx;
    height: 100%;
    color: $text-primary;
  }
  
  .placeholder-text {
      color: $text-secondary;
  }
}

.cancel-btn {
  font-size: 34rpx;
  color: $theme-blue;
  margin-left: 20rpx;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(20rpx);
  pointer-events: none; // hidden state
  transition: all 0.3s ease;
  display: none; // hide from layout flow initially
}

/* Search Mode Active State */
.search-active {
    .search-input-wrapper {
        background-color: #fff;
        border: 1px solid $theme-blue;
        box-shadow: 0 0 0 4rpx rgba($theme-blue, 0.2);
    }
    
    .cancel-btn {
        display: block;
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
    }
}

.search-overlay {
    flex: 1;
    background-color: $bg-color;
    display: flex;
    justify-content: center;
    padding-top: 100rpx;
    
    .empty-text {
        color: $text-secondary;
        font-size: 32rpx;
    }
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20rpx 32rpx;
  box-sizing: border-box;
}

/* Common Card Styles */
.section-header {
    margin-top: 48rpx;
    margin-bottom: 16rpx;
    padding-left: 10rpx;
    
    .section-title {
        font-size: 40rpx;
        font-weight: 700;
        color: $text-primary;
    }
}

.card-group, .grid-group, .list-group {
    margin-bottom: 20rpx;
}

/* Action Card (Import) */
.action-card {
    background-color: $card-bg;
    border-radius: 24rpx;
    padding: 32rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.04);
}

.card-icon-bg {
    width: 96rpx;
    height: 96rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    
    &.icon-blue { background-color: rgba(0, 122, 255, 0.1); color: #007AFF; }
    
    .emoji-icon {
        font-size: 48rpx;
    }
}

.card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .card-title {
        font-size: 34rpx;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 8rpx;
    }
    
    .card-subtitle {
        font-size: 26rpx;
        color: $text-secondary;
    }
}

.arrow-icon, .list-arrow {
    font-size: 36rpx;
    color: #C7C7CC;
    font-family: monospace; // 简单模拟箭头
    font-weight: bold;
}

/* Grid System */
.grid-group {
    display: flex;
    justify-content: space-between;
}

.grid-card {
    background-color: $card-bg;
    width: 48%; /* 2 column */
    border-radius: 24rpx;
    padding: 32rpx 24rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start; // 左对齐更现代
    box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.04);
    
    .grid-icon-box {
        width: 80rpx;
        height: 80rpx;
        border-radius: 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24rpx;
        
        &.bg-orange { background-color: rgba(255, 149, 0, 0.1); }
        &.bg-purple { background-color: rgba(175, 82, 222, 0.1); }
        
        .emoji-large { font-size: 40rpx; }
    }
    
    .grid-title {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 6rpx;
    }
    
    .grid-desc {
        font-size: 24rpx;
        color: $text-secondary;
    }
}

/* List Group */
.list-group {
    background-color: $card-bg;
    border-radius: 24rpx;
    overflow: hidden; // for corner clipping
    box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.04);
}

.list-item {
    padding: 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .item-left {
        display: flex;
        align-items: center;
    }
    
    .small-icon-box {
        width: 60rpx;
        height: 60rpx;
        border-radius: 14rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        
        &.bg-green { background-color: rgba(52, 199, 89, 0.1); }
        &.bg-indigo { background-color: rgba(88, 86, 214, 0.1); }
        
        .emoji-small { font-size: 32rpx; }
    }
    
    .item-title {
        font-size: 32rpx;
        color: $text-primary;
        font-weight: 500;
    }
}

.divider {
    height: 1px;
    background-color: $separator-color;
    margin-left: 116rpx; // align with text start
}

.card-hover, .list-hover {
    background-color: #F2F2F7 !important; 
    opacity: 0.9;
}

.bottom-spacer {
    height: 100rpx;
}
</style>
