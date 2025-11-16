const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function createLaborSignInForm() {
  try {
    console.log('正在初始化劳务签到系统...');

    // 检查表单是否已存在
    const checkResponse = await axios.get(`${API_BASE}/forms/labor_sign_in`);
    if (checkResponse.data.success) {
      console.log('✅ 签到表单已存在，跳过创建');
    } else {
      console.log('正在创建签到表单...');
      
      // 创建签到表单定义
      const formData = {
        formId: 'labor_sign_in',
        name: '劳务签到系统',
        description: '劳务人员签到签退系统，支持姓名、手机号、公司选择和自动时间记录',
        tableMapping: 'labor_sign_records',
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
              placeholder: '请选择签到时间',
              defaultValue: '{{current_time}}'
            },
            {
              name: 'sign_out_time',
              label: '签退时间',
              type: 'datetime',
              required: false,
              placeholder: '请选择签退时间'
            },
            {
              name: 'actual_work_hours',
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
                fields: ['sign_in_time', 'sign_out_time', 'actual_work_hours']
              }
            ]
          }
        }
      };

      // 使用API创建表单
      const response = await axios.post(`${API_BASE}/forms`, formData);
      console.log('✅ 签到表单创建成功:', response.data);
    }

    // 创建签到Hook - 自动填充签到时间
    const signInHook = {
      formId: 'labor_sign_in',
      name: '自动签到时间',
      type: 'javascript',
      triggerType: 'beforeSubmit',
      enabled: true,
      description: '自动填充当前时间作为签到时间',
      config: {
        code: `
// 自动填充签到时间
if (!formData.sign_in_time) {
  formData.sign_in_time = new Date().toISOString();
}
console.log('自动设置签到时间:', formData.sign_in_time);
        `
      }
    };

    // 创建签退Hook - 计算工作时间
    const signOutHook = {
      formId: 'labor_sign_in',
      name: '计算工作时间',
      type: 'javascript',
      triggerType: 'beforeSubmit',
      enabled: true,
      description: '根据签到和签退时间计算实际工作时间',
      config: {
        code: `
// 计算实际工作时间
if (formData.sign_in_time && formData.sign_out_time) {
  const signIn = new Date(formData.sign_in_time);
  const signOut = new Date(formData.sign_out_time);
  const workHours = (signOut - signIn) / (1000 * 60 * 60); // 转换为小时
  
  if (workHours > 0) {
    formData.actual_work_hours = Math.round(workHours * 100) / 100; // 保留2位小数
    console.log('计算工作时间:', formData.actual_work_hours, '小时');
  }
}
        `
      }
    };

    // 创建数据验证Hook - 防止重复签到
    const validationHook = {
      formId: 'labor_sign_in',
      name: '重复签到验证',
      type: 'javascript',
      triggerType: 'beforeSubmit',
      enabled: true,
      description: '验证同一天内不能重复签到',
      config: {
        code: `
// 重复签到验证逻辑
const today = new Date().toISOString().split('T')[0];
const signInDate = formData.sign_in_time ? formData.sign_in_time.split('T')[0] : null;

// 这里可以添加数据库查询逻辑来检查重复签到
// 暂时只做简单的日期验证
if (signInDate && signInDate === today) {
  console.log('签到日期验证通过');
} else {
  console.log('签到日期验证失败');
}
        `
      }
    };

    // 创建Hook
    await axios.post(`${API_BASE}/forms/labor_sign_in/hooks`, signInHook);
    console.log('✅ 签到时间Hook创建成功');

    await axios.post(`${API_BASE}/forms/labor_sign_in/hooks`, signOutHook);
    console.log('✅ 工作时间Hook创建成功');

    await axios.post(`${API_BASE}/forms/labor_sign_in/hooks`, validationHook);
    console.log('✅ 验证Hook创建成功');

    console.log('🎉 劳务签到系统创建完成！');
    console.log('表单ID: labor_sign_in');
    console.log('可以通过以下URL访问公开表单:');
    console.log('http://localhost:3000/api/public/form/labor_sign_in');

  } catch (error) {
    console.error('❌ 创建签到表单失败:', error.response?.data || error.message);
  }
}

// 如果后端服务器未运行，先等待一下
setTimeout(() => {
  createLaborSignInForm();
}, 2000);
