const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 三个企业的配置
const COMPANIES = [
  {
    id: 'huibo',
    name: '汇博劳务公司',
    tableName: 'huibo_qr_sign_records'
  },
  {
    id: 'hengxin', 
    name: '恒信劳务公司',
    tableName: 'hengxin_qr_sign_records'
  },
  {
    id: 'temporary',
    name: '临时工',
    tableName: 'temporary_qr_sign_records'
  }
];

/**
 * 检查数据表是否存在
 */
async function checkTableExists(tableName) {
  try {
    // 尝试通过公开表单接口检查表结构
    const response = await axios.get(`${API_BASE}/public/form/${tableName}/structure`);
    if (response.data.success) {
      console.log(`✅ 数据表 ${tableName} 已存在`);
      return true;
    }
  } catch (error) {
    // 表不存在或其他错误
    if (error.response?.status === 404) {
      console.log(`❌ 数据表 ${tableName} 不存在`);
      return false;
    } else {
      console.log(`⚠️  检查数据表 ${tableName} 时出现错误:`, error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * 通过Excel导入创建数据表
 */
async function createTableViaExcelImport(company) {
  console.log(`📊 正在为 ${company.name} 创建数据表...`);
  
  // 创建Excel模板数据
  const excelData = [
    {
      '姓名': '示例员工',
      '手机号': '13800138000',
      '所在公司': company.name,
      '签到时间': new Date().toISOString(),
      '签退时间': '',
      '实际工作时间': 0,
      'IP地址': '',
      '浏览器信息': '',
      '提交时间': new Date().toISOString()
    }
  ];
  
  console.log(`📋 ${company.name} 数据表结构已定义:`);
  console.log('  - 姓名 (文本, 必填)');
  console.log('  - 手机号 (文本, 必填)');
  console.log('  - 所在公司 (文本, 必填)');
  console.log('  - 签到时间 (日期时间)');
  console.log('  - 签退时间 (日期时间)');
  console.log('  - 实际工作时间 (数字)');
  console.log('  - IP地址 (文本)');
  console.log('  - 浏览器信息 (文本)');
  console.log('  - 提交时间 (日期时间)');
  
  console.log(`💡 请通过以下方式创建数据表:`);
  console.log(`1. 下载Excel模板并填写上述字段`);
  console.log(`2. 通过系统导入功能创建表: ${company.tableName}`);
  console.log(`3. 或者联系管理员创建数据表`);
  
  return false; // 需要手动创建
}

/**
 * 更新表单映射
 */
async function updateFormMapping(formId, tableName) {
  try {
    // 获取当前表单信息
    const formResponse = await axios.get(`${API_BASE}/forms/${formId}`);
    const currentForm = formResponse.data.data;
    
    // 更新表映射
    const updateData = {
      ...currentForm,
      tableMapping: tableName
    };
    
    const response = await axios.put(`${API_BASE}/forms/${formId}`, updateData);
    console.log(`✅ 表单 ${formId} 已更新映射到表: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新表单 ${formId} 映射失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 主函数 - 检查并创建数据表
 */
async function checkAndCreateTables() {
  try {
    console.log('🔍 开始检查数据表状态...');
    console.log('目标服务器:', API_BASE);
    
    // 测试服务器连接
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.error('❌ 服务器连接失败，请检查服务器状态');
      return;
    }
    
    const tableStatus = {};
    
    // 检查每个企业的数据表
    for (const company of COMPANIES) {
      console.log(`\n📋 检查 ${company.name} 的数据表...`);
      
      const tableExists = await checkTableExists(company.tableName);
      tableStatus[company.tableName] = tableExists;
      
      if (!tableExists) {
        console.log(`🚨 ${company.name} 的数据表 ${company.tableName} 不存在，需要创建`);
        await createTableViaExcelImport(company);
      }
    }
    
    console.log('\n📊 数据表状态总结:');
    for (const company of COMPANIES) {
      const status = tableStatus[company.tableName] ? '✅ 已存在' : '❌ 不存在';
      console.log(`  - ${company.tableName}: ${status}`);
    }
    
    if (Object.values(tableStatus).some(status => !status)) {
      console.log('\n🚨 需要创建缺失的数据表才能正常使用系统');
      console.log('💡 解决方案:');
      console.log('1. 通过Excel导入创建缺失的数据表');
      console.log('2. 或者联系管理员创建数据表');
      console.log('3. 创建完成后重新运行此脚本更新表单映射');
    } else {
      console.log('\n🎉 所有数据表都已存在，系统可以正常使用');
      
      // 更新表单映射
      console.log('\n🔄 更新表单映射...');
      for (const company of COMPANIES) {
        await updateFormMapping(`${company.id}_qr_checkin`, company.tableName);
        await updateFormMapping(`${company.id}_qr_checkout`, company.tableName);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查数据表失败:', error.response?.data || error.message);
  }
}

// 执行检查
checkAndCreateTables();
