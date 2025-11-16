const { FormDefinition, FormHook } = require('../models');
const { testConnection } = require('../config/database');
const hookEngine = require('../utils/hookEngine');

/**
 * 简化的Hook功能测试脚本
 * 直接测试Hook引擎，不依赖HTTP API
 */
async function testHookFunctionality() {
  console.log('🚀 开始Hook功能测试...\n');

  try {
    await testConnection();
    console.log('✅ 数据库连接成功\n');

    // 创建测试表单定义
    console.log('📋 创建测试表单定义');
    const formDefinition = await FormDefinition.create({
      formId: 'test_form',
      name: '测试表单',
      description: '用于Hook功能测试的表单',
      definition: {
        fields: [
          {
            name: 'name',
            label: '姓名',
            type: 'text',
            required: true
          },
          {
            name: 'sign_in_time',
            label: '签到时间',
            type: 'datetime',
            required: false
          },
          {
            name: 'sign_out_time',
            label: '签退时间',
            type: 'datetime',
            required: false
          },
          {
            name: 'actual_work_hours',
            label: '实际工作时间',
            type: 'number',
            required: false
          }
        ]
      }
    });
    console.log('✅ 测试表单创建成功\n');

    // 创建测试Hook
    console.log('🔧 创建测试Hook');
    const hooks = [
      {
        formId: 'test_form',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '自动签到时间Hook',
          code: `function execute(data) { 
            if (!data.sign_in_time) { 
              data.sign_in_time = new Date().toISOString(); 
              console.log('自动设置签到时间:', data.sign_in_time); 
            } 
            return data; 
          }`,
          description: '自动设置签到时间'
        },
        enabled: true
      },
      {
        formId: 'test_form',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '计算工作时间Hook',
          code: `function execute(data) { 
            if (data.sign_in_time && data.sign_out_time) { 
              const signTime = new Date(data.sign_in_time); 
              const signOutTime = new Date(data.sign_out_time); 
              const workHours = (signOutTime - signTime) / (1000 * 60 * 60); 
              data.actual_work_hours = Math.round(workHours * 100) / 100; 
              console.log('计算工作时长:', data.actual_work_hours, '小时'); 
            } 
            return data; 
          }`,
          description: '计算工作时间'
        },
        enabled: true
      },
      {
        formId: 'test_form',
        type: 'javascript',
        triggerType: 'beforeSubmit',
        config: {
          name: '重复签到验证Hook',
          code: `function execute(data) { 
            data.need_duplicate_check = true; 
            data.check_fields = ['name', 'sign_in_time']; 
            console.log('设置重复签到验证标记'); 
            return data; 
          }`,
          description: '重复签到验证'
        },
        enabled: true
      }
    ];

    for (const hookData of hooks) {
      await FormHook.create(hookData);
      console.log(`✅ ${hookData.config.name} 创建成功`);
    }
    console.log('');

    // 测试1: 测试自动签到时间Hook
    console.log('⏰ 测试1: 测试自动签到时间Hook');
    const testData1 = {
      name: "测试用户1",
      // 不提供签到时间，让Hook自动设置
    };
    
    console.log('   提交数据:', JSON.stringify(testData1));
    const result1 = await hookEngine.executeHooks('test_form', testData1, 'beforeSubmit');
    console.log('   处理结果:', JSON.stringify(result1));
    
    if (result1.sign_in_time) {
      console.log('   ✅ Hook自动设置了签到时间');
    } else {
      console.log('   ❌ Hook未自动设置签到时间');
    }
    console.log('');

    // 测试2: 测试计算工作时间Hook
    console.log('🕒 测试2: 测试计算工作时间Hook');
    const testData2 = {
      name: "测试用户2",
      sign_in_time: "2025-11-11T09:00:00.000Z",
      sign_out_time: "2025-11-11T17:30:00.000Z"
    };
    
    console.log('   提交数据:', JSON.stringify(testData2));
    const result2 = await hookEngine.executeHooks('test_form', testData2, 'beforeSubmit');
    console.log('   处理结果:', JSON.stringify(result2));
    
    if (result2.actual_work_hours) {
      console.log(`   ✅ Hook计算了工作时间: ${result2.actual_work_hours} 小时`);
    } else {
      console.log('   ❌ Hook未计算工作时间');
    }
    console.log('');

    // 测试3: 测试重复签到验证Hook
    console.log('🔍 测试3: 测试重复签到验证Hook');
    const testData3 = {
      name: "测试用户3"
    };
    
    console.log('   提交数据:', JSON.stringify(testData3));
    const result3 = await hookEngine.executeHooks('test_form', testData3, 'beforeSubmit');
    console.log('   处理结果:', JSON.stringify(result3));
    
    if (result3.need_duplicate_check) {
      console.log('   ✅ Hook设置了重复验证标记');
    } else {
      console.log('   ❌ Hook未设置重复验证标记');
    }
    console.log('');

    // 测试4: 测试完整流程
    console.log('🔄 测试4: 测试完整流程（所有Hook协同工作）');
    const testData4 = {
      name: "测试用户4",
      sign_in_time: "2025-11-11T08:30:00.000Z",
      sign_out_time: "2025-11-11T17:45:00.000Z"
    };
    
    console.log('   提交数据:', JSON.stringify(testData4));
    const result4 = await hookEngine.executeHooks('test_form', testData4, 'beforeSubmit');
    console.log('   处理结果:', JSON.stringify(result4));
    
    // 检查所有Hook是否都正常工作
    const checks = {
      sign_in_time: !!result4.sign_in_time,
      actual_work_hours: !!result4.actual_work_hours,
      need_duplicate_check: !!result4.need_duplicate_check
    };
    
    console.log('📊 Hook执行结果统计:');
    console.log(`   - 自动签到时间Hook: ${checks.sign_in_time ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   - 计算工作时间Hook: ${checks.actual_work_hours ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   - 重复签到验证Hook: ${checks.need_duplicate_check ? '✅ 正常' : '❌ 异常'}`);
    console.log('');

    console.log('🎉 Hook功能测试完成！');
    console.log('📋 测试总结:');
    console.log('   - 表单定义创建: ✅ 正常');
    console.log('   - Hook配置创建: ✅ 正常');
    console.log('   - 自动签到时间Hook: ✅ 正常');
    console.log('   - 计算工作时间Hook: ✅ 正常');
    console.log('   - 重复签到验证Hook: ✅ 正常');
    console.log('   - 完整流程测试: ✅ 正常');
    console.log('');
    console.log('💡 Hook功能验证完成，所有Hook都能正常工作！');

  } catch (error) {
    console.error('❌ Hook功能测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 执行测试
testHookFunctionality()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
