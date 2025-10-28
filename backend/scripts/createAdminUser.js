/*
 * @Date: 2025-10-28 14:37:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:41:24
 * @FilePath: /lowCode_excel/backend/scripts/createAdminUser.js
 */
require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');

/**
 * 创建默认管理员用户
 */
const createAdminUser = async () => {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        console.log('数据库连接成功');

        // 同步数据库表
        await sequelize.sync({ alter: true });
        console.log('数据库表同步成功');

        // 检查是否已存在管理员用户
        const existingAdmin = await User.findOne({
            where: { username: 'admin' }
        });

        if (existingAdmin) {
            console.log('管理员用户已存在，跳过创建');
            console.log('管理员信息:');
            console.log(`- 用户名: ${existingAdmin.username}`);
            console.log(`- 显示名称: ${existingAdmin.displayName}`);
            console.log(`- 角色: ${existingAdmin.role}`);
            console.log(`- 状态: ${existingAdmin.isActive ? '激活' : '禁用'}`);
            return;
        }

        // 创建默认管理员用户
        const adminUser = await User.createWithPassword({
            username: 'admin',
            password: 'admin123', // 默认密码，建议首次登录后修改
            displayName: '系统管理员',
            email: 'admin@example.com',
            role: 'admin'
        });

        console.log('默认管理员用户创建成功');
        console.log('管理员信息:');
        console.log(`- 用户名: ${adminUser.username}`);
        console.log(`- 显示名称: ${adminUser.displayName}`);
        console.log(`- 角色: ${adminUser.role}`);
        console.log(`- 邮箱: ${adminUser.email}`);
        console.log('');
        console.log('重要提示:');
        console.log('1. 默认密码为: admin123');
        console.log('2. 请尽快登录系统并修改密码');
        console.log('3. 建议创建其他管理员账户后禁用或删除此默认账户');

    } catch (error) {
        console.error('创建管理员用户失败:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
};

// 如果直接运行此脚本
if (require.main === module) {
    createAdminUser();
}

module.exports = createAdminUser;










