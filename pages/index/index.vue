<template>
  <view class="page-container" @click="closeGlobalPopups">
    <!-- 顶部区域：搜索与导航 -->
    <view class="sticky-header" :class="{ 'search-active': isSearchMode }">
      <!-- 只有在非搜索模式下才显示的大标题 -->
      <view class="header-title-bar" :style="{ opacity: isSearchMode ? 0 : 1, height: isSearchMode ? '0px' : 'auto', overflow: isSearchMode ? 'hidden' : 'visible' }">
        <text class="large-title">工作台</text>
        <view class="user-profile-wrapper">
             <!-- 退出按钮 -->
             <view class="logout-btn" :class="{ 'show': showLogout }" @click.stop="handleLogout">
                 <text>退出登录</text>
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
        <scroll-view 
            scroll-y 
            class="result-list" 
            v-if="keyword"
            @scrolltolower="onScrollToLower"
        >
            <view 
                class="result-item" 
                v-for="item in searchResult" 
                :key="item._id"
                @click="goToDetail(item)"
            >
                <!-- 左侧标签 -->
                <view :class="['category-tag', item.type === 'wine' ? 'tag-wine' : 'tag-cigarette']">
                    <text>{{ item.type === 'wine' ? '酒' : '烟' }}</text>
                </view>
                
                <!-- 中间信息 -->
                <view class="item-info">
                    <text class="item-name">{{ item.name }}</text>
                    <text class="item-code" v-if="item.type !== 'wine'">{{ item.company_code }}</text>
                </view>
                
                <!-- 右侧价格 (仅香烟显示批发价) -->
                <view class="item-price" v-if="item.type !== 'wine'">
                    <text class="price-label">批发价</text>
                    <text class="price-value">¥{{ item.wholesale_price }}</text>
                </view>
            </view>
            
            <!-- 加载更多提示 -->
            <view class="loading-more-bar" v-if="searchResult.length > 0">
                 <view v-if="isLoadingMore" class="spinner-box">
                     <view class="spinner"></view>
                     <text>正在检索数据...</text>
                 </view>
                 <text v-else class="status-msg">{{ hasMore ? '上拉加载更多' : '— 已显示全部记录 —' }}</text>
            </view>
            
            <!-- 空状态 -->
            <view class="empty-search-state" v-if="searchResult.length === 0 && !searching">
                <text class="empty-icon">🔎</text>
                <text class="empty-text">未找到相关商品</text>
            </view>
        </scroll-view>

        <!-- 初始空状态提示 (仅当无历史且无输入时) -->
        <view class="empty-search-state" v-if="!keyword && historyList.length === 0">
            <text class="empty-icon">⌨️</text>
            <text class="empty-text">输入关键词搜索商品</text>
        </view>
    </view>

    <!-- 主展示区域 -->
    <view  class="main-content" v-else>
      
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
          <view class="arrow-icon">›</view>
        </view>
      </view>

      <!-- 库存概览 -->
      <view class="section-header">
        <text class="section-title">库存概览</text>
      </view>
      
      <view class="grid-group">
        <view class="grid-card" hover-class="card-hover" @click="goToList('cigarette')">
          <view class="grid-icon-box bg-orange">
            <text class="emoji-large">🚬</text>
          </view>
          <view class="grid-text-content">
              <text class="grid-title">香烟列表</text>
              <text class="grid-desc">共 {{counts.cigarette}} 种</text>
          </view>
        </view>

        <view class="grid-card" hover-class="card-hover" @click="goToList('wine')">
          <view class="grid-icon-box bg-purple">
            <text class="emoji-large">🍷</text>
          </view>
          <view class="grid-text-content">
            <text class="grid-title">酒水列表</text>
            <text class="grid-desc">共 {{counts.wine}} 种</text>
          </view>
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
          <text class="list-arrow">›</text>
        </view>
        
        <view class="divider"></view>
        
        <view class="list-item" hover-class="list-hover" @click="handleExportWine">
          <view class="item-left">
            <view class="small-icon-box bg-indigo">
              <text class="emoji-small">📈</text>
            </view>
            <text class="item-title">导出酒水数据</text>
          </view>
          <text class="list-arrow">›</text>
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
          <view class="grid-text-content">
            <text class="grid-title">添加香烟</text>
            <text class="grid-desc">品类管理</text>
          </view>
        </view>

        <view class="grid-card" hover-class="card-hover" @click="handleAddWine">
          <view class="grid-icon-box bg-purple">
            <text class="emoji-large">🍷</text>
          </view>
          <view class="grid-text-content">
            <text class="grid-title">添加酒水</text>
            <text class="grid-desc">品类管理</text>
          </view>
        </view>
      </view>
      
      <view class="bottom-spacer"></view>
      <!-- 底部遮罩层 (香烟导出字段选择) -->
      <view class="modal-mask" v-if="showCigaretteExportModal" @click="closeCigaretteExportModal">
          <view class="modal-content" @click.stop>
              <view class="modal-header">
                  <text class="modal-title">选择导出字段</text>
                  <text class="close-icon" @click="closeCigaretteExportModal">×</text>
              </view>
              <view class="field-list">
                   <view class="field-tip">默认包含：商品名称</view>
                   <view 
                        class="field-item" 
                        v-for="(item, index) in cigaretteFields" 
                        :key="index"
                        @click="toggleField(index)"
                   >
                       <view class="checkbox" :class="{ checked: item.checked }">
                           <text v-if="item.checked" class="check-mark">✓</text>
                       </view>
                       <text class="field-label">{{ item.label }}</text>
                   </view>
              </view>
              <view class="modal-footer">
                  <button class="btn-confirm" @click="doExportCigarette" :disabled="isExporting">
                      {{ isExporting ? '导出中...' : '确认导出' }}
                  </button>
              </view>
          </view>
      </view>

      <!-- 底部遮罩层 (通用下载链接) -->
      <view class="modal-mask" v-if="showDownloadModal" @click="closeDownloadModal">
          <view class="modal-content" @click.stop>
              <view class="modal-header">
                  <text class="modal-title">导出成功</text>
                  <text class="close-icon" @click="closeDownloadModal">×</text>
              </view>
              
              <view class="download-body">
                  <view class="input-wrapper">
                    <input class="url-input" type="text" :value="downloadUrl" disabled />
                  </view>
                  <view class="modal-actions">
                      <button class="action-btn btn-copy" @click="copyDownloadUrl">复制链接</button>
                      <button class="action-btn btn-close" @click="closeDownloadModal">关闭</button>
                  </view>
              </view>
          </view>
      </view>

      <!-- 底部遮罩层 (日期选择) -->
      <view class="modal-mask" v-if="showDateModal" @click="closeDateModal">
          <view class="modal-content" @click.stop>
              <view class="modal-header">
                  <text class="modal-title">选择导出时间段</text>
                  <text class="close-icon" @click="closeDateModal">×</text>
              </view>
              <view class="date-picker-group">
                  <view class="picker-item">
                      <text class="label">开始日期</text>
                      <picker mode="date" :value="exportStartDate" @change="bindStartDateChange">
                        <view class="picker-box">{{ exportStartDate || '请选择' }}</view>
                      </picker>
                  </view>
                  <view class="divider-arrow">→</view>
                  <view class="picker-item">
                      <text class="label">结束日期</text>
                      <picker mode="date" :value="exportEndDate" @change="bindEndDateChange">
                        <view class="picker-box">{{ exportEndDate || '请选择' }}</view>
                      </picker>
                  </view>
              </view>
              <view class="modal-footer">
                  <button class="btn-confirm" @click="confirmExportWine" :disabled="isExporting">
                      {{ isExporting ? '导出中...' : '确认导出' }}
                  </button>
              </view>
          </view>
      </view>

    </view>
  </view>
</template>

<script>
// 引入 XLSX
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      isSearchMode: false,
      keyword: '',
      showLogout: false,
      historyList: [],
      searchResult: [],
      searching: false,
      searchTimer: null,
      page: 1,
      pageSize: 20,
      hasMore: true,
      isLoadingMore: false,
      counts: { cigarette: 0, wine: 0 },
      
      // Export related
      showDateModal: false,
      exportStartDate: '',
      exportEndDate: '',
      isExporting: false,
      
      // Cigarette Export
      showCigaretteExportModal: false,
      cigaretteFields: [
          { key: 'company_code', label: '商品编码', checked: false },
          { key: 'wholesale_price', label: '批发价', checked: false },
          { key: 'purchase_price', label: '收货价', checked: false },
          { key: 'retail_price', label: '零售价', checked: false },
          { key: 'manufacturer', label: '厂家名称', checked: false }
      ],
      
      // Download Modal
      showDownloadModal: false,
      downloadUrl: ''
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
      this.fetchCounts();
      // 如果处于搜索模式且有关键词，每次显示页面时刷新搜索结果
      if (this.isSearchMode && this.keyword) {
          // 刷新数据，不重置分页 (可选: 如果希望回到第一页则不传 false)
          this.doSearch(this.keyword, false, false);
      }
  },
  // Removed onReachBottom because we use scroll-view
  methods: {
    // 监听 ScrollView 滚动到底部
    onScrollToLower() {
        if (this.isSearchMode && this.keyword && this.hasMore && !this.isLoadingMore) {
            console.log('Load More Triggered');
            this.doSearch(this.keyword, false, true);
        }
    },
    async fetchCounts() {
        try {
            const fzhCigarette = uniCloud.importObject('fzh-cigarette');
            const fzhWine = uniCloud.importObject('fzh-wine');
            const [c, w] = await Promise.all([
                fzhCigarette.count().catch(() => 0),
                fzhWine.count().catch(() => 0)
            ]);
            this.counts = { cigarette: c, wine: w };
        } catch (e) {
            console.error('Fetch counts error', e);
        }
    },
    goToList(type) {
        uni.navigateTo({ url: `/pages/common/list?type=${type}` });
    },
    closeGlobalPopups() {
        if (this.showLogout) {
            this.showLogout = false;
        }
    },
    toggleLogout() {
        this.showLogout = !this.showLogout;
    },
    handleLogout() {
        // 点击后立即隐藏菜单，提升体验
        this.showLogout = false;
        
        uni.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    // 清理缓存
                    uni.removeStorageSync('uni_id_token');
                    uni.removeStorageSync('userInfo');
                    uni.removeStorageSync('login_expired');
                    
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
      // uni.hideTabBar();
    },
    exitSearchMode() {
      this.isSearchMode = false;
      this.keyword = '';
      this.searchResult = [];
      // uni.showTabBar();
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
    async doSearch(kw, saveHistory = false, isLoadMore = false) {
        if (!kw) return;
        
        if (isLoadMore) {
            this.isLoadingMore = true;
        } else {
            this.searching = true;
            this.page = 1;
            this.hasMore = true;
            this.searchResult = [];
        }

        try {
            const fzhCigarette = uniCloud.importObject('fzh-cigarette');
            const fzhWine = uniCloud.importObject('fzh-wine');
            
            const skip = (this.page - 1) * this.pageSize;
            
            // 并行查询
            const [cigRes, wineRes] = await Promise.all([
                fzhCigarette.search(kw, skip, this.pageSize).catch(() => []),
                fzhWine.search(kw, skip, this.pageSize).catch(() => [])
            ]);

            const cigarettes = (cigRes || []).map(item => ({ ...item, type: 'cigarette' }));
            const wines = (wineRes || []).map(item => ({ ...item, type: 'wine' }));
            
            // 合并并按名称首字拼音排序
            let combined = [...cigarettes, ...wines];
            combined.sort((a, b) => {
                return (a.name || '').localeCompare(b.name || '', 'zh-CN');
            });
            
            if (isLoadMore) {
                this.searchResult = [...this.searchResult, ...combined];
            } else {
                this.searchResult = combined;
            }
            
            // 判断是否还有更多：如果本次获取数量少于预期，通常没有更多了
            if (combined.length === 0) {
                this.hasMore = false;
            } else if (cigRes && cigRes.length < this.pageSize && wineRes && wineRes.length < this.pageSize) {
                // 如果两边都少于请求的 pageSize，说明都取完了
                this.hasMore = false;
                this.page++;
            } else {
                this.page++;
            }
            
            // 只有点击搜索按钮时才记录历史
            if (saveHistory && !isLoadMore) {
                this.addToHistory(kw);
            }
            
        } catch (e) {
            console.error(e);
            if (!isLoadMore) this.searchResult = [];
        } finally {
            this.searching = false;
            this.isLoadingMore = false;
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
    goToDetail(item) {
        if (item.type === 'wine') {
             uni.navigateTo({
                url: `/pages/wine/detail?id=${item._id}`
            });
        } else {
            uni.navigateTo({
                url: `/pages/cigarette/detail?id=${item._id}`
            });
        }
    },
    // 功能占位函数
    handleImport() {
      // uni.showToast({ title: '点击了导入单据', icon: 'none' });
      uni.navigateTo({
          url: '/pages/cigarette/import'
      });
    },
    handleAddCigarette() {
      uni.navigateTo({
        url: '/pages/cigarette/detail'
      });
    },
    handleAddWine() {
      uni.navigateTo({
        url: '/pages/wine/detail'
      });
    },
    handleExportCigarette() {
       this.showCigaretteExportModal = true;
    },
    closeCigaretteExportModal() {
        this.showCigaretteExportModal = false;
    },
    toggleField(index) {
        this.cigaretteFields[index].checked = !this.cigaretteFields[index].checked;
    },
    async doExportCigarette() {
        if (this.isExporting) return;
        this.isExporting = true;
        uni.showLoading({ title: '正在导出...' });
        
        try {
            const fzhCigarette = uniCloud.importObject('fzh-cigarette');
            const data = await fzhCigarette.getAll();
            
            if (!data || data.length === 0) {
                uni.showToast({ title: '暂无数据', icon: 'none' });
                this.isExporting = false;
                uni.hideLoading();
                return;
            }
            
            // Filter checked fields
            const selectedFields = this.cigaretteFields.filter(f => f.checked);
            
            // Format Data
            const sheetData = data.map(item => {
                const row = { '商品': item.name }; // Always included
                selectedFields.forEach(field => {
                    row[field.label] = item[field.key] || '';
                });
                return row;
            });
            
            await this.generateAndExportExcel(sheetData, '香烟数据表');
            this.showCigaretteExportModal = false;
            
        } catch (e) {
            console.error(e);
            uni.showToast({ title: '导出失败: ' + e.message, icon: 'none' });
        } finally {
            this.isExporting = false;
            uni.hideLoading();
        }
    },
    
    handleExportWine() {
      // 默认结束日期为当天，开始日期为一个月前
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      
      const formatDate = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
      };
      
      this.exportEndDate = formatDate(end);
      this.exportStartDate = formatDate(start);
      
      this.showDateModal = true;
    },
    closeDateModal() {
        this.showDateModal = false;
    },
    bindStartDateChange(e) {
        this.exportStartDate = e.detail.value;
    },
    bindEndDateChange(e) {
        this.exportEndDate = e.detail.value;
    },
    async confirmExportWine() {
        if (this.isExporting) return;
        this.isExporting = true;
        uni.showLoading({ title: '生成中...' });
        
        try {
            const startTs = new Date(this.exportStartDate + ' 00:00:00').getTime();
            const endTs = new Date(this.exportEndDate + ' 23:59:59').getTime();
            
            const fzhHistory = uniCloud.importObject('fzh-wine-history');
            const list = await fzhHistory.getExportData(startTs, endTs);
            
            if (!list || list.length === 0) {
                uni.showToast({ title: '该时间段无入库记录', icon: 'none' });
                this.isExporting = false;
                uni.hideLoading();
                return;
            }
            
            // Format: Wine Name, Cases, Bottles, Unit Price, Total Amount, Supplier
            const sheetData = list.map(item => {
                const dateStr = new Date(item.purchase_date);
                const Y = dateStr.getFullYear();
                const M = String(dateStr.getMonth()+1).padStart(2,'0');
                const D = String(dateStr.getDate()).padStart(2,'0');
                
                return {
                    '进货日期': `${Y}-${M}-${D}`,
                    '酒水名称': item.wine_name,
                    '箱数': item.box_num,
                    '单箱瓶数': item.bottle_per_box,
                    '单瓶进价': item.price_per_bottle,
                    '总金额': item.total_amount,
                    '供应商': item.supplier
                };
            });
            
            await this.generateAndExportExcel(sheetData, `酒水入库表_${this.exportStartDate}_${this.exportEndDate}`);
            this.showDateModal = false;
            
        } catch (e) {
            console.error(e);
            uni.showToast({ title: '导出失败', icon: 'none' });
        } finally {
            this.isExporting = false;
            uni.hideLoading();
        }
    },
    
    async generateAndExportExcel(data, filename) {
        // 1. Create Worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        
        // 2. Write to binary
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // 3. Save to temp file
        // #ifdef MP-WEIXIN
        const fs = wx.getFileSystemManager();
        const tempPath = `${wx.env.USER_DATA_PATH}/${filename}.xlsx`;
        
        try {
            fs.writeFileSync(tempPath, wbout, 'binary');
            console.log('File saved to:', tempPath);
            
            // 4. Upload to Cloud to get a URL/FileID (per user request)
            const uploadRes = await uniCloud.uploadFile({
                filePath: tempPath,
                cloudPath: `fzh_exports/${filename}_${Date.now()}.xlsx`
            });
            
            console.log('Upload Result:', uploadRes);
            
            // Get https url
            const tempFiles = await uniCloud.getTempFileURL({
                fileList: [uploadRes.fileID]
            });
            this.downloadUrl = tempFiles.fileList[0].tempFileURL;
            
            // Show new Download Modal
            this.showDownloadModal = true;
            
        } catch (err) {
            throw new Error('文件保存或上传失败: ' + err.message);
        }
        // #endif
        
        // #ifndef MP-WEIXIN
        uni.showToast({ title: '当前环境不支持文件导出', icon: 'none' });
        // #endif
    },
    
    closeDownloadModal() {
        this.showDownloadModal = false;
        this.downloadUrl = '';
    },
    
    copyDownloadUrl() {
        if (!this.downloadUrl) return;
        uni.setClipboardData({
            data: this.downloadUrl,
            success: () => {
                uni.showToast({ title: '链接已复制', icon: 'none' });
            }
        });
    }
  }
};
</script>

<style lang="scss" scoped>
/* 
  Apple Style Design System (Compact Version)
  Designed for single-screen view without scrolling
*/

$bg-color: #F2F2F7;
$card-bg: #FFFFFF;
$text-primary: #1C1C1E;
$text-secondary: #8E8E93;
$theme-blue: #007AFF;
$separator-color: #E5E5EA;

.page-container {
  height: 100vh;
  overflow: hidden; /* Prevent body scroll */
  background-color: $bg-color;
  display: flex;
  flex-direction: column;
}

/* Header Styles */
.sticky-header {
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  z-index: 100;
  padding: 0 32rpx 16rpx; /* Reduced padding */
  border-bottom: 0.5px solid rgba(0,0,0,0);
  transition: all 0.3s ease;
  
  &.search-active {
     background-color: $bg-color;
  }
}

.header-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0 16rpx; /* Compressed */
  overflow: hidden;
  transition: all 0.3s ease;
  
  .large-title {
    font-size: 48rpx; /* 68->48 Compact Title */
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -0.5px;
  }
  
  .avatar-circle {
      width: 64rpx; /* 72->64 */
      height: 64rpx;
      background-color: #E5E5EA;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: $text-secondary;
      font-size: 28rpx;
  }
}

.user-profile-wrapper {
    position: relative;
    z-index: 102;
    display: flex;
    align-items: center;
}

.logout-btn {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 20rpx;
    
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    
    padding: 24rpx 40rpx;
    border-radius: 16rpx;
    min-width: 160rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    
    box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);
    border: 0.5px solid rgba(0,0,0,0.05);
    
    /* Animation */
    transform-origin: top right;
    transform: scale(0.9);
    opacity: 0;
    visibility: hidden;
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    
    &.show {
        transform: scale(1);
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    text {
        font-size: 30rpx;
        color: #FF3B30;
        font-weight: 500;
        letter-spacing: 0.5px;
    }
    
    /* Popover Arrow */
    &::before {
        content: '';
        position: absolute;
        top: -12rpx;
        right: 24rpx; /* Align near center of avatar circle (approx 32rpx) */
        border-left: 12rpx solid transparent;
        border-right: 12rpx solid transparent;
        border-bottom: 12rpx solid rgba(255, 255, 255, 0.95);
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
  height: 68rpx; /* 72->68 */
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  transition: all 0.3s ease;
  
  .search-icon {
    font-size: 30rpx;
    margin-right: 12rpx;
    opacity: 0.5;
  }
  
  .search-input {
    flex: 1;
    font-size: 30rpx;
    height: 100%;
    color: $text-primary;
  }
  
  .placeholder-text {
      color: $text-secondary;
  }
}

.cancel-btn {
  font-size: 32rpx;
  color: $theme-blue;
  margin-left: 20rpx;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(20rpx);
  pointer-events: none; 
  transition: all 0.3s ease;
  display: none; 
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
    flex-direction: column; 
    justify-content: flex-start;
    padding-top: 20rpx;
    overflow: hidden; /* 必须加，防止子元素溢出撑开父容器导致无法滚动 */
    box-sizing: border-box;
    position: relative;
    z-index: 99;
}

/* History Section */
.history-section {
    width: 100%;
    padding: 0 32rpx;
    margin-bottom: 30rpx;
    box-sizing: border-box;
    
    .section-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .section-subtitle {
            font-size: 28rpx;
            font-weight: 600;
            color: $text-primary;
        }
        
        .trash-icon {
            font-size: 32rpx;
            padding: 10rpx;
            color: $text-secondary;
        }
    }
    
    .history-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;
        
        .tag {
            background-color: #F2F2F7;
            color: $text-primary;
            padding: 10rpx 24rpx;
            border-radius: 24rpx;
            font-size: 26rpx;
            display: inline-block;
        }
    }
}

/* Result List */
.result-list {
    flex: 1;
    width: 100%;
    height: 100%; 
    background-color: $bg-color;
}

.result-item {
    background-color: $card-bg;
    padding: 28rpx 32rpx;
    margin-bottom: 2rpx;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    
    &:active {
        background-color: #F2F2F7;
        transform: scale(0.98);
    }
    
    .category-tag {
        width: 56rpx;
        height: 56rpx;
        border-radius: 14rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        font-size: 26rpx;
        font-weight: 700;
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
        
        &.tag-cigarette { background: linear-gradient(135deg, #FF9500, #FFCC00); }
        &.tag-wine { background: linear-gradient(135deg, #AF52DE, #D471FF); }
    }
    
    .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        
        .item-name {
            font-size: 32rpx;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 6rpx;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .item-code {
            font-size: 24rpx;
            color: $text-secondary;
            letter-spacing: 0.5px;
        }
    }
    
    .item-price {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding-left: 20rpx;
        
        .price-label {
            font-size: 20rpx;
            color: $text-secondary;
            text-transform: uppercase;
            margin-bottom: 4rpx;
        }
        
        .price-value {
            font-size: 34rpx;
            font-weight: 700;
            color: $theme-blue;
        }
    }
}

.loading-more-bar {
    padding: 40rpx 0;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .status-msg {
        font-size: 24rpx;
        color: $text-secondary;
        letter-spacing: 1px;
    }
    
    .spinner-box {
        display: flex;
        align-items: center;
        gap: 16rpx;
        color: $text-secondary;
        font-size: 24rpx;
    }
}

.spinner {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid rgba($theme-blue, 0.2);
    border-top: 3rpx solid $theme-blue;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.empty-search-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 20%;
    
    .empty-icon {
        font-size: 80rpx;
        margin-bottom: 20rpx;
        opacity: 0.6;
    }
    
    .empty-text {
        color: $text-secondary;
        font-size: 28rpx;
        font-weight: 500;
    }
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 32rpx;
  box-sizing: border-box;
  overflow-y: auto; 
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
}

/* Common Card Styles */
.section-header {
    margin-top: 40rpx;
    margin-bottom: 16rpx;
    padding-left: 12rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .section-title {
        font-size: 34rpx;
        font-weight: 800;
        color: $text-primary;
        letter-spacing: -0.5px;
    }
}

.card-group, .grid-group, .list-group {
    margin-bottom: 30rpx;
}

/* Action Card (Import) */
.action-card {
    background-color: $card-bg;
    border-radius: 28rpx;
    padding: 40rpx 32rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.05);
    transition: all 0.2s ease;
    border: 1px solid rgba(0,0,0,0.02);
    
    &:active {
        transform: translateY(2rpx);
        box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
        background-color: #F8F8F8;
    }
}

.card-icon-bg {
    width: 100rpx;
    height: 100rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 28rpx;
    
    &.icon-blue { 
        background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.2)); 
        color: #007AFF; 
    }
    
    .emoji-icon {
        font-size: 52rpx;
    }
}

.card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .card-title {
        font-size: 34rpx;
        font-weight: 700;
        color: $text-primary;
        margin-bottom: 8rpx;
    }
    
    .card-subtitle {
        font-size: 24rpx;
        color: $text-secondary;
        font-weight: 500;
    }
}

.arrow-icon, .list-arrow {
    font-size: 32rpx;
    color: #C7C7CC;
    font-family: monospace; 
    font-weight: bold;
}

/* Grid System */
.grid-group {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;
}

.grid-card {
    background-color: $card-bg;
    flex: 1;
    border-radius: 24rpx;
    padding: 30rpx 24rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
    transition: all 0.2s ease;
    
    &:active {
        transform: scale(0.96);
        background-color: #F8F8F8;
    }
    
    .grid-icon-box {
        width: 80rpx; 
        height: 80rpx;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
        flex-shrink: 0;
        
        &.bg-orange { 
            background: linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 149, 0, 0.2)); 
            color: #FF9500;
        }
        &.bg-purple { 
            background: linear-gradient(135deg, rgba(175, 82, 222, 0.1), rgba(175, 82, 222, 0.2)); 
            color: #AF52DE;
        }
        
        .emoji-large { font-size: 40rpx; }
    }

    .grid-text-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
    }
    
    .grid-title {
        font-size: 30rpx;
        font-weight: 700;
        color: $text-primary;
        margin-bottom: 4rpx;
        white-space: nowrap;
    }
    
    .grid-desc {
        font-size: 22rpx;
        color: $text-secondary;
        font-weight: 500;
    }
}

/* List Group */
.list-group {
    background-color: $card-bg;
    border-radius: 28rpx;
    overflow: hidden; 
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
}

/* Modal Styles */
.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    width: 600rpx;
    background-color: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
    
    .modal-title { font-size: 34rpx; font-weight: 600; color: $text-primary; }
    .close-icon { font-size: 40rpx; color: $text-secondary; padding: 0 10rpx; }
}

.date-picker-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40rpx;
    
    .picker-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .label { font-size: 24rpx; color: $text-secondary; margin-bottom: 12rpx; }
        .picker-box {
            height: 80rpx;
            background-color: #F2F2F7;
            border-radius: 12rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28rpx;
            color: $theme-blue;
            font-weight: 500;
        }
    }
    
    .divider-arrow {
        margin: 0 20rpx;
        color: $text-secondary;
        font-weight: bold;
        padding-top: 30rpx; 
    }
}

.modal-footer {
    .btn-confirm {
        background-color: $theme-blue;
        color: #fff;
        border-radius: 40rpx;
        font-size: 30rpx;
        font-weight: 600;
        &[disabled] { opacity: 0.6; }
    }
}

.list-item {
    padding: 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s;
    
    &:active {
        background-color: #F8F8F8;
    }
    
    .item-left {
        display: flex;
        align-items: center;
    }
    
    .small-icon-box {
        width: 72rpx;
        height: 72rpx;
        border-radius: 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        
        &.bg-green { background: linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.2)); color: #34C759; }
        &.bg-indigo { background: linear-gradient(135deg, rgba(88, 86, 214, 0.1), rgba(88, 86, 214, 0.2)); color: #5856D6; }
        
        .emoji-small { font-size: 36rpx; }
    }
    
    .item-title {
        font-size: 30rpx;
        color: $text-primary;
        font-weight: 600;
    }
}

.divider {
    height: 1px;
    background-color: $separator-color;
    margin-left: 128rpx; 
}

.card-hover, .list-hover {
    background-color: #F2F2F7 !important; 
    opacity: 0.9;
}

.bottom-spacer {
    display: none; /* No spacer needed for compact fixed layout */
}

/* Cigarette Export Modal Styles */
.field-list {
    margin-bottom: 30rpx;
}
.field-tip {
    font-size: 24rpx;
    color: $text-secondary;
    margin-bottom: 20rpx;
    padding-left: 10rpx;
}
.field-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 0.5px solid $separator-color;
    &:last-child { border-bottom: none; }
    
    .field-label {
        font-size: 30rpx;
        color: $text-primary;
        margin-left: 20rpx;
    }
}
.checkbox {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    border: 2px solid #C7C7CC;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &.checked {
        background-color: $theme-blue;
        border-color: $theme-blue;
    }
    
    .check-mark {
        color: #fff;
        font-size: 28rpx;
        font-weight: bold;
    }
}

/* Download Result Modal Styles */
.download-body {
    display: flex;
    flex-direction: column;
}
.input-wrapper {
    background-color: #F2F2F7;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 30rpx;
}
.url-input {
    font-size: 26rpx;
    color: $text-primary;
    width: 100%;
    height: 40rpx;
    // single line
}

.modal-actions {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;
    
    .action-btn {
        flex: 1;
        height: 80rpx;
        border-radius: 40rpx;
        font-size: 30rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        
        &.btn-copy {
            background-color: $theme-blue;
            color: #fff; 
        }
        
        &.btn-close {
            background-color: #F2F2F7;
            color: $text-primary;
        }
    }
}
</style>
