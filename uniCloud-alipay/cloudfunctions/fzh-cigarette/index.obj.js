// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程: https://ask.dcloud.net.cn/article/129
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
	_before: function () { // 通用预处理器
        // 简单的鉴权
        // const token = this.getUniIdToken();
        // if(!token) {
        //     throw new Error('未登录');
        // }
	},
    
    /**
     * 添加香烟
     * @param {Object} params 
     */
	async add(params) {
		const { image_url, company_code, name, wholesale_price, purchase_price, retail_price } = params;
        
        if (!company_code) throw new Error('请输入公司编码');
        if (!name) throw new Error('请输入香烟名称');
        if (!wholesale_price) throw new Error('请输入批发价');

        const now = Date.now();
        
        let addData = {
            image_url: image_url || '', // 选填
            company_code,
            name,
            wholesale_price: parseFloat(wholesale_price),
            wholesale_price_updated_at: now,
            
            // 选填字段处理：默认为0，仅当有值时设置更新时间，避免传 null 给 timestamp 类型字段报错
            purchase_price: purchase_price ? parseFloat(purchase_price) : 0,
            retail_price: retail_price ? parseFloat(retail_price) : 0,

            created_at: now,
            updated_at: now
        };

        if (purchase_price) {
            addData.purchase_price_updated_at = now;
        }
        
        if (retail_price) {
            addData.retail_price_updated_at = now;
        }

        const res = await db.collection('fzh_cigarette').add(addData);
        
        return {
            id: res.id,
            msg: '添加成功'
        }
	},

    /**
     * 获取详情
     * @param {String} id 
     */
    async get(id) {
        if (!id) throw new Error('ID不能为空');
        
        const res = await db.collection('fzh_cigarette').doc(id).get();
        if (res.data && res.data.length > 0) {
            return res.data[0];
        }
        return null;
    },

    /**
     * 更新香烟
     * @param {Object} params 
     */
    async update(params) {
        const { id, image_url, company_code, name, wholesale_price, purchase_price, retail_price } = params;
        
        if (!id) throw new Error('ID不能为空');

        const oldDataRes = await db.collection('fzh_cigarette').doc(id).get();
        if (!oldDataRes.data || oldDataRes.data.length === 0) {
            throw new Error('数据不存在');
        }
        const oldData = oldDataRes.data[0];

        const now = Date.now();
        let updateData = {
            updated_at: now
        };

        // 图片现在是选填，如果传了就更新，没传如果是空字符串也更新（比如删除图片场景，暂时这里只处理有值情况或显式更新）
        // 这里假设前端传什么就更什么
        if (image_url !== undefined) updateData.image_url = image_url;
        if (company_code) updateData.company_code = company_code;
        if (name) updateData.name = name;

        // 检查价格变化，更新对应的时间戳
        if (wholesale_price !== undefined && parseFloat(wholesale_price) !== oldData.wholesale_price) {
            updateData.wholesale_price = parseFloat(wholesale_price);
            updateData.wholesale_price_updated_at = now;
        }
        
        // 选填字段更新逻辑
        // 只要传了就更新，即使是空值也允许置空？通常输入框传空字符串
        // 为了严谨，如果前端传了 purchase_price (哪怕是空串代表清空)，我们处理一下
        // 但前端绑定的是 digit input，空可能是 undefined 或 null 或 ''
        if (purchase_price !== undefined) {
             const newPurchase = purchase_price ? parseFloat(purchase_price) : 0;
             if(newPurchase !== oldData.purchase_price) {
                 updateData.purchase_price = newPurchase;
                 updateData.purchase_price_updated_at = now;
             }
        }
        
        if (retail_price !== undefined) {
             const newRetail = retail_price ? parseFloat(retail_price) : 0;
             if(newRetail !== oldData.retail_price) {
                 updateData.retail_price = newRetail;
                 updateData.retail_price_updated_at = now;
             }
        }

        await db.collection('fzh_cigarette').doc(id).update(updateData);
        
        return {
            msg: '更新成功'
        }
    },

    /**
     * 删除香烟
     * @param {String} id 
     */
    async delete(id) {
        if (!id) throw new Error('ID不能为空');
        await db.collection('fzh_cigarette').doc(id).remove();
        return {
            msg: '删除成功'
        }
    },

    /**
     * 搜索香烟
     * @param {String} keyword 
     * @param {Number} skip 
     * @param {Number} limit 
     */
    async search(keyword, skip = 0, limit = 20) {
        if (!keyword) return [];
        
        // 模糊查询: 名称 或 编码
        const regex = new RegExp(keyword, 'i');
        const res = await db.collection('fzh_cigarette').where(
            dbCmd.or([
                { name: regex },
                { company_code: regex }
            ])
        ).orderBy('updated_at', 'desc').skip(skip).limit(limit).get();
        
        return res.data;
    }
}