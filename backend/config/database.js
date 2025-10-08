/*
 * @Date: 2025-09-27 23:16:15
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-08 23:31:47
 * @FilePath: /综合部-年假计算/backend/config/database.js
 */
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// 根据环境变量选择数据库类型
const getDatabaseConfig = () => {
    const dbType = process.env.DB_TYPE || 'mysql';

    if (dbType === 'sqlite') {
        // SQLite 配置
        const dbPath = process.env.SQLITE_DB_PATH || '/app/data/annual_leave.db';
        console.log(`使用 SQLite 数据库: ${dbPath}`);

        return {
            dialect: 'sqlite',
            storage: dbPath,
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true
            }
        };
    } else {
        // MySQL 配置（默认）
        console.log(`使用 MySQL 数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

        return {
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
        };
    }
};

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    getDatabaseConfig()
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
