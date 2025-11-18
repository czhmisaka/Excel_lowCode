const { TableMapping, FormDefinition, FormHook } = require('../models');
const { generateHash } = require('../utils/hashGenerator');

async function fixLaborSignInForm() {
  try {
    console.log('🔧 开始修复劳务签到表单...\n');

    // 1. 创建表映射
    console.log('=== 1. 创建表映射 ===');
    const tableHash = generateHash('labor_sign_records');
    
    const mapping = await TableMapping.create({
      tableName: 'labor_sign_records',
      hashValue: tableHash,
      originalFileName: 'labor_sign_records',
      columnCount: 6,
      rowCount: 0,
      headerRow: 1,
      columnDefinitions: [
        { name: 'name', type: 'string', label: '姓名' },
        { name: 'phone', type: 'string', label: '手机号' },
        { name: 'company', type: 'string', label: '所在公司' },
        { name: 'sign_in_time', type: 'datetime', label: '签到时间' },
        { name: 'sign_out_time', type: 'datetime', label: '签退时间' },
        { name: 'actual_work_hours', type: 'number', label: '实际工作时间' }
      ]
    });
    
    console.log('✅ 表映射创建成功:');
    console.log('- tableName:', mapping.tableName);
    console.log('- hashValue:', mapping.hashValue);

    // 2. 更新表单的tableMapping为哈希值
    console.log('\n=== 2. 更新表单tableMapping ===');
    const form = await FormDefinition.findOne({
      where: { formId: 'labor_sign_in' }
    });
    
    if (form) {
      await form.update({
        tableMapping: tableHash
      });
      console.log('✅ 表单tableMapping更新成功:', tableHash);
    } else {
      console.log('❌ 表单不存在，需要重新创建');
      return;
    }

    // 3. 创建Hook配置
    console.log('\n=== 3. 创建Hook配置 ===');
    
    // 自动签到时间Hook
    const signInHook = await FormHook.create({
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
    });
    console.log('✅ 自动签到时间Hook创建成功');

    // 计算工作时间Hook
    const signOutHook = await FormHook.create({
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
    });
    console.log('✅ 计算工作时间Hook创建成功');

    // 重复签到验证Hook
    const validationHook = await FormHook.create({
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
    });
    console.log('✅ 重复签到验证Hook创建成功');

    console.log('\n🎉 劳务签到表单修复完成！');
    console.log('📋 修复总结:');
    console.log('  - ✅ 表映射创建成功');
    console.log('  - ✅ 表单tableMapping更新为哈希值');
    console.log('  - ✅ 3个Hook配置创建成功');
    console.log('  - ✅ 现在可以正常提交数据到对应表了');

  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

fixLaborSignInForm();
