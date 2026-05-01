<template>
  <view class="page-container">
    <view class="nav-bar">
        <text class="nav-title">{{ type === 'wine' ? '酒水列表' : '香烟列表' }} ({{ totalCount }})</text>
    </view>

    <scroll-view scroll-y class="list-scroll" :scroll-into-view="currentAnchor" scroll-with-animation>
        <view v-for="(group, index) in groupedList" :key="group.letter" :id="'anchor-' + group.letter">
            <!-- 字母分割标题 -->
            <view class="section-header">
                <text class="section-letter">{{ group.letter }}</text>
            </view>
            
            <!-- 商品卡片 -->
            <view class="card-list">
                <view 
                    class="good-card" 
                    v-for="(item, i) in group.list" 
                    :key="item._id"
                    @click="goToDetail(item)"
                    hover-class="card-hover"
                >
                    <view class="card-content">
                        <view class="card-row-top">
                            <text class="good-name">{{ item.name }}</text>
                        </view>
                        <view class="card-row-bottom">
                            <!-- 酒水的价格展示 -->
                            <view class="price-box" v-if="type === 'wine' && (item.wholesale_price || item.wholesale_price === 0)">
                                <text class="label">批发</text>
                                <text class="value-price">¥{{ item.wholesale_price }}</text>
                            </view>
                            
                            <!-- 香烟显示公司价格和零售价格 -->
                            <view class="price-box" v-if="type === 'cigarette' && (item.company_price || item.company_price === 0)">
                                <text class="label">公司价</text>
                                <text class="value-price">¥{{ item.company_price }}</text>
                            </view>
                            <view class="price-box" style="margin-left: 30rpx;" v-if="type === 'cigarette' && (item.retail_price || item.retail_price === 0)">
                                <text class="label">零售价</text>
                                <text class="value-price">¥{{ item.retail_price }}</text>
                            </view>
                        </view>
                    </view>
                    <text class="arrow">›</text>
                </view>
            </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="loading" class="loading-state">
            <text>加载中...</text>
        </view>
        <view v-if="!loading && groupedList.length === 0" class="empty-state">
            <text>暂无数据</text>
        </view>
    </scroll-view>

    <!-- 侧边字母导航 (可选) -->
    <view class="side-bar" v-if="groupedList.length > 0">
        <view 
            class="side-item" 
            v-for="group in groupedList" 
            :key="group.letter"
            @click="scrollTo(group.letter)"
        >
            {{ group.letter }}
        </view>
    </view>
  </view>
</template>

<script>
import { pinyin } from 'pinyin-pro';

export default {
    data() {
        return {
            type: 'cigarette', // cigarette | wine
            list: [],
            groupedList: [], // [{ letter: 'A', list: [] }]
            totalCount: 0,
            loading: true,
            currentAnchor: ''
        };
    },
    onLoad(options) {
        if (options.type) {
            this.type = options.type;
        }
    },
    onShow() {
        // 每次显示时刷新数据（确保数据最新）
        // 如果未登录，则不加载，交给 App.vue 或者 main.js 处理跳转，避免报错
        if (uni.$checkLogin && !uni.$checkLogin()) return;
        
        this.fetchData();
    },
    methods: {
        async fetchData() {
            this.loading = true;
            try {
                const cloudObj = uniCloud.importObject(this.type === 'wine' ? 'fzh-wine' : 'fzh-cigarette');
                const data = await cloudObj.getAll();
                this.list = data;
                this.totalCount = data.length;
                this.processGroups(data);
            } catch (e) {
                console.error(e);
                uni.showToast({ title: '加载失败', icon: 'none' });
            } finally {
                this.loading = false;
            }
        },
        
        processGroups(data) {
            // 1. Group by First Letter of Pinyin
            const groups = {};
            
            data.forEach(item => {
                const letter = this.getFirstLetter(item.name);
                if (!groups[letter]) {
                    groups[letter] = [];
                }
                groups[letter].push(item);
            });

            // 2. Convert to Array and Sort Keys (A-Z, # at end)
            let keys = Object.keys(groups).sort();
            
            // Move '#' to the end if present
            if (keys.includes('#')) {
                keys = keys.filter(k => k !== '#');
                keys.push('#');
            }

            const result = keys.map(key => ({
                letter: key,
                // 3. Sort items within group
                list: groups[key].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
            }));

            this.groupedList = result;
        },

        getFirstLetter(str) {
            if (!str) return '#';
            const firstChar = str[0];
            
            // Build-in check for English
            if (/[a-zA-Z]/.test(firstChar)) return firstChar.toUpperCase();
            
            // Use pinyin-pro for Chinese
            // pattern: 'first', toneType: 'none', type: 'array'
            try {
                const py = pinyin(firstChar, { pattern: 'first', toneType: 'none', type: 'array' });
                if (py && py.length > 0) {
                    const letter = py[0].toUpperCase();
                    if (/[A-Z]/.test(letter)) {
                        return letter;
                    }
                }
            } catch (e) {
                console.error('Pinyin conversion error', e);
            }
            
            return '#';
        },
        
        scrollTo(letter) {
            this.currentAnchor = 'anchor-' + letter;
            uni.showToast({ title: letter, icon: 'none', duration: 500 });
        },
        
        goToDetail(item) {
            const url = this.type === 'wine' 
                ? `/pages/wine/detail?id=${item._id}`
                : `/pages/cigarette/detail?id=${item._id}`;
            uni.navigateTo({ url });
        }
    }
};
</script>

<style lang="scss" scoped>
$bg-color: #F2F2F7;
$card-bg: #FFFFFF;
$text-primary: #000000;
$text-secondary: #8E8E93;
$theme-blue: #007AFF;

.page-container {
    height: 100vh;
    background-color: $bg-color;
    display: flex;
    flex-direction: column;
}

.nav-bar {
    background-color: #fff;
    padding: 20rpx 32rpx;
    border-bottom: 0.5px solid #E5E5EA;
    .nav-title {
        font-size: 34rpx;
        font-weight: 700;
        color: $text-primary;
    }
}

.list-scroll {
    flex: 1;
    overflow: hidden;
}

.section-header {
    padding: 12rpx 32rpx;
    background-color: $bg-color;
    position: sticky;
    top: 0;
    z-index: 10;
    
    .section-letter {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-secondary;
    }
}

.card-list {
    background-color: $card-bg;
}

.good-card {
    display: flex;
    align-items: center;
    padding: 24rpx 32rpx;
    border-bottom: 0.5px solid #E5E5EA;
    
    &:last-child {
        border-bottom: none;
    }
    
    .card-content {
        flex: 1;
        margin-right: 20rpx;
    }
    
    .card-row-top {
        margin-bottom: 12rpx;
        .good-name {
            font-size: 32rpx;
            font-weight: 500;
            color: $text-primary;
        }
    }
    
    .card-row-bottom {
        display: flex;
        align-items: center;
        
        .code-box {
            display: flex;
            align-items: center;
            margin-right: 24rpx;
            background-color: #F2F2F7;
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
            
            .label { font-size: 20rpx; color: $text-secondary; margin-right: 6rpx; }
            .value { font-size: 24rpx; color: $text-primary; font-family: monospace; }
        }
        
        .price-box {
            display: flex;
            align-items: center;
            
            .label { font-size: 20rpx; color: $text-secondary; margin-right: 6rpx; }
            .value-price { font-size: 26rpx; color: #FF3B30; font-weight: 600; }
        }
    }
    
    .arrow {
        font-size: 36rpx;
        color: #C7C7CC;
    }
}

.card-hover {
    background-color: #F2F2F7;
}

.side-bar {
    position: fixed;
    right: 8rpx;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 20rpx;
    padding: 10rpx 4rpx;
    box-shadow: 0 0 10rpx rgba(0,0,0,0.1);
    z-index: 1000;
    
    .side-item {
        font-size: 22rpx;
        color: $theme-blue;
        text-align: center;
        padding: 4rpx 0;                                                                                                                                                                                                                                                                                                                                                                                                                                          
        width: 55rpx;
        font-weight: 600;
    }
}

.loading-state, .empty-state {
    padding: 100rpx 0;
    text-align: center;
    color: $text-secondary;
}
</style>