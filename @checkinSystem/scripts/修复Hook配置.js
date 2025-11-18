/**
 * 修复Hook配置脚本
 * 通过API接口为签到系统创建正确的Hook配置
 */

const axios = require('axios');

// 配置
const CONFIG = {
  API_BASE: 'http://118.196.16.32:13000/api',
  FORM_ID: 'labor_sign_in',
  TIMEOUT: 10000
};

// 正确的Hook配置
const HOOKS = [
  {
    formId: 'labor_sign_in',
    name: '自动签到时间Hook',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '自动填充当前时间作为签到时间',
    config: {
      code: `
// 自动签到时间Hook
// 在提交前自动设置签到时间
function execute(formData) {
  console.log('执行自动签到时间Hook...');
  
  // 如果没有提供签到时间，自动设置为当前时间
  if (!formData.sign_in_time || formData.sign_in_time === '{{current_time}}') {
    formData.sign_in_time = new Date().toISOString();
    console.log('自动设置签到时间:', formData.sign_in_time);
  }
  
  return formData;
}
      `.trim()
    }
  },
  {
    formId: 'labor_sign_in',
    name: '计算工作时间Hook',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '根据签到和签退时间计算实际工作时间',
    config: {
      code: `
// 计算工作时间Hook
// 根据签到和签退时间计算实际工作时间
function execute(formData) {
  console.log('执行计算工作时间Hook...');
  
  // 如果有签到时间和签退时间，计算工作时间
  if (formData.sign_in_time && formData.sign_out_time) {
    try {
      const signIn = new Date(formData.sign_in_time);
      const signOut = new Date(formData.sign_out_time);
      
      // 计算时间差（小时）
      const workHours = (signOut - signIn) / (1000 * 60 * 60);
      
      if (workHours > 0) {
        formData.work_hours = Math.round(workHours * 100) / 100; // 保留2位小数
        console.log('计算工作时间:', formData.work_hours, '小时');
      } else {
        formData.work_hours = 0;
        console.log('工作时间计算为0或负数');
      }
    } catch (error) {
      console.error('计算工作时间错误:', error);
      formData.work_hours = 0;
    }
  } else {
    formData.work_hours = 0;
    console.log('缺少签到或签退时间，无法计算工作时间');
  }
  
  return formData;
}
      `.trim()
    }
  },
  {
    formId: 'labor_sign_in',
    name: '数据验证Hook',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '验证表单数据的完整性',
    config: {
      code: `
// 数据验证Hook
// 验证表单数据的完整性
function execute(formData) {
  console.log('执行数据验证Hook...');
  
  // 验证必填字段
  if (!formData.name || formData.name.trim() === '') {
    throw new Error('姓名不能为空');
  }
  
  if (!formData.phone || formData.phone.trim() === '') {
    throw new Error('手机号不能为空');
  }
  
  if (!formData.company || formData.company.trim() === '') {
    throw new Error('请选择所在公司');
  }
  
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\\d{9}$/;
  if (formData.phone && !phoneRegex.test(formData.phone)) {
    throw new Error('请输入正确的手机号格式');
  }
  
  console.log('数据验证通过');
  return formData;
}
      `.trim()
    }
  }
];

/**
 * 检查Hook是否已存在
 */
async function checkHookExists(hookName) {
  try {
    const response = await axios.get(`${CONFIG.API_BASE}/forms/${CONFIG.FORM_ID}/hooks`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data.some(hook => hook.name === hookName);
    }
    return false;
  } catch (error) {
    console.log(`检查Hook "${hookName}" 是否存在失败:`, error.message);
    return false;
  }
}

/**
 * 创建Hook
 */
async function createHook(hookData) {
  try {
    console.log(`正在创建Hook: ${hookData.name}`);
    
    const response = await axios.post(
      `${CONFIG.API_BASE}/forms/${CONFIG.FORM_ID}/hooks`,
      hookData,
      {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Hook "${hookData.name}" 创建成功`);
      return true;
    } else {
      console.log(`❌ Hook "${hookData.name}" 创建失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Hook "${hookData.name}" 创建失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 删除现有Hook
 */
async function deleteExistingHooks() {
  try {
    console.log('正在清理现有Hook...');
    
    const response = await axios.get(`${CONFIG.API_BASE}/forms/${CONFIG.FORM_ID}/hooks`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.success && response.data.data) {
      for (const hook of response.data.data) {
        try {
          await axios.delete(`${CONFIG.API_BASE}/forms/${CONFIG.FORM_ID}/hooks/${hook.id}`, {
            timeout: CONFIG.TIMEOUT
          });
          console.log(`✅ 删除Hook: ${hook.name}`);
        } catch (error) {
          console.log(`⚠️ 删除Hook "${hook.name}" 失败:`, error.message);
        }
      }
    }
    
    console.log('Hook清理完成');
    return true;
  } catch (error) {
    console.error('清理Hook失败:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始修复Hook配置...');
  console.log('目标服务器:', CONFIG.API_BASE);
  console.log('表单ID:', CONFIG.FORM_ID);
  console.log('='.repeat(50));
  
  try {
    // 1. 清理现有Hook
    await deleteExistingHooks();
    
    // 2. 创建新的Hook
    let successCount = 0;
    
    for (const hook of HOOKS) {
      const hookExists = await checkHookExists(hook.name);
      
      if (hookExists) {
        console.log(`⚠️ Hook "${hook.name}" 已存在，跳过创建`);
        continue;
      }
      
      const created = await createHook(hook);
      if (created) {
        successCount++;
      }
    }
    
    // 3. 验证Hook创建结果
    console.log('='.repeat(50));
    console.log('🔍 验证Hook创建结果...');
    
    const verifyResponse = await axios.get(`${CONFIG.API_BASE}/forms/${CONFIG.FORM_ID}/hooks`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (verifyResponse.data.success) {
      console.log(`✅ Hook验证完成，共 ${verifyResponse.data.data.length} 个Hook`);
      verifyResponse.data.data.forEach(hook => {
        console.log(`   - ${hook.name} (${hook.enabled ? '启用' : '禁用'})`);
      });
    }
    
    console.log('='.repeat(50));
    console.log('🎉 Hook修复完成！');
    console.log('');
    console.log('📋 修复总结:');
    console.log(`- 目标Hook数量: ${HOOKS.length}`);
    console.log(`- 成功创建: ${successCount}`);
    console.log(`- 当前Hook总数: ${verifyResponse.data.data.length}`);
    console.log('');
    console.log('💡 下一步:');
    console.log('1. 重新测试表单提交');
    console.log('2. 验证时间自动记录功能');
    console.log('3. 验证工作时间计算功能');
    
  } catch (error) {
    console.error('❌ Hook修复失败:', error.message);
    process.exit(1);
  }
}

// 执行修复
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('修复过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = {
  createHook,
  checkHookExists,
  deleteExistingHooks
};
