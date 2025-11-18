/**
 * 自动获取签到表哈希值脚本
 * 功能：自动获取所有表信息，匹配sign_in_sheet表并返回哈希值
 */

const axios = require('axios');

// 配置
const CONFIG = {
  API_BASE: 'http://118.196.16.32:13000/api',
  TARGET_TABLE: 'sign_in_sheet',
  TIMEOUT: 10000
};

/**
 * 获取所有表映射信息
 */
async function getAllTableMappings() {
  try {
    console.log('🔍 正在获取所有表映射信息...');
    
    const response = await axios.get(`${CONFIG.API_BASE}/mappings`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.success) {
      console.log(`✅ 成功获取 ${response.data.data.length} 个表`);
      return response.data.data;
    } else {
      throw new Error('获取表映射信息失败');
    }
  } catch (error) {
    console.error('❌ 获取表映射信息失败:', error.message);
    throw error;
  }
}

/**
 * 查找目标表
 */
function findTargetTable(tables, targetTableName) {
  console.log(`🔍 正在查找表: ${targetTableName}`);
  
  const targetTable = tables.find(table => 
    table.tableName === targetTableName
  );
  
  if (targetTable) {
    console.log(`✅ 找到目标表: ${targetTable.tableName}`);
    console.log(`   哈希值: ${targetTable.hashValue}`);
    console.log(`   列数: ${targetTable.columnCount}`);
    console.log(`   行数: ${targetTable.rowCount}`);
    
    // 显示列信息
    if (targetTable.columnDefinitions) {
      console.log('   列定义:');
      targetTable.columnDefinitions.forEach(col => {
        console.log(`     - ${col.name} (${col.type})`);
      });
    }
    
    return targetTable;
  } else {
    console.log(`❌ 未找到表: ${targetTableName}`);
    console.log('可用的表列表:');
    tables.forEach(table => {
      console.log(`   - ${table.tableName} (${table.hashValue})`);
    });
    return null;
  }
}

/**
 * 更新配置文件
 */
async function updateConfigFiles(targetTable) {
  console.log('📝 正在更新配置文件...');
  
  try {
    // 更新前端增强脚本
    const fs = require('fs');
    const path = require('path');
    
    // 1. 更新签到系统增强脚本.js
    const frontendScriptPath = path.join(__dirname, '签到系统增强脚本.js');
    if (fs.existsSync(frontendScriptPath)) {
      let frontendContent = fs.readFileSync(frontendScriptPath, 'utf8');
      frontendContent = frontendContent.replace(
        /const SIGN_IN_TABLE_HASH = '.*?';/,
        `const SIGN_IN_TABLE_HASH = '${targetTable.hashValue}';`
      );
      fs.writeFileSync(frontendScriptPath, frontendContent);
      console.log('✅ 更新前端增强脚本成功');
    }
    
    // 2. 更新配置签到表字段.js
    const fieldConfigPath = path.join(__dirname, '配置签到表字段.js');
    if (fs.existsSync(fieldConfigPath)) {
      let fieldConfigContent = fs.readFileSync(fieldConfigPath, 'utf8');
      fieldConfigContent = fieldConfigContent.replace(
        /const tableHash = '.*?';/,
        `const tableHash = '${targetTable.hashValue}';`
      );
      fs.writeFileSync(fieldConfigPath, fieldConfigContent);
      console.log('✅ 更新字段配置脚本成功');
    }
    
    // 3. 更新部署脚本
    const deployScriptPath = path.join(__dirname, '远程签到系统部署脚本.js');
    if (fs.existsSync(deployScriptPath)) {
      let deployContent = fs.readFileSync(deployScriptPath, 'utf8');
      // 更新API基础地址
      deployContent = deployContent.replace(
        /API_BASE: '.*?',/,
        `API_BASE: '${CONFIG.API_BASE}',`
      );
      fs.writeFileSync(deployScriptPath, deployContent);
      console.log('✅ 更新部署脚本成功');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 更新配置文件失败:', error.message);
    return false;
  }
}

/**
 * 创建表单定义
 */
async function createFormDefinition(targetTable) {
  console.log('📋 正在创建表单定义...');
  
  const formData = {
    formId: 'labor_sign_in',
    name: '劳务签到系统',
    description: '劳务人员签到签退系统，支持姓名、手机号、公司选择和自动时间记录',
    tableMapping: targetTable.hashValue,
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
          name: 'work_hours',
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
            fields: ['sign_in_time', 'sign_out_time', 'work_hours']
          }
        ]
      }
    }
  };
  
  try {
    // 检查表单是否已存在
    const checkResponse = await axios.get(`${CONFIG.API_BASE}/forms/labor_sign_in`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (checkResponse.data.success) {
      console.log('✅ 签到表单已存在，跳过创建');
      return true;
    }
  } catch (error) {
    // 表单不存在，继续创建
  }
  
  try {
    const response = await axios.post(`${CONFIG.API_BASE}/forms`, formData, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.success) {
      console.log('✅ 签到表单创建成功');
      return true;
    } else {
      throw new Error('创建表单失败');
    }
  } catch (error) {
    console.error('❌ 创建表单失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始自动获取签到表哈希值...');
  console.log('目标表:', CONFIG.TARGET_TABLE);
  console.log('API地址:', CONFIG.API_BASE);
  console.log('='.repeat(50));
  
  try {
    // 1. 获取所有表信息
    const tables = await getAllTableMappings();
    
    // 2. 查找目标表
    const targetTable = findTargetTable(tables, CONFIG.TARGET_TABLE);
    
    if (!targetTable) {
      console.log('❌ 未找到目标表，程序退出');
      process.exit(1);
    }
    
    // 3. 更新配置文件
    const configUpdated = await updateConfigFiles(targetTable);
    if (!configUpdated) {
      console.log('⚠️ 配置文件更新失败，但继续执行');
    }
    
    // 4. 创建表单定义
    const formCreated = await createFormDefinition(targetTable);
    if (!formCreated) {
      console.log('⚠️ 表单创建失败，但配置已更新');
    }
    
    console.log('='.repeat(50));
    console.log('🎉 自动配置完成！');
    console.log('');
    console.log('📋 配置总结:');
    console.log(`- 目标表: ${targetTable.tableName}`);
    console.log(`- 哈希值: ${targetTable.hashValue}`);
    console.log(`- 表单ID: labor_sign_in`);
    console.log('');
    console.log('🔗 访问地址:');
    console.log(`表单页面: http://localhost:5173/form?table=${targetTable.hashValue}`);
    console.log(`数据查询: http://localhost:5173/browser?hash=${targetTable.hashValue}`);
    console.log('');
    console.log('💡 下一步:');
    console.log('1. 在表单页面加载前端增强脚本');
    console.log('2. 测试签到/签退功能');
    console.log('3. 验证工作时间计算');
    
  } catch (error) {
    console.error('❌ 自动配置失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('程序执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  getAllTableMappings,
  findTargetTable,
  updateConfigFiles,
  createFormDefinition
};
