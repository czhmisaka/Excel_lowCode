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
 * 测试签到功能
 */
async function testCheckin(company, employee) {
  try {
    console.log(`📝 测试 ${company.name} 签到: ${employee.name}`);
    
    const response = await axios.post(
      `${API_BASE}/public/form/forms/${company.checkinFormId}/submit`,
      {
        data: {
          name: employee.name,
          phone: employee.phone
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签到成功`);
      console.log(`   - 员工: ${employee.name}`);
      console.log(`   - 手机: ${employee.phone}`);
      console.log(`   - 签到时间: ${response.data.data.sign_in_time}`);
      console.log(`   - 公司: ${response.data.data.company}`);
      return true;
    } else {
      console.log(`❌ ${company.name} 签到失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${company.name} 签到错误:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试签退功能
 */
async function testCheckout(company, employee) {
  try {
    console.log(`📝 测试 ${company.name} 签退: ${employee.name}`);
    
    const response = await axios.post(
      `${API_BASE}/public/form/forms/${company.checkoutFormId}/submit`,
      {
        data: {
          name: employee.name,
          phone: employee.phone
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签退成功`);
      console.log(`   - 员工: ${employee.name}`);
      console.log(`   - 手机: ${employee.phone}`);
      console.log(`   - 签退时间: ${response.data.data.sign_out_time}`);
      console.log(`   - 公司: ${response.data.data.company}`);
      
      // 检查是否计算了工作时间
      if (response.data.data.work_hours) {
        console.log(`   - 工作时间: ${response.data.data.work_hours} 小时`);
      }
      
      return true;
    } else {
      console.log(`❌ ${company.name} 签退失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${company.name} 签退错误:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试完整的签到签退流程
 */
async function testCompleteWorkflow() {
  try {
    console.log('🚀 开始测试完整的二维码签到系统...');
    console.log('目标服务器:', API_BASE);
    
    // 测试服务器连接
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.error('❌ 服务器连接失败，请检查服务器状态');
      return;
    }
    
    // 测试员工数据
    const testEmployees = [
      { name: '张三', phone: '13800138001' },
      { name: '李四', phone: '13800138002' },
      { name: '王五', phone: '13800138003' }
    ];
    
    const results = {
      checkin: { success: 0, total: 0 },
      checkout: { success: 0, total: 0 }
    };
    
    // 为每个企业测试完整的签到签退流程
    for (const company of COMPANIES) {
      console.log(`\n📋 测试 ${company.name} 系统...`);
      
      for (const employee of testEmployees) {
        console.log(`\n👤 测试员工: ${employee.name}`);
        
        // 测试签到
        results.checkin.total++;
        const checkinSuccess = await testCheckin(company, employee);
        if (checkinSuccess) results.checkin.success++;
        
        // 等待一段时间模拟工作时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 测试签退
        results.checkout.total++;
        const checkoutSuccess = await testCheckout(company, employee);
        if (checkoutSuccess) results.checkout.success++;
        
        console.log('---');
      }
    }
    
    // 输出测试结果
    console.log('\n📊 完整系统测试结果:');
    console.log(`✅ 签到测试: ${results.checkin.success}/${results.checkin.total} 成功`);
    console.log(`✅ 签退测试: ${results.checkout.success}/${results.checkout.total} 成功`);
    
    const overallSuccess = 
      results.checkin.success === results.checkin.total && 
      results.checkout.success === results.checkout.total;
    
    if (overallSuccess) {
      console.log('\n🎉 所有测试通过！二维码签到系统完全正常运行');
      console.log('\n🔗 系统访问地址:');
      for (const company of COMPANIES) {
        console.log(`\n${company.name}:`);
        console.log(`  - 签到二维码: http://localhost:3000/api/public/form/forms/${company.checkinFormId}`);
        console.log(`  - 签退二维码: http://localhost:3000/api/public/form/forms/${company.checkoutFormId}`);
      }
      
      console.log('\n💡 使用说明:');
      console.log('1. 将上述URL生成二维码并打印');
      console.log('2. 员工扫描二维码填写姓名和手机号');
      console.log('3. 系统自动记录时间、公司信息并计算工作时间');
      console.log('4. 数据自动存储到对应的企业数据表中');
      
    } else {
      console.log('\n⚠️  部分测试失败，请检查系统配置');
    }
    
  } catch (error) {
    console.error('❌ 系统测试失败:', error.response?.data || error.message);
  }
}

// 执行完整测试
testCompleteWorkflow();
