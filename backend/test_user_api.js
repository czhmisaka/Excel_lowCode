const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

/**
 * 用户模块API测试
 */
async function testUserAPI() {
    console.log('🚀 开始用户模块API测试...\n');

    let adminToken = '';
    let testUserId = '';

    try {
        // 测试1: 健康检查
        console.log('📋 测试1: 健康检查');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        if (healthResponse.status === 200) {
            console.log('✅ 健康检查通过');
        } else {
            console.log('❌ 健康检查失败');
        }

        // 测试2: 用户注册
        console.log('\n📋 测试2: 用户注册');
        const testUser = {
            username: `testuser_${Date.now()}`,
            password: 'test123456',
            email: `test_${Date.now()}@example.com`,
            displayName: '测试用户'
        };

        try {
            const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
            if (registerResponse.status === 201) {
                console.log('✅ 用户注册成功');
                console.log(`   用户ID: ${registerResponse.data.data.user.id}`);
                console.log(`   用户名: ${registerResponse.data.data.user.username}`);
            }
        } catch (error) {
            console.log('❌ 用户注册失败:', error.response?.data?.message || error.message);
        }

        // 测试3: 管理员登录
        console.log('\n📋 测试3: 管理员登录');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                username: 'admin',
                password: 'admin123'
            });

            if (loginResponse.status === 200) {
                adminToken = loginResponse.data.data.token;
                console.log('✅ 管理员登录成功');
                console.log(`   令牌: ${adminToken.substring(0, 20)}...`);
            }
        } catch (error) {
            console.log('❌ 管理员登录失败:', error.response?.data?.message || error.message);
        }

        if (adminToken) {
            // 测试4: 获取当前用户信息
            console.log('\n📋 测试4: 获取当前用户信息');
            try {
                const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });

                if (meResponse.status === 200) {
                    console.log('✅ 获取用户信息成功');
                    console.log(`   用户名: ${meResponse.data.data.username}`);
                    console.log(`   显示名称: ${meResponse.data.data.displayName}`);
                    console.log(`   角色: ${meResponse.data.data.role}`);
                }
            } catch (error) {
                console.log('❌ 获取用户信息失败:', error.response?.data?.message || error.message);
            }

            // 测试5: 获取用户列表
            console.log('\n📋 测试5: 获取用户列表');
            try {
                const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });

                if (usersResponse.status === 200) {
                    console.log('✅ 获取用户列表成功');
                    console.log(`   用户总数: ${usersResponse.data.data.pagination.total}`);
                    console.log(`   当前页用户数: ${usersResponse.data.data.users.length}`);
                }
            } catch (error) {
                console.log('❌ 获取用户列表失败:', error.response?.data?.message || error.message);
            }

            // 测试6: 创建新用户
            console.log('\n📋 测试6: 创建新用户');
            const newUser = {
                username: `admin_created_${Date.now()}`,
                password: 'password123',
                displayName: '管理员创建的用户',
                role: 'user'
            };

            try {
                const createUserResponse = await axios.post(`${BASE_URL}/api/users`, newUser, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (createUserResponse.status === 201) {
                    testUserId = createUserResponse.data.data.id;
                    console.log('✅ 创建用户成功');
                    console.log(`   新用户ID: ${testUserId}`);
                }
            } catch (error) {
                console.log('❌ 创建用户失败:', error.response?.data?.message || error.message);
            }

            // 测试7: 错误情况测试
            console.log('\n📋 测试7: 错误情况测试');

            // 测试重复用户名注册
            try {
                await axios.post(`${BASE_URL}/api/auth/register`, {
                    username: 'admin',
                    password: 'password123'
                });
            } catch (error) {
                if (error.response?.status === 400) {
                    console.log('✅ 重复用户名验证通过');
                    console.log(`   错误信息: ${error.response.data.message}`);
                }
            }

            // 测试错误密码登录
            try {
                await axios.post(`${BASE_URL}/api/auth/login`, {
                    username: 'admin',
                    password: 'wrongpassword'
                });
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('✅ 错误密码验证通过');
                    console.log(`   错误信息: ${error.response.data.message}`);
                }
            }
        }

        console.log('\n🎉 用户模块API测试完成！');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
    }
}

// 运行测试
testUserAPI().catch(console.error);
