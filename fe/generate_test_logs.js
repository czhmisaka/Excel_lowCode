import axios from 'axios';

const FRONTEND_URL = 'http://localhost:5173/backend';

/**
 * 生成测试操作日志
 * 通过上传测试Excel文件并执行一些操作来生成操作日志
 */
async function generateTestLogs() {
    console.log('🚀 开始生成测试操作日志...\n');

    let authToken = '';

    try {
        // 测试1: 用户登录
        console.log('📋 测试1: 用户登录');
        const loginResponse = await axios.post(`${FRONTEND_URL}/api/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });

        if (loginResponse.status === 200 && loginResponse.data.success) {
            authToken = loginResponse.data.data.token;
            console.log('✅ 用户登录成功');
        } else {
            console.log('❌ 用户登录失败');
            return;
        }

        if (!authToken) {
            console.log('❌ 无法获取认证令牌，测试终止');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        // 测试2: 检查当前映射表
        console.log('\n📋 测试2: 检查当前映射表');
        try {
            const mappingsResponse = await axios.get(`${FRONTEND_URL}/api/mappings`, { headers });
            const mappings = mappingsResponse.data;

            if (Array.isArray(mappings) && mappings.length > 0) {
                console.log('✅ 已有映射表，可以直接测试数据操作');
                console.log('   可用表名:');
                mappings.forEach((mapping, index) => {
                    console.log(`     ${index + 1}. ${mapping.tableName} (${mapping.hashValue})`);
                });

                // 使用第一个表进行测试
                const testTable = mappings[0];
                console.log(`\n🔧 使用表 "${testTable.tableName}" 进行测试操作`);

                // 测试3: 新增数据
                console.log('\n📋 测试3: 新增数据');
                try {
                    const addResponse = await axios.post(`${FRONTEND_URL}/api/data/${testTable.hashValue}`, {
                        updates: {
                            name: '测试用户',
                            email: 'test@example.com',
                            age: 25,
                            department: '技术部'
                        }
                    }, { headers });

                    if (addResponse.data.success) {
                        console.log('✅ 新增数据成功');
                        console.log(`   新增记录ID: ${addResponse.data.data.id}`);
                    } else {
                        console.log('❌ 新增数据失败:', addResponse.data.message);
                    }
                } catch (error) {
                    console.log('❌ 新增数据失败:', error.response?.data?.message || error.message);
                }

                // 测试4: 更新数据
                console.log('\n📋 测试4: 更新数据');
                try {
                    const updateResponse = await axios.put(`${FRONTEND_URL}/api/data/${testTable.hashValue}`, {
                        conditions: { id: 1 },
                        updates: { age: 26, department: '研发部' }
                    }, { headers });

                    if (updateResponse.data.success) {
                        console.log('✅ 更新数据成功');
                        console.log(`   影响行数: ${updateResponse.data.affectedRows}`);
                    } else {
                        console.log('❌ 更新数据失败:', updateResponse.data.message);
                    }
                } catch (error) {
                    console.log('❌ 更新数据失败:', error.response?.data?.message || error.message);
                }

                // 测试5: 删除数据
                console.log('\n📋 测试5: 删除数据');
                try {
                    const deleteResponse = await axios.delete(`${FRONTEND_URL}/api/data/${testTable.hashValue}`, {
                        data: { conditions: { id: 1 } },
                        headers
                    });

                    if (deleteResponse.data.success) {
                        console.log('✅ 删除数据成功');
                        console.log(`   影响行数: ${deleteResponse.data.affectedRows}`);
                    } else {
                        console.log('❌ 删除数据失败:', deleteResponse.data.message);
                    }
                } catch (error) {
                    console.log('❌ 删除数据失败:', error.response?.data?.message || error.message);
                }

            } else {
                console.log('⚠️ 没有映射表，需要先上传Excel文件');
                console.log('   请执行以下步骤:');
                console.log('   1. 访问 http://localhost:5173');
                console.log('   2. 登录系统 (用户名: admin, 密码: admin123)');
                console.log('   3. 在"文件管理"页面上传Excel文件');
                console.log('   4. 在"数据编辑"页面进行一些操作');
                console.log('   5. 然后刷新"操作日志"页面查看日志');
                return;
            }

        } catch (error) {
            console.log('❌ 获取映射表失败:', error.response?.data?.message || error.message);
        }

        // 测试6: 检查生成的日志
        console.log('\n📋 测试6: 检查生成的日志');
        try {
            const logsResponse = await axios.get(`${FRONTEND_URL}/api/rollback/logs`, { headers });
            if (logsResponse.data.success) {
                const logs = logsResponse.data.data?.logs || logsResponse.data.data;
                console.log(`📝 当前日志数量: ${Array.isArray(logs) ? logs.length : 'N/A'}`);

                if (Array.isArray(logs) && logs.length > 0) {
                    console.log('\n👥 操作日志详情:');
                    logs.forEach((log, index) => {
                        console.log(`   ${index + 1}. ${log.operationType} - ${log.tableName} - ${log.username} - ${log.description}`);
                    });
                } else {
                    console.log('⚠️ 仍然没有操作日志，请检查:');
                    console.log('   - 数据操作是否成功执行');
                    console.log('   - 日志记录功能是否正常工作');
                    console.log('   - 数据库连接是否正常');
                }
            }
        } catch (error) {
            console.log('❌ 检查日志失败:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 测试操作日志生成完成！');
        console.log('\n🌐 现在可以访问操作日志管理页面查看日志:');
        console.log('   http://localhost:5173/logs');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
    }
}

// 运行测试
generateTestLogs().catch(console.error);
