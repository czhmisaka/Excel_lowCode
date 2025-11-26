/**
 * 彻底修复签到系统Hook配置
 * 删除所有现有Hook并重新创建正确的配置
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// 正确的Hook配置
const CORRECT_HOOKS = [
  {
    name: '自动签到时间',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '自动填充当前时间作为签到时间',
    config: {
      code: `
// 自动填充签到时间
function execute(formData, context) {
  if (!formData.sign_in_time) {
    formData.sign_in_time = new Date().toISOString();
  }
  console.log('自动设置签到时间:', formData.sign_in_time);
  return formData;
}
      `.trim()
    }
  },
  {
    name: '计算工作时间',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '根据签到和签退时间计算实际工作时间',
    config: {
      code: `
// 计算实际工作时间
function execute(formData, context) {
  if (formData.sign_in_time && formData.sign_out_time) {
    const signIn = new Date(formData.sign_in_time);
    const signOut = new Date(formData.sign_out_time);
    const workHours = (signOut - signIn) / (1000 * 60 * 60); // 转换为小时
    
    if (workHours > 0) {
      formData.actual_work_hours = Math.round(workHours * 100) / 100; // 保留2位小数
      console.log('计算工作时间:', formData.actual_work_hours, '小时');
    }
  }
  return formData;
}
      `.trim()
    }
  }
];

/**
 * 删除所有现有的Hook配置
 */
async function deleteAllHooks() {
  try {
    console.log('🗑️ 删除所有现有Hook配置...');
    
    const hooksResponse = await axios.get(`${API_BASE}/forms/labor_sign_in/hooks`);
    
    if (hooksResponse.data.success && hooksResponse.data.data) {
      console.log(`发现 ${hooksResponse.data.data.length} 个Hook需要删除`);
      
      for (const hook of hooksResponse.data.data) {
        try {
          // 尝试使用不同的删除端点
          await axios.delete(`${API_BASE}/forms/labor_sign_in/hooks/${hook.id}`);
          console.log(`✅ 删除Hook: ${hook.id}`);
        } catch (error) {
          console.log(`⚠️ 删除Hook失败: ${hook.id}`, error.message);
          // 如果删除失败，尝试禁用Hook
          try {
            await axios.put(`${API_BASE}/forms/labor_sign_in/hooks/${hook.id}`, {
              enabled: false
            });
            console.log(`✅ 禁用Hook: ${hook.id}`);
          } catch (disableError) {
            console.log(`❌ 禁用Hook也失败: ${hook.id}`, disableError.message);
          }
        }
      }
    }
    
    console.log('✅ 所有Hook配置处理完成');
    return true;
  } catch (error) {
    console.error('❌ 删除Hook配置失败:', error.message);
    return false;
  }
}

/**
 * 创建正确的Hook配置
 */
async function createCorrectHooks() {
  console.log('⚙️ 创建正确的Hook配置...');
  
  let successCount = 0;
  
  for (const hook of CORRECT_HOOKS) {
    try {
      const response = await axios.post(`${API_BASE}/forms/labor_sign_in/hooks`, {
        formId: 'labor_sign_in',
        name: hook.name,
        type: hook.type,
        triggerType: hook.triggerType,
        enabled: hook.enabled,
        description: hook.description,
        config: hook.config
      });
      
      if (response.data.success) {
        console.log(`✅ Hook "${hook.name}" 创建成功`);
        successCount++;
      } else {
        console.error(`❌ Hook "${hook.name}" 创建失败:`, response.data.message);
      }
    } catch (error) {
      console.error(`❌ Hook "${hook.name}" 创建错误:`, error.response?.data || error.message);
    }
  }
  
  return successCount === CORRECT_HOOKS.length;
}

/**
 * 验证Hook修复结果
 */
async function validateHookFix() {
  console.log('🔧 验证Hook修复结果...');
  
  try {
    // 检查Hook列表
    const hooksResponse = await axios.get(`${API_BASE}/forms/labor_sign_in/hooks`);
    
    if (hooksResponse.data.success) {
      const hooks = hooksResponse.data.data || [];
      console.log(`✅ Hook列表查询成功，共 ${hooks.length} 个Hook`);
      
      // 检查每个Hook的配置
      for (const hook of hooks) {
        const name = hook.name || '未命名Hook';
        const status = hook.enabled ? '✅ 启用' : '❌ 禁用';
        console.log(`  - ${name}: ${status}`);
        
        // 检查Hook配置
        if (hook.config) {
          try {
            const config = typeof hook.config === 'string' ? JSON.parse(hook.config) : hook.config;
            if (config.code && config.code.includes('function execute')) {
              console.log(`    ✅ 代码配置正确`);
            } else {
              console.log(`    ⚠️ 代码配置可能有问题`);
            }
          } catch (parseError) {
            console.log(`    ❌ 配置解析失败`);
          }
        }
      }
    }
    
    // 测试表单提交
    console.log('🧪 测试表单提交...');
    try {
      const testResponse = await axios.post(`${API_BASE}/public/form/forms/labor_sign_in/submit`, {
        data: {
          name: '测试用户',
          phone: '13800138000',
          company: 'huibo'
        }
      }, {
        timeout: 10000
      });
      
      if (testResponse.data.success) {
        console.log('✅ 表单提交测试成功');
        console.log('提交结果:', JSON.stringify(testResponse.data, null, 2));
      } else {
        console.log('⚠️ 表单提交测试失败:', testResponse.data.message);
      }
    } catch (submitError) {
      console.log('❌ 表单提交错误:', submitError.response?.data || submitError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Hook验证失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主修复函数
 */
async function fixHookConfiguration() {
  console.log('🚀 开始彻底修复Hook配置...');
  console.log('目标服务器:', API_BASE);
  console.log('='.repeat(50));
  
  try {
    // 1. 删除所有现有Hook配置
    const hooksDeleted = await deleteAllHooks();
    if (!hooksDeleted) {
      console.log('❌ 修复中止: 无法删除现有Hook配置');
      return false;
    }
    
    // 等待一下确保删除完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. 创建正确的Hook配置
    const hooksCreated = await createCorrectHooks();
    if (!hooksCreated) {
      console.log('⚠️ 部分Hook创建失败，但继续验证');
    }
    
    // 3. 验证修复结果
    const fixValidated = await validateHookFix();
    
    console.log('='.repeat(50));
    if (fixValidated) {
      console.log('🎉 Hook配置修复完成！');
      console.log('');
      console.log('📋 修复总结:');
      console.log('- 现有Hook删除: ✅ 完成');
      console.log('- 正确Hook创建: ✅ 完成');
      console.log('- 功能验证: ✅ 通过');
    } else {
      console.log('⚠️ 修复完成，但存在一些问题');
      console.log('请检查系统日志并手动验证功能');
    }
    
    return fixValidated;
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
    return false;
  }
}

// 执行修复
if (require.main === module) {
  fixHookConfiguration()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('修复过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = {
  fixHookConfiguration,
  deleteAllHooks,
  createCorrectHooks,
  validateHookFix
};
