/*
 * @Date: 2025-09-27 23:16:15
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-27 23:16:35
 * @FilePath: /backend/config/database.js
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        }
    }
);

// 测试数据库连接
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection
};
