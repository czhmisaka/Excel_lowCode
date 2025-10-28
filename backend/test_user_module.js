const { chromium } = require('playwright');

/**
 * 用户模块测试脚本
 * 使用Playwright进行API测试
 */
async function testUserModule() {
    console.log('🚀 开始用户模块测试...\n');

    let browser;
    let context;
    let page;

    try {
        // 启动浏览器
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext();
        page = await context.newPage();

        const baseURL = 'http://localhost:3000';

        // 测试1: 健康检查
        console.log('📋 测试1: 健康检查');
        const healthResponse = await page.goto(`${baseURL}/health`);
        if (healthResponse.status() === 200) {
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

        const registerResponse = await page.request.post(`${baseURL}/api/auth/register`, {
            data: testUser
        });

        if (registerResponse.status() === 201) {
            const registerData = await registerResponse.json();
            console.log('✅ 用户注册成功');
            console.log(`   用户ID: ${registerData.data.user.id}`);
            console.log(`   用户名: ${registerData.data.user.username}`);

            // 保存token用于后续测试
            const token = registerData.data.token;

            // 测试3: 用户登录
            console.log('\n📋 测试3: 用户登录');
            const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
                data: {
                    username: testUser.username,
                    password: testUser.password
                }
            });

            if (loginResponse.status() === 200) {
                const loginData = await loginResponse.json();
                console.log('✅ 用户登录成功');
                console.log(`   令牌: ${loginData.data.token.substring(0, 20)}...`);

                // 更新token
                const newToken = loginData.data.token;

                // 测试4: 获取当前用户信息
                console.log('\n📋 测试4: 获取当前用户信息');
                const meResponse = await page.request.get(`${baseURL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`
                    }
                });

                if (meResponse.status() === 200) {
                    const meData = await meResponse.json();
                    console.log('✅ 获取用户信息成功');
                    console.log(`   用户名: ${meData.data.username}`);
                    console.log(`   显示名称: ${meData.data.displayName}`);
                } else {
                    console.log('❌ 获取用户信息失败');
                }

                // 测试5: 更新用户信息
                console.log('\n📋 测试5: 更新用户信息');
                const updateResponse = await page.request.put(`${baseURL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        displayName: '更新后的测试用户',
                        email: `updated_${Date.now()}@example.com`
                    }
                });

                if (updateResponse.status() === 200) {
                    const updateData = await updateResponse.json();
                    console.log('✅ 更新用户信息成功');
                    console.log(`   新显示名称: ${updateData.data.displayName}`);
                } else {
                    console.log('❌ 更新用户信息失败');
                }

                // 测试6: 修改密码
                console.log('\n📋 测试6: 修改密码');
                const changePasswordResponse = await page.request.post(`${baseURL}/api/auth/change-password`, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        currentPassword: testUser.password,
                        newPassword: 'newpassword123'
                    }
                });

                if (changePasswordResponse.status() === 200) {
                    console.log('✅ 修改密码成功');
                } else {
                    console.log('❌ 修改密码失败');
                }

                // 测试7: 管理员登录（测试用户管理功能）
                console.log('\n📋 测试7: 管理员登录');
                const adminLoginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
                    data: {
                        username: 'admin',
                        password: 'admin123'
                    }
                });

                if (adminLoginResponse.status() === 200) {
                    const adminData = await adminLoginResponse.json();
                    const adminToken = adminData.data.token;
                    console.log('✅ 管理员登录成功');

                    // 测试8: 获取用户列表（管理员权限）
                    console.log('\n📋 测试8: 获取用户列表');
                    const usersResponse = await page.request.get(`${baseURL}/api/users`, {
                        headers: {
                            'Authorization': `Bearer ${adminToken}`
                        }
                    });

                    if (usersResponse.status() === 200) {
                        const usersData = await usersResponse.json();
                        console.log('✅ 获取用户列表成功');
                        console.log(`   用户总数: ${usersData.data.pagination.total}`);
                    } else {
                        console.log('❌ 获取用户列表失败');
                    }

                    // 测试9: 创建新用户（管理员权限）
                    console.log('\n📋 测试9: 创建新用户');
                    const newTestUser = {
                        username: `admin_created_${Date.now()}`,
                        password: 'password123',
                        displayName: '管理员创建的用户',
                        role: 'user'
                    };

                    const createUserResponse = await page.request.post(`${baseURL}/api/users`, {
                        headers: {
                            'Authorization': `Bearer ${adminToken}`,
                            'Content-Type': 'application/json'
                        },
                        data: newTestUser
                    });

                    if (createUserResponse.status() === 201) {
                        const createData = await createUserResponse.json();
                        console.log('✅ 创建用户成功');
                        console.log(`   新用户ID: ${createData.data.id}`);
                    } else {
                        console.log('❌ 创建用户失败');
                    }

                } else {
                    console.log('❌ 管理员登录失败');
                }

            } else {
                console.log('❌ 用户登录失败');
            }

        } else {
            console.log('❌ 用户注册失败');
            const errorData = await registerResponse.json();
            console.log(`   错误信息: ${errorData.message}`);
        }

        // 测试10: 错误情况测试
        console.log('\n📋 测试10: 错误情况测试');

        // 测试重复用户名注册
        const duplicateResponse = await page.request.post(`${baseURL}/api/auth/register`, {
            data: {
                username: 'admin', // 已存在的用户名
                password: 'password123'
            }
        });

        if (duplicateResponse.status() === 400) {
            const duplicateData = await duplicateResponse.json();
            console.log('✅ 重复用户名验证通过');
            console.log(`   错误信息: ${duplicateData.message}`);
        }

        // 测试错误密码登录
        const wrongPasswordResponse = await page.request.post(`${baseURL}/api/auth/login`, {
            data: {
                username: 'admin',
                password: 'wrongpassword'
            }
        });

        if (wrongPasswordResponse.status() === 401) {
            const wrongPasswordData = await wrongPasswordResponse.json();
            console.log('✅ 错误密码验证通过');
            console.log(`   错误信息: ${wrongPasswordData.message}`);
        }

        console.log('\n🎉 用户模块测试完成！');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 运行测试
testUserModule().catch(console.error);
