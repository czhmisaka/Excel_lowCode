/*
 * @Date: 2025-10-31 10:32:33
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 10:32:56
 * @FilePath: /lowCode_excel/MCPServer/debugTokenManager.js
 */
import tokenManager from './utils/tokenManager.js';

async function debugTokenManager() {
    console.log('=== 调试令牌管理器 ===');

    // 检查环境变量
    console.log('\n1. 环境变量检查:');
    console.log('- MCP_SERVICE_TOKEN:', process.env.MCP_SERVICE_TOKEN ? '已设置' : '未设置');
    console.log('- MCP_SERVICE_TOKEN 长度:', process.env.MCP_SERVICE_TOKEN?.length || 0);

    // 检查令牌管理器状态
    console.log('\n2. 令牌管理器状态:');
    const status = tokenManager.getTokenStatus();
    console.log('- 是否有令牌:', status.hasToken);
    console.log('- 是否过期:', status.isExpired);
    console.log('- 过期时间:', status.expiryTime);
    console.log('- 距离过期时间:', status.timeUntilExpiry ? Math.round(status.timeUntilExpiry / 1000) + '秒' : '未知');

    // 尝试获取令牌
    console.log('\n3. 尝试获取令牌:');
    try {
        const token = await tokenManager.getToken();
        console.log('- 获取令牌成功:', token ? '是' : '否');
        console.log('- 令牌长度:', token?.length || 0);

        // 检查令牌管理器更新后的状态
        const newStatus = tokenManager.getTokenStatus();
        console.log('\n4. 获取令牌后的状态:');
        console.log('- 是否有令牌:', newStatus.hasToken);
        console.log('- 是否过期:', newStatus.isExpired);
        console.log('- 过期时间:', newStatus.expiryTime);

    } catch (error) {
        console.log('- 获取令牌失败:', error.message);
    }

    // 测试令牌刷新
    console.log('\n5. 测试令牌刷新:');
    try {
        await tokenManager.refreshToken();
        console.log('- 令牌刷新成功');
    } catch (error) {
        console.log('- 令牌刷新失败:', error.message);
    }
}

debugTokenManager().catch(console.error);
