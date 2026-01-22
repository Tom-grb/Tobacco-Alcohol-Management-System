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
      <!-- Edit Overlay on top of image in Edit Mode -->
      <view v-if="!isViewMode && formData.image_url" class="edit-overlay">
         <text class="edit-text">更换图片</text>
      </view>
    </view>

    <view class="form-container">
       <view class="form-group">
            <!-- Company Code -->
            <view class="form-item">
                <text class="label">公司编码</text>
                <input 
                    class="input" 
                    v-model="formData.company_code" 
                    placeholder="请输入编码" 
                    :disabled="isViewMode"
                    placeholder-class="placeholder"
                />
            </view>
            <view class="divider"></view>
            
            <!-- Name -->
            <view class="form-item">
                <text class="label">香烟名称</text>
                <input 
                    class="input" 
                    v-model="formData.name" 
                    placeholder="请输入名称" 
                    :disabled="isViewMode"
                    placeholder-class="placeholder"
                />
            </view>
       </view>

       <view class="form-group">
            <!-- Wholesale Price -->
            <view class="form-item-col">
                <view class="row-main">
                    <text class="label">批发价</text>
                    <input 
                        class="input price-input" 
                        type="digit"
                        v-model="formData.wholesale_price" 
                        placeholder="0.00" 
                        :disabled="isViewMode"
                        placeholder-class="placeholder"
                    />
                </view>
                <text v-if="isViewMode && formData.wholesale_price_updated_at" class="update-time">
                    更新于: {{ formatDate(formData.wholesale_price_updated_at) }}
                </text>
            </view>
            <view class="divider"></view>

            <!-- Purchase Price -->
            <view class="form-item-col">
                <view class="row-main">
                    <text class="label">收货价</text>
                    <input 
                        class="input price-input" 
                        type="digit"
                        v-model="formData.purchase_price" 
                        placeholder="0.00" 
                        :disabled="isViewMode"
                        placeholder-class="placeholder"
                    />
                </view>
                <text v-if="isViewMode && formData.purchase_price_updated_at" class="update-time">
                    更新于: {{ formatDate(formData.purchase_price_updated_at) }}
                </text>
            </view>
            <view class="divider"></view>

            <!-- Retail Price -->
            <view class="form-item-col">
                <view class="row-main">
                    <text class="label">零售价</text>
                    <input 
                        class="input price-input" 
                        type="digit"
                        v-model="formData.retail_price" 
                        placeholder="0.00" 
                        :disabled="isViewMode"
                        placeholder-class="placeholder"
                    />
                </view>
                <text v-if="isViewMode && formData.retail_price_updated_at" class="update-time">
                    更新于: {{ formatDate(formData.retail_price_updated_at) }}
                </text>
            </view>
       </view>

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
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const mode = ref('add'); // add, view, edit
const id = ref('');
const loading = ref(false);

const formData = reactive({
    image_url: '',
    company_code: '',
    name: '',
    wholesale_price: '',
    purchase_price: '',
    retail_price: '',
    wholesale_price_updated_at: null,
    purchase_price_updated_at: null,
    retail_price_updated_at: null
});

const isViewMode = computed(() => mode.value === 'view');

onLoad((options) => {
    if (options.id) {
        mode.value = 'view';
        id.value = options.id;
        loadData(options.id);
        uni.setNavigationBarTitle({ title: '香烟详情' });
    } else {
        mode.value = 'add';
        uni.setNavigationBarTitle({ title: '添加香烟' });
    }
});

const loadData = async (targetId) => {
    uni.showLoading({ title: '加载中' });
    try {
        const fzhCigarette = uniCloud.importObject('fzh-cigarette');
        const res = await fzhCigarette.get(targetId);
        if (res) {
            Object.assign(formData, res);
        }
    } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' });
    } finally {
        uni.hideLoading();
    }
};

const switchToEdit = () => {
    mode.value = 'edit';
    uni.setNavigationBarTitle({ title: '编辑香烟' });
};

const handleDelete = () => {
    uni.showModal({
        title: '警告',
        content: '确定要删除该香烟吗？此操作无法撤销。',
        confirmText: '删除',
        confirmColor: '#FF3B30',
        success: async (res) => {
            if (res.confirm) {
                loading.value = true;
                try {
                    const fzhCigarette = uniCloud.importObject('fzh-cigarette');
                    await fzhCigarette.delete(id.value);
                    uni.showToast({ title: '删除成功', icon: 'success' });
                    // 使用 reLaunch 或者 navigateBack 刷新上一页数据比较麻烦，简单点 navigateBack
                    // 实际项目中可能需要通知上一页更新
                    setTimeout(() => {
                        uni.navigateBack();
                    }, 1500);
                } catch (e) {
                    uni.showToast({ title: e.message || '删除失败', icon: 'none' });
                    loading.value = false;
                }
            }
        }
    })
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${m}月${d}日 ${h}:${min}`;
};

// Image Handling
const handleImageClick = () => {
    if (isViewMode.value) {
        // Preview image
        if (formData.image_url) {
            uni.previewImage({
                urls: [formData.image_url]
            });
        }
        return;
    }

    // Choose Image
    uni.chooseImage({
        count: 1,
        sourceType: ['camera'], // Only Camera
        sizeType: ['compressed'], // Try compressed first
        success: async (res) => {
            const tempFilePath = res.tempFilePaths[0];
            const tempFile = res.tempFiles[0];
            
            // Check size (2MB = 2 * 1024 * 1024 bytes)
            const MAX_SIZE = 2 * 1024 * 1024;
            
            if (tempFile.size > MAX_SIZE) {
                // Determine quality based on size ratio, crude estimation
                // Or just use a fixed low quality to ensure it drops
                uni.compressImage({
                    src: tempFilePath,
                    quality: 60, // Aggressive compression
                    success: (compressRes) => {
                        uploadImage(compressRes.tempFilePath);
                    },
                    fail: () => {
                        uni.showToast({ title: '压缩失败', icon: 'none' });
                    }
                })
            } else {
                uploadImage(tempFilePath);
            }
        },
        fail: (err) => {
            // console.log('Choose image failed', err);
        }
    });
};

const uploadImage = async (filePath) => {
    uni.showLoading({ title: '上传中...' });
    try {
        const result = await uniCloud.uploadFile({
            filePath: filePath,
            cloudPath: `fzh_image/cigarette_${Date.now()}.jpg`
        });
        
        console.log('Upload result:', result);

        // 获取 HTTPS 链接
        // 支付宝云等平台返回的 fileID 可能是 cloud:// 或 internal:// 协议，需要转换
        let imageUrl = result.fileID;
        
        // 尝试获取临时链接（如果是公有读，有效期可能很长或永久，视配置而定）
        if (imageUrl.indexOf('cloud://') === 0 || imageUrl.indexOf('internal://') === 0) { // 简单判断
             const tempResult = await uniCloud.getTempFileURL({
                 fileList: [imageUrl]
             });
             if (tempResult.fileList && tempResult.fileList.length > 0) {
                 imageUrl = tempResult.fileList[0].tempFileURL;
                 // 如果获取失败，API通常会返回空或者原样，这里假定成功
             }
        } else {
             // 有些云平台直接返回的是 https 链接（如阿里云OSS直接上传模式），或者支付宝云某些配置
             // 为了保险，统一再调一次 getTempFileURL 也无妨，但如果已经是 https 开头就不用了
             if (imageUrl.indexOf('http') !== 0) {
                 const tempResult = await uniCloud.getTempFileURL({
                     fileList: [imageUrl]
                 });
                 if (tempResult.fileList && tempResult.fileList.length > 0) {
                     imageUrl = tempResult.fileList[0].tempFileURL;
                 }
             }
        }

        console.log('Final Image URL:', imageUrl);
        formData.image_url = imageUrl;
        
    } catch (e) {
        console.error('Upload failed:', e);
        uni.showToast({ 
            title: '上传失败: ' + (e.message || '网络错误'), 
            icon: 'none' 
        });
    } finally {
        uni.hideLoading();
    }
};

const submit = async () => {
    // Validate
    // 图片、收货价、零售价 选填
    // 只有 公司编码、香烟名称、批发价 必填
    if (!formData.company_code) {
        uni.showToast({ title: '请输入公司编码', icon: 'none' });
        return;
    }
    if (!formData.name) {
        uni.showToast({ title: '请输入香烟名称', icon: 'none' });
        return;
    }
    if (!formData.wholesale_price) {
        uni.showToast({ title: '请输入批发价', icon: 'none' });
        return;
    }

    // 图片不再是必填
    // if (!formData.image_url && mode.value === 'add') {
    //      uni.showToast({ title: '请拍摄图片', icon: 'none' });
    //      return;
    // }

    loading.value = true;
    try {
        const fzhCigarette = uniCloud.importObject('fzh-cigarette');
        
        if (mode.value === 'add') {
            await fzhCigarette.add({
                image_url: formData.image_url,
                company_code: formData.company_code,
                name: formData.name,
                wholesale_price: formData.wholesale_price,
                purchase_price: formData.purchase_price,
                retail_price: formData.retail_price
            });
            uni.showToast({ title: '添加成功', icon: 'success' });
            setTimeout(() => uni.navigateBack(), 1500);
        } else if (mode.value === 'edit') {
            await fzhCigarette.update({
                id: id.value,
                image_url: formData.image_url,
                company_code: formData.company_code,
                name: formData.name,
                wholesale_price: formData.wholesale_price,
                purchase_price: formData.purchase_price,
                retail_price: formData.retail_price
            });
            uni.showToast({ title: '更新成功', icon: 'success' });
            // Switch back to view mode and refresh
            mode.value = 'view';
            loadData(id.value);
            uni.setNavigationBarTitle({ title: '香烟详情' });
        }
    } catch (e) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' });
    } finally {
        loading.value = false;
    }
};

</script>

<style lang="scss" scoped>
$bg-color: #F2F2F7;
$card-bg: #FFFFFF;
$text-primary: #1C1C1E;
$text-secondary: #8E8E93;
$theme-blue: #007AFF;
$theme-red: #FF3B30;
$border-color: #E5E5EA;

.page-container {
    min-height: 100vh;
    background-color: $bg-color;
    padding-bottom: 40rpx;
}

/* Image Section */
.image-section {
    width: 100%;
    // aspect-ratio: 3/4; /* Remove fixed ratio for container */
    height: 30vh; /* 30% of screen height */
    background-color: transparent; /* Remove gray background for container */
    position: relative;
    display: flex;
    justify-content: center; /* Center horizontally */
    align-items: center;
    margin-bottom: 20rpx;
    
    .product-image {
        height: 100%;
        width: 100%;
        border-radius: 16rpx;
    }
    
    .image-placeholder {
        height: 100%;
        width: 400rpx; /* Fixed width for placeholder to look good */
        background-color: #E1E1E5; /* Placeholder bg only for the image area */
        border-radius: 16rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: $text-secondary;
        
        .camera-icon {
            font-size: 60rpx;
            margin-bottom: 20rpx;
        }
        
        .placeholder-text {
            font-size: 26rpx;
        }
    }

    .edit-overlay {
        position: absolute;
        bottom: 0;
        left: 50%; /* Center the overlay relative to container */
        transform: translateX(-50%); /* Adjust centering */
        width: auto; /* Match image width roughly, or use JS to calculate */
        /* To perfectly match the image width in CSS only is tricky without fixed widths.
           Here we can just make it part of the image container or style it to look good floating.
        */
        height: 60rpx;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16rpx;
        padding: 0 40rpx;
        
        .edit-text {
            color: #fff;
            font-size: 24rpx;
        }
    }
}

/* Form Styles */
.form-container {
    padding: 0 32rpx;
}

.form-group {
    background-color: $card-bg;
    border-radius: 20rpx;
    margin-bottom: 40rpx;
    padding-left: 32rpx; // Indent divider
    overflow: hidden;
    position: relative;
}

.divider {
    height: 1rpx;
    background-color: $border-color;
    width: 100%;
}

.form-item {
    padding: 24rpx 32rpx 24rpx 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 88rpx;
}

.form-item-col {
    padding: 24rpx 32rpx 24rpx 0;
    display: flex;
    flex-direction: column;
    min-height: 88rpx;
    
    .row-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    
    .update-time {
        font-size: 22rpx;
        color: $text-secondary;
        margin-top: 8rpx;
        align-self: flex-end;
    }
}

.label {
    font-size: 32rpx;
    color: $text-primary;
    font-weight: 400;
}

.input {
    flex: 1;
    text-align: right;
    font-size: 32rpx;
    color: $text-primary;
    margin-left: 20rpx;
}

.price-input {
    color: $theme-blue;
    font-weight: 600;
}

.placeholder {
    color: #C7C7CC;
}

/* Action Buttons */
.action-area {
    margin-top: 60rpx;
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
    
    .btn-primary {
        background-color: $theme-blue;
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
    }
    
    .btn-secondary {
        background-color: #fff;
        color: $theme-blue;
        border: 2rpx solid $theme-blue;
    }
    
    .button-row {
        display: flex;
        justify-content: space-between;
        gap: 20rpx;
        margin-bottom: 24rpx;
        
        button {
            margin-bottom: 0;
        }
    }
    
    .flex-1 {
        flex: 1;
    }
    
    .btn-danger {
        background-color: $theme-red;
        color: #fff;
        // border: 2rpx solid $theme-red;
        box-shadow: 0 4rpx 12rpx rgba(255, 59, 48, 0.3);
    }
}

</style>