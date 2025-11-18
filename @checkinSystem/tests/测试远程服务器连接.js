/*
 * @Date: 2025-11-17 09:05:35
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-17 09:06:06
 * @FilePath: /lowCode_excel/测试远程服务器连接.js
 */
/**
 * 测试远程服务器连接状态
 * 用于检查目标服务器是否可访问
 */

const axios = require('axios');

const TARGET_SERVER = 'http://118.196.16.32:13000';

async function testConnection() {
  console.log('🔍 测试远程服务器连接状态...');
  console.log('目标服务器:', TARGET_SERVER);
  console.log('='.repeat(50));
  
  try {
    // 测试健康检查接口
    console.log('1. 测试健康检查接口...');
    const healthResponse = await axios.get(`${TARGET_SERVER}/health`, {
      timeout: 10000
    });
    console.log('✅ 健康检查接口响应:', healthResponse.data);
    
    // 测试API基础接口
    console.log('2. 测试API基础接口...');
    const apiResponse = await axios.get(`${TARGET_SERVER}/api/health`, {
      timeout: 10000
    });
    console.log('✅ API基础接口响应:', apiResponse.data);
    
    // 测试表单接口
    console.log('3. 测试表单接口...');
    try {
      const formsResponse = await axios.get(`${TARGET_SERVER}/api/forms`, {
        timeout: 10000
      });
      console.log('✅ 表单接口响应正常');
    } catch (error) {
      console.log('⚠️ 表单接口可能未实现，但服务器连接正常');
    }
    
    console.log('='.repeat(50));
    console.log('🎉 服务器连接测试完成！');
    console.log('服务器状态: ✅ 正常');
    console.log('可以执行签到系统部署脚本');
    
    return true;
    
  } catch (error) {
    console.error('❌ 服务器连接测试失败:');
    console.error('错误信息:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('原因: 连接被拒绝 - 服务器可能未启动或端口错误');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('原因: 连接超时 - 网络问题或服务器无响应');
    } else if (error.code === 'ENOTFOUND') {
      console.error('原因: 域名解析失败 - 服务器地址错误');
    }
    
    console.log('');
    console.log('🔧 故障排除建议:');
    console.log('1. 检查服务器是否正在运行');
    console.log('2. 确认服务器地址和端口正确');
    console.log('3. 检查网络连接和防火墙设置');
    console.log('4. 确认服务器应用已正确部署');
    
    return false;
  }
}

// 执行测试
testConnection()
  .then(success => {
    if (success) {
      console.log('');
      console.log('💡 下一步: 执行部署脚本');
      console.log('node 远程签到系统部署脚本.js');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  });
