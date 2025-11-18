const { FormDefinition, FormHook } = require('../models');
const { testConnection } = require('../config/database');

/**
 * 直接创建劳务签到表单定义和Hook配置
 */
async function createLaborSignInFormDirect() {
  try {
    await testConnection();
    
    console.log('正在创建劳务签到表单...');

    // 创建表单定义
    const formDefinition = {
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
              pattern: '^[\\u4e00-\\u9fa5]{2,10}$',
              message: '姓名必须是2-10个中文字符'
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

    // 检查是否已存在
    const existingForm = await FormDefinition.findOne({
      where: { formId: 'labor_sign_in' }
    });

    if (existingForm) {
      console.log('✅ 签到表单已存在，跳过创建');
    } else {
      // 创建表单
      const form = await FormDefinition.create(formDefinition);
      console.log('✅ 签到表单创建成功:', form.formId);
    }

    // 创建Hook配置
    const hooks = [
      {
        formId: 'labor_sign_in',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '自动签到时间Hook',
          code: `
// 自动签到时间Hook
// 在提交前自动设置签到时间
function execute(data) {
  // 如果没有提供签到时间，自动设置为当前时间
  if (!data.sign_time) {
    data.sign_time = new Date().toISOString();
    console.log('自动设置签到时间:', data.sign_time);
  }
  
  // 如果没有提供日期，自动设置为今天
  if (!data.sign_date) {
    const today = new Date();
    data.sign_date = today.toISOString().split('T')[0];
    console.log('自动设置签到日期:', data.sign_date);
  }
  
  return data;
}
          `.trim(),
          description: '自动设置签到时间和日期'
        },
        enabled: true
      },
      {
        formId: 'labor_sign_in',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '计算工作时间Hook',
          code: `
// 计算工作时间Hook
// 根据签到和签退时间计算工作时长
function execute(data) {
  // 如果有签到时间和签退时间，计算工作时长
  if (data.sign_time && data.sign_out_time) {
    const signTime = new Date(data.sign_time);
    const signOutTime = new Date(data.sign_out_time);
    const workHours = (signOutTime - signTime) / (1000 * 60 * 60); // 转换为小时
    
    data.work_hours = Math.round(workHours * 100) / 100; // 保留两位小数
    console.log('计算工作时间:', data.work_hours, '小时');
  }
  
  return data;
}
          `.trim(),
          description: '根据签到和签退时间计算工作时长'
        },
        enabled: true
      }
    ];

    // 创建Hook
    for (const hookConfig of hooks) {
      const existingHook = await FormHook.findOne({
        where: {
          formId: hookConfig.formId,
          triggerType: hookConfig.triggerType,
          type: hookConfig.type
        }
      });

      if (existingHook) {
        console.log(`✅ Hook已存在: ${hookConfig.triggerType} - ${hookConfig.type}`);
      } else {
        const hook = await FormHook.create(hookConfig);
        console.log(`✅ Hook创建成功: ${hook.triggerType} - ${hook.type}`);
      }
    }

    console.log('🎉 劳务签到表单系统初始化完成！');
    
  } catch (error) {
    console.error('❌ 创建劳务签到表单失败:', error);
  }
}

// 执行创建
createLaborSignInFormDirect();
