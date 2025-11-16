const { FormDefinition } = require('../models');

/**
 * 修复表单定义序列化问题
 * 将错误的序列化格式转换为正常的JSON字符串
 */
async function fixFormDefinitionSerialization() {
  try {
    console.log('开始修复表单定义序列化问题...');
    
    // 获取所有表单定义
    const formDefinitions = await FormDefinition.findAll();
    console.log(`找到 ${formDefinitions.length} 个表单定义`);
    
    let fixedCount = 0;
    
    for (const formDef of formDefinitions) {
      const definition = formDef.definition;
      
      // 检查是否是错误的序列化格式
      if (typeof definition === 'object' && definition !== null) {
        // 检查是否包含数字键（错误的序列化特征）
        const hasNumericKeys = Object.keys(definition).some(key => !isNaN(parseInt(key)));
        
        if (hasNumericKeys) {
          console.log(`发现错误的序列化格式: ${formDef.formId}`);
          
          // 尝试重建JSON字符串
          try {
            // 将对象值连接成字符串
            const jsonString = Object.values(definition).join('');
            console.log('重建的JSON字符串:', jsonString);
            
            // 验证是否是有效的JSON
            const parsedJson = JSON.parse(jsonString);
            
            // 更新表单定义
            await FormDefinition.update(
              { definition: parsedJson },
              { where: { id: formDef.id } }
            );
            
            console.log(`✅ 成功修复表单: ${formDef.formId}`);
            fixedCount++;
          } catch (parseError) {
            console.error(`❌ 无法解析重建的JSON: ${formDef.formId}`, parseError.message);
            
            // 如果重建失败，尝试使用默认的劳务签到表单定义
            if (formDef.formId === 'labor_sign_in') {
              const defaultLaborSignInDefinition = {
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
              };
              
              await FormDefinition.update(
                { definition: defaultLaborSignInDefinition },
                { where: { id: formDef.id } }
              );
              
              console.log(`✅ 使用默认定义修复劳务签到表单: ${formDef.formId}`);
              fixedCount++;
            }
          }
        }
      }
    }
    
    console.log(`\n修复完成！共修复了 ${fixedCount} 个表单定义`);
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const laborSignInForm = await FormDefinition.findOne({ where: { formId: 'labor_sign_in' } });
    if (laborSignInForm) {
      console.log('劳务签到表单定义:', JSON.stringify(laborSignInForm.definition, null, 2));
    }
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixFormDefinitionSerialization()
    .then(() => {
      console.log('修复脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('修复脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixFormDefinitionSerialization };
