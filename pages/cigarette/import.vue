<template>
  <view class="page-container">
    <!-- Header -->
    <view class="header-section">
      <text class="page-title">导入烟草单据</text>
      <text class="page-subtitle">支持Excel/CSV文件 (.xlsx, .xls, .csv)</text>
    </view>

    <!-- Upload Card -->
    <view class="upload-card" @click="handleChooseFile" v-if="!isProcessing && !logs.length && !importFinished">
      <view class="icon-wrapper">
        <text class="icon-emoji">📄</text>
      </view>
      <text class="upload-text">点击选择文件</text>
      <text class="upload-hint">自动识别：商品编码、商品、批发价、厂家名称</text>
    </view>

    <!-- Processing State -->
    <view class="processing-state" v-if="isProcessing">
      <view class="spinner"></view>
      <text class="processing-text">正在处理数据...</text>
    </view>

    <!-- Result Dashboard -->
    <view class="result-dashboard" v-if="logs.length > 0 || (importFinished && logs.length === 0)">
      <view class="summary-card">
        <view class="summary-item">
            <text class="s-label">总条数</text>
            <text class="s-value">{{ stats.total }}</text>
        </view>
        <view class="divider-v"></view>
        <view class="summary-item">
            <text class="s-label">新增</text>
            <text class="s-value blue">{{ stats.added }}</text>
        </view>
        <view class="divider-v"></view>
        <view class="summary-item">
            <text class="s-label">更新</text>
            <text class="s-value orange">{{ stats.updated }}</text>
        </view>
      </view>

      <view class="log-list-header">
          <text class="list-title">变动明细</text>
          <text class="list-remark" v-if="logs.length === 0">暂无价格变动或新增记录</text>
      </view>

      <scroll-view scroll-y class="log-list">
        <view class="log-card" v-for="(log, index) in logs" :key="index">
            <view class="log-left">
                <view :class="['log-tag', log.type === 'add' ? 'tag-new' : 'tag-update']">
                    {{ log.type === 'add' ? '新' : '改' }}
                </view>
                <view class="log-info">
                    <text class="log-name">{{ log.name }}</text>
                    <text class="log-code">{{ log.code }}</text>
                </view>
            </view>
            
            <view class="log-right">
                <view v-if="log.type === 'add'" class="price-box">
                    <text class="price-new">¥{{ log.new_price }}</text>
                </view>
                <view v-else class="price-change-box">
                    <text class="price-old">¥{{ log.old_price }}</text>
                    <view class="arrow-box">
                        <text class="arrow-icon" :class="log.change > 0 ? 'red-up' : 'green-down'">
                            {{ log.change > 0 ? '↑' : '↓' }}
                        </text>
                    </view>
                    <text class="price-new" :class="log.change > 0 ? 'text-red' : 'text-green'">
                        ¥{{ log.new_price }}
                    </text>
                </view>
            </view>
        </view>
      </scroll-view>

      <view class="action-footer">
          <button class="btn-reset" @click="reset">继续导入</button>
      </view>
    </view>
  </view>
</template>

<script>
// 需要 npm install xlsx
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      isProcessing: false,
      importFinished: false,
      stats: {
        total: 0,
        added: 0,
        updated: 0
      },
      logs: [] // { type: 'add'|'update', name, code, old_price, new_price, change: 1|-1 }
    };
  },
  methods: {
    reset() {
        this.isProcessing = false;
        this.importFinished = false;
        this.stats = { total: 0, added: 0, updated: 0 };
        this.logs = [];
    },
    handleChooseFile() {
      // 微信小程序选择文件
      // #ifdef MP-WEIXIN
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls', 'csv'],
        success: (res) => {
          const filePath = res.tempFiles[0].path;
          this.readExcel(filePath);
        },
        fail: (err) => {
            console.error(err);
        }
      });
      // #endif
      
      // #ifdef H5
      // H5 Input file logic (simplified)
      uni.showToast({ title: '请在微信小程序环境使用', icon: 'none' });
      // #endif
    },
    readExcel(filePath) {
        this.isProcessing = true;
        const fs = wx.getFileSystemManager();
        // 读取 ArrayBuffer，不指定 encoding
        fs.readFile({
            filePath: filePath,
            success: (res) => {
                const data = res.data; // ArrayBuffer
                this.parseData(data);
            },
            fail: (err) => {
                this.isProcessing = false;
                uni.showToast({ title: '读取文件失败', icon: 'none' });
            }
        });
    },
    parseData(data) {
        try {
            let workbook;
            let content;
            
            // 简单判断文件类型：检查前几个字节（Magic Number）
            const view = new Uint8Array(data);
            let isExcelBinary = false;
            
            // Excel (.xlsx): 50 4B 03 04 (PK..)
            // Excel (.xls):  D0 CF 11 E0
            if (view.length > 4) {
                if ((view[0] === 0x50 && view[1] === 0x4B) || 
                    (view[0] === 0xD0 && view[1] === 0xCF)) {
                    isExcelBinary = true;
                }
            }

            if (isExcelBinary) {
                // Excel 文件直接解析
                workbook = XLSX.read(data, { type: 'array' });
            } else {
                // 认为是 CSV/文本，尝试检测编码 (GBK vs UTF-8)
                // 优先尝试 UTF-8
                let str = '';
                let encoding = 'utf-8';
                
                if (typeof TextDecoder !== 'undefined') {
                    try {
                        const decoderUtf8 = new TextDecoder('utf-8', { fatal: true });
                        str = decoderUtf8.decode(data);
                    } catch (e) {
                        // UTF-8 解码失败，尝试 GBK
                        try {
                            const decoderGbk = new TextDecoder('gbk');
                            str = decoderGbk.decode(data);
                            encoding = 'gbk';
                        } catch (e2) {
                            // 都不行，回退到默认
                            str = '';
                        }
                    }
                    
                    // 如果都没解码成功，或者解码后不包含关键词，尝试强制 GBK (针对 TextDecoder('utf-8') 不报错但乱码的情况)
                    // 关键词检查：商品、编码、批发
                    if (!str.includes('商品') && !str.includes('编码')) {
                         try {
                            const decoderGbk = new TextDecoder('gbk');
                            const strGbk = decoderGbk.decode(data);
                            if (strGbk.includes('商品') || strGbk.includes('编码')) {
                                str = strGbk;
                                encoding = 'gbk';
                            }
                         } catch (e) {}
                    }
                }
                
                if (str && (str.includes('商品') || str.includes('编码'))) {
                     console.log('Detected CSV Encoding:', encoding);
                     workbook = XLSX.read(str, { type: 'string' });
                } else {
                     // 兜底：交给 XLSX 自动处理（通常默认 UTF-8 或 Latin1）
                     console.log('Fallback to XLSX array read');
                     workbook = XLSX.read(data, { type: 'array' });
                }
            }

            const sheetName = workbook.SheetNames[0]; // 读取第一个sheet
            const sheet = workbook.Sheets[sheetName];
            
            // 使用 header: 1 模式获取二维数组，确保能准确处理表头
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            if (!rows || rows.length < 2) {
                uni.showToast({ title: '表格为空或无数据行', icon: 'none' });
                this.isProcessing = false;
                return;
            }

            console.log('Total Rows:', rows.length);

            // 1. 定位表头（取第一行）
            // 兼容可能存在的空单元格，转字符串并去空格
            const header = rows[0].map(val => String(val || '').trim());
            console.log('Header Row:', header);

            // 2. 查找关键列索引 (统一使用严格正则匹配)
            const idxCode = header.findIndex(h => /^(商品编码)$/.test(h));
            const idxName = header.findIndex(h => /^(商品)$/.test(h));
            const idxPrice = header.findIndex(h => /^(批发价)$/.test(h));
            const idxManufacturer = header.findIndex(h => /^(厂家名称)$/.test(h));

            if (idxCode === -1 || idxName === -1 || idxPrice === -1) {
                let missing = [];
                if (idxCode === -1) missing.push('商品编码');
                if (idxName === -1) missing.push('商品名称');
                if (idxPrice === -1) missing.push('批发价');
                
                uni.showModal({
                    title: '表头识别失败',
                    content: '第一行未包含以下必需列：\n' + missing.join('、') + '\n请检查Excel表头名称。',
                    showCancel: false
                });
                this.isProcessing = false;
                return;
            }

            // 3. 提取数据（从第二行开始）
            const items = rows.slice(1).map(row => {
                // row 是数组，按索引取值
                // 注意：row的长度可能短于header长度
                const code = row[idxCode];
                const name = row[idxName];
                const price = row[idxPrice];
                const manufacturer = idxManufacturer > -1 ? row[idxManufacturer] : '';

                // 简单的空值检查
                if (!code && !name) return null;

                return {
                     company_code: code,
                     name: name,
                     wholesale_price: price,
                     manufacturer: manufacturer
                };
            }).filter(item => {
                // 过滤无效行：必须有编码、名称、价格
                return item && 
                       item.company_code && 
                       item.name && 
                       item.wholesale_price !== undefined && 
                       item.wholesale_price !== null &&
                       String(item.wholesale_price).trim() !== '';
            });

            if (items.length === 0) {
                 uni.showToast({ title: '未识别到有效数据', icon: 'none' });
                 this.isProcessing = false;
                 return;
            }

            this.uploadToCloud(items);

        } catch (e) {
            console.error(e);
            this.isProcessing = false;
            uni.showToast({ title: '解析Excel失败: ' + (e.message || '未知错误'), icon: 'none' });
        }
    },
    async uploadToCloud(items) {
        try {
            const fzhCigarette = uniCloud.importObject('fzh-cigarette');
            const res = await fzhCigarette.batchImport(items);
            
            this.stats.total = res.total;
            this.stats.added = res.added;
            this.stats.updated = res.updated;
            this.logs = res.logs;
            this.importFinished = true;
            
            uni.showToast({ title: '处理完成', icon: 'success' });
        } catch (e) {
            uni.showToast({ title: e.message || '导入失败', icon: 'none' });
        } finally {
            this.isProcessing = false;
        }
    }
  }
};
</script>

<style lang="scss" scoped>
$bg-color: #F2F2F7;
$card-bg: #FFFFFF;
$text-primary: #1C1C1E;
$text-secondary: #8E8E93;
$theme-blue: #007AFF;
$theme-green: #34C759;
$theme-red: #FF3B30;
$theme-orange: #FF9500;

.page-container {
    min-height: 100vh;
    background-color: $bg-color;
    padding: 32rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.header-section {
    margin-bottom: 48rpx;
    margin-top: 20rpx;
    
    .page-title {
        display: block;
        font-size: 56rpx;
        font-weight: 800;
        color: $text-primary;
        margin-bottom: 8rpx;
    }
    
    .page-subtitle {
        display: block;
        font-size: 28rpx;
        color: $text-secondary;
    }
}

.upload-card {
    background-color: $card-bg;
    border-radius: 32rpx;
    height: 400rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.05);
    transition: transform 0.2s;
    
    &:active {
        transform: scale(0.98);
    }
    
    .icon-wrapper {
        width: 120rpx;
        height: 120rpx;
        background-color: rgba(0, 122, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32rpx;
        
        .icon-emoji { font-size: 56rpx; }
    }
    
    .upload-text {
        font-size: 34rpx;
        font-weight: 600;
        color: $theme-blue;
        margin-bottom: 12rpx;
    }
    
    .upload-hint {
        font-size: 24rpx;
        color: $text-secondary;
    }
}

.processing-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
    
    .spinner {
        width: 60rpx;
        height: 60rpx;
        border: 6rpx solid #E5E5EA;
        border-top-color: $theme-blue;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 32rpx;
    }
    
    .processing-text {
        color: $text-secondary;
        font-size: 28rpx;
    }
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Dashboard */
.result-dashboard {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.summary-card {
    background-color: $card-bg;
    border-radius: 24rpx;
    padding: 32rpx;
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 40rpx;
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
    
    .summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .s-label { font-size: 24rpx; color: $text-secondary; margin-bottom: 8rpx; }
        .s-value { font-size: 40rpx; font-weight: 700; color: $text-primary; }
        
        .blue { color: $theme-blue; }
        .orange { color: $theme-orange; }
    }
    
    .divider-v { width: 1px; height: 40rpx; background-color: #E5E5EA; }
}

.log-list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24rpx;
    padding: 0 10rpx;
    
    .list-title { font-size: 34rpx; font-weight: 700; color: $text-primary; }
    .list-remark { font-size: 24rpx; color: $text-secondary; }
}

.log-list {
    flex: 1;
    // max-height: calc(100vh - 500rpx);
    overflow: hidden;
}

.log-card {
    background-color: $card-bg;
    padding: 24rpx;
    border-radius: 20rpx;
    margin-bottom: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .log-left {
        display: flex;
        align-items: center;
        flex: 1;
        overflow: hidden;
        
        .log-tag {
            font-size: 20rpx;
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
            color: #fff;
            margin-right: 16rpx;
            flex-shrink: 0;
            
            &.tag-new { background-color: $theme-blue; }
            &.tag-update { background-color: $theme-orange; }
        }
        
        .log-info {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            flex: 1; /* 占据剩余空间 */
            margin-right: 20rpx;
            
            .log-name { 
                font-size: 30rpx; 
                font-weight: 500; 
                color: $text-primary; 
                /* 允许换行，不限制显示 */
                white-space: normal; 
                word-break: break-all;
                line-height: 1.4;
            }
            .log-code { font-size: 24rpx; color: $text-secondary; margin-top: 6rpx; }
        }
    }
    
    .log-right {
        margin-left: 20rpx;
        text-align: right;
        min-width: 140rpx; // ensure space for prices
        
        .price-new { font-size: 30rpx; font-weight: 600; color: $text-primary; }
        
        .price-change-box {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            
            .price-old { text-decoration: line-through; color: $text-secondary; font-size: 22rpx; margin-right: 8rpx; }
            
            .arrow-box { 
                margin-right: 4rpx;
                .arrow-icon { font-size: 24rpx; font-weight: bold; }
                .red-up { color: $theme-red; }
                .green-down { color: $theme-green; }
            }
            
            .text-red { color: $theme-red; }
            .text-green { color: $theme-green; }
        }
    }
}

.action-footer {
    padding: 32rpx 0;
    
    .btn-reset {
        background-color: #F2F2F7;
        color: $theme-blue;
        font-weight: 600;
        border-radius: 48rpx;
        &::after { border: none; }
    }
}
</style>
