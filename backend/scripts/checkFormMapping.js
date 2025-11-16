const { TableMapping, FormDefinition } = require('../models');

async function checkFormAndMapping() {
  try {
    console.log('=== 检查表单定义 ===');
    const form = await FormDefinition.findOne({
      where: { formId: 'labor_sign_in' }
    });
    
    if (form) {
      console.log('表单定义:');
      console.log('- formId:', form.formId);
      console.log('- name:', form.name);
      console.log('- tableMapping:', form.tableMapping);
      console.log('- definition:', form.definition ? '已定义' : '未定义');
    } else {
      console.log('❌ 表单 labor_sign_in 不存在');
      return;
    }
    
    console.log('\n=== 检查表映射 ===');
    const mapping = await TableMapping.findOne({
      where: { tableName: 'labor_sign_records' }
    });
    
    if (mapping) {
      console.log('表映射:');
      console.log('- tableName:', mapping.tableName);
      console.log('- hashValue:', mapping.hashValue);
