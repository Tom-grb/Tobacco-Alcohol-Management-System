// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
	_before: function () {
        // 通用预处理器
	},
    
    /**
     * 添加酒水
     */
	async add(params) {
		const { image_url, name } = params;
        
        if (!name) {
            throw new Error('请输入酒水名称');
        }

        const now = Date.now();
        
        let addData = {
            image_url: image_url || '',
            name,
            created_at: now,
            updated_at: now
        };

        const res = await db.collection('fzh_wine').add(addData);
        
        return {
            id: res.id,
            msg: '添加成功'
        }
	},

    /**
     * 获取详情 (仅酒水基础信息)
     */
    async get(id) {
        if (!id) throw new Error('ID不能为空');
        
        const res = await db.collection('fzh_wine').doc(id).get();
        if (res.data && res.data.length > 0) {
            return res.data[0];
        }
        return null;
    },

    /**
     * 更新酒水
     */
    async update(params) {
        const { id, image_url, name } = params;
        
        if (!id) throw new Error('ID不能为空');

        const now = Date.now();
        let updateData = {
            updated_at: now
        };

        if (image_url !== undefined) updateData.image_url = image_url;
        if (name) updateData.name = name;

        await db.collection('fzh_wine').doc(id).update(updateData);
        
        return {
            msg: '更新成功'
        }
    },

    /**
     * 删除酒水
     */
    async delete(id) {
        if (!id) throw new Error('ID不能为空');
        await db.collection('fzh_wine').doc(id).remove();
        return {
            msg: '删除成功'
        }
    },
    
    /**
     * 搜索酒水 (Name only)
     * @param {String} keyword 
     * @param {Number} skip 
     * @param {Number} limit 
     */
    async search(keyword, skip = 0, limit = 10) {
        if (!keyword) return [];
        const regex = new RegExp(keyword, 'i');
        const res = await db.collection('fzh_wine').where({
            name: regex
        }).orderBy('updated_at', 'desc').skip(skip).limit(limit).get();
        return res.data;
    },

    async count() {
        const res = await db.collection('fzh_wine').count();
        return res.total;
    },

    async getAll() {
        const res = await db.collection('fzh_wine')
            .field({ name: 1, company_code: 1, wholesale_price: 1 })
            .limit(1000)
            .get();
        return res.data;
    }
}