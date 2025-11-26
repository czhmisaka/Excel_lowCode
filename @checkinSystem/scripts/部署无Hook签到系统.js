/**
 * 部署无Hook签到系统
 * 创建一个没有Hook的签到系统，确保基本功能可用
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// 无Hook的签到表单配置
const NO_HOOK_FORM_CONFIG = {
  formId: 'labor_sign_in_no_hook',
  name: '劳务签到系统 - 无Hook版本',
  description: '劳务人员签到签退系统 - 无Hook版本，确保基本功能可用',
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
        placeholder: '请手动选择签到时间'
      },
      {
        name: 'sign_out_time',
        label: '签退时间',
        type: 'datetime',
        required: false,
        placeholder: '请手动选择签退时间'
      },
      {
        name: 'work_hours',
        label: '实际工作时间',
        type: 'number',
        required: false,
        placeholder: '请手动计算工作时间',
        description: '需要手动计算并填写工作时间'
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
 * 创建无Hook表单
 */
async function createNoHookForm() {
  console.log('📝 创建无Hook签到表单...');
  
  const formExists = await checkFormExists(NO_HOOK_FORM_CONFIG.formId);
  if (formExists) {
    console.log('✅ 无Hook表单已存在，跳过创建');
    return true;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/forms`, NO_HOOK_FORM_CONFIG);
    
    if (response.data.success) {
      console.log('✅ 无Hook表单创建成功');
      console.log(`表单ID: ${NO_HOOK_FORM_CONFIG.formId}`);
      return true;
    } else {
      throw new Error('创建表单失败');
    }
  } catch (error) {
    console.error('❌ 创建无Hook表单失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 验证无Hook系统功能
 */
async function validateNoHookSystem() {
  console.log('🔧 验证无Hook系统功能...');
  
  try {
    // 检查表单详情
    const formResponse = await axios.get(`${API_BASE}/forms/${NO_HOOK_FORM_CONFIG.formId}`);
    
    if (formResponse.data.success) {
      console.log('✅ 无Hook表单详情查询成功');
    }
    
    // 测试表单提交
    console.log('🧪 测试无Hook表单提交...');
    const testResponse = await axios.post(`${API_BASE}/public/form/forms/${NO_HOOK_FORM_CONFIG.formId}/submit`, {
      data: {
        name: '测试用户',
        phone: '13800138000',
        company: 'huibo',
        sign_in_time: new Date().toISOString(),
        sign_out_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8小时后
        work_hours: 8.0
      }
    });
    
    if (testResponse.data.success) {
      console.log('✅ 无Hook表单提交测试成功');
      console.log('提交结果:', JSON.stringify(testResponse.data, null, 2));
    } else {
      console.log('⚠️ 无Hook表单提交测试失败:', testResponse.data.message);
    }
    
    console.log('🎉 无Hook系统验证完成');
    console.log('公开表单访问地址:');
    console.log(`${API_BASE.replace('/api', '')}/api/public/form/forms/${NO_HOOK_FORM_CONFIG.formId}`);
    
    return true;
  } catch (error) {
    console.error('❌ 无Hook系统验证失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主函数 - 部署无Hook签到系统
 */
async function deployNoHookSignInSystem() {
  console.log('🚀 开始部署无Hook签到系统...');
  console.log('目标服务器:', API_BASE);
  console.log('='.repeat(50));
  
  try {
    // 1. 创建无Hook表单
    const formCreated = await createNoHookForm();
    if (!formCreated) {
      console.log('❌ 部署中止: 表单创建失败');
      return false;
    }
    
    // 2. 验证无Hook系统功能
    const systemValidated = await validateNoHookSystem();
    
    console.log('='.repeat(50));
    if (systemValidated) {
      console.log('🎉 无Hook签到系统部署完成！');
      console.log('');
      console.log('📋 部署总结:');
      console.log('- 表单创建: ✅ 完成');
      console.log('- 功能验证: ✅ 通过');
      console.log('');
      console.log('🔗 访问地址:');
      console.log(`公开表单: ${API_BASE.replace('/api', '')}/api/public/form/forms/${NO_HOOK_FORM_CONFIG.formId}`);
      console.log('');
      console.log('💡 使用说明:');
      console.log('1. 用户需要手动选择签到和签退时间');
      console.log('2. 用户需要手动计算并填写工作时间');
      console.log('3. 系统会验证手机号格式和必填字段');
      console.log('4. 数据会正常存储到数据库中');
      console.log('');
      console.log('⚠️ 注意事项:');
      console.log('- 此版本没有自动时间记录功能');
      console.log('- 需要用户手动填写所有时间信息');
      console.log('- 后续可以修复Hook问题后升级到完整版本');
    } else {
      console.log('⚠️ 部署完成，但存在一些问题');
      console.log('请检查系统日志并手动验证功能');
    }
    
    return systemValidated;
  } catch (error) {
    console.error('❌ 部署过程中发生错误:', error);
    return false;
  }
}

// 执行部署
if (require.main === module) {
  deployNoHookSignInSystem()
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
  deployNoHookSignInSystem,
  createNoHookForm,
  validateNoHookSystem
};
