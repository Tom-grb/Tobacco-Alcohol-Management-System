// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
	_before: function () {
        // 通用预处理器
	},
    
    /**
     * 添加/编辑记录
     */
    async addOrUpdate(params) {
        const { id, wine_id, supplier, purchase_date, box_num, bottle_per_box, price_per_bottle, total_amount } = params;
        
        if (!wine_id) throw new Error('关联酒水ID不能为空');
        const now = Date.now();
        
        let data = {
            wine_id,
            supplier: supplier || '',
            purchase_date: purchase_date || now,
            box_num: Number(box_num) || 0,
            bottle_per_box: Number(bottle_per_box) || 0,
            price_per_bottle: parseFloat(price_per_bottle) || 0,
            total_amount: parseFloat(total_amount) || 0,
            updated_at: now
        };
        
        if (id) {
            // Update
            await db.collection('fzh_wine_history').doc(id).update(data);
            return { id, msg: '更新成功' };
        } else {
            // Add
            data.created_at = now;
            const res = await db.collection('fzh_wine_history').add(data);
            return { id: res.id, msg: '添加成功' };
        }
    },

    /**
     * 删除记录
     */
    async delete(id) {
        if (!id) throw new Error('ID不能为空');
        await db.collection('fzh_wine_history').doc(id).remove();
        return { msg: '删除成功' };
    },

    /**
     * 获取指定酒水的历史记录（分页）
     */
    async getHistory(wine_id, page = 1, pageSize = 10) {
        if (!wine_id) return { list: [], total: 0 };
        
        const countRes = await db.collection('fzh_wine_history').where({ wine_id }).count();
        const total = countRes.total;
        
        const res = await db.collection('fzh_wine_history')
            .where({ wine_id })
            .orderBy('purchase_date', 'desc') // Latest first
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .get();
            
        return {
            list: res.data,
            total,
            hasMore: (page * pageSize) < total
        };
    },
    
    /**
     * 获取最近N条记录用于图表（不分页，取最近N条）
     */
    async getRecentHistory(wine_id, limit = 10) {
        if (!wine_id) return [];
        const res = await db.collection('fzh_wine_history')
            .where({ wine_id })
            .orderBy('purchase_date', 'desc')
            .limit(limit)
            .get();
        // Return reversed (Oldest -> Newest) for chart left-to-right logic? 
        // Or Frontend can reverse. Let's return raw desc.
        return res.data;
    }
}