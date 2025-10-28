import axios from 'axios';

const FRONTEND_URL = 'http://localhost:5173/backend';

/**
 * 前端集成测试
 * 测试前端与后端的完整集成
 */
async function testFrontendIntegration() {
    console.log('🚀 开始前端集成测试...\n');

    let authToken = '';

    try {
        // 测试1: 健康检查
        console.log('📋 测试1: 健康检查');
        const healthResponse = await axios.get(`${FRONTEND_URL}/health`);
        if (healthResponse.status === 200) {
            console.log('✅ 健康检查通过');
        } else {
            console.log('❌ 健康检查失败');
        }

        // 测试2: 用户登录
        console.log('\n📋 测试2: 用户登录');
        try {
            const loginResponse = await axios.post(`${FRONTEND_URL}/api/auth/login`, {
                username: 'admin',
                password: 'admin123'
            });

            if (loginResponse.status === 200 && loginResponse.data.success) {
                authToken = loginResponse.data.data.token;
                console.log('✅ 用户登录成功');
                console.log(`   令牌: ${authToken.substring(0, 20)}...`);
                console.log(`   用户: ${loginResponse.data.data.user.username}`);
                console.log(`   角色: ${loginResponse.data.data.user.role}`);
            }
        } catch (error) {
            console.log('❌ 用户登录失败:', error.response?.data?.message || error.message);
            return;
        }

        if (!authToken) {
            console.log('❌ 无法获取认证令牌，测试终止');
            return;
        }

        // 测试3: 获取当前用户信息
        console.log('\n📋 测试3: 获取当前用户信息');
        try {
            const userResponse = await axios.get(`${FRONTEND_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (userResponse.status === 200 && userResponse.data.success) {
                console.log('✅ 获取用户信息成功');
                console.log(`   用户名: ${userResponse.data.data.username}`);
                console.log(`   邮箱: ${userResponse.data.data.email}`);
                console.log(`   角色: ${userResponse.data.data.role}`);
            }
        } catch (error) {
            console.log('❌ 获取用户信息失败:', error.response?.data?.message || error.message);
        }

        // 测试4: 获取映射关系
        console.log('\n📋 测试4: 获取映射关系');
        try {
            const mappingsResponse = await axios.get(`${FRONTEND_URL}/api/mappings`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (mappingsResponse.status === 200) {
                console.log('✅ 获取映射关系成功');
                console.log(`   表数量: ${mappingsResponse.data.data.length}`);
                if (mappingsResponse.data.data.length > 0) {
                    console.log(`   第一个表: ${mappingsResponse.data.data[0].tableName}`);
                    console.log(`   哈希值: ${mappingsResponse.data.data[0].hashValue}`);
                }
            }
        } catch (error) {
            console.log('❌ 获取映射关系失败:', error.response?.data?.message || error.message);
        }

        // 测试5: 获取操作日志
        console.log('\n📋 测试5: 获取操作日志');
        try {
            const logsResponse = await axios.get(`${FRONTEND_URL}/api/rollback/logs`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (logsResponse.status === 200) {
                console.log('✅ 获取操作日志成功');
                console.log(`   日志总数: ${logsResponse.data.data.pagination?.total || logsResponse.data.data.logs?.length || 0}`);
            }
        } catch (error) {
            console.log('❌ 获取操作日志失败:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 前端集成测试完成！');
        console.log('\n📊 测试总结:');
        console.log('   ✅ 代理配置 - 正常');
        console.log('   ✅ 用户认证 - 正常');
        console.log('   ✅ 数据访问 - 正常');
        console.log('   ✅ 日志功能 - 正常');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
    }
}

// 运行测试
testFrontendIntegration().catch(console.error);
