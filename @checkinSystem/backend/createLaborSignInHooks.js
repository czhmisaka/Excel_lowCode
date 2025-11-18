const { FormHook } = require('../models');
const { testConnection } = require('../config/database');

/**
 * 为劳务签到系统创建Hook配置
 */
async function createLaborSignInHooks() {
  try {
    await testConnection();
    
    const hooks = [
      {
        formId: 'labor_sign_in',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '自动签到时间Hook',
          code: `
// 自动签到时间Hook
// 在提交前自动设置签到时间
function execute(data) {
  // 如果没有提供签到时间，自动设置为当前时间
  if (!data.sign_time) {
    data.sign_time = new Date().toISOString();
    console.log('自动设置签到时间:', data.sign_time);
  }
  
  // 如果没有提供日期，自动设置为今天
  if (!data.sign_date) {
    const today = new Date();
    data.sign_date = today.toISOString().split('T')[0];
    console.log('自动设置签到日期:', data.sign_date);
  }
  
  return data;
}
          `.trim(),
          description: '自动设置签到时间和日期'
        },
        enabled: true
      },
      {
        formId: 'labor_sign_in',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '计算工作时间Hook',
          code: `
// 计算工作时间Hook
// 根据签到和签退时间计算工作时长
function execute(data) {
  // 如果有签到时间和签退时间，计算工作时长
  if (data.sign_time && data.sign_out_time) {
    const signTime = new Date(data.sign_time);
    const signOutTime = new Date(data.sign_out_time);
    
    // 计算时间差（小时）
    const workHours = (signOutTime - signTime) / (1000 * 60 * 60);
    
    // 设置工作时长
    data.work_hours = Math.round(workHours * 100) / 100; // 保留2位小数
    
    console.log('计算工作时长:', data.work_hours, '小时');
  }
  
  return data;
}
          `.trim(),
          description: '根据签到和签退时间计算工作时长'
        },
        enabled: true
      },
      {
        formId: 'labor_sign_in',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '重复签到验证Hook',
          code: `
// 重复签到验证Hook
// 检查同一员工在同一天是否已经签到
function execute(data) {
  // 这里需要查询数据库检查重复签到
  // 由于在Hook中无法直接访问数据库，我们返回一个标记
  // 实际的重复检查将在Hook引擎中实现
  
  // 设置验证标记
  data.need_duplicate_check = true;
  data.check_fields = ['employee_id', 'sign_date'];
  
  console.log('设置重复签到验证标记');
  
  return data;
}
          `.trim(),
          description: '检查同一员工在同一天是否已经签到'
        },
        enabled: true
      }
    ];

    console.log('开始创建Hook配置...');
    
    for (const hookData of hooks) {
      // 检查是否已存在相同名称的Hook（通过config.name）
      const existingHooks = await FormHook.findAll({
        where: {
          formId: hookData.formId
        }
      });
      
      // 检查是否有相同名称的Hook
      const hasDuplicate = existingHooks.some(hook => {
        try {
          const config = typeof hook.config === 'string' ? JSON.parse(hook.config) : hook.config;
          return config.name === hookData.config.name;
        } catch (error) {
          return false;
        }
      });
      
      if (hasDuplicate) {
        console.log(`Hook "${hookData.config.name}" 已存在，跳过创建`);
        continue;
      }
      
      // 创建Hook
      const hook = await FormHook.create(hookData);
      console.log(`✅ 创建Hook成功: ${hookData.config.name}`);
      console.log(`   - 类型: ${hookData.type}`);
      console.log(`   - 触发时机: ${hookData.triggerType}`);
    }
    
    console.log('Hook配置创建完成！');
    
  } catch (error) {
    console.error('创建Hook配置失败:', error);
  }
}

// 执行脚本
createLaborSignInHooks()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
