/*
 * @Date: 2025-11-16 04:32:44
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-16 12:28:45
 * @FilePath: /lowCode_excel/backend/scripts/testSimpleForm.js
 */
const { FormDefinition } = require('../models');
const hookEngine = require('../utils/hookEngine');

async function testSimpleForm() {
  try {
    console.log('=== 简单表单测试 ===');

    // 1. 测试获取表单定义
    console.log('\n1. 测试获取表单定义...');
    const form = await FormDefinition.findOne({ where: { formId: 'labor_sign_in' } });
    if (form) {
      console.log('✅ 获取表单定义成功');
      console.log(`   表单名称: ${form.name}`);
      console.log(`   表单描述: ${form.description}`);
      
      // 解析表单定义
      let definition;
      if (typeof form.definition === 'string') {
        try {
          definition = JSON.parse(form.definition);
        } catch (e) {
          console.log('❌ 表单定义解析失败:', e.message);
          return;
        }
      } else {
        definition = form.definition;
      }
      
      console.log(`   字段数量: ${definition.fields ? definition.fields.length : 0}`);
    } else {
      console.log('❌ 获取表单定义失败');
      return;
    }

    // 2. 测试Hook执行
    console.log('\n2. 测试Hook执行...');
    const testData = {
      name: '测试用户',
      phone: '13800138000',
      company: 'huibo',
      sign_in_time: new Date().toISOString()
    };

    try {
      const processedData = await hookEngine.executeHooks('labor_sign_in', testData, 'beforeSubmit');
      console.log('✅ Hook执行成功');
      console.log('   原始数据:', testData);
      console.log('   处理后数据:', processedData);
    } catch (error) {
      console.log('❌ Hook执行失败:', error.message);
    }

    // 3. 测试公开表单API
    console.log('\n3. 测试公开表单API...');
    try {
      const response = await fetch('http://localhost:3000/api/public/form/forms/labor_sign_in');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ 公开表单API正常');
          console.log(`   表单名称: ${result.data.name}`);
        } else {
          console.log('❌ 公开表单API返回错误:', result.message);
        }
      } else {
        console.log('❌ 公开表单API失败:', response.status);
      }
    } catch (error) {
      console.log('❌ 公开表单API错误:', error.message);
    }

    console.log('\n=== 简单表单测试完成 ===');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
testSimpleForm();
