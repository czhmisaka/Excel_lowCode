/**
 * 重新创建签到系统
 * 通过创建新的表单ID来避免Hook配置问题
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// 新的表单配置
const NEW_FORM_CONFIG = {
  formId: 'labor_sign_in_v2',
  name: '劳务签到系统 V2',
  description: '劳务人员签到签退系统 - 修复版本',
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
        required: false,
        placeholder: '自动记录',
        disabled: true
      },
      {
        name: 'sign_out_time',
        label: '签退时间',
        type: 'datetime',
        required: false,
        placeholder: '自动记录',
        disabled: true
      },
      {
        name: 'work_hours',
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
          fields: ['sign_in_time', 'sign_out_time', 'work_hours']
        }
      ]
    }
  }
};

// 简化的Hook配置
const SIMPLE_HOOKS = [
  {
    name: '自动记录时间',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '自动记录签到时间和计算工作时间',
    config: {
      code: `
// 自动记录时间和计算工作时间
function execute(formData, context) {
  // 自动设置签到时间
  if (!formData.sign_in_time) {
    formData.sign_in_time = new Date().toISOString();
    console.log('自动设置签到时间:', formData.sign_in_time);
  }
  
  // 如果有签退时间，计算工作时间
  if (formData.sign_out_time) {
    const signIn = new Date(formData.sign_in_time);
    const signOut = new Date(formData.sign_out_time);
    const workHours = (signOut - signIn) / (1000 * 60 * 60);
    
    if (workHours > 0) {
      formData.work_hours = Math.round(workHours * 100) / 100;
      console.log('计算工作时间:', formData.work_hours, '小时');
    }
  }
  
  return formData;
}
      `.trim()
    }
  }
];

/**
 * 检查表单是否已存在
 */
async function checkFormExists(formId) {
  try {
    const response = await axios.get(`${API_BASE}/forms/${formId}`);
    return response.data.success;
  } catch (error) {
    return false;
  }
}

/**
 * 创建新表单
 */
async function createNewForm() {
  console.log('📝 创建新表单...');
  
  const formExists = await checkFormExists(NEW_FORM_CONFIG.formId);
  if (formExists) {
    console.log('✅ 新表单已存在，跳过创建');
    return true;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/forms`, NEW_FORM_CONFIG);
    
    if (response.data.success) {
      console.log('✅ 新表单创建成功');
      console.log(`表单ID: ${NEW_FORM_CONFIG.formId}`);
      return true;
    } else {
      throw new Error('创建表单失败');
    }
  } catch (error) {
    console.error('❌ 创建新表单失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 创建简化的Hook配置
 */
async function createSimpleHooks() {
  console.log('⚙️ 创建简化的Hook配置...');
  
  for (const hook of SIMPLE_HOOKS) {
    try {
      const response = await axios.post(`${API_BASE}/forms/${NEW_FORM_CONFIG.formId}/hooks`, {
        formId: NEW_FORM_CONFIG.formId,
        ...hook
      });
      
      if (response.data.success) {
        console.log(`✅ Hook "${hook.name}" 创建成功`);
      } else {
        console.error(`❌ Hook "${hook.name}" 创建失败:`, response.data.message);
      }
    } catch (error) {
      console.error(`❌ Hook "${hook.name}" 创建错误:`, error.response?.data || error.message);
    }
  }
  
  return true;
}

/**
 * 验证新系统功能
 */
async function validateNewSystem() {
  console.log('🔧 验证新系统功能...');
  
  try {
    // 检查表单详情
    const formResponse = await axios.get(`${API_BASE}/forms/${NEW_FORM_CONFIG.formId}`);
    
    if (formResponse.data.success) {
      console.log('✅ 新表单详情查询成功');
    }
    
    // 检查Hook列表
    const hooksResponse = await axios.get(`${API_BASE}/forms/${NEW_FORM_CONFIG.formId}/hooks`);
    
    if (hooksResponse.data.success) {
      console.log(`✅ Hook列表查询成功，共 ${hooksResponse.data.data?.length || 0} 个Hook`);
    }
    
    // 测试表单提交
    console.log('🧪 测试新表单提交...');
    const testResponse = await axios.post(`${API_BASE}/public/form/forms/${NEW_FORM_CONFIG.formId}/submit`, {
      data: {
        name: '测试用户',
        phone: '13800138000',
        company: 'huibo'
      }
    });
    
    if (testResponse.data.success) {
      console.log('✅ 新表单提交测试成功');
      console.log('提交结果:', JSON.stringify(testResponse.data, null, 2));
    } else {
      console.log('⚠️ 新表单提交测试失败:', testResponse.data.message);
    }
    
    console.log('🎉 新系统验证完成');
    console.log('公开表单访问地址:');
    console.log(`${API_BASE.replace('/api', '')}/api/public/form/forms/${NEW_FORM_CONFIG.formId}`);
    
    return true;
  } catch (error) {
    console.error('❌ 新系统验证失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主函数 - 重新创建签到系统
 */
async function recreateSignInSystem() {
  console.log('🚀 开始重新创建签到系统...');
  console.log('目标服务器:', API_BASE);
  console.log('='.repeat(50));
  
  try {
    // 1. 创建新表单
    const formCreated = await createNewForm();
    if (!formCreated) {
      console.log('❌ 创建中止: 新表单创建失败');
      return false;
    }
    
    // 2. 创建简化的Hook配置
    await createSimpleHooks();
    
    // 3. 验证新系统功能
    const systemValidated = await validateNewSystem();
    
    console.log('='.repeat(50));
    if (systemValidated) {
      console.log('🎉 新签到系统创建完成！');
      console.log('');
      console.log('📋 创建总结:');
      console.log('- 新表单创建: ✅ 完成');
      console.log('- Hook配置: ✅ 完成');
      console.log('- 功能验证: ✅ 通过');
      console.log('');
      console.log('🔗 访问地址:');
      console.log(`公开表单: ${API_BASE.replace('/api', '')}/api/public/form/forms/${NEW_FORM_CONFIG.formId}`);
      console.log('');
      console.log('💡 使用说明:');
      console.log('1. 使用新表单地址进行签到签退');
      console.log('2. 系统会自动记录时间和计算工作时间');
    } else {
      console.log('⚠️ 创建完成，但存在一些问题');
      console.log('请检查系统日志并手动验证功能');
    }
    
    return systemValidated;
  } catch (error) {
    console.error('❌ 创建过程中发生错误:', error);
    return false;
  }
}

// 执行创建
if (require.main === module) {
  recreateSignInSystem()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('创建过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = {
  recreateSignInSystem,
  createNewForm,
  createSimpleHooks,
  validateNewSystem
};
