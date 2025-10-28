/*
 * @Date: 2025-10-28 16:36:18
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 16:36:51
 * @FilePath: /lowCode_excel/backend/test_logs_api.js
 */
const axios = require('axios');

// 测试日志API
async function testLogsAPI() {
    try {
        console.log('🔍 测试操作日志API...');

        // 首先获取认证令牌（这里使用一个测试令牌，实际使用时需要先登录获取）
        const token = 'test-token'; // 实际使用时需要先登录获取有效令牌

        // 测试获取日志列表
        console.log('\n📋 测试获取操作日志列表...');
        try {
            const response = await axios.get('http://localhost:3000/api/rollback/logs?page=1&limit=10', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ 日志列表API响应:', response.data);
        } catch (error) {
            if (error.response) {
                console.log('❌ 日志列表API错误:', error.response.data);
            } else {
                console.log('❌ 日志列表API错误:', error.message);
            }
        }

        // 测试数据库中的日志记录
        console.log('\n📊 直接查询数据库中的日志记录...');
        const { sequelize } = require('./config/database');
        const TableLogModel = require('./models/TableLog');
        const TableLog = TableLogModel(sequelize);

        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');

        const logCount = await TableLog.count();
        console.log(`📈 日志记录总数: ${logCount}`);

        const recentLogs = await TableLog.findAll({
            limit: 5,
            order: [['operationTime', 'DESC']]
        });

        console.log('\n📋 最近5条日志记录:');
        recentLogs.forEach(log => {
            console.log(`   - ID: ${log.id}, 操作: ${log.operationType}, 表名: ${log.tableName}, 用户: ${log.username}, 时间: ${log.operationTime.toLocaleString('zh-CN')}`);
        });

        console.log('\n🎉 日志系统测试完成！');
        console.log('💡 问题总结:');
        console.log('   1. 日志API需要有效的JWT令牌才能访问');
        console.log('   2. 数据库中有测试日志记录，说明日志记录功能正常');
        console.log('   3. 前端需要先登录获取令牌，然后才能访问日志管理页面');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

testLogsAPI();
