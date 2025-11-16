/*
 * @Date: 2025-11-11 14:08:55
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 14:09:30
 * @FilePath: /lowCode_excel/backend/scripts/diagnoseFormIssue.js
 */
const { TableMapping, FormDefinition, FormHook } = require('../models');

async function diagnoseFormIssue() {
  try {
    console.log('🔍 开始诊断表单问题...\n');

    // 1. 检查表单定义
    console.log('=== 1. 检查表单定义 ===');
    const form = await FormDefinition.findOne({
      where: { formId: 'labor_sign_in' }
    });
    
    if (!form) {
      console.log('❌ 表单 labor_sign_in 不存在');
      return;
    }
    
    console.log('✅ 表单定义存在:');
    console.log('- formId:', form.formId);
    console.log('- name:', form.name);
    console.log('- tableMapping:', form.tableMapping);
    console.log('- definition:', form.definition ? '已定义' : '未定义');
    
    // 2. 检查Hook配置
    console.log('\n=== 2. 检查Hook配置 ===');
    const hooks = await FormHook.findAll({
      where: { formId: 'labor_sign_in' }
    });
    
    if (hooks.length === 0) {
      console.log('❌ 表单没有配置任何Hook');
    } else {
      console.log(`✅ 找到 ${hooks.length} 个Hook:`);
      hooks.forEach((hook, index) => {
        console.log(`  ${index + 1}. ${hook.name} (${hook.type}, ${hook.triggerType})`);
        console.log(`     配置:`, hook.config);
      });
    }
    
    // 3. 检查表映射
    console.log('\n=== 3. 检查表映射 ===');
    const mapping = await TableMapping.findOne({
      where: { tableName: 'labor_sign_records' }
    });
    
    if (!mapping) {
      console.log('❌ 表映射 labor_sign_records 不存在');
      console.log('\n=== 所有可用的表映射 ===');
      const allMappings = await TableMapping.findAll();
      if (allMappings.length === 0) {
        console.log('  没有找到任何表映射');
      } else {
        allMappings.forEach(m => {
          console.log(`  - ${m.tableName} (哈希: ${m.hashValue})`);
        });
      }
    } else {
      console.log('✅ 表映射存在:');
      console.log('- tableName:', mapping.tableName);
      console.log('- hashValue:', mapping.hashValue);
      console.log('- columnDefinitions:', mapping.columnDefinitions ? '已定义' : '未定义');
    }
    
    // 4. 检查表单定义中的tableMapping是否匹配
    console.log('\n=== 4. 检查表单与表映射的匹配 ===');
    if (form.tableMapping) {
      if (form.tableMapping === 'labor_sign_records') {
        console.log('⚠️  表单的tableMapping是表名而不是哈希值');
        console.log('   需要将 tableMapping 从 "labor_sign_records" 改为实际的哈希值');
      } else {
        const matchingMapping = await TableMapping.findOne({
          where: { hashValue: form.tableMapping }
        });
        if (matchingMapping) {
          console.log('✅ 表单的tableMapping匹配到表映射:', matchingMapping.tableName);
        } else {
          console.log('❌ 表单的tableMapping没有匹配到任何表映射');
        }
      }
    } else {
      console.log('⚠️  表单没有配置tableMapping');
    }
    
    console.log('\n🎯 诊断完成！');
    
  } catch (error) {
    console.error('诊断失败:', error);
  }
}

diagnoseFormIssue();
