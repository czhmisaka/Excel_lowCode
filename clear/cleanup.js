#!/usr/bin/env node

/**
 * 低代码Excel系统 - 数据清理脚本
 * 用于清理端口3000上的所有数据表、表单和hook
 * 基于现有API接口，无需修改项目代码
 */

const axios = require('axios');
const readline = require('readline');

// 配置
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const API_KEY = process.env.API_KEY || ''; // 可选API密钥

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY })
  }
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log('cyan', `[INFO] ${message}`);
}

function logSuccess(message) {
  log('green', `[SUCCESS] ${message}`);
}

function logWarning(message) {
  log('yellow', `[WARNING] ${message}`);
}

function logError(message) {
  log('red', `[ERROR] ${message}`);
}

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * 测试API连接
 */
async function testConnection() {
  try {
    logInfo('测试API连接...');
    const response = await api.get('/health');
    if (response.data && response.data.success) {
      logSuccess('API连接成功');
      return true;
    }
  } catch (error) {
    logError(`API连接失败: ${error.message}`);
    return false;
  }
}

/**
 * 获取所有表单列表
 */
async function getForms() {
  try {
    logInfo('获取表单列表...');
    const response = await api.get('/forms');
    if (response.data && response.data.success) {
      const forms = response.data.data || [];
      logSuccess(`找到 ${forms.length} 个表单`);
      return forms;
    }
    return [];
  } catch (error) {
    logError(`获取表单列表失败: ${error.message}`);
    return [];
  }
}

/**
 * 获取所有数据表映射
 */
async function getTableMappings() {
  try {
    logInfo('获取数据表映射...');
    const response = await api.get('/mappings');
    if (response.data && response.data.success) {
      const mappings = response.data.data || [];
      logSuccess(`找到 ${mappings.length} 个数据表映射`);
      return mappings;
    }
    return [];
  } catch (error) {
    logError(`获取数据表映射失败: ${error.message}`);
    return [];
  }
}

/**
 * 删除表单及其关联资源
 */
async function deleteForm(formId) {
  try {
    logInfo(`删除表单: ${formId}`);
    const response = await api.delete(`/forms/${formId}`);
    if (response.data && response.data.success) {
      logSuccess(`表单 ${formId} 删除成功`);
      return true;
    }
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logWarning(`表单 ${formId} 不存在`);
      return true;
    }
    logError(`删除表单 ${formId} 失败: ${error.message}`);
    return false;
  }
}

/**
 * 删除数据表映射和数据表
 */
async function deleteTableMapping(hash) {
  try {
    logInfo(`删除数据表映射: ${hash}`);
    const response = await api.delete(`/mappings/${hash}`);
    if (response.data && response.data.success) {
      logSuccess(`数据表映射 ${hash} 删除成功`);
      return true;
    }
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logWarning(`数据表映射 ${hash} 不存在`);
      return true;
    }
    logError(`删除数据表映射 ${hash} 失败: ${error.message}`);
    return false;
  }
}

/**
 * 批量删除表单
 */
async function deleteAllForms(forms) {
  logInfo(`开始删除 ${forms.length} 个表单...`);
  let successCount = 0;
  let failCount = 0;

  for (const form of forms) {
    const success = await deleteForm(form.formId);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  logSuccess(`表单删除完成: ${successCount} 成功, ${failCount} 失败`);
  return { successCount, failCount };
}

/**
 * 批量删除数据表映射
 */
async function deleteAllTableMappings(mappings) {
  logInfo(`开始删除 ${mappings.length} 个数据表映射...`);
  let successCount = 0;
  let failCount = 0;

  for (const mapping of mappings) {
    const success = await deleteTableMapping(mapping.hashValue);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  logSuccess(`数据表映射删除完成: ${successCount} 成功, ${failCount} 失败`);
  return { successCount, failCount };
}

/**
 * 验证清理结果
 */
async function verifyCleanup() {
  logInfo('验证清理结果...');
  
  const forms = await getForms();
  const mappings = await getTableMappings();
  
  if (forms.length === 0 && mappings.length === 0) {
    logSuccess('✅ 清理验证通过: 所有表单和数据表已成功删除');
    return true;
  } else {
    logWarning(`❌ 清理验证失败: 剩余 ${forms.length} 个表单, ${mappings.length} 个数据表`);
    return false;
  }
}

/**
 * 主清理函数
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('低代码Excel系统 - 数据清理工具');
  console.log('='.repeat(60));
  
  logInfo(`API地址: ${API_BASE}`);
  
  // 测试连接
  if (!await testConnection()) {
    logError('无法连接到API服务，请检查服务是否运行在端口3000');
    process.exit(1);
  }

  // 确认操作
  console.log('\n⚠️  警告: 此操作将删除所有表单、数据表和hook配置！');
  console.log('   删除的数据无法恢复，请谨慎操作！\n');
  
  const answer = await question('确认继续清理操作？(y/N): ');
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    logInfo('操作已取消');
    rl.close();
    return;
  }

  try {
    // 获取现有资源
    const forms = await getForms();
    const mappings = await getTableMappings();

    if (forms.length === 0 && mappings.length === 0) {
      logSuccess('没有找到需要清理的资源');
      rl.close();
      return;
    }

    // 显示资源统计
    console.log('\n📊 资源统计:');
    console.log(`  - 表单: ${forms.length} 个`);
    console.log(`  - 数据表映射: ${mappings.length} 个`);
    
    // 确认删除
    const confirmDelete = await question('\n确认删除以上所有资源？(y/N): ');
    if (confirmDelete.toLowerCase() !== 'y' && confirmDelete.toLowerCase() !== 'yes') {
      logInfo('操作已取消');
      rl.close();
      return;
    }

    // 执行清理
    console.log('\n🚀 开始清理...\n');

    // 先删除表单（包含hook和提交记录）
    const formResult = await deleteAllForms(forms);
    
    // 再删除数据表映射和数据表
    const mappingResult = await deleteAllTableMappings(mappings);

    // 验证清理结果
    console.log('\n🔍 验证清理结果...');
    await verifyCleanup();

    // 显示总结
    console.log('\n📋 清理总结:');
    console.log(`  - 表单删除: ${formResult.successCount} 成功, ${formResult.failCount} 失败`);
    console.log(`  - 数据表删除: ${mappingResult.successCount} 成功, ${mappingResult.failCount} 失败`);
    
    if (formResult.failCount === 0 && mappingResult.failCount === 0) {
      logSuccess('🎉 清理完成！所有资源已成功删除');
    } else {
      logWarning('⚠️  清理完成，但部分资源删除失败');
    }

  } catch (error) {
    logError(`清理过程中发生错误: ${error.message}`);
  } finally {
    rl.close();
  }
}

// 处理命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 简单的命令行参数解析
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-base' && args[i + 1]) {
      process.env.API_BASE = args[i + 1];
    } else if (args[i] === '--api-key' && args[i + 1]) {
      process.env.API_KEY = args[i + 1];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
使用说明:
  node clear/cleanup.js [选项]

选项:
  --api-base <url>    设置API基础地址 (默认: http://localhost:3000/api)
  --api-key <key>     设置API密钥 (可选)
  --help, -h          显示帮助信息

环境变量:
  API_BASE            API基础地址
  API_KEY             API密钥

示例:
  node clear/cleanup.js
  node clear/cleanup.js --api-base http://localhost:3000/api
  API_BASE=http://your-api.com/api node clear/cleanup.js
      `);
      process.exit(0);
    }
  }

  main().catch(error => {
    logError(`脚本执行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testConnection,
  getForms,
  getTableMappings,
  deleteForm,
  deleteTableMapping,
  deleteAllForms,
  deleteAllTableMappings,
  verifyCleanup
};
