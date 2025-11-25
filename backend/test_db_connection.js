/*
 * @Date: 2025-11-23 14:37:15
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 14:37:42
 * @FilePath: /lowCode_excel/backend/test_db_connection.js
 */
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        console.log('正在测试MySQL数据库连接...');
        console.log('主机:', process.env.DB_HOST);
        console.log('端口:', process.env.DB_PORT);
        console.log('数据库:', process.env.DB_NAME);
        console.log('用户:', process.env.DB_USER);
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 10000,
            acquireTimeout: 10000,
            timeout: 10000
        });
        
        console.log('✅ 数据库连接成功！');
        
        // 测试查询
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('✅ 查询测试成功，结果:', rows[0].result);
        
        // 检查数据库版本
        const [versionRows] = await connection.execute('SELECT VERSION() AS version');
        console.log('✅ MySQL版本:', versionRows[0].version);
        
        // 检查数据库中的表
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('✅ 数据库中的表数量:', tables.length);
        
        await connection.end();
        return true;
        
    } catch (error) {
        console.error('❌ 数据库连接失败:');
        console.error('错误信息:', error.message);
        console.error('错误代码:', error.code);
        console.error('错误编号:', error.errno);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ 连接被拒绝 - 可能原因:');
            console.error('- 服务器地址或端口错误');
            console.error('- 防火墙阻止了连接');
            console.error('- MySQL服务未运行');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('❌ 访问被拒绝 - 可能原因:');
            console.error('- 用户名或密码错误');
            console.error('- 用户没有访问权限');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('❌ 数据库不存在 - 可能原因:');
            console.error('- 数据库名称错误');
            console.error('- 数据库未创建');
        }
        
        return false;
    }
}

// 加载环境变量
require('dotenv').config();

testConnection().then(success => {
    if (success) {
        console.log('\n🎉 数据库连接测试通过！');
        process.exit(0);
    } else {
        console.log('\n💥 数据库连接测试失败！');
        process.exit(1);
    }
});
