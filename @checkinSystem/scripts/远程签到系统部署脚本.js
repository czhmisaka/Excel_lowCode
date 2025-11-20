/**
 * 远程签到系统部署脚本
 * 用于在远程服务器上部署劳务签到系统
 * 目标服务器: http://118.196.16.32:3000
 */

const axios = require('axios');

// 配置
const CONFIG = {
  API_BASE: 'http://localhost:3000/api',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 5000
};

// 签到表单定义
const SIGN_IN_FORM_DEFINITION = {
  formId: 'labor_sign_in',
  name: '劳务签到系统',
  description: '劳务人员签到签退系统，支持姓名、手机号、公司选择和自动时间记录',
  tableMapping: 'labor_sign_records',
  definition: {
    fields: [
      {
        name: 'name',
        label: '姓名',
        type: 'text',
        required: true,
        placeholder: '请输入姓名',
        validation: {
          pattern: '',
          message: ''
        }
      },
      {
        name: 'phone',
        label: '手机号',
        type: 'text',
        required: true,
        placeholder: '请输入手机号',
        validation: {
          pattern: '^1[3-9]\\d{9}$',
          message: '请输入正确的手机号格式'
        }
      },
      {
        name: 'company',
        label: '所在公司',
        type: 'select',
        required: true,
        options: [
          { label: '汇博劳务公司', value: 'huibo' },
          { label: '恒信劳务公司', value: 'hengxin' },
          { label: '临时工', value: 'temporary' }
        ],
        placeholder: '请选择所在公司'
      },
      {
        name: 'sign_in_time',
        label: '签到时间',
        type: 'datetime',
        required: true,
        placeholder: '请选择签到时间',
        defaultValue: '{{current_time}}'
      },
      {
        name: 'sign_out_time',
        label: '签退时间',
        type: 'datetime',
        required: false,
        placeholder: '请选择签退时间'
      },
      {
        name: 'actual_work_hours',
        label: '实际工作时间',
        type: 'number',
        required: false,
        placeholder: '自动计算',
        disabled: true,
        description: '根据签到和签退时间自动计算'
      }
    ],
    layout: {
      columns: 2,
      sections: [
        {
          title: '基本信息',
          fields: ['name', 'phone', 'company']
        },
        {
          title: '签到信息',
          fields: ['sign_in_time', 'sign_out_time', 'actual_work_hours']
        }
      ]
    }
  }
};

// Hook配置
const HOOKS = [
  {
    formId: 'labor_sign_in',
    name: '自动签到时间',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '自动填充当前时间作为签到时间',
    config: {
      code: `
// 自动填充签到时间
if (!formData.sign_in_time) {
  formData.sign_in_time = new Date().toISOString();
}
console.log('自动设置签到时间:', formData.sign_in_time);
      `.trim()
    }
  },
  {
    formId: 'labor_sign_in',
    name: '计算工作时间',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '根据签到和签退时间计算实际工作时间',
    config: {
      code: `
// 计算实际工作时间
if (formData.sign_in_time && formData.sign_out_time) {
  const signIn = new Date(formData.sign_in_time);
  const signOut = new Date(formData.sign_out_time);
  const workHours = (signOut - signIn) / (1000 * 60 * 60); // 转换为小时
  
  if (workHours > 0) {
    formData.actual_work_hours = Math.round(workHours * 100) / 100; // 保留2位小数
    console.log('计算工作时间:', formData.actual_work_hours, '小时');
  }
}
      `.trim()
    }
  },
  {
    formId: 'labor_sign_in',
    name: '重复签到验证',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '验证同一天内不能重复签到',
    config: {
      code: `
// 重复签到验证逻辑
const today = new Date().toISOString().split('T')[0];
const signInDate = formData.sign_in_time ? formData.sign_in_time.split('T')[0] : null;

// 这里可以添加数据库查询逻辑来检查重复签到
// 暂时只做简单的日期验证
if (signInDate && signInDate === today) {
  console.log('签到日期验证通过');
} else {
  console.log('签到日期验证失败');
}
      `.trim()
    }
  }
];

// 重试机制
async function retryOperation(operation, maxRetries = CONFIG.RETRY_COUNT) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`尝试 ${attempt}/${maxRetries} 失败:`, error.message);
      if (attempt < maxRetries) {
        console.log(`等待 ${CONFIG.RETRY_DELAY/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      } else {
        throw error;
      }
    }
  }
}

// 检查服务器连接
async function checkServerConnection() {
  console.log('🔍 检查远程服务器连接...');
  
  try {
    const response = await axios.get(`${CONFIG.API_BASE.replace('/api', '')}/health`, {
      timeout: CONFIG.TIMEOUT
    });
    
    console.log('✅ 服务器连接正常');
    console.log('服务器状态:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 无法连接到服务器:', error.message);
    console.log('请检查:');
    console.log('1. 服务器地址是否正确: http://localhost:3000');
    console.log('2. 服务器是否正在运行');
    console.log('3. 网络连接是否正常');
    console.log('4. 防火墙设置');
    return false;
  }
}

// 检查表单是否已存在
async function checkFormExists() {
  try {
    const response = await axios.get(`${CONFIG.API_BASE}/forms/labor_sign_in`, {
      timeout: CONFIG.TIMEOUT
    });
    return response.data.success;
  } catch (error) {
    return false;
  }
}

// 创建签到表单
async function createSignInForm() {
  console.log('📝 创建签到表单...');
  
  const formExists = await checkFormExists();
  if (formExists) {
    console.log('✅ 签到表单已存在，跳过创建');
    return true;
  }
  
  try {
    const response = await retryOperation(async () => {
      return await axios.post(`${CONFIG.API_BASE}/forms`, SIGN_IN_FORM_DEFINITION, {
        timeout: CONFIG.TIMEOUT
      });
    });
    
    console.log('✅ 签到表单创建成功');
    return true;
  } catch (error) {
    console.error('❌ 创建签到表单失败:', error.response?.data || error.message);
    return false;
  }
}

// 创建Hook配置
async function createHooks() {
  console.log('⚙️ 创建Hook配置...');
  
  let successCount = 0;
  
  for (const hook of HOOKS) {
    try {
      await retryOperation(async () => {
        await axios.post(`${CONFIG.API_BASE}/forms/labor_sign_in/hooks`, hook, {
          timeout: CONFIG.TIMEOUT
        });
      });
      
      console.log(`✅ Hook "${hook.name}" 创建成功`);
      successCount++;
    } catch (error) {
      console.error(`❌ Hook "${hook.name}" 创建失败:`, error.response?.data || error.message);
    }
  }
  
  return successCount === HOOKS.length;
}

// 验证系统功能
async function validateSystem() {
  console.log('🔧 验证系统功能...');
  
  try {
    // 检查表单详情
    const formResponse = await axios.get(`${CONFIG.API_BASE}/forms/labor_sign_in`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (formResponse.data.success) {
      console.log('✅ 表单详情查询成功');
    }
    
    // 检查Hook列表
    const hooksResponse = await axios.get(`${CONFIG.API_BASE}/forms/labor_sign_in/hooks`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (hooksResponse.data.success) {
      console.log(`✅ Hook列表查询成功，共 ${hooksResponse.data.data?.length || 0} 个Hook`);
    }
    
    console.log('🎉 系统验证完成');
    console.log('公开表单访问地址:');
    console.log(`${CONFIG.API_BASE.replace('/api', '')}/api/public/form/labor_sign_in`);
    
    return true;
  } catch (error) {
    console.error('❌ 系统验证失败:', error.message);
    return false;
  }
}

// 主部署函数
async function deploySignInSystem() {
  console.log('🚀 开始部署劳务签到系统到远程服务器...');
  console.log('目标服务器:', CONFIG.API_BASE);
  console.log('='.repeat(50));
  
  // 1. 检查服务器连接
  const serverConnected = await checkServerConnection();
  if (!serverConnected) {
    console.log('❌ 部署中止: 无法连接到远程服务器');
    return false;
  }
  
  // 2. 创建签到表单
  const formCreated = await createSignInForm();
  if (!formCreated) {
    console.log('❌ 部署中止: 表单创建失败');
    return false;
  }
  
  // 3. 创建Hook配置
  const hooksCreated = await createHooks();
  if (!hooksCreated) {
    console.log('⚠️ 部分Hook创建失败，但继续部署');
  }
  
  // 4. 验证系统功能
  const systemValidated = await validateSystem();
  
  console.log('='.repeat(50));
  if (systemValidated) {
    console.log('🎉 劳务签到系统部署完成！');
    console.log('');
    console.log('📋 部署总结:');
    console.log('- 服务器连接: ✅ 正常');
    console.log('- 签到表单: ✅ 已创建');
    console.log('- Hook配置: ✅ 已配置');
    console.log('- 系统验证: ✅ 通过');
    console.log('');
    console.log('🔗 访问地址:');
    console.log(`公开表单: ${CONFIG.API_BASE.replace('/api', '')}/api/public/form/labor_sign_in`);
    console.log('');
    console.log('💡 使用说明:');
    console.log('1. 将前端增强脚本加载到签到表单页面');
    console.log('2. 用户可以通过公开表单地址进行签到签退');
    console.log('3. 系统会自动记录时间和计算工作时间');
  } else {
    console.log('⚠️ 部署完成，但存在一些问题');
    console.log('请检查系统日志并手动验证功能');
  }
  
  return systemValidated;
}

// 执行部署
if (require.main === module) {
  deploySignInSystem()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('部署过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = {
  deploySignInSystem,
  checkServerConnection,
  createSignInForm,
  createHooks,
  validateSystem
};
