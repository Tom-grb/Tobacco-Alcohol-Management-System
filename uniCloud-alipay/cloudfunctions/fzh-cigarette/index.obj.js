// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程: https://ask.dcloud.net.cn/article/129
const db = uniCloud.database();
const dbCmd = db.command;
const XLSX = require('xlsx');
const iconv = require('iconv-lite');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'fzh-project-secret-key-2026';

module.exports = {
	_before: async function () { // 通用预处理器
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
     * 添加香烟
     * @param {Object} params 
     */
	async add(params) {
		const { image_url, name, wholesale_price, purchase_price, retail_price } = params;
        
        if (!name) throw new Error('请输入香烟名称');
        if (!wholesale_price) throw new Error('请输入批发价');

        const now = Date.now();
        
        let addData = {
            user_id: this.uid,
            image_url: image_url || '', // 选填
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
        
        const res = await db.collection('fzh_cigarette').where({
            _id: id,
            user_id: this.uid
        }).get();
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
        const { id, image_url, name, wholesale_price, purchase_price, retail_price } = params;
        
        if (!id) throw new Error('ID不能为空');

        const oldDataRes = await db.collection('fzh_cigarette').where({
            _id: id,
            user_id: this.uid
        }).get();
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

        await db.collection('fzh_cigarette').where({
            _id: id,
            user_id: this.uid
        }).update(updateData);
        
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
        const res = await db.collection('fzh_cigarette').where({
            _id: id,
            user_id: this.uid
        }).remove();
        return {
            msg: '删除成功'
        }
    },

    /**
     * 解析上传的Excel/CSV文件 (服务端解析解决编码问题)
     * @param {String} fileBase64 
     */
    async parseExcelFile(fileBase64) {
        if (!fileBase64) throw new Error('文件内容为空');
        
        // Convert base64 to buffer
        const buf = Buffer.from(fileBase64, 'base64');
        const hex = buf.toString('hex').toUpperCase();
        
        let workbook;
        
        // 1. Binary Excel (.xlsx/.xls)
        if (hex.startsWith('504B0304') || hex.startsWith('D0CF11E0')) {
             workbook = XLSX.read(buf, { type: 'buffer' });
        } else {
             // 2. CSV / Text
             // 智能检测 GBK: 检查 "商品"(C9CCC6B7) 或 "编码"(B1E0C2EB) 或 "批发"(C5FAC2A2)
             let isGbk = false;
             if (hex.includes('C9CCC6B7') || hex.includes('B1E0C2EB') || hex.includes('C5FAC2A2')) {
                 isGbk = true;
             }
             
             let content;
             if (isGbk) {
                 content = iconv.decode(buf, 'gbk');
             } else {
                 // 尝试 UTF-8
                 content = buf.toString('utf8');
                 // 如果 UTF-8 出现大量乱码特征, 且不是 GBK, 可能是 Latin1? 
                 // 但通常 CSV 只有 UTF-8 或 GBK (在中国).
                 // 简单的兜底: 如果解析出来没有中文关键字，尝试用 GBK 再解一次?
                 if (!content.includes('商品') && !content.includes('编码')) {
                      const contentTryGbk = iconv.decode(buf, 'gbk');
                      if (contentTryGbk.includes('商品') || contentTryGbk.includes('编码')) {
                          content = contentTryGbk;
                      }
                 }
             }
             workbook = XLSX.read(content, { type: 'string' });
        }
        
        if (!workbook || !workbook.SheetNames.length) {
            throw new Error('无法解析Excel/CSV文件');
        }

        const sheetName = workbook.SheetNames[0];
        return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    },

    /**
     * 批量导入
     * @param {Array} items [{ name, wholesale_price, manufacturer }]
     */
    async batchImport(items) {
        if (!items || items.length === 0) return { total: 0, updated: 0, added: 0, logs: [] };

        const logs = [];
        let added = 0;
        let updated = 0;
        const now = Date.now();

        // 1. 收集所有 Names
        const names = items.map(i => String(i.name).trim()).filter(c => c);
        if (names.length === 0) return { total: 0, updated: 0, added: 0, logs: [], msg: '有效数据为空' };

        // 2. 分批查询现有数据
        const existingMap = new Map();
        const CHUNK_SIZE = 100;
        for (let i = 0; i < names.length; i += CHUNK_SIZE) {
             const chunk = names.slice(i, i + CHUNK_SIZE);
             if (chunk.length === 0) continue;
             const { data } = await db.collection('fzh_cigarette')
                .where({
                    user_id: this.uid,
                    name: dbCmd.in(chunk)
                })
                .limit(1000)
                .get();
             data.forEach(item => {
                 existingMap.set(item.name, item);
             });
        }

        // 3. 遍历处理
        for (const item of items) {
            const name = String(item.name || '').trim();
            const manufacturer = String(item.manufacturer || '').trim(); 
            const price = parseFloat(item.wholesale_price);
            
            if (!name || isNaN(price)) continue;

            const existing = existingMap.get(name);
            
            if (existing) {
                // Check for updates
                let hasChange = false;
                let priceChange = 0; // 0: none, 1: up, -1: down
                let oldPrice = existing.wholesale_price;
                
                const updateData = { updated_at: now };
                
                // 价格变动
                if (existing.wholesale_price !== price) {
                    hasChange = true;
                    if (price > existing.wholesale_price) priceChange = 1;
                    else priceChange = -1;
                    
                    updateData.wholesale_price = price;
                    updateData.wholesale_price_updated_at = now;
                    
                    logs.push({
                         type: 'update',
                         name: name,
                         old_price: oldPrice,
                         new_price: price,
                         change: priceChange
                    });
                }
                
                if (manufacturer && existing.manufacturer !== manufacturer) {
                     hasChange = true;
                     updateData.manufacturer = manufacturer;
                }
                

                if (hasChange) {
                    updated++;
                    await db.collection('fzh_cigarette').doc(existing._id).update(updateData);
                }

            } else {
                // Add new
                const newData = {
                    user_id: this.uid,
                    name: name,
                    manufacturer: manufacturer,
                    wholesale_price: price,
                    wholesale_price_updated_at: now,
                    purchase_price: 0,
                    retail_price: 0,
                    created_at: now,
                    updated_at: now
                };
                await db.collection('fzh_cigarette').add(newData);
                added++;
                logs.push({
                    type: 'add',
                    name: name,
                    new_price: price
                });
            }
        }

        return {
            total: items.length,
            updated,
            added,
            logs
        };
    },

    /**
     * 搜索香烟
     * @param {String} keyword 
 
     * @param {Number} skip 
     * @param {Number} limit 
     */
    async search(keyword, skip = 0, limit = 10) {
        if (!keyword) return [];
        
        // 模糊查询: 名称
        const regex = new RegExp(keyword, 'i');
        const res = await db.collection('fzh_cigarette').where(
            dbCmd.and([
                { user_id: this.uid },
                { name: regex }
            ])
        ).orderBy('updated_at', 'desc').skip(skip).limit(limit).get();
        
        return res.data;
    },

    /**
     * 获取香烟总数
     */
    async count() {
        const res = await db.collection('fzh_cigarette').where({
            user_id: this.uid
        }).count();
        return res.total;
    },

    /**
     * 获取所有香烟数据 (用于列表页本地排序)
     */
    async getAll() {
        // limit默认20，最大1000。如果要支持更多，需循环获取。
        // 这里暂时实现单次最大获取 1000 条
        const res = await db.collection('fzh_cigarette')
            .where({
                user_id: this.uid
            })
            .field({ name: 1, wholesale_price: 1, manufacturer: 1 })
            .limit(1000)
            .get();
        return res.data;
    }
}