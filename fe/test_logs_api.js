import axios from 'axios';

const FRONTEND_URL = 'http://localhost:5173/backend';

/**
 * 操作日志API测试
 * 检查为什么操作日志管理页面看不到任何操作日志
 */
async function testLogsAPI() {
    console.log('🔍 开始操作日志API测试...\n');

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
            console.log(`   令牌: ${authToken.substring(0, 20)}...`);
        } else {
            console.log('❌ 用户登录失败');
            return;
        }

        if (!authToken) {
            console.log('❌ 无法获取认证令牌，测试终止');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${authToken}`
        };

        // 测试2: 检查日志API
        console.log('\n📋 测试2: 检查日志API');
        try {
            const logsResponse = await axios.get(`${FRONTEND_URL}/api/rollback/logs`, { headers });
            console.log('📊 日志API响应:');
            console.log(JSON.stringify(logsResponse.data, null, 2));

            if (logsResponse.data.success) {
                const logs = logsResponse.data.data?.logs || logsResponse.data.data;
                console.log(`\n📝 日志数量: ${Array.isArray(logs) ? logs.length : 'N/A'}`);

                if (Array.isArray(logs) && logs.length > 0) {
                    console.log('\n👥 操作日志详情:');
                    logs.forEach((log, index) => {
                        console.log(`   ${index + 1}. ${log.operationType} - ${log.tableName} - ${log.username}`);
                    });
                } else {
                    console.log('\n⚠️ 没有找到操作日志，可能的原因:');
                    console.log('   - 还没有进行任何数据操作');
                    console.log('   - 日志记录功能未正确集成');
                    console.log('   - 数据库中没有日志记录');
                }
            } else {
                console.log('❌ 日志API返回失败状态');
            }
        } catch (error) {
            console.log('❌ 日志API请求失败:', error.response?.data?.message || error.message);
        }

        // 测试3: 检查数据库表
        console.log('\n📋 测试3: 检查数据库表状态');
        try {
            const healthResponse = await axios.get(`${FRONTEND_URL}/health`);
            console.log('📊 数据库状态:', healthResponse.data);
        } catch (error) {
            console.log('❌ 健康检查失败:', error.message);
        }

        // 测试4: 检查是否有映射表
        console.log('\n📋 测试4: 检查映射表');
        try {
            const mappingsResponse = await axios.get(`${FRONTEND_URL}/api/mappings`, { headers });
            if (mappingsResponse.data.success) {
                const mappings = mappingsResponse.data;
                console.log(`   映射表数量: ${Array.isArray(mappings) ? mappings.length : 'N/A'}`);
                if (Array.isArray(mappings) && mappings.length > 0) {
                    console.log('   可用表名:');
                    mappings.forEach((mapping, index) => {
                        console.log(`     ${index + 1}. ${mapping.tableName}`);
                    });
                } else {
                    console.log('   ⚠️ 没有映射表，请先上传Excel文件');
                }
            }
        } catch (error) {
            console.log('❌ 获取映射表失败:', error.response?.data?.message || error.message);
        }

        console.log('\n🔍 问题诊断:');
        console.log('   如果看不到操作日志，请尝试以下操作:');
        console.log('   1. 上传Excel文件创建数据表');
        console.log('   2. 在数据编辑页面进行一些操作（新增、更新、删除）');
        console.log('   3. 刷新操作日志管理页面');
        console.log('   4. 检查后端日志记录是否正常工作');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
    }
}

// 运行测试
testLogsAPI().catch(console.error);
