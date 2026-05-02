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
     * 添加酒水
     */
	async add(params) {
		const { image_url, name, remark } = params;
        
        if (!name) {
            throw new Error('请输入酒水名称');
        }

        const now = Date.now();
        
        let addData = {
            user_id: this.uid,
            image_url: image_url || '',
            name,
            remark: remark || '',
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
        const res = await db.collection('fzh_wine').where({
            _id: id,
            user_id: this.uid
        }).get();
        if (res.data && res.data.length > 0) {
            return res.data[0];
        }
        return null;
    },

    /**
     * 更新酒水
     */
    async update(params) {
        const { id, image_url, name, remark } = params;
        
        if (!id) throw new Error('ID不能为空');

        const now = Date.now();
        let updateData = {
            updated_at: now
        };

        if (image_url !== undefined) updateData.image_url = image_url;
        if (name !== undefined) updateData.name = name;
        if (remark !== undefined) updateData.remark = remark;

        await db.collection('fzh_wine').where({
            _id: id,
            user_id: this.uid
        }).update(updateData);
        
        return {
            msg: '更新成功'
        }
    },

    /**
     * 删除酒水
     */
    async delete(id) {
        if (!id) throw new Error('ID不能为空');
        await db.collection('fzh_wine').where({
            _id: id,
            user_id: this.uid
        }).remove();
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
            user_id: this.uid,
            name: regex
        }).orderBy('updated_at', 'desc').skip(skip).limit(limit).get();
        return res.data;
    },

    async count() {
        const res = await db.collection('fzh_wine').where({
            user_id: this.uid
        }).count();
        return res.total;
    },

    async getAll() {
        const res = await db.collection('fzh_wine')
            .where({
                user_id: this.uid
            })
            .field({ name: 1, wholesale_price: 1 })
            .limit(1000)
            .get();
        return res.data;
    }
}