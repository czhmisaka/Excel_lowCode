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
 * 创建数据表
 */
async function createDataTable(tableName) {
  try {
    console.log(`📊 正在创建数据表: ${tableName}`);
    
    // 检查表是否已存在
    const tablesResponse = await axios.get(`${API_BASE}/tables`);
    const existingTables = tablesResponse.data.data || [];
    
    const tableExists = existingTables.some(table => table.name === tableName);
    if (tableExists) {
      console.log(`✅ 数据表 ${tableName} 已存在`);
      return true;
    }
    
    // 创建新表
    const tableData = {
      name: tableName,
      description: `${tableName} - 二维码签到记录表`,
      columns: [
        { name: 'name', type: 'string', nullable: false },
        { name: 'phone', type: 'string', nullable: false },
        { name: 'company', type: 'string', nullable: false },
        { name: 'sign_in_time', type: 'datetime', nullable: true },
        { name: 'sign_out_time', type: 'datetime', nullable: true },
        { name: 'work_hours', type: 'number', nullable: true },
        { name: 'ip_address', type: 'string', nullable: true },
        { name: 'user_agent', type: 'string', nullable: true },
        { name: 'submit_time', type: 'datetime', nullable: true }
      ]
    };
    
    const response = await axios.post(`${API_BASE}/tables`, tableData);
    console.log(`✅ 数据表 ${tableName} 创建成功`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ 创建数据表 ${tableName} 失败:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * 获取表的哈希值
 */
async function getTableHash(tableName) {
  try {
    const tablesResponse = await axios.get(`${API_BASE}/tables`);
    const tables = tablesResponse.data.data || [];
    
    const targetTable = tables.find(table => table.name === tableName);
    if (targetTable && targetTable.hashValue) {
      return targetTable.hashValue;
    }
    
    console.error(`❌ 无法获取表 ${tableName} 的哈希值`);
    return null;
  } catch (error) {
    console.error(`❌ 获取表哈希值失败:`, error.response?.data || error.message);
    return null;
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
    tableMapping: tableHash,
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
    tableMapping: tableHash,
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
 * 主函数 - 创建完整的二维码签到系统
 */
async function createCompleteQRCodeSystem() {
  try {
    console.log('🚀 开始创建完整的二维码签到系统...');
    console.log('目标服务器:', API_BASE);
    
    // 测试服务器连接
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.error('❌ 服务器连接失败，请检查服务器状态');
      return;
    }
    
    // 为每个企业创建系统
    for (const company of COMPANIES) {
      console.log(`\n📋 处理 ${company.name}...`);
      
      // 1. 创建数据表
      const tableName = `${company.id}_qr_sign_records`;
      const tableCreated = await createDataTable(tableName);
      
      if (!tableCreated) {
        console.log(`❌ ${company.name} 数据表创建失败，跳过`);
        continue;
      }
      
      // 2. 获取表哈希值
      const tableHash = await getTableHash(tableName);
      if (!tableHash) {
        console.log(`❌ ${company.name} 无法获取表哈希值，跳过`);
        continue;
      }
      
      // 3. 创建签到表单
      await createCheckinForm(company, tableHash);
      
      // 4. 创建签退表单
      await createCheckoutForm(company, tableHash);
      
      // 5. 配置Hook
      await createSimpleCheckinHook(company.checkinFormId, company);
      await createSimpleCheckoutHook(company.checkoutFormId, company);
    }
    
    console.log('\n🎉 完整的二维码签到系统创建完成！');
    console.log('\n📊 系统概览:');
    
    for (const company of COMPANIES) {
      console.log(`\n${company.name}:`);
      console.log(`  - 签到表单: ${company.checkinFormId}`);
      console.log(`  - 签退表单: ${company.checkoutFormId}`);
      console.log(`  - 数据表: ${company.id}_qr_sign_records`);
    }
    
    console.log('\n🔗 二维码访问地址:');
    for (const company of COMPANIES) {
      console.log(`\n${company.name}:`);
      console.log(`  - 签到二维码: http://localhost:3000/api/public/form/forms/${company.checkinFormId}`);
      console.log(`  - 签退二维码: http://localhost:3000/api/public/form/forms/${company.checkoutFormId}`);
    }
    
    console.log('\n🧪 测试命令:');
    console.log('curl -X POST http://localhost:3000/api/public/form/forms/huibo_qr_checkin/submit \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"data": {"name": "张三", "phone": "13800138000"}}\'');
    
  } catch (error) {
    console.error('❌ 创建系统失败:', error.response?.data || error.message);
  }
}

// 执行创建
createCompleteQRCodeSystem();
