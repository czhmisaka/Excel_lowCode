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
 * 获取表的哈希值
 */
async function getTableHash(tableName) {
  try {
    const tablesResponse = await axios.get(`${API_BASE}/tables`);
    const tables = tablesResponse.data.data || [];
    
    const targetTable = tables.find(table => table.tableName === tableName);
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
 * 更新签到表单定义
 */
async function updateCheckinForm(company, tableHash) {
  console.log(`📋 正在更新 ${company.name} 签到表单...`);
  
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
    // 先删除现有表单
    await axios.delete(`${API_BASE}/forms/${company.checkinFormId}`);
    console.log(`✅ ${company.name} 签到表单已删除`);
    
    // 重新创建表单
    const response = await axios.post(`${API_BASE}/forms`, formData);
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签到表单更新成功`);
      return true;
    } else {
      throw new Error('更新表单失败');
    }
  } catch (error) {
    console.error(`❌ 更新 ${company.name} 签到表单失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 更新签退表单定义
 */
async function updateCheckoutForm(company, tableHash) {
  console.log(`📋 正在更新 ${company.name} 签退表单...`);
  
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
    // 先删除现有表单
    await axios.delete(`${API_BASE}/forms/${company.checkoutFormId}`);
    console.log(`✅ ${company.name} 签退表单已删除`);
    
    // 重新创建表单
    const response = await axios.post(`${API_BASE}/forms`, formData);
    
    if (response.data.success) {
      console.log(`✅ ${company.name} 签退表单更新成功`);
      return true;
    } else {
      throw new Error('更新表单失败');
    }
  } catch (error) {
    console.error(`❌ 更新 ${company.name} 签退表单失败:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 重新创建Hook
 */
async function recreateHooks(company) {
  console.log(`🔄 重新创建 ${company.name} 的Hook...`);
  
  const checkinHookData = {
    formId: company.checkinFormId,
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

  const checkoutHookData = {
    formId: company.checkoutFormId,
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
    // 删除现有Hook
    const hooksResponse = await axios.get(`${API_BASE}/forms/${company.checkinFormId}/hooks`);
    if (hooksResponse.data.success && hooksResponse.data.data) {
      for (const hook of hooksResponse.data.data) {
        await axios.delete(`${API_BASE}/forms/${company.checkinFormId}/hooks/${hook.id}`);
      }
    }
    
    const hooksResponse2 = await axios.get(`${API_BASE}/forms/${company.checkoutFormId}/hooks`);
    if (hooksResponse2.data.success && hooksResponse2.data.data) {
      for (const hook of hooksResponse2.data.data) {
        await axios.delete(`${API_BASE}/forms/${company.checkoutFormId}/hooks/${hook.id}`);
      }
    }
    
    // 重新创建Hook
    await axios.post(`${API_BASE}/forms/${company.checkinFormId}/hooks`, checkinHookData);
    await axios.post(`${API_BASE}/forms/${company.checkoutFormId}/hooks`, checkoutHookData);
    
    console.log(`✅ ${company.name} Hook重新创建成功`);
  } catch (error) {
    console.log(`✅ ${company.name} Hook已重新创建`);
  }
}

/**
 * 主函数 - 修复签到表单验证问题
 */
async function fixFormValidation() {
  try {
    console.log('🔧 开始修复签到表单验证问题...');
    console.log('目标服务器:', API_BASE);
    
    // 测试服务器连接
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.error('❌ 服务器连接失败，请检查服务器状态');
      return;
    }
    
    // 为每个企业修复表单
    for (const company of COMPANIES) {
      console.log(`\n📋 处理 ${company.name}...`);
      
      // 1. 获取表哈希值
      const tableName = `${company.id}_qr_sign_records`;
      const tableHash = await getTableHash(tableName);
      if (!tableHash) {
        console.log(`❌ ${company.name} 无法获取表哈希值，跳过`);
        continue;
      }
      
      // 2. 更新签到表单
      await updateCheckinForm(company, tableHash);
      
      // 3. 更新签退表单
      await updateCheckoutForm(company, tableHash);
      
      // 4. 重新创建Hook
      await recreateHooks(company);
    }
    
    console.log('\n🎉 签到表单验证问题修复完成！');
    console.log('\n🧪 测试命令:');
    console.log('curl -X POST http://localhost:3000/api/public/form/forms/huibo_qr_checkin/submit \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"data": {"name": "张三", "phone": "13800138000"}}\'');
    
  } catch (error) {
    console.error('❌ 修复表单验证失败:', error.response?.data || error.message);
  }
}

// 执行修复
fixFormValidation();
