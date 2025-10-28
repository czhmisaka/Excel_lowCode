const { sequelize } = require('./config/database');
const TableLogModel = require('./models/TableLog');
const OperationLogger = require('./utils/logger');

// 初始化日志表模型
const TableLog = TableLogModel(sequelize);

async function generateTestLogs() {
    try {
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');

        // 生成测试日志记录
        const testLogs = [
            {
                operationType: 'create',
                tableName: '员工信息',
                tableHash: '88c24054abce351a80a58479380c5731',
                recordId: 1,
                oldData: null,
                newData: JSON.stringify({ id: 1, name: '张三', department: '技术部' }),
                description: '新增员工记录',
                userId: 1,
                username: 'admin',
                operationTime: new Date(Date.now() - 3600000), // 1小时前
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                operationType: 'update',
                tableName: '员工信息',
                tableHash: '88c24054abce351a80a58479380c5731',
                recordId: 1,
                oldData: JSON.stringify({ id: 1, name: '张三', department: '技术部' }),
                newData: JSON.stringify({ id: 1, name: '张三', department: '研发部' }),
                description: '更新员工部门',
                userId: 1,
                username: 'admin',
                operationTime: new Date(Date.now() - 1800000), // 30分钟前
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                operationType: 'delete',
                tableName: '员工信息',
                tableHash: '88c24054abce351a80a58479380c5731',
                recordId: 2,
                oldData: JSON.stringify({ id: 2, name: '李四', department: '销售部' }),
                newData: null,
                description: '删除员工记录',
                userId: 1,
                username: 'admin',
                operationTime: new Date(Date.now() - 900000), // 15分钟前
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                operationType: 'create',
                tableName: '假期余额',
                tableHash: '0bdb916b3eed7de2e95767459c35b915',
                recordId: 1,
                oldData: null,
                newData: JSON.stringify({ id: 1, employeeId: 1, leaveDays: 10, year: 2025 }),
                description: '新增假期余额记录',
                userId: 2,
                username: 'user1',
                operationTime: new Date(Date.now() - 7200000), // 2小时前
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            {
                operationType: 'update',
                tableName: '假期余额',
                tableHash: '0bdb916b3eed7de2e95767459c35b915',
                recordId: 1,
                oldData: JSON.stringify({ id: 1, employeeId: 1, leaveDays: 10, year: 2025 }),
                newData: JSON.stringify({ id: 1, employeeId: 1, leaveDays: 8, year: 2025 }),
                description: '更新假期余额',
                userId: 2,
                username: 'user1',
                operationTime: new Date(Date.now() - 600000), // 10分钟前
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        ];

        console.log('📝 开始生成测试日志记录...');

        for (const logData of testLogs) {
            try {
                await TableLog.create(logData);
                console.log(`✅ 创建日志记录: ${logData.operationType} ${logData.tableName}#${logData.recordId}`);
            } catch (error) {
                console.error(`❌ 创建日志记录失败: ${error.message}`);
            }
        }

        // 验证生成的日志记录
        const logCount = await TableLog.count();
        console.log(`\n📊 日志记录统计:`);
        console.log(`   总记录数: ${logCount}`);

        const recentLogs = await TableLog.findAll({
            limit: 10,
            order: [['operationTime', 'DESC']]
        });

        console.log(`\n📋 最近日志记录:`);
        recentLogs.forEach(log => {
            console.log(`   - ID: ${log.id}, 操作: ${log.operationType}, 表名: ${log.tableName}, 用户: ${log.username}, 时间: ${log.operationTime.toLocaleString('zh-CN')}`);
        });

        console.log('\n🎉 测试日志生成完成！');
        console.log('💡 现在可以在操作日志管理页面查看这些日志记录了。');

    } catch (error) {
        console.error('❌ 生成测试日志失败:', error);
    } finally {
        await sequelize.close();
    }
}

generateTestLogs();
