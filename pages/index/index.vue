<template>
  <view class="page-container">
    <!-- 顶部区域：搜索与导航 -->
    <view class="sticky-header" :class="{ 'search-active': isSearchMode }">
      <!-- 只有在非搜索模式下才显示的大标题 -->
      <view class="header-title-bar" :style="{ opacity: isSearchMode ? 0 : 1, height: isSearchMode ? '0px' : 'auto' }">
        <text class="large-title">工作台</text>
        <view class="user-profile-wrapper">
             <!-- 退出按钮 -->
             <view class="logout-btn" :class="{ 'show': showLogout }" @click.stop="handleLogout">
                 <text>退出</text>
             </view>
             
             <view class="user-profile" @click.stop="toggleLogout">
                <!-- 模拟头像 -->
                <view class="avatar-circle">丰</view>
            </view>
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
            confirm-type="search"
            @focus="enterSearchMode"
            @input="onInput"
            @confirm="onConfirm"
            v-model="keyword"
          />
        </view>
        
        <!-- 取消按钮，点击搜索框时出现 -->
        <text class="cancel-btn" @click="exitSearchMode">取消</text>
      </view>
    </view>

    <!-- 搜索模式下的覆盖层 -->
    <view class="search-overlay" v-if="isSearchMode">
        
        <!-- 搜索历史 (当没有输入内容且有历史记录时显示) -->
        <view class="history-section" v-if="!keyword && historyList.length > 0">
            <view class="section-header-row">
                <text class="section-subtitle">历史搜索</text>
                <text class="trash-icon" @click="clearHistory">🗑️</text>
            </view>
            <view class="history-tags">
                <view 
                    class="tag" 
                    v-for="(item, index) in historyList" 
                    :key="index"
                    @click="onHistoryTagClick(item)"
                >
                    {{ item }}
                </view>
            </view>
        </view>

        <!-- 搜索结果列表 -->
        <scroll-view scroll-y class="result-list" v-if="keyword">
            <view 
                class="result-item" 
                v-for="item in searchResult" 
                :key="item._id"
                @click="goToDetail(item._id)"
            >
                <!-- 左侧标签 -->
                <view class="category-tag tag-cigarette">
                    <text>烟</text>
                </view>
                
                <!-- 中间信息 -->
                <view class="item-info">
                    <text class="item-name">{{ item.name }}</text>
                    <text class="item-code">{{ item.company_code }}</text>
                </view>
                
                <!-- 右侧价格 -->
                <view class="item-price">
                    <text class="price-label">批发价</text>
                    <text class="price-value">¥{{ item.wholesale_price }}</text>
                </view>
            </view>
            
            <!-- 空状态 -->
            <view class="empty-search-state" v-if="searchResult.length === 0 && !searching">
                <text class="empty-text">未找到相关商品</text>
            </view>
        </scroll-view>

        <!-- 初始空状态提示 (仅当无历史且无输入时) -->
        <view class="empty-search-state" v-if="!keyword && historyList.length === 0">
            <text class="empty-text">输入关键词搜索商品</text>
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
          <text class="grid-desc">品类管理</text>
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
      keyword: '',
      showLogout: false,
      historyList: [],
      searchResult: [],
      searching: false,
      searchTimer: null
    };
  },
  onLoad() {
      // 加载搜索历史
      const history = uni.getStorageSync('search_history');
      if (history) {
          this.historyList = JSON.parse(history);
      }
  },
  onShow() {
      // 如果处于搜索模式且有关键词，每次显示页面时刷新搜索结果
      // 这里的场景主要是：用户点击某个商品进入详情页，进行了编辑或删除操作，返回来时需要更新列表
      if (this.isSearchMode && this.keyword) {
          this.doSearch(this.keyword, false);
      }
  },
  methods: {
    toggleLogout() {
        this.showLogout = !this.showLogout;
    },
    handleLogout() {
        uni.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    // 清理缓存
                    uni.removeStorageSync('uni_id_token');
                    uni.removeStorageSync('userInfo');
                    uni.removeStorageSync('login_expired');
                    
                    // 重置状态
                    this.showLogout = false;
                    
                    // 跳转回登录页
                    uni.reLaunch({
                        url: '/pages/login/login'
                    });
                }
            }
        });
    },
    enterSearchMode() {
      this.isSearchMode = true;
      this.showLogout = false; // 进入搜索模式时隐藏退出按钮
      // 可以在这里隐藏tabbar，视觉效果更好
      uni.hideTabBar();
    },
    exitSearchMode() {
      this.isSearchMode = false;
      this.keyword = '';
      this.searchResult = [];
      uni.showTabBar();
      // 收起键盘
      uni.hideKeyboard();
    },
    onInput(e) {
        const val = e.detail.value;
        this.keyword = val;
        
        if (!val) {
            this.searchResult = [];
            return;
        }
        
        // 防抖搜索 (不存历史)
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.doSearch(val, false);
        }, 500);
    },
    onConfirm(e) {
        const val = this.keyword;
        if(val) {
           this.doSearch(val, true);
        }
    },
    async doSearch(kw, saveHistory = false) {
        if (!kw) return;
        this.searching = true;
        try {
            const fzhCigarette = uniCloud.importObject('fzh-cigarette');
            const res = await fzhCigarette.search(kw);
            this.searchResult = res || [];
            
            // 只有点击搜索按钮时才记录历史
            if (saveHistory) {
                this.addToHistory(kw);
            }
            
        } catch (e) {
            console.error(e);
        } finally {
            this.searching = false;
        }
    },
    addToHistory(kw) {
        // 移除已存在的
        const idx = this.historyList.indexOf(kw);
        if (idx > -1) {
            this.historyList.splice(idx, 1);
        }
        // 插入头部
        this.historyList.unshift(kw);
        // 限制长度
        if (this.historyList.length > 10) {
            this.historyList.pop();
        }
        uni.setStorageSync('search_history', JSON.stringify(this.historyList));
    },
    clearHistory() {
        uni.showModal({
            title: '提示',
            content: '确定清空搜索历史吗？',
            success: (res) => {
                if (res.confirm) {
                    this.historyList = [];
                    uni.removeStorageSync('search_history');
                }
            }
        });
    },
    onHistoryTagClick(tag) {
        this.keyword = tag;
        this.doSearch(tag);
    },
    goToDetail(id) {
        uni.navigateTo({
            url: `/pages/cigarette/detail?id=${id}`
        });
    },
    // 功能占位函数
    handleImport() {
      uni.showToast({ title: '点击了导入单据', icon: 'none' });
    },
    handleAddCigarette() {
      uni.navigateTo({
        url: '/pages/cigarette/detail'
      });
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

.user-profile-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.logout-btn {
    position: absolute;
    right: 110%; /* 头像左侧 */
    background-color: #FF3B30;
    color: white;
    padding: 10rpx 24rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(20rpx);
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 4rpx 12rpx rgba(255, 59, 48, 0.2);
    
    &.show {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
    }
    
    /* 小三角指示 */
    &::after {
        content: '';
        position: absolute;
        top: 50%;
        right: -8rpx;
        transform: translateY(-50%);
        border-width: 8rpx 0 8rpx 8rpx;
        border-style: solid;
        border-color: transparent transparent transparent #FF3B30;
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
    flex-direction: column; /* Use column layout */
    justify-content: flex-start; /* Start from top */
    padding-top: 20rpx;
    
    .empty-search-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .empty-text {
            color: $text-secondary;
            font-size: 32rpx;
        }
    }
}

/* History Section */
.history-section {
    width: 100%;
    padding: 0 32rpx;
    margin-bottom: 40rpx;
    box-sizing: border-box;
    
    .section-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24rpx;
        
        .section-subtitle {
            font-size: 30rpx;
            font-weight: 600;
            color: $text-primary;
        }
        
        .trash-icon {
            font-size: 36rpx;
            padding: 10rpx;
            color: $text-secondary;
        }
    }
    
    .history-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        
        .tag {
            background-color: #F2F2F7; // Slightly darker than white
            color: $text-primary;
            padding: 12rpx 28rpx;
            border-radius: 30rpx;
            font-size: 28rpx;
            display: inline-block;
        }
    }
}

/* Result List */
.result-list {
    flex: 1;
    width: 100%;
    height: 100%; // Fill available space
    background-color: $bg-color;
}

.result-item {
    background-color: $card-bg;
    padding: 24rpx 32rpx;
    margin-bottom: 2rpx; /* Slight separator */
    display: flex;
    align-items: center;
    
    &:active {
        background-color: #E5E5EA;
    }
    
    .category-tag {
        width: 60rpx; // Square-ish or rounded rect
        height: 60rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        font-size: 26rpx;
        font-weight: bold;
        color: #fff;
        
        &.tag-cigarette {
            background-color: #FF9500; // Orange for Cigarette
        }
    }
    
    .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        
        .item-name {
            font-size: 32rpx;
            font-weight: 500;
            color: $text-primary;
            margin-bottom: 6rpx;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .item-code {
            font-size: 24rpx;
            color: $text-secondary;
        }
    }
    
    .item-price {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        
        .price-label {
            font-size: 20rpx;
            color: $text-secondary;
            margin-bottom: 4rpx;
        }
        
        .price-value {
            font-size: 32rpx;
            font-weight: 600;
            color: $theme-blue;
        }
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
