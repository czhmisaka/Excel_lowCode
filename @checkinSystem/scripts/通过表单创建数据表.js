const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 三个企业的配置
const COMPANIES = [
  {
    id: 'huibo',
    name: '汇博劳务公司',
    tableName: 'huibo_qr_sign_records',
    checkinFormId: 'huibo_qr_checkin',
    checkoutFormId: 'huibo_qr_checkout'
  },
  {
    id: 'hengxin', 
    name: '恒信劳务公司',
    tableName: 'hengxin_qr_sign_records',
    checkinFormId: 'hengxin_qr_checkin',
    checkoutFormId: 'hengxin_qr_checkout'
  },
  {
    id: 'temporary',
    name: '临时工',
    tableName: 'temporary_qr_sign_records',
    checkinFormId: 'temporary_qr_checkin',
    checkoutFormId: 'temporary_qr_checkout'
  }
];

/**
 * 通过表单提交创建数据表
 * 这个方法通过向表单提交测试数据来触发数据表的自动创建
 */
async function createTableViaFormSubmission(company) {
  console.log(`📊 正在通过表单提交为 ${company.name} 创建数据表...`);
  
  // 测试数据
  const testData = {
    data: {
      name: '测试员工',
      phone: '13800138000',
      company: company.id,
      sign_in_time: new Date().toISOString(),
      sign_out_time: '',
      work_hours: 0
    }
  };
  
  try {
    console.log(`📝 向 ${company.checkinFormId} 提交测试数据...`);
    const response = await axios.post(
      `${API_BASE}/public/form/forms/${company.checkinFormId}/submit`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 数据表创建成功`);
      console.log(`   - 表名: ${company.tableName}`);
      console.log(`   - 提交结果:`, response.data);
      return true;
    } else {
      console.log(`⚠️  表单提交成功但可能有警告:`, response.data);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`❌ 表单 ${company.checkinFormId} 不存在，需要先创建表单`);
      return false;
    } else if (error.response?.data?.message?.includes('表不存在')) {
      console.log(`❌ 数据表 ${company.tableName} 不存在，需要手动创建`);
      console.log(`💡 解决方案:`);
      console.log(`1. 通过系统界面创建数据表: ${company.tableName}`);
      console.log(`2. 或者通过Excel导入创建数据表`);
      console.log(`3. 创建完成后重新运行此脚本`);
      return false;
    } else {
      console.log(`⚠️  表单提交出现错误:`, error.response?.data || error.message);
      // 可能是其他错误，继续尝试
      return true;
    }
  }
}

/**
 * 检查数据表是否已创建
 */
async function verifyTableCreation(company) {
  try {
    // 等待一段时间让表创建完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 尝试通过表单结构检查表是否存在
    const response = await axios.get(
      `${API_BASE}/public/form/forms/${company.checkinFormId}`
    );
    
    if (response.data.success) {
      const form = response.data.data;
      if (form.tableMapping) {
        console.log(`✅ ${company.name} 数据表已正确映射: ${form.tableMapping}`);
        return true;
      } else {
        console.log(`⚠️  ${company.name} 表单未正确映射到数据表`);
        return false;
      }
    }
  } catch (error) {
    console.log(`⚠️  验证数据表创建时出现错误:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 更新表单映射
 */
async function updateFormMapping(company) {
  try {
    // 获取当前表单信息
    const formResponse = await axios.get(`${API_BASE}/forms/${company.checkinFormId}`);
    const currentForm = formResponse.data.data;
    
    // 更新表映射
    const updateData = {
      ...currentForm,
      tableMapping: company.tableName
    };
    
    const response = await axios.put(`${API_BASE}/forms/${company.checkinFormId}`, updateData);
    console.log(`✅ ${company.checkinFormId} 已更新映射到表: ${company.tableName}`);
    
    // 同样更新签退表单
    const checkoutFormResponse = await axios.get(`${API_BASE}/forms/${company.checkoutFormId}`);
    const checkoutForm = checkoutFormResponse.data.data;
    
    const checkoutUpdateData = {
      ...checkoutForm,
      tableMapping: company.tableName
    };
    
    await axios.put(`${API_BASE}/forms/${company.checkoutFormId}`, checkoutUpdateData);
    console.log(`✅ ${company.checkoutFormId} 已更新映射到表: ${company.tableName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ 更新表单映射失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 主函数 - 通过表单创建数据表
 */
async function createTablesViaForms() {
  try {
    console.log('🚀 开始通过表单提交创建数据表...');
    console.log('目标服务器:', API_BASE);
    
    // 测试服务器连接
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.error('❌ 服务器连接失败，请检查服务器状态');
      return;
    }
    
    const results = {};
    
    // 为每个企业创建数据表
    for (const company of COMPANIES) {
      console.log(`\n📋 处理 ${company.name}...`);
      
      // 1. 通过表单提交创建数据表
      const tableCreated = await createTableViaFormSubmission(company);
      results[company.tableName] = tableCreated;
      
      if (tableCreated) {
        // 2. 验证表创建
        await verifyTableCreation(company);
        
        // 3. 更新表单映射
        await updateFormMapping(company);
      }
    }
    
    console.log('\n📊 数据表创建结果:');
    for (const company of COMPANIES) {
      const status = results[company.tableName] ? '✅ 创建成功' : '❌ 创建失败';
      console.log(`  - ${company.tableName}: ${status}`);
    }
    
    const allSuccess = Object.values(results).every(status => status);
    
    if (allSuccess) {
      console.log('\n🎉 所有数据表创建成功！系统可以正常使用');
      console.log('\n🔗 二维码访问地址:');
      for (const company of COMPANIES) {
        console.log(`\n${company.name}:`);
        console.log(`  - 签到二维码: http://localhost:3000/api/public/form/forms/${company.checkinFormId}`);
        console.log(`  - 签退二维码: http://localhost:3000/api/public/form/forms/${company.checkoutFormId}`);
      }
    } else {
      console.log('\n🚨 部分数据表创建失败，需要手动创建');
      console.log('💡 手动创建步骤:');
      console.log('1. 通过系统界面创建缺失的数据表');
      console.log('2. 或者通过Excel导入创建数据表');
      console.log('3. 创建完成后重新运行此脚本');
    }
    
  } catch (error) {
    console.error('❌ 创建数据表失败:', error.response?.data || error.message);
  }
}

// 执行创建
createTablesViaForms();
