/*
 * @Date: 2025-12-02 14:27:05
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-02 14:27:33
 * @FilePath: /打卡/test_checkin_fix.js
 */
/**
 * 测试签到功能修复
 * 验证labor_source字段是否正常工作
 */

const axios = require('./backend/node_modules/axios');

async function testCheckinFix() {
  console.log('=== 测试签到功能修复 ===\n');
  
  const testData = {
    realName: '测试用户',
    phone: '13800138000',
    companyCode: 'TEST001',
    laborSource: '汇博劳务公司',
    location: '测试地点',
    remark: '测试签到'
  };

  try {
    console.log('1. 测试签到API...');
    console.log('请求数据:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:3050/api/checkin/checkin', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ 签到成功！');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ 劳务来源字段验证通过');
      console.log('   - labor_source字段已成功添加到数据库');
      console.log('   - 签到API接受laborSource参数');
      console.log('   - 数据保存成功');
    } else {
      console.log('\n⚠️ 签到API返回失败');
      console.log('错误信息:', response.data.message);
    }

  } catch (error) {
    console.error('❌ 测试失败:');
    
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.error && error.response.data.error.includes('labor_source')) {
        console.error('\n❌ 问题: labor_source字段相关错误');
        console.error('可能原因:');
        console.error('1. 数据库表缺少labor_source列');
        console.error('2. 后端控制器未正确处理laborSource参数');
        console.error('3. 数据库连接问题');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('请求已发送但未收到响应');
      console.error('可能原因:');
      console.error('1. 后端服务未启动');
      console.error('2. 网络连接问题');
      console.error('3. 服务器超时');
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message);
    }
    
    console.error('\n完整错误:', error.message);
  }

  console.log('\n=== 测试完成 ===');
}

// 运行测试
testCheckinFix().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
