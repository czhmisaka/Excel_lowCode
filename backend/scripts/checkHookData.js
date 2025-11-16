/*
 * @Date: 2025-11-16 04:31:23
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-16 04:31:38
 * @FilePath: /lowCode_excel/backend/scripts/checkHookData.js
 */
const { FormHook } = require('../models');

async function checkHookData() {
  try {
    console.log('=== 检查Hook数据 ===');

    // 获取所有Hook
    const hooks = await FormHook.findAll();
    console.log(`找到 ${hooks.length} 个Hook`);

    for (const hook of hooks) {
      console.log(`\nHook ID: ${hook.id}`);
      console.log(`表单ID: ${hook.formId}`);
      console.log(`类型: ${hook.type}`);
      console.log(`触发时机: ${hook.triggerType}`);
      console.log(`启用状态: ${hook.enabled}`);
      console.log('配置内容:', JSON.stringify(hook.config, null, 2));
      
      // 检查JavaScript Hook的代码
      if (hook.type === 'javascript') {
        const code = hook.config.code || '';
        console.log('JavaScript代码:');
        console.log(code);
        
        // 检查是否包含 formData 变量
        if (!code.includes('formData')) {
          console.log('❌ 警告: JavaScript代码中未找到 formData 变量');
        } else {
          console.log('✅ JavaScript代码中包含 formData 变量');
        }
      }
    }

    console.log('\n=== Hook数据检查完成 ===');
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

// 执行检查
checkHookData();
