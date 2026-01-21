// fzh-user/index.obj.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = uniCloud.database();
const usersCollection = db.collection('fzh_user');

const JWT_SECRET = 'fzh-project-secret-key-2026'; // 实际开发建议配置在云函数环境变量中
const TOKEN_EXPIRATION = '7d';

function hashPassword(password) {
	return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

module.exports = {
	_before: async function() {
		this.startTime = Date.now();
	},

	/**
	 * 注册
	 * @param {Object} params
	 * @param {String} params.username
	 * @param {String} params.password
	 */
	async register(params) {
		const { username, password } = params;

		// 1. 基础校验
		if (!username || !password) {
			throw new Error('用户名和密码不能为空');
		}

		// 密码复杂度校验：8-20位，包含字母和数字
		const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,20}$/;
		if (!passwordRegex.test(password)) {
			throw new Error('密码需为8-20位，且包含字母和数字');
		}

		// 2. 查重
		const countResult = await usersCollection.where({
			username: username
		}).count();

		if (countResult.total > 0) {
			throw new Error('用户名已存在');
		}

		// 3. 写入数据库
		const hashedPassword = hashPassword(password);
		const result = await usersCollection.add({
			username,
			password: hashedPassword,
			register_date: Date.now()
		});

		return {
			errCode: 0,
			errMsg: '注册成功',
			uid: result.id
		};
	},

	/**
	 * 登录
	 * @param {Object} params
	 * @param {String} params.username
	 * @param {String} params.password
	 */
	async login(params) {
		const { username, password } = params;

		if (!username || !password) {
			throw new Error('用户名和密码不能为空');
		}

		// 1. 查询用户
		const userResult = await usersCollection.where({
			username: username
		}).limit(1).get();

		if (userResult.data.length === 0) {
			throw new Error('用户不存在');
		}

		const user = userResult.data[0];

		// 2. 校验密码
		if (hashPassword(password) !== user.password) {
			throw new Error('密码错误');
		}

		// 3. 生成Token
		const token = jwt.sign({
			uid: user._id,
			username: user.username
		}, JWT_SECRET, {
			expiresIn: TOKEN_EXPIRATION
		});

		// 4. 更新最后登录时间
		await usersCollection.doc(user._id).update({
			last_login_date: Date.now()
		});

		return {
			errCode: 0,
			errMsg: '登录成功',
			token,
			userInfo: {
				uid: user._id,
				username: user.username
			}
		};
	}
};
