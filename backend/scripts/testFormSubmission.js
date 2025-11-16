/*
 * @Date: 2025-11-11 14:11:15
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 14:11:39
 * @FilePath: /lowCode_excel/backend/scripts/testFormSubmission.js
 */
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testFormSubmission() {
  try {
    console.log('🚀 开始测试表单提交功能...\n');

    // 测试数据
    const testData = {
      name: '测试用户',
      phone: '13800138000',
      company: 'huibo',
      sign_in_time: '2025-11-11T09:00:00.000Z',
      sign_out_time: '2025-11-11T17:30:00.000Z'
    };

    console.log('📝 提交测试数据:', JSON.stringify(testData, null, 2));

    // 提交表单数据
    const response = await axios.post(`${API_BASE}/public/form/labor_sign_in/submit`, {
      data: testData
    });

    console.log('\n✅ 表单提交成功！');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 测试通过！数据已成功提交到对应表中');
      console.log('📋 提交结果:');
      console.log('  - 表单ID:', 'labor_sign_in');
      console.log('  - 提交状态:', '成功');
      console.log('  - 处理后的数据:', response.data.data);
    } else {
      console.log('\n❌ 测试失败:', response.data.message);
    }

  } catch (error) {
    console.error('\n❌ 表单提交测试失败:');
    if (error.response) {
      console.log('  - 状态码:', error.response.status);
      console.log('  - 错误信息:', error.response.data.message);
      console.log('  - 详细错误:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('  - 错误:', error.message);
    }
  }
}

// 等待后端服务器启动
setTimeout(() => {
  testFormSubmission();
}, 2000);
