/**
 * 测试无Hook表单
 * 创建一个没有Hook的简单表单来测试基本功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// 最简单的表单配置
const SIMPLE_FORM_CONFIG = {
  formId: 'simple_test_form',
  name: '简单测试表单',
  description: '用于测试基本表单功能的简单表单',
  tableMapping: 'test_records',
  definition: {
    fields: [
      {
        name: 'name',
        label: '姓名',
        type: 'text',
        required: true,
        placeholder: '请输入姓名'
      },
      {
        name: 'phone',
        label: '手机号',
        type: 'text',
        required: true,
        placeholder: '请输入手机号'
      }
    ],
    layout: {
      columns: 2,
      sections: [
        {
          title: '基本信息',
          fields: ['name', 'phone']
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
 * 创建简单表单
 */
async function createSimpleForm() {
  console.log('📝 创建简单测试表单...');
  
  const formExists = await checkFormExists(SIMPLE_FORM_CONFIG.formId);
  if (formExists) {
    console.log('✅ 简单表单已存在，跳过创建');
    return true;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/forms`, SIMPLE_FORM_CONFIG);
    
    if (response.data.success) {
      console.log('✅ 简单表单创建成功');
      console.log(`表单ID: ${SIMPLE_FORM_CONFIG.formId}`);
      return true;
    } else {
      throw new Error('创建表单失败');
    }
  } catch (error) {
    console.error('❌ 创建简单表单失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试表单提交
 */
async function testFormSubmit() {
  console.log('🧪 测试表单提交...');
  
  try {
    const testResponse = await axios.post(`${API_BASE}/public/form/forms/${SIMPLE_FORM_CONFIG.formId}/submit`, {
      data: {
        name: '测试用户',
        phone: '13800138000'
      }
    });
    
    if (testResponse.data.success) {
      console.log('✅ 表单提交测试成功');
      console.log('提交结果:', JSON.stringify(testResponse.data, null, 2));
      return true;
    } else {
      console.log('⚠️ 表单提交测试失败:', testResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 表单提交错误:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主函数 - 测试无Hook表单
 */
async function testNoHookForm() {
  console.log('🚀 开始测试无Hook表单...');
  console.log('目标服务器:', API_BASE);
  console.log('='.repeat(50));
  
  try {
    // 1. 创建简单表单
    const formCreated = await createSimpleForm();
    if (!formCreated) {
      console.log('❌ 测试中止: 表单创建失败');
      return false;
    }
    
    // 2. 测试表单提交
    const submitTested = await testFormSubmit();
    
    console.log('='.repeat(50));
    if (submitTested) {
      console.log('🎉 无Hook表单测试完成！');
      console.log('');
      console.log('📋 测试总结:');
      console.log('- 表单创建: ✅ 完成');
      console.log('- 提交测试: ✅ 通过');
      console.log('');
      console.log('🔗 访问地址:');
      console.log(`公开表单: ${API_BASE.replace('/api', '')}/api/public/form/forms/${SIMPLE_FORM_CONFIG.formId}`);
      console.log('');
      console.log('💡 结论:');
      console.log('基本表单功能正常，问题可能出现在Hook执行环节');
    } else {
      console.log('⚠️ 测试完成，但存在一些问题');
      console.log('基本表单功能可能也有问题');
    }
    
    return submitTested;
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
}

// 执行测试
if (require.main === module) {
  testNoHookForm()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = {
  testNoHookForm,
  createSimpleForm,
  testFormSubmit
};
