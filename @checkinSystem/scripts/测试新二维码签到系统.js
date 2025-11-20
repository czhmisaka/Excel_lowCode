const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 三个企业的配置
const COMPANIES = [
  {
    id: 'huibo',
    name: '汇博劳务公司',
    checkinFormId: 'huibo_qr_checkin',
    checkoutFormId: 'huibo_qr_checkout'
  },
  {
    id: 'hengxin', 
    name: '恒信劳务公司',
    checkinFormId: 'hengxin_qr_checkin',
    checkoutFormId: 'hengxin_qr_checkout'
  },
  {
    id: 'temporary',
    name: '临时工',
    checkinFormId: 'temporary_qr_checkin',
    checkoutFormId: 'temporary_qr_checkout'
  }
];

/**
 * 测试服务器连接
 */
async function testConnection() {
  try {
    const response = await axios.get(`http://localhost:3000/health`);
    if (response.data.status === 'ok') {
      console.log('✅ 服务器连接正常');
      return true;
    }
  } catch (error) {
    console.error('❌ 服务器连接失败:', error.message);
    return false;
  }
}

/**
 * 测试表单访问
 */
async function testFormAccess(company) {
  console.log(`\n📋 测试 ${company.name} 表单访问...`);
  
  try {
    // 测试签到表单
    const checkinResponse = await axios.get(`${API_BASE}/forms/${company.checkinFormId}`);
    if (checkinResponse.data.success) {
      console.log(`✅ ${company.name} 签到表单访问正常`);
    } else {
      console.log(`❌ ${company.name} 签到表单访问失败`);
    }
    
    // 测试签退表单
    const checkoutResponse = await axios.get(`${API_BASE}/forms/${company.checkoutFormId}`);
    if (checkoutResponse.data.success) {
      console.log(`✅ ${company.name} 签退表单访问正常`);
    } else {
      console.log(`❌ ${company.name} 签退表单访问失败`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ${company.name} 表单访问失败:`, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * 测试签到流程
 */
async function testCheckinProcess(company) {
  console.log(`\n📝 测试 ${company.name} 签到流程...`);
  
  const testData = {
    name: '测试用户',
    phone: '13800138000'
  };
  
  try {
    const response = await axios.post(
      `${API_BASE}/public/form/forms/${company.checkinFormId}/submit`,
      { data: testData }
    );
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签到成功`);
      console.log(`   返回数据:`, JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } else {
      console.log(`❌ ${company.name} 签到失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${company.name} 签到请求失败:`, error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * 测试签退流程
 */
async function testCheckoutProcess(company) {
  console.log(`\n📝 测试 ${company.name} 签退流程...`);
  
  const testData = {
    name: '测试用户',
    phone: '13800138000'
  };
  
  try {
    const response = await axios.post(
      `${API_BASE}/public/form/forms/${company.checkoutFormId}/submit`,
      { data: testData }
    );
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签退成功`);
      console.log(`   返回数据:`, JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } else {
      console.log(`❌ ${company.name} 签退失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${company.name} 签退请求失败:`, error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * 测试数据查询
 */
async function testDataQuery(company) {
  console.log(`\n📊 测试 ${company.name} 数据查询...`);
  
  try {
    // 尝试查询对应的数据表
    const tableName = `${company.id}_labor_sign_records`;
    const response = await axios.get(`${API_BASE}/data/${tableName}`);
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 数据查询成功`);
      console.log(`   数据条数:`, response.data.data?.length || 0);
      return response.data.data;
    } else {
      console.log(`❌ ${company.name} 数据查询失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${company.name} 数据查询失败:`, error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试新二维码签到系统...');
  
  // 测试服务器连接
  if (!await testConnection()) {
    console.log('❌ 服务器连接失败，测试中止');
    return;
  }
  
  // 测试每个企业的表单
  for (const company of COMPANIES) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`测试 ${company.name}`);
    console.log('='.repeat(50));
    
    // 测试表单访问
    await testFormAccess(company);
    
    // 测试签到流程
    await testCheckinProcess(company);
    
    // 测试签退流程
    await testCheckoutProcess(company);
    
    // 测试数据查询
    await testDataQuery(company);
  }
  
  console.log('\n🎉 测试完成！');
  console.log('\n🔗 二维码访问地址:');
  for (const company of COMPANIES) {
    console.log(`\n${company.name}:`);
    console.log(`  - 签到二维码: http://localhost:3000/api/public/form/forms/${company.checkinFormId}`);
    console.log(`  - 签退二维码: http://localhost:3000/api/public/form/forms/${company.checkoutFormId}`);
  }
}

// 执行测试
main().catch(error => {
  console.error('测试执行失败:', error);
});
