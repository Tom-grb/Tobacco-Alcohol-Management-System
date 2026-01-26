// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const db = uniCloud.database();
const dbCmd = db.command;
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'fzh-project-secret-key-2026';

module.exports = {
	_before: async function () {
        this.startTime = Date.now();
        const token = this.getUniIdToken();
        if(!token) {
            const err = new Error('未登录');
            err.errCode = 'TOKEN_INVALID';
            throw err;
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            this.uid = decoded.uid;
            
            // 校验用户是否存在
            const userRes = await db.collection('fzh_user').where({
                _id: this.uid
            }).count();
            
            if (userRes.total === 0) {
                const err = new Error('用户不存在或已被删除');
                err.errCode = 'TOKEN_INVALID';
                throw err;
            }
        } catch (err) {
             const e = new Error('登录校验失败：' + err.message);
             e.errCode = 'TOKEN_INVALID';
             throw e;
        }
	},
    
    /**
     * 添加/编辑记录
     */
    async addOrUpdate(params) {
        const { id, wine_id, supplier, purchase_date, box_num, bottle_per_box, price_per_bottle, total_amount } = params;
        
        if (!wine_id) throw new Error('关联酒水ID不能为空');
        const now = Date.now();
        
        let data = {
            user_id: this.uid,
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
            await db.collection('fzh_wine_history').where({
                _id: id,
                user_id: this.uid
            }).update(data);
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
        await db.collection('fzh_wine_history').where({
            _id: id,
            user_id: this.uid
        }).remove();
        return { msg: '删除成功' };
    },

    /**
     * 获取指定酒水的历史记录（分页）
     */
    async getHistory(wine_id, page = 1, pageSize = 10) {
        if (!wine_id) return { list: [], total: 0 };
        
        const countRes = await db.collection('fzh_wine_history').where({ 
            wine_id,
            user_id: this.uid
         }).count();
        const total = countRes.total;
        
        const res = await db.collection('fzh_wine_history')
            .where({
                 wine_id,
                 user_id: this.uid
            })
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
            .where({ 
                wine_id,
                user_id: this.uid
             })
            .orderBy('purchase_date', 'desc')
            .limit(limit)
            .get();
        // Return reversed (Oldest -> Newest) for chart left-to-right logic? 
        // Or Frontend can reverse. Let's return raw desc.
        return res.data;
    },

    /**
     * 导出查询：根据进货时间范围获取详细数据 (含酒水名称关联)
     */
    async getExportData(startDate, endDate) {
        if (!startDate || !endDate) return [];
        
        // 1. 获取历史记录
        const MAX_LIMIT = 1000;
        const historyRes = await db.collection('fzh_wine_history')
            .where({
                user_id: this.uid,
                purchase_date: dbCmd.gte(startDate).lte(endDate)
            })
            .orderBy('purchase_date', 'desc')
            .limit(MAX_LIMIT)
            .get();
        
        const historyList = historyRes.data;
        if (historyList.length === 0) return [];
        
        // 2. 提取所有关联的 wine_id
        const wineIds = historyList.map(h => h.wine_id);
        const uniqueWineIds = [...new Set(wineIds)];
        
        // 3. 批量查询酒水名称
        const wineRes = await db.collection('fzh_wine')
            .where({
                _id: dbCmd.in(uniqueWineIds.slice(0, 1000)), // Safety slice
                user_id: this.uid
            })
            .field({ _id: 1, name: 1 })
            .limit(1000)
            .get();
            
        // 4. 构建 ID -> Name 映射
        const wineMap = {};
        wineRes.data.forEach(w => {
            wineMap[w._id] = w.name;
        });
        
        // 5. 组合数据
        return historyList.map(h => ({
            ...h,
            wine_name: wineMap[h.wine_id] || '未知酒水'
        }));
    }
}