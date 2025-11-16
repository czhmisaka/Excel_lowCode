const { FormDefinition } = require('../models');

/**
 * 增强版表单定义序列化问题修复
 * 处理各种可能的序列化格式问题
 */
async function fixFormDefinitionSerializationEnhanced() {
  try {
    console.log('开始增强版表单定义序列化问题修复...');
    
    // 获取所有表单定义
    const formDefinitions = await FormDefinition.findAll();
    console.log(`找到 ${formDefinitions.length} 个表单定义`);
    
    let fixedCount = 0;
    
    for (const formDef of formDefinitions) {
      const definition = formDef.definition;
      console.log(`\n处理表单: ${formDef.formId}`);
      console.log('定义类型:', typeof definition);
      
      // 情况1: 已经是字符串格式（可能是正确的JSON字符串）
      if (typeof definition === 'string') {
        try {
          // 尝试解析验证是否是有效的JSON
          const parsed = JSON.parse(definition);
          console.log(`✅ 表单 ${formDef.formId} 已经是有效的JSON字符串`);
          continue;
        } catch (parseError) {
          console.log(`❌ 表单 ${formDef.formId} 的字符串格式无效:`, parseError.message);
          // 继续处理其他情况
        }
      }
      
      // 情况2: 对象格式但包含数字键（错误的序列化）
      if (typeof definition === 'object' && definition !== null) {
        const keys = Object.keys(definition);
        const hasNumericKeys = keys.some(key => !isNaN(parseInt(key)));
        
        if (hasNumericKeys) {
          console.log(`发现错误的序列化格式: ${formDef.formId}`);
          console.log('键示例:', keys.slice(0, 10));
          
          // 尝试重建JSON字符串
          try {
            // 将对象值连接成字符串
            const jsonString = Object.values(definition).join('');
            console.log('重建的JSON字符串长度:', jsonString.length);
            
            // 验证是否是有效的JSON
            const parsedJson = JSON.parse(jsonString);
            
            // 更新表单定义
            await FormDefinition.update(
              { definition: parsedJson },
              { where: { id: formDef.id } }
            );
            
            console.log(`✅ 成功修复表单: ${formDef.formId}`);
            fixedCount++;
            continue;
          } catch (parseError) {
            console.error(`❌ 无法解析重建的JSON: ${formDef.formId}`, parseError.message);
          }
        } else {
          // 情况3: 已经是正常的对象格式
          console.log(`✅ 表单 ${formDef.formId} 已经是正常的对象格式`);
          continue;
        }
      }
      
      // 情况4: 使用默认定义修复
      console.log(`尝试使用默认定义修复表单: ${formDef.formId}`);
      const defaultDefinition = getDefaultFormDefinition(formDef.formId);
      if (defaultDefinition) {
        await FormDefinition.update(
          { definition: defaultDefinition },
          { where: { id: formDef.id } }
        );
        console.log(`✅ 使用默认定义修复表单: ${formDef.formId}`);
        fixedCount++;
      } else {
        console.log(`❌ 无法修复表单: ${formDef.formId}，没有对应的默认定义`);
      }
    }
    
    console.log(`\n修复完成！共修复了 ${fixedCount} 个表单定义`);
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const allForms = await FormDefinition.findAll();
    for (const form of allForms) {
      console.log(`\n表单 ${form.formId}:`);
      console.log('定义类型:', typeof form.definition);
      if (typeof form.definition === 'string') {
        try {
          const parsed = JSON.parse(form.definition);
          console.log('✅ 有效的JSON字符串');
          console.log('字段数量:', parsed.fields ? parsed.fields.length : 'N/A');
        } catch (e) {
          console.log('❌ 无效的JSON字符串');
        }
      } else if (typeof form.definition === 'object') {
        console.log('✅ 对象格式');
        console.log('字段数量:', form.definition.fields ? form.definition.fields.length : 'N/A');
      }
    }
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  }
}

/**
 * 获取默认的表单定义
 */
function getDefaultFormDefinition(formId) {
  const defaultDefinitions = {
    'labor_sign_in': {
      fields: [
        {
          name: "name",
          label: "姓名",
          type: "text",
          required: true,
          placeholder: "请输入姓名",
          validation: {
            pattern: "^.{2,10}$",
            message: "姓名长度应为2-10个字符"
          }
        },
        {
          name: "phone",
          label: "手机号",
          type: "text",
          required: true,
          placeholder: "请输入手机号",
          validation: {
            pattern: "^1[3-9]\\d{9}$",
            message: "请输入正确的手机号格式"
          }
        },
        {
          name: "company",
          label: "公司",
          type: "select",
          required: true,
          options: [
            { label: "汇博", value: "huibo" },
            { label: "恒信", value: "hengxin" },
            { label: "临时工", value: "temporary" }
          ],
          placeholder: "请选择公司"
        },
        {
          name: "sign_in_time",
          label: "签到时间",
          type: "datetime",
          required: true,
          placeholder: "请选择签到时间",
          defaultValue: "{{current_time}}"
        },
        {
          name: "sign_out_time",
          label: "签退时间",
          type: "datetime",
          required: false,
          placeholder: "请选择签退时间"
        },
        {
          name: "actual_work_hours",
          label: "实际工时",
          type: "number",
          required: false,
          placeholder: "自动计算",
          disabled: true,
          description: "系统自动计算的工作时间"
        }
      ]
    }
  };
  
  return defaultDefinitions[formId];
}

// 如果直接运行此脚本
if (require.main === module) {
  fixFormDefinitionSerializationEnhanced()
    .then(() => {
      console.log('增强版修复脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('增强版修复脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixFormDefinitionSerializationEnhanced };
