/*
 * @Date: 2025-09-27 23:16:15
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-19 00:23:42
 * @FilePath: /lowCode_excel/backend/config/database.js
 */
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// 创建数据库连接实例
let sequelize;

if (process.env.DB_TYPE === 'sqlite') {
    // SQLite 连接
    const dbPath = process.env.SQLITE_DB_PATH || '/app/data/annual_leave.db';
    console.log(`使用 SQLite 数据库: ${dbPath}`);

    sequelize = new Sequelize({
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
    });
} else {
    // MySQL 连接
    console.log(`使用 MySQL 数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

    sequelize = new Sequelize(
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
}

// 测试数据库连接
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        
        // 提供更详细的错误信息
        if (process.env.DB_TYPE === 'mysql') {
            console.error('MySQL连接配置:');
            console.error('- 主机:', process.env.DB_HOST);
            console.error('- 端口:', process.env.DB_PORT);
            console.error('- 数据库:', process.env.DB_NAME);
            console.error('- 用户:', process.env.DB_USER);
        } else {
            console.error('SQLite数据库路径:', process.env.SQLITE_DB_PATH || './data/annual_leave.db');
        }
        
        return false;
    }
};

/**
 * 初始化数据库表结构
 * 使用自动建表模块确保所有必需表都存在
 */
const initializeDatabase = async () => {
    try {
        const autoTableCreator = require('../utils/autoTableCreator');
        console.log('开始自动初始化数据库表结构...');
        
        const result = await autoTableCreator.initializeDatabase();
        
        if (result.success) {
            console.log('✅ 数据库表结构初始化成功');
        } else {
            console.error('❌ 数据库表结构初始化失败');
            console.error('初始化报告:', JSON.stringify(result, null, 2));
        }
        
        return result;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        return {
            success: false,
            message: '数据库初始化失败',
            error: error.message
        };
    }
};

/**
 * 获取数据库健康状态
 */
const getDatabaseHealth = async () => {
    try {
        const autoTableCreator = require('../utils/autoTableCreator');
        return await autoTableCreator.getHealthStatus();
    } catch (error) {
        return {
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = {
    sequelize,
    testConnection,
    initializeDatabase,
    getDatabaseHealth
};
