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
 * 使用API创建数据表
 */
async function createTableViaAPI(company) {
  console.log(`📊 正在为 ${company.name} 创建数据表...`);
  
  const tableData = {
    name: company.tableName,
    description: `${company.name}二维码签到记录表`,
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'name', type: 'VARCHAR(255)', allowNull: false },
      { name: 'phone', type: 'VARCHAR(20)', allowNull: false },
      { name: 'company', type: 'VARCHAR(100)', allowNull: false },
      { name: 'sign_in_time', type: 'DATETIME', allowNull: true },
      { name: 'sign_out_time', type: 'DATETIME', allowNull: true },
      { name: 'work_hours', type: 'DECIMAL(5,2)', allowNull: true },
      { name: 'ip_address', type: 'VARCHAR(45)', allowNull: true },
      { name: 'user_agent', type: 'TEXT', allowNull: true }
    ]
  };
  
  try {
    const response = await axios.post(`${API_BASE}/tables`, tableData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 数据表创建成功`);
      console.log(`   - 表名: ${company.tableName}`);
      console.log(`   - 哈希值: ${response.data.data.hashValue}`);
      console.log(`   - 字段数: ${response.data.data.columnCount}`);
      
      return {
        success: true,
        hashValue: response.data.data.hashValue
      };
    } else {
      console.log(`❌ ${company.name} 数据表创建失败:`, response.data.message);
      return {
        success: false,
        error: response.data.message
      };
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`✅ ${company.name} 数据表已存在`);
      return {
        success: true,
        hashValue: null // 表已存在，不需要哈希值
      };
    } else {
      console.log(`❌ ${company.name} 数据表创建错误:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

/**
 * 创建签到表单定义
 */
async function createCheckinForm(company, tableHash) {
  console.log(`📋 正在创建 ${company.name} 签到表单...`);
  
  const formData = {
    formId: company.checkinFormId,
    name: `${company.name} - 二维码签到`,
    description: `${company.name}专用二维码签到表单，自动记录签到时间`,
    tableMapping: tableHash || company.tableName,
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
  
  try {
    // 检查表单是否已存在
    const checkResponse = await axios.get(`${API_BASE}/forms/${company.checkinFormId}`);
    
    if (checkResponse.data.success) {
      console.log(`✅ ${company.name} 签到表单已存在，跳过创建`);
      return true;
    }
  } catch (error) {
    // 表单不存在，继续创建
  }
  
  try {
    const response = await axios.post(`${API_BASE}/forms`, formData);
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签到表单创建成功`);
      return true;
    } else {
      throw new Error('创建表单失败');
    }
  } catch (error) {
    console.error(`❌ 创建 ${company.name} 签到表单失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 创建签退表单定义
 */
async function createCheckoutForm(company, tableHash) {
  console.log(`📋 正在创建 ${company.name} 签退表单...`);
  
  const formData = {
    formId: company.checkoutFormId,
    name: `${company.name} - 二维码签退`,
    description: `${company.name}专用二维码签退表单，自动匹配签到记录并计算工作时间`,
    tableMapping: tableHash || company.tableName,
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
          required: true,
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
            title: '签退信息',
            fields: ['sign_out_time', 'sign_in_time', 'work_hours']
          }
        ]
      }
    }
  };
  
  try {
    // 检查表单是否已存在
    const checkResponse = await axios.get(`${API_BASE}/forms/${company.checkoutFormId}`);
    
    if (checkResponse.data.success) {
      console.log(`✅ ${company.name} 签退表单已存在，跳过创建`);
      return true;
    }
  } catch (error) {
    // 表单不存在，继续创建
  }
  
  try {
    const response = await axios.post(`${API_BASE}/forms`, formData);
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签退表单创建成功`);
      return true;
    } else {
      throw new Error('创建表单失败');
    }
  } catch (error) {
    console.error(`❌ 创建 ${company.name} 签退表单失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 创建简化的签到逻辑Hook
 */
async function createSimpleCheckinHook(formId, company) {
  const hookData = {
    formId: formId,
    name: '签到逻辑',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '自动设置签到时间和公司信息',
    config: {
      code: `
// 签到逻辑Hook
function execute(data, context) {
  // 自动设置签到时间
  data.sign_in_time = new Date().toISOString();
  console.log('自动设置签到时间:', data.sign_in_time);
  
  // 自动设置公司信息
  data.company = '${company.id}';
  console.log('自动设置公司:', data.company);
  
  return data;
}
      `.trim()
    }
  };

  try {
    await axios.post(`${API_BASE}/forms/${formId}/hooks`, hookData);
    console.log(`✅ ${formId} 签到逻辑Hook创建成功`);
  } catch (error) {
    console.log(`✅ ${formId} 签到逻辑Hook已存在`);
  }
}

/**
 * 创建简化的签退逻辑Hook
 */
async function createSimpleCheckoutHook(formId, company) {
  const hookData = {
    formId: formId,
    name: '签退逻辑',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '自动设置签退时间并计算工作时间',
    config: {
      code: `
// 签退逻辑Hook
function execute(data, context) {
  // 自动设置签退时间
  data.sign_out_time = new Date().toISOString();
  console.log('自动设置签退时间:', data.sign_out_time);
  
  // 自动设置公司信息
  data.company = '${company.id}';
  console.log('自动设置公司:', data.company);
  
  // 如果有签到时间，计算工作时间
  if (data.sign_in_time) {
    const signIn = new Date(data.sign_in_time);
    const signOut = new Date(data.sign_out_time);
    const workHours = (signOut - signIn) / (1000 * 60 * 60);
    
    if (workHours > 0) {
      data.work_hours = Math.round(workHours * 100) / 100;
      console.log('计算工作时间:', data.work_hours, '小时');
    }
  }
  
  return data;
}
      `.trim()
    }
  };

  try {
    await axios.post(`${API_BASE}/forms/${formId}/hooks`, hookData);
    console.log(`✅ ${formId} 签退逻辑Hook创建成功`);
  } catch (error) {
    console.log(`✅ ${formId} 签退逻辑Hook已存在`);
  }
}

/**
 * 主函数 - 使用API创建完整的二维码签到系统
 */
async function createQRCodeSystemWithAPI() {
  try {
    console.log('🚀 开始使用API创建完整的二维码签到系统...');
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
    
    // 为每个企业创建系统
    for (const company of COMPANIES) {
      console.log(`\n📋 处理 ${company.name}...`);
      
      // 1. 使用API创建数据表
      const tableResult = await createTableViaAPI(company);
      results[company.tableName] = tableResult;
      
      if (tableResult.success) {
        // 2. 创建签到表单
        await createCheckinForm(company, tableResult.hashValue);
        
        // 3. 创建签退表单
        await createCheckoutForm(company, tableResult.hashValue);
        
        // 4. 配置Hook
        await createSimpleCheckinHook(company.checkinFormId, company);
        await createSimpleCheckoutHook(company.checkoutFormId, company);
      }
    }
    
    console.log('\n📊 系统创建结果:');
    for (const company of COMPANIES) {
      const status = results[company.tableName]?.success ? '✅ 创建成功' : '❌ 创建失败';
      console.log(`  - ${company.tableName}: ${status}`);
    }
    
    const allSuccess = Object.values(results).every(result => result.success);
    
    if (allSuccess) {
      console.log('\n🎉 完整的二维码签到系统创建完成！');
      console.log('\n🔗 二维码访问地址:');
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
      console.log('\n🚨 部分系统创建失败，请检查配置');
    }
    
  } catch (error) {
    console.error('❌ 创建系统失败:', error.response?.data || error.message);
  }
}

// 执行创建
createQRCodeSystemWithAPI();
