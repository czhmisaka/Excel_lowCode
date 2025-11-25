/*
 * @Date: 2025-11-25 18:43:45
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 18:44:13
 * @FilePath: /lowCode_excel/backend/test_sqlite_connection.js
 */
const { testConnection, initializeDatabase } = require('./config/database');

async function testSQLiteConnection() {
    try {
        console.log('正在测试SQLite数据库连接...');
        console.log('数据库类型:', process.env.DB_TYPE);
        console.log('数据库路径:', process.env.DB_STORAGE);
        
        // 测试连接
        const connectionSuccess = await testConnection();
        
        if (connectionSuccess) {
            console.log('✅ 数据库连接成功！');
            
            // 初始化数据库表结构
            console.log('开始初始化数据库表结构...');
            const initResult = await initializeDatabase();
            
            if (initResult.success) {
                console.log('✅ 数据库表结构初始化成功');
                console.log('初始化报告:', JSON.stringify(initResult, null, 2));
            } else {
                console.error('❌ 数据库表结构初始化失败');
                console.error('错误信息:', initResult.message);
                if (initResult.error) {
                    console.error('详细错误:', initResult.error);
                }
                return false;
            }
            
            return true;
        } else {
            console.error('❌ 数据库连接失败');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 数据库连接测试失败:');
        console.error('错误信息:', error.message);
        console.error('错误堆栈:', error.stack);
        
        return false;
    }
}

// 加载环境变量
require('dotenv').config();

testSQLiteConnection().then(success => {
    if (success) {
        console.log('\n🎉 SQLite数据库连接测试通过！');
        process.exit(0);
    } else {
        console.log('\n💥 SQLite数据库连接测试失败！');
        process.exit(1);
    }
});
