/*
 * @Date: 2025-10-28 16:11:10
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 16:11:47
 * @FilePath: /lowCode_excel/fe/debug_user_data.js
 */
import axios from 'axios';

const FRONTEND_URL = 'http://localhost:5173/backend';

/**
 * 用户数据结构调试
 * 详细检查API返回的数据结构
 */
async function debugUserData() {
    console.log('🔍 开始用户数据结构调试...\n');

    let authToken = '';

    try {
        // 用户登录
        console.log('📋 用户登录');
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
            console.log('❌ 无法获取认证令牌，调试终止');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${authToken}`
        };

        // 详细检查用户列表API响应
        console.log('\n📋 详细检查用户列表API响应');
        try {
            const usersResponse = await axios.get(`${FRONTEND_URL}/api/users`, { headers });
            if (usersResponse.status === 200) {
                console.log('✅ API请求成功');

                const responseData = usersResponse.data;
                console.log('📊 完整响应结构:');
                console.log(JSON.stringify(responseData, null, 2));

                console.log('\n🔍 数据结构分析:');
                console.log(`   - success: ${responseData.success}`);
                console.log(`   - message: ${responseData.message}`);
                console.log(`   - data 类型: ${typeof responseData.data}`);

                if (responseData.data) {
                    console.log(`   - data 结构:`, Object.keys(responseData.data));

                    if (responseData.data.users) {
                        console.log(`   - users 类型: ${typeof responseData.data.users}`);
                        console.log(`   - users 是数组: ${Array.isArray(responseData.data.users)}`);
                        console.log(`   - users 长度: ${Array.isArray(responseData.data.users) ? responseData.data.users.length : 'N/A'}`);

                        if (Array.isArray(responseData.data.users) && responseData.data.users.length > 0) {
                            console.log('\n👥 用户数据详情:');
                            responseData.data.users.forEach((user, index) => {
                                console.log(`   ${index + 1}. ${user.username} (ID: ${user.id}, 角色: ${user.role})`);
                            });
                        }
                    }

                    if (responseData.data.pagination) {
                        console.log('\n📄 分页信息:');
                        console.log(`   - 当前页: ${responseData.data.pagination.page}`);
                        console.log(`   - 每页大小: ${responseData.data.pagination.limit}`);
                        console.log(`   - 总数: ${responseData.data.pagination.total}`);
                        console.log(`   - 总页数: ${responseData.data.pagination.totalPages}`);
                    }
                }
            }
        } catch (error) {
            console.log('❌ 获取用户列表失败:', error.response?.data?.message || error.message);
        }

        console.log('\n🎯 前端页面应该如何处理数据:');
        console.log('   - 用户列表: response.data.data.users');
        console.log('   - 分页总数: response.data.data.pagination.total');
        console.log('   - 确保数据是数组格式');

    } catch (error) {
        console.error('❌ 调试过程中发生错误:', error.message);
    }
}

// 运行调试
debugUserData().catch(console.error);
