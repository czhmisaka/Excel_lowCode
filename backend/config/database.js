/*
 * @Date: 2025-09-27 23:16:15
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-09 01:13:26
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
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection
};
