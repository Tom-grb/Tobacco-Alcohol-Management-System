<template>
  <view class="page-container">
    <!-- Image Section -->
    <view class="image-section" @click="handleImageClick">
      <image 
        v-if="formData.image_url" 
        :src="formData.image_url" 
        mode="aspectFit" 
        class="product-image"
      />
      <view v-else class="image-placeholder">
        <text class="camera-icon">📷</text>
        <text class="placeholder-text">{{ isViewMode ? '暂无图片' : '点击拍摄图片' }}</text>
      </view>
      <view v-if="!isViewMode && formData.image_url" class="edit-overlay">
         <text class="edit-text">更换图片</text>
      </view>
    </view>

    <view class="form-container">
       <view class="form-group-single">
            <view class="form-item no-border">
                <text class="label">酒水名称</text>
                <input 
                    class="input" 
                    v-model="formData.name" 
                    placeholder="请输入名称" 
                    :disabled="isViewMode"
                    placeholder-class="placeholder"
                />
            </view>
       </view>

       <!-- Purchase Records Section -->
       <view class="section-header">
           <text class="section-title">进货记录</text>
           <view v-if="!isViewMode" class="add-icon" @click="openRecordModal(null)">
               <text>➕ 添加记录</text>
           </view>
       </view>

       <!-- Tabs Control -->
       <view class="tabs-container">
           <view class="segment-control">
               <view 
                    class="segment-item" 
                    :class="{ active: currentTab === 0 }" 
                    @click="currentTab = 0"
               >
                    列表
               </view>
               <view 
                    class="segment-item" 
                    :class="{ active: currentTab === 1 }" 
                    @click="currentTab = 1"
               >
                    趋势
               </view>
               <view class="segment-bg" :style="{ transform: currentTab === 0 ? 'translateX(0)' : 'translateX(100%)' }"></view>
           </view>
       </view>

       <swiper 
            class="history-swiper" 
            :current="currentTab" 
            @change="onSwiperChange"
       >
           <!-- List Tab -->
           <swiper-item>
               <scroll-view 
                    scroll-y 
                    class="swiper-scroll" 
                    @scrolltolower="loadMoreHistory"
               >
                   <view class="record-list-inner">
                       <view 
                            class="record-card" 
                            v-for="(item, index) in displayedHistory" 
                            :key="item.id || index"
                       >
                           <view class="card-header">
                               <text class="supplier-name">{{ item.supplier || '未知供货商' }}</text>
                               <text class="record-date">{{ formatDate(item.purchase_date) }}</text>
                           </view>
                           <view class="divider-dashed"></view>
                           <view class="card-body">
                               <view class="info-row">
                                   <text class="info-label">箱数</text>
                                   <text class="info-val">{{ item.box_num }}</text>
                               </view>
                               <view class="info-row">
                                   <text class="info-label">每箱瓶数</text>
                                   <text class="info-val">{{ item.bottle_per_box }}</text>
                               </view>
                               <view class="info-row">
                                   <text class="info-label">单瓶价</text>
                                   <text class="info-val">¥{{ item.price_per_bottle }}</text>
                               </view>
                               <view class="info-row highlight">
                                   <text class="info-label">总金额</text>
                                   <text class="info-val">¥{{ item.total_amount }}</text>
                               </view>
                           </view>
                           
                           <view v-if="!isViewMode" class="card-actions">
                               <view class="action-btn edit" @click="openRecordModal(item)">修改</view>
                               <view class="action-btn delete" @click="deleteRecord(item)">删除</view>
                           </view>
                       </view>
                       
                       <view v-if="displayedHistory.length === 0" class="empty-record">
                           <text>暂无进货记录</text>
                       </view>
                       
                       <view v-if="hasMoreHistory" class="loading-more">
                           <text>加载更多...</text>
                       </view>
                       <view v-else-if="displayedHistory.length > 0" class="loading-more">
                           <text>没有更多了</text>
                       </view>
                   </view>
               </scroll-view>
           </swiper-item>
           
           <!-- Chart Tab -->
           <swiper-item>
               <view class="chart-tab-content">
                    <view class="chart-container" v-if="chartData.length > 0">
                        <view class="canvas-wrapper">
                            <canvas 
                                canvas-id="lineChart" 
                                id="lineChart"
                                class="charts-box"
                                @touchstart="handleChartTouch"
                            ></canvas>
                        </view>
                    </view>
                    
                    <view class="empty-record" v-else>
                         <text>数据不足，无法生成图表</text>
                    </view>

                    <!-- Selected Detail Card -->
                    <view class="selected-detail-card" v-if="selectedChartItem">
                        <view class="detail-header">
                            <text class="detail-title">详情信息</text>
                            <text class="detail-subtitle">{{ formatDate(selectedChartItem.purchase_date) }}</text>
                        </view>
                        <view class="detail-grid">
                            <view class="detail-item">
                                <text class="d-label">供货商</text>
                                <text class="d-value">{{ selectedChartItem.supplier || '-' }}</text>
                            </view>
                             <view class="detail-item">
                                <text class="d-label">总金额</text>
                                <text class="d-value highlight">¥{{ selectedChartItem.total_amount }}</text>
                            </view>
                            <view class="detail-item">
                                <text class="d-label">箱数</text>
                                <text class="d-value">{{ selectedChartItem.box_num }}</text>
                            </view>
                            <view class="detail-item">
                                <text class="d-label">每箱瓶数</text>
                                <text class="d-value">{{ selectedChartItem.bottle_per_box }}</text>
                            </view>
                            <view class="detail-item">
                                <text class="d-label">单瓶价</text>
                                <text class="d-value">¥{{ selectedChartItem.price_per_bottle }}</text>
                            </view>
                        </view>
                    </view>
               </view>
           </swiper-item>
       </swiper>
       
       <!-- Action Buttons -->
       <view class="action-area">
           <button 
                v-if="mode === 'add'" 
                class="btn-primary" 
                @click="submit" 
                :loading="loading"
            >
                保存
           </button>
           
           <view v-if="mode === 'view'" class="button-row">
               <button 
                    class="btn-secondary flex-1" 
                    @click="switchToEdit"
                >
                    编辑
               </button>
               <button 
                    class="btn-danger flex-1" 
                    @click="handleDelete"
                    :loading="loading"
                >
                    删除
               </button>
           </view>

           <button 
                v-if="mode === 'edit'" 
                class="btn-primary" 
                @click="submit" 
                :loading="loading"
            >
                保存修改
           </button>
       </view>

    </view>

    <!-- Initial Modal for adding/editing record -->
    <!-- Note: uni-app simple modal or custom view overlay -->
    <view class="modal-overlay" v-if="showModal" @click.self="closeRecordModal">
        <view class="modal-content">
            <view class="modal-header">
                <text class="modal-title">{{ editingRecordIndex === -1 ? '添加记录' : '编辑记录' }}</text>
                <text class="close-btn" @click="closeRecordModal">✕</text>
            </view>
            <scroll-view scroll-y class="modal-body">
                <view class="modal-form-item">
                    <text class="m-label">供货商</text>
                    <input class="m-input" v-model="recordForm.supplier" placeholder="请输入供货商" />
                </view>
                <view class="modal-form-item">
                    <text class="m-label">进货时间</text>
                    <picker mode="date" :value="recordForm.dateStr" @change="onDateChange">
                        <view class="m-picker">
                            {{ recordForm.dateStr || '请选择日期' }}
                        </view>
                    </picker>
                </view>
                <view class="modal-divider"></view>
                <view class="calc-section">
                    <view class="modal-form-item-small">
                        <text class="m-label-s">箱数</text>
                        <input class="m-input-s" type="number" v-model.number="recordForm.box_num" placeholder="0" @input="calcTotal" />
                    </view>
                    <view class="symbol">×</view>
                    <view class="modal-form-item-small">
                        <text class="m-label-s">单箱瓶数</text>
                        <input class="m-input-s" type="number" v-model.number="recordForm.bottle_per_box" placeholder="0" @input="calcTotal" />
                    </view>
                </view>
                 <view class="calc-section">
                    <view class="modal-form-item-small">
                        <text class="m-label-s">单瓶价格</text>
                         <input class="m-input-s" type="digit" v-model.number="recordForm.price_per_bottle" placeholder="0.00" @input="calcTotal" />
                    </view>
                    <view class="symbol">→</view>
                    <view class="modal-form-item-small">
                        <text class="m-label-s">总金额</text>
                        <!-- Total is auto calculated usually, but user can edit. If edit, we don't reverse calc for now based on requirement simplification or we implement basic reverse -->
                         <input class="m-input-s highlight" type="digit" v-model.number="recordForm.total_amount" placeholder="0.00" @input="onTotalInput" />
                    </view>
                </view>
                <view class="tip-text">输入前三项自动计算总金额</view>
            </scroll-view>
            <view class="modal-footer">
                <button class="btn-confirm" @click="saveRecord">确定</button>
            </view>
        </view>
    </view>

  </view>
</template>

<script setup>
import { ref, reactive, computed, watch, getCurrentInstance, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const instance = getCurrentInstance();
const chartPoints = ref([]);

const mode = ref('add');
const id = ref('');
const loading = ref(false);

const formData = reactive({
    image_url: '',
    name: ''
});

const isViewMode = computed(() => mode.value === 'view');

// Pagination & Display Logic
const currentTab = ref(0);
const historyPage = ref(1);
const displayedHistory = ref([]); // Replaces displayedHistory computed
const hasMoreHistory = ref(false); // Replaces computed

// Remove sortedHistory computed as we fetch from DB now

// Chart Logic
// Recent 10 for Chart (Oldest -> Newest)
const chartData = ref([]);
const selectedChartIndex = ref(0);

const selectedChartItem = computed(() => {
    if (!chartData.value || chartData.value.length === 0) return null;
    return chartData.value[selectedChartIndex.value];
});

const drawChart = () => {
    const data = chartData.value;
    if (!data || data.length === 0) return;
    
    const sysInfo = uni.getSystemInfoSync();
    // Fallback width: window width - padding (64rpx for container)
    // If rect is not available (e.g. hidden tab), use this approximation
    const fallbackWidth = sysInfo.windowWidth - uni.upx2px(64);

    const query = uni.createSelectorQuery().in(instance);
    query.select('#lineChart').boundingClientRect(rect => {
        // Use actual rect width if available and positive, else fallback
        let effectiveWidth = (rect && rect.width > 0) ? rect.width : fallbackWidth;
        if (effectiveWidth <= 0) effectiveWidth = 300; // Last resort safety

        const height = 200; 
        const padding = 20;

        const ctx = uni.createCanvasContext('lineChart', instance);
        
        const drawWidth = effectiveWidth - (padding * 2);
        const drawHeight = height - (padding * 2);

        let maxVal = 0;
        let minVal = Infinity;
        const prices = data.map(d => Number(d.price_per_bottle) || 0);
        if(prices.length) {
            maxVal = Math.max(...prices);
            minVal = Math.min(...prices);
        } else {
            minVal = 0;
        }

        if (maxVal === minVal) {
            if (maxVal === 0) { maxVal = 100; minVal = 0; }
            else { maxVal = maxVal * 1.2; minVal = minVal * 0.8; if(minVal<0) minVal=0; }
        } else {
            const range = maxVal - minVal;
            maxVal += range * 0.1;
            minVal -= range * 0.1;
            if(minVal < 0) minVal = 0;
        }
        const valRange = maxVal - minVal;

        // Clear must use effectiveWidth
        ctx.clearRect(0, 0, effectiveWidth, height);

        // Grid
        ctx.setStrokeStyle('#f5f5f5');
        ctx.setLineWidth(1);
        for(let i=0; i<5; i++) {
            const y = padding + (drawHeight/4)*i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(effectiveWidth - padding, y);
            ctx.stroke();
        }

        const points = data.map((item, i) => {
            const x = padding + (i / (data.length - 1 || 1)) * drawWidth;
            const val = Number(item.price_per_bottle) || 0;
            const y = padding + drawHeight - ((val - minVal) / (valRange || 1)) * drawHeight;
            return { x, y, item, index: i };
        });
        chartPoints.value = points;

        if (points.length > 0) {
            ctx.beginPath();
            ctx.setStrokeStyle('#2979ff');
            ctx.setLineWidth(2);
            ctx.setLineCap('round');
            ctx.setLineJoin('round');
            ctx.moveTo(points[0].x, points[0].y);
            for(let i=1; i<points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }

        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            if (i === selectedChartIndex.value) {
                 ctx.setFillStyle('#2979ff');
                 ctx.setStrokeStyle('#ffffff');
            } else {
                 ctx.setFillStyle('#ffffff');
                 ctx.setStrokeStyle('#2979ff');
            }
            ctx.setLineWidth(2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.draw();
    }).exec();
};

const handleChartTouch = (e) => {
    if (!chartPoints.value.length) return;
    const touchT = e.touches && e.touches[0];
    const clickX = touchT ? touchT.x : 0;
    
    let closest = null;
    let minD = Infinity;
    chartPoints.value.forEach(p => {
        const d = Math.abs(p.x - clickX);
        if (d < minD) {
            minD = d;
            closest = p;
        }
    });

    if (closest && minD < 50) {
        selectedChartIndex.value = closest.index;
        nextTick(drawChart);
    }
};

watch(chartData, (newVal) => {
    if (newVal.length > 0) {
        selectedChartIndex.value = newVal.length - 1;
        nextTick(drawChart);
    }
}, { immediate: true });

watch(currentTab, (val) => {
    if (val === 1) {
        nextTick(drawChart);
    }
});

const onSwiperChange = (e) => {
    currentTab.value = e.detail.current;
    if (currentTab.value === 1 && chartData.value.length === 0) {
        loadChartData();
    }
};

const loadHistoryList = async (reload = false) => {
    if (reload) {
        historyPage.value = 1;
        displayedHistory.value = [];
        hasMoreHistory.value = true;
    }
    
    // 如果没有酒水ID，说明是添加模式，不加载历史
    if (!id.value) return;

    try {
        const fzhWineHistory = uniCloud.importObject('fzh-wine-history');
        const res = await fzhWineHistory.getHistory(id.value, historyPage.value, 10);
        
        if (reload) {
            displayedHistory.value = res.list;
        } else {
            displayedHistory.value = [...displayedHistory.value, ...res.list];
        }
        
        hasMoreHistory.value = res.hasMore;
    } catch (e) {
        uni.showToast({ title: '加载记录失败', icon: 'none' });
    }
};

const loadChartData = async () => {
    if (!id.value) return;
    try {
        const fzhWineHistory = uniCloud.importObject('fzh-wine-history');
        const res = await fzhWineHistory.getRecentHistory(id.value, 10);
        // Backend returns desc (Newest -> Oldest).
        // For chart we want Oldest -> Newest (Left -> Right)
        chartData.value = res.reverse();
    } catch (e) {
        console.error(e);
    }
};

const loadMoreHistory = () => {
    if (hasMoreHistory.value) {
        historyPage.value++;
        loadHistoryList();
    }
};

const formatDateShort = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}-${date.getDate()}`;
};

// Modal State
const showModal = ref(false);
const editingRecordIndex = ref(-1); // -1 means add
const recordForm = reactive({
    supplier: '',
    dateStr: '',
    box_num: '',
    bottle_per_box: '',
    price_per_bottle: '',
    total_amount: ''
});

onLoad((options) => {
    if (options.id) {
        mode.value = 'view';
        id.value = options.id;
        loadData(options.id);
        // Start loading history in background
        loadHistoryList(true);
        uni.setNavigationBarTitle({ title: '酒水详情' });
    } else {
        mode.value = 'add';
        uni.setNavigationBarTitle({ title: '添加酒水' });
    }
});

const loadData = async (targetId) => {
    uni.showLoading({ title: '加载中' });
    try {
        const fzhWine = uniCloud.importObject('fzh-wine');
        const res = await fzhWine.get(targetId);
        if (res) {
            formData.name = res.name;
            formData.image_url = res.image_url;
        }
    } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' });
    } finally {
        uni.hideLoading();
    }
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Image Handling (Camera Only, 3:4, 2MB limit logic same as cigarette)
const handleImageClick = () => {
    if (isViewMode.value) {
        if (formData.image_url) {
            uni.previewImage({ urls: [formData.image_url] });
        }
        return;
    }

    uni.chooseImage({
        count: 1,
        sourceType: ['camera'], 
        sizeType: ['compressed'],
        success: (res) => {
            const tempFile = res.tempFiles[0];
            const MAX_SIZE = 2 * 1024 * 1024;
            
            if (tempFile.size > MAX_SIZE) {
                uni.compressImage({
                    src: res.tempFilePaths[0],
                    quality: 60,
                    success: (cRes) => uploadImage(cRes.tempFilePath),
                    fail: () => uni.showToast({ title: '压缩失败', icon: 'none' })
                })
            } else {
                uploadImage(res.tempFilePaths[0]);
            }
        }
    });
};

const uploadImage = async (filePath) => {
    uni.showLoading({ title: '上传中...' });
    try {
        const result = await uniCloud.uploadFile({
            filePath: filePath,
            cloudPath: `fzh/wine_${Date.now()}.jpg`
        });
        
        let imageUrl = result.fileID;
        if (imageUrl.indexOf('cloud://') === 0 || imageUrl.indexOf('internal://') === 0 || imageUrl.indexOf('http') !== 0) {
             const tempResult = await uniCloud.getTempFileURL({ fileList: [imageUrl] });
             if (tempResult.fileList && tempResult.fileList.length > 0) {
                 imageUrl = tempResult.fileList[0].tempFileURL;
             }
        }
        formData.image_url = imageUrl;
    } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' });
    } finally {
        uni.hideLoading();
    }
};

// Modal Logic
const openRecordModal = (item) => {
    if (item) {
        editingRecordIndex.value = 1; 
        recordForm.supplier = item.supplier;
        recordForm.dateStr = formatDate(item.purchase_date);
        recordForm.box_num = item.box_num;
        recordForm.bottle_per_box = item.bottle_per_box;
        recordForm.price_per_bottle = item.price_per_bottle;
        recordForm.total_amount = item.total_amount;
        recordForm._currentId = item._id || item.id;
    } else {
        editingRecordIndex.value = -1;
        recordForm.supplier = '';
        const now = new Date();
        const m = (now.getMonth()+1).toString().padStart(2,'0');
        const d = now.getDate().toString().padStart(2,'0');
        recordForm.dateStr = `${now.getFullYear()}-${m}-${d}`;
        recordForm.box_num = '';
        recordForm.bottle_per_box = '';
        recordForm.price_per_bottle = '';
        recordForm.total_amount = '';
        recordForm._currentId = null;
    }
    showModal.value = true;
};

const closeRecordModal = () => {
    showModal.value = false;
};

const onDateChange = (e) => {
    recordForm.dateStr = e.detail.value;
};

// Auto calc: A * B * C = D
const calcTotal = () => {
    const { box_num, bottle_per_box, price_per_bottle } = recordForm;
    if (box_num && bottle_per_box && price_per_bottle) {
        recordForm.total_amount = (box_num * bottle_per_box * price_per_bottle).toFixed(2);
    }
};

// Reverse calc? Requirement: validation or auto derive.
// "输入其中三个可自动推导剩下一个"
const onTotalInput = (e) => {
    // If user changes Total, we try to see if we can calc others. 
    // Usually total is Fixed. If user inputs total, and we have box & bottle, we can calc price.
    const { box_num, bottle_per_box, total_amount } = recordForm;
    if (total_amount && box_num && bottle_per_box && box_num * bottle_per_box > 0) {
        recordForm.price_per_bottle = (total_amount / (box_num * bottle_per_box)).toFixed(2);
    }
    // Logic can be complex, sticking to basic forward calc primarily as it's most common.
};

const saveRecord = async () => {
    // Validation
    const { box_num, bottle_per_box, price_per_bottle, total_amount } = recordForm;
    if (!box_num || !bottle_per_box || !price_per_bottle || !total_amount) {
        // Try strict calc check?
        const calcTotal = Number(box_num) * Number(bottle_per_box) * Number(price_per_bottle);
        if (Math.abs(calcTotal - Number(total_amount)) > 1.0) { // allow small float diff
             uni.showToast({ title: '数值计算有误，请检查', icon: 'none' });
             return;
        }
    }
    
    // Construct Object Data (Exclude ID here, handle ID in addOrUpdate params explicitly)
    const recordData = {
        supplier: recordForm.supplier,
        purchase_date: new Date(recordForm.dateStr.replace(/-/g, '/')).getTime(),
        box_num: Number(recordForm.box_num),
        bottle_per_box: Number(recordForm.bottle_per_box),
        price_per_bottle: Number(recordForm.price_per_bottle),
        total_amount: Number(recordForm.total_amount)
    };
    
    loading.value = true;
    try {
        const fzhWineHistory = uniCloud.importObject('fzh-wine-history');
        
        if (editingRecordIndex.value > -1 && recordForm._currentId) {
            // Update existing
             await fzhWineHistory.addOrUpdate({
                 id: recordForm._currentId,
                 wine_id: id.value,
                 ...recordData
             });
             uni.showToast({ title: '修改成功', icon: 'success' });
        } else {
            // Add new
            if (!id.value) {
                uni.showToast({ title: '请先保存酒水信息', icon: 'none' });
                return;
            }
             await fzhWineHistory.addOrUpdate({
                 wine_id: id.value,
                 ...recordData
             });
             uni.showToast({ title: '添加成功', icon: 'success' });
        }
        
        // Refresh lists
        await loadHistoryList(true);
        loadChartData();
        
    } catch (e) {
        console.error(e);
        uni.showToast({ title: '操作失败: ' + (e.message || '未知错误'), icon: 'none' });
    } finally {
        loading.value = false;
        closeRecordModal();
    }
};

const deleteRecord = (item) => {
    uni.showModal({
        title: '删除记录',
        content: '确定删除这条进货记录吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    const fzhWineHistory = uniCloud.importObject('fzh-wine-history');
                    await fzhWineHistory.delete(item._id);
                    uni.showToast({ title: '删除成功', icon: 'success' });
                    // Refresh list
                    loadHistoryList(true);
                    loadChartData();
                } catch (e) {
                    uni.showToast({ title: '删除失败', icon: 'none' });
                }
            }
        }
    })
};

// CRUD Operations
const submit = async () => {
    if (!formData.name) {
        uni.showToast({ title: '请输入酒水名称', icon: 'none' });
        return;
    }
    // Allow image to be empty
    
    loading.value = true;
    try {
        const fzhWine = uniCloud.importObject('fzh-wine');
        if (mode.value === 'add') {
            const res = await fzhWine.add({
                image_url: formData.image_url,
                name: formData.name
            });
            id.value = res.id; // Set ID
            uni.showToast({ title: '添加成功', icon: 'success' });
            // Switch to edit/view mode? Or just back.
            // Requirement says "Save", usually means create main item first.
            // If user added records in modal BEFORE main item saved... wait, 
            // the modal logic now requires ID. So flow: Add Wine -> Save -> Show "Add Record" button?
            // "Add Record" button is visible broadly. 
            // In 'add' mode, we might need to block adding records until wine is saved.
            setTimeout(() => {
                // uni.navigateBack() // Or stay and allow adding records?
                // Better UX: Redirect to view mode of this new item to add records
                 mode.value = 'view';
                 uni.setNavigationBarTitle({ title: '酒水详情' });
            }, 1000);
        } else if (mode.value === 'edit') {
            await fzhWine.update({
                id: id.value,
                image_url: formData.image_url,
                name: formData.name
            });
            uni.showToast({ title: '更新成功', icon: 'success' });
            mode.value = 'view';
            uni.setNavigationBarTitle({ title: '酒水详情' });
        }
    } catch (e) {
        uni.showToast({ title: e.message || '失败', icon: 'none' });
    } finally {
        loading.value = false;
    }
};

const switchToEdit = () => {
    mode.value = 'edit';
    uni.setNavigationBarTitle({ title: '编辑酒水' });
};

const handleDelete = () => {
    uni.showModal({
        title: '警告',
        content: '确定要删除该酒水吗？',
        confirmText: '删除',
        confirmColor: '#FF3B30',
        success: async (res) => {
            if (res.confirm) {
                loading.value = true;
                try {
                    const fzhWine = uniCloud.importObject('fzh-wine');
                    await fzhWine.delete(id.value);
                    uni.showToast({ title: '删除成功', icon: 'success' });
                    setTimeout(() => uni.navigateBack(), 1500);
                } catch (e) {
                    uni.showToast({ title: '删除失败', icon: 'none' });
                    loading.value = false;
                }
            }
        }
    })
};
</script>

<style lang="scss" scoped>
$bg-color: #F2F2F7;
$card-bg: #FFFFFF;
$text-primary: #1C1C1E;
$text-secondary: #8E8E93;
$theme-blue: #007AFF;
$theme-red: #FF3B30;

.page-container {
    min-height: 100vh;
    background-color: $bg-color;
    padding-bottom: 40rpx;
    position: relative;
    z-index: 1;
}

/* Reusing Image styles from cigarette */
.image-section {
    width: 100%;
    height: 30vh;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20rpx;
    position: relative;
    
    .product-image {
        height: 100%;
        width: 100%;
        border-radius: 16rpx;
    }
    
    .image-placeholder {
        height: 100%;
        width: 400rpx;
        background-color: #E1E1E5;
        border-radius: 16rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: $text-secondary;
        .camera-icon { font-size: 60rpx; margin-bottom: 20rpx; }
        .placeholder-text { font-size: 26rpx; }
    }
    .edit-overlay {
        position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
        height: 60rpx; background-color: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        border-radius: 16rpx; padding: 0 40rpx;
        .edit-text { color: #fff; font-size: 24rpx; }
    }
}

.form-container {
    padding: 0 32rpx;
}

.form-group-single {
    background-color: $card-bg;
    border-radius: 20rpx;
    padding-left: 32rpx;
    margin-bottom: 40rpx;
}

.form-item {
    padding: 24rpx 32rpx 24rpx 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 88rpx;
    
    .label { font-size: 32rpx; color: $text-primary; }
    .input { flex: 1; text-align: right; font-size: 32rpx; color: $text-primary; margin-left: 20rpx; }
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding: 0 10rpx;
    
    .section-title {
        font-size: 34rpx;
        font-weight: 600;
        color: $text-primary;
    }
    
    .add-icon {
        color: $theme-blue;
        font-size: 28rpx;
        font-weight: 500;
    }
}

.record-list {
    margin-bottom: 40rpx;
}

.record-card {
    background-color: $card-bg;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
    
    .card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16rpx;
        font-size: 30rpx;
        font-weight: 500;
        color: $text-primary;
        
        .record-date { color: $text-secondary; font-size: 26rpx; font-weight: 400; }
    }
    
    .divider-dashed {
        width: 100%;
        height: 1px;
        border-bottom: 1px dashed #E5E5EA;
        margin-bottom: 16rpx;
    }
    
    .card-body {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        
        .info-row {
            width: 48%;
            margin-bottom: 12rpx;
            display: flex;
            justify-content: space-between;
            font-size: 28rpx;
            
            .info-label { color: $text-secondary; }
            .info-val { color: $text-primary; font-weight: 500; }
            
            &.highlight .info-val { color: $theme-blue; font-weight: 600; }
        }
    }
    
    .card-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16rpx;
        padding-top: 16rpx;
        border-top: 1rpx solid #F0F0F5;
        gap: 20rpx;
        
        .action-btn {
            font-size: 26rpx;
            padding: 8rpx 20rpx;
            border-radius: 24rpx;
            
            &.edit { color: $theme-blue; background: rgba(0,122,255,0.1); }
            &.delete { color: $theme-red; background: rgba(255,59,48,0.1); }
        }
    }
}

.loading-more {
    text-align: center;
    padding: 20rpx;
    color: $text-secondary;
    font-size: 24rpx;
}

.empty-record {
    text-align: center;
    padding: 40rpx;
    color: $text-secondary;
    font-size: 28rpx;
}

/* Tabs & Swiper */
.tabs-container {
    padding: 0 10rpx;
    margin-bottom: 20rpx;
}

.segment-control {
    background-color: rgba(118, 118, 128, 0.12);
    border-radius: 16rpx;
    padding: 4rpx;
    display: flex;
    position: relative;
    height: 64rpx;
    
    .segment-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
        font-weight: 500;
        color: $text-primary;
        position: relative;
        z-index: 2;
        transition: color 0.3s ease;
        
        &.active {
            font-weight: 600;
        }
    }
    
    .segment-bg {
        position: absolute;
        width: 50%;
        height: 56rpx;
        top: 4rpx;
        left: 0;
        background-color: #fff;
        border-radius: 14rpx;
        box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.12);
        transition: transform 0.3s cubic-bezier(0.2, 0.0, 0.2, 1);
        z-index: 1;
    }
}

.history-swiper {
    /* Height dynamic */
    height: 800rpx;
    background-color: transparent;
}

.swiper-scroll {
    height: 100%;
}

.record-list-inner {
    padding-bottom: 20rpx;
}

/* Chart Styles */
.chart-tab-content {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 32rpx;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.chart-container {
    height: 400rpx;
    width: 100%;
    margin-bottom: 20rpx;
    display: flex;
    background-color: #fff;
}

.canvas-wrapper {
    width: 100%;
    height: 100%;
}

.charts-box {
    width: 100%;
    height: 100%;
    background-color: #fff;
}

.selected-detail-card {
    background-color: #F2F2F7;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-top: auto; /* Push to bottom */
}

.detail-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
    
    .detail-title { font-size: 28rpx; font-weight: 600; color: $text-primary; }
    .detail-subtitle { font-size: 24rpx; color: $text-secondary; }
}

.detail-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.detail-item {
    width: 48%; /* 2 cols */
    display: flex;
    flex-direction: column;
    
    .d-label { font-size: 22rpx; color: $text-secondary; margin-bottom: 4rpx; }
    .d-value { 
        font-size: 26rpx; 
        color: $text-primary; 
        font-weight: 500; 
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis;
        
        &.highlight { color: $theme-blue; font-weight: 600; }
    }
}

/* Action Buttons */
.action-area {
    margin-top: 40rpx;
    padding: 0 16rpx;
    
    button {
        height: 96rpx;
        border-radius: 48rpx;
        font-size: 34rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24rpx;
        &::after { border: none; }
    }
    
    .btn-primary { background-color: $theme-blue; color: #fff; box-shadow: 0 4rpx 12rpx rgba(0,122,255,0.3); }
    .btn-secondary { background-color: #fff; color: $theme-blue; border: 2rpx solid $theme-blue; }
    .btn-danger { background-color: $theme-red; color: #fff; box-shadow: 0 4rpx 12rpx rgba(255,59,48,0.3); }
    
    .button-row { display: flex; justify-content: space-between; gap: 20rpx; button { margin-bottom: 0; } }
    .flex-1 { flex: 1; }
}

/* Modal Styles */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.5); z-index: 999;
    display: flex; align-items: flex-end; /* Bottom sheet style */
}

.modal-content {
    width: 100%;
    background-color: #fff;
    border-top-left-radius: 32rpx;
    border-top-right-radius: 32rpx;
    padding: 32rpx;
    padding-bottom: 60rpx;
    box-sizing: border-box;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 32rpx;
    .modal-title { font-size: 36rpx; font-weight: 600; color: $text-primary; }
    .close-btn { font-size: 40rpx; color: $text-secondary; padding: 10rpx; }
}

.modal-body {
    max-height: 60vh;
}

.modal-form-item {
    margin-bottom: 32rpx;
    .m-label { display: block; font-size: 28rpx; color: $text-secondary; margin-bottom: 12rpx; }
    .m-input, .m-picker {
        width: 100%; height: 88rpx; background: #F2F2F7; border-radius: 16rpx;
        padding: 0 24rpx; font-size: 32rpx; color: $text-primary; box-sizing: border-box;
        display: flex; align-items: center;
    }
}

.modal-divider { height: 1rpx; background: #E5E5EA; margin: 32rpx 0; }

.calc-section {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx;
    .symbol { font-size: 36rpx; color: $text-secondary; margin: 0 10rpx; padding-top: 36rpx; }
    .modal-form-item-small {
        flex: 1;
        .m-label-s { display: block; font-size: 24rpx; color: $text-secondary; margin-bottom: 8rpx; text-align: center; }
        .m-input-s {
            width: 100%; height: 80rpx; background: #F2F2F7; border-radius: 16rpx;
            text-align: center; font-size: 32rpx; font-weight: 500;
            &.highlight { color: $theme-blue; background: rgba(0,122,255,0.05); }
        }
    }
}

.tip-text { text-align: center; font-size: 24rpx; color: $text-secondary; margin-top: 20rpx; }

.modal-footer {
    margin-top: 40rpx;
    .btn-confirm {
        width: 100%; height: 96rpx; background: $theme-blue; color: #fff;
        border-radius: 48rpx; font-size: 34rpx; display: flex; align-items: center; justify-content: center;
        &::after { border: none; }
    }
}

</style>