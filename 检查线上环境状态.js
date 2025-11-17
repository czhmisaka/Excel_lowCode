/**
 * 检查线上环境状态
 * 用于诊断当前线上500错误的具体原因
 */

const axios = require('axios');

const TARGET_SERVER = 'http://118.196.16.32:13000';

async function checkOnlineStatus() {
  console.log('🔍 检查线上环境状态...');
  console.log('目标服务器:', TARGET_SERVER);
  console.log('='.repeat(50));

  try {
    // 1. 检查健康状态
    console.log('1. 检查服务器健康状态...');
    const healthResponse = await axios.get(`${TARGET_SERVER}/health`, {
      timeout: 10000
    });
    console.log('✅ 服务器健康状态:', healthResponse.data.status);
    console.log('   数据库状态:', healthResponse.data.database);
    console.log('   环境:', healthResponse.data.environment);

    // 2. 检查表单接口
    console.log('2. 检查表单接口状态...');
    try {
      const formsResponse = await axios.get(`${TARGET_SERVER}/api/forms`, {
        timeout: 10000
      });
      console.log('✅ 表单接口正常:', formsResponse.data.success);
      if (formsResponse.data.data) {
        console.log('   表单数量:', formsResponse.data.data.length);
      }
    } catch (formsError) {
      console.log('❌ 表单接口错误:');
      console.log('   状态码:', formsError.response?.status);
      console.log('   错误信息:', formsError.response?.data?.message);
      console.log('   详细错误:', formsError.response?.data?.error);
    }

    // 3. 检查其他关键接口
    console.log('3. 检查其他关键接口...');
    
    // 检查数据接口
    try {
      const dataResponse = await axios.get(`${TARGET_SERVER}/api/data/tables`, {
        timeout: 10000
      });
      console.log('✅ 数据接口正常');
    } catch (dataError) {
      console.log('⚠️ 数据接口可能有问题:', dataError.response?.status);
    }

    // 检查映射接口
    try {
      const mappingsResponse = await axios.get(`${TARGET_SERVER}/api/mappings`, {
        timeout: 10000
      });
      console.log('✅ 映射接口正常');
    } catch (mappingsError) {
      console.log('⚠️ 映射接口可能有问题:', mappingsError.response?.status);
    }

    console.log('='.repeat(50));
    console.log('📊 诊断结果:');
    
    // 分析问题
    if (healthResponse.data.database === 'connected') {
      console.log('✅ 数据库连接正常');
      console.log('❌ 问题: 数据库表缺失 (form_definitions等表)');
      console.log('💡 解决方案: 执行数据库初始化脚本');
      console.log('   node backend/scripts/initDatabase.js');
    } else {
      console.log('❌ 数据库连接异常');
      console.log('💡 解决方案: 检查数据库配置和连接');
    }

    return true;

  } catch (error) {
    console.error('❌ 检查线上环境失败:');
    console.error('错误信息:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('原因: 服务器未启动或端口错误');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('原因: 服务器响应超时');
    }
    
    return false;
  }
}

// 执行检查
checkOnlineStatus()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🚀 立即修复建议:');
      console.log('1. 登录到远程服务器');
      console.log('2. 执行: node backend/scripts/initDatabase.js');
      console.log('3. 重启应用服务');
      console.log('4. 重新测试');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
  });
