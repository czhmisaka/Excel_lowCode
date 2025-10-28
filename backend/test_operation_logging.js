const axios = require('axios');

// 测试操作日志记录功能
async function testOperationLogging() {
    try {
        console.log('🔍 测试操作日志记录功能...');

        // 首先需要登录获取有效的令牌
        console.log('\n🔐 模拟登录获取令牌...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (!loginResponse.data.success) {
            console.log('❌ 登录失败:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功，获取到令牌');

        // 获取一个现有的表哈希值用于测试
        console.log('\n📊 获取现有表映射...');
        const mappingsResponse = await axios.get('http://localhost:3000/api/mappings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!mappingsResponse.data.success || mappingsResponse.data.data.length === 0) {
            console.log('❌ 没有找到可用的数据表');
            return;
        }

        const testMapping = mappingsResponse.data.data[0];
        const tableHash = testMapping.hashValue;
        const tableName = testMapping.tableName;

        console.log(`📋 使用表进行测试: ${tableName} (${tableHash})`);

        // 测试新增数据
        console.log('\n➕ 测试新增数据...');
        const addResponse = await axios.post(`http://localhost:3000/api/data/${tableHash}/add`, {
            updates: {
                name: '测试用户',
                department: '测试部门',
                created_at: new Date().toISOString()
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (addResponse.data.success) {
            console.log('✅ 新增数据成功');
            const newRecordId = addResponse.data.data.id;

            // 测试更新数据
            console.log('\n✏️ 测试更新数据...');
            const updateResponse = await axios.put(`http://localhost:3000/api/data/${tableHash}`, {
                conditions: { id: newRecordId },
                updates: { department: '更新后的部门' }
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (updateResponse.data.success) {
                console.log('✅ 更新数据成功');

                // 测试删除数据
                console.log('\n🗑️ 测试删除数据...');
                const deleteResponse = await axios.delete(`http://localhost:3000/api/data/${tableHash}`, {
                    data: {
                        conditions: { id: newRecordId }
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (deleteResponse.data.success) {
                    console.log('✅ 删除数据成功');
                } else {
                    console.log('❌ 删除数据失败:', deleteResponse.data.message);
                }
            } else {
                console.log('❌ 更新数据失败:', updateResponse.data.message);
            }
        } else {
            console.log('❌ 新增数据失败:', addResponse.data.message);
        }

        // 检查生成的日志记录
        console.log('\n📋 检查生成的日志记录...');
        const { sequelize } = require('./config/database');
        const TableLogModel = require('./models/TableLog');
        const TableLog = TableLogModel(sequelize);

        await sequelize.authenticate();

        const recentLogs = await TableLog.findAll({
            where: {
                tableHash: tableHash
            },
            order: [['operationTime', 'DESC']],
            limit: 10
        });

        console.log(`\n📊 表 ${tableName} 的最近操作日志:`);
        if (recentLogs.length === 0) {
            console.log('   ❌ 没有找到任何日志记录');
        } else {
            recentLogs.forEach(log => {
                console.log(`   - ID: ${log.id}, 操作: ${log.operationType}, 记录ID: ${log.recordId}, 用户: ${log.username}, 时间: ${log.operationTime.toLocaleString('zh-CN')}`);
            });
        }

        console.log('\n🎉 操作日志记录测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('响应数据:', error.response.data);
        }
    }
}

testOperationLogging();
