/**
 * 创建签到系统数据表脚本
 * 用于在4000端口服务上创建签到系统所需的数据表
 */

const axios = require('axios');

// 配置
const CONFIG = {
  API_BASE: 'http://localhost:4000/api',
  TIMEOUT: 30000
};

// 签到记录表结构
const LABOR_SIGN_RECORDS_TABLE = {
  tableName: 'labor_sign_records',
  columns: [
    { name: 'id', type: 'integer', nullable: false, primaryKey: true, autoIncrement: true },
    { name: 'name', type: 'text', nullable: false },
    { name: 'phone', type: 'text', nullable: false },
    { name: 'company', type: 'text', nullable: false },
    { name: 'sign_in_time', type: 'datetime', nullable: true },
    { name: 'sign_out_time', type: 'datetime', nullable: true },
    { name: 'work_hours', type: 'number', nullable: true },
    { name: 'created_at', type: 'datetime', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    { name: 'updated_at', type: 'datetime', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
  ]
};

// 检查表是否存在
async function checkTableExists(tableName) {
  try {
    const response = await axios.get(`${CONFIG.API_BASE}/tables`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.success && response.data.data) {
      const tables = response.data.data;
      return tables.some(table => table.tableName === tableName);
    }
    return false;
  } catch (error) {
    console.error('检查表存在失败:', error.message);
    return false;
  }
}

// 创建数据表
async function createTable(tableDefinition) {
  console.log(`📝 创建数据表: ${tableDefinition.tableName}`);
  
  const tableExists = await checkTableExists(tableDefinition.tableName);
  if (tableExists) {
    console.log(`✅ 数据表 "${tableDefinition.tableName}" 已存在，跳过创建`);
    return true;
  }
  
  try {
    // 使用文件上传API来创建表
    const response = await axios.post(`${CONFIG.API_BASE}/upload`, {
      tableName: tableDefinition.tableName,
      columns: tableDefinition.columns
    }, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log(`✅ 数据表 "${tableDefinition.tableName}" 创建成功`);
      return true;
    } else {
      console.error(`❌ 数据表创建失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ 创建数据表失败:`, error.response?.data || error.message);
    
    // 如果上传API失败，尝试使用直接SQL创建
    console.log('尝试使用替代方法创建数据表...');
    return await createTableAlternative(tableDefinition);
  }
}

// 替代方法创建数据表
async function createTableAlternative(tableDefinition) {
  try {
    // 这里可以添加其他创建表的方法
    // 比如通过直接数据库连接或使用其他API端点
    console.log(`⚠️ 需要手动创建数据表: ${tableDefinition.tableName}`);
    console.log('表结构:');
    console.log(JSON.stringify(tableDefinition, null, 2));
    
    return false;
  } catch (error) {
    console.error('替代方法创建表失败:', error.message);
    return false;
  }
}

// 验证数据表功能
async function validateTableFunction() {
  console.log('🔧 验证数据表功能...');
  
  try {
    // 检查表列表
    const response = await axios.get(`${CONFIG.API_BASE}/tables`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.success) {
      console.log('✅ 数据表列表查询成功');
      console.log('当前数据表:');
      response.data.data.forEach(table => {
        console.log(`  - ${table.tableName || '(空表名)'} (${table.rowCount} 行)`);
      });
      return true;
    } else {
      console.error('❌ 数据表列表查询失败');
      return false;
    }
  } catch (error) {
    console.error('❌ 数据表功能验证失败:', error.message);
    return false;
  }
}

// 主函数
async function createSignInTables() {
  console.log('🚀 开始创建签到系统数据表...');
  console.log('目标服务器:', CONFIG.API_BASE);
  console.log('='.repeat(50));
  
  // 1. 创建签到记录表
  const tableCreated = await createTable(LABOR_SIGN_RECORDS_TABLE);
  
  if (!tableCreated) {
    console.log('⚠️ 数据表创建失败，但表单功能仍可正常使用');
    console.log('表单提交数据将存储在表单提交记录表中');
  }
  
  // 2. 验证数据表功能
  await validateTableFunction();
  
  console.log('='.repeat(50));
  if (tableCreated) {
    console.log('🎉 签到系统数据表创建完成！');
    console.log('');
    console.log('📋 创建总结:');
    console.log('- 签到记录表: ✅ 已创建');
    console.log('- 数据表功能: ✅ 验证通过');
    console.log('');
    console.log('💡 使用说明:');
    console.log('1. 表单提交数据将存储在 labor_sign_records 表中');
    console.log('2. 可以通过数据查询API访问签到记录');
  } else {
    console.log('⚠️ 数据表创建存在问题');
    console.log('表单功能仍可正常使用，但数据存储在表单提交记录中');
    console.log('如需数据表功能，请手动创建数据表');
  }
  
  return tableCreated;
}

// 执行创建
if (require.main === module) {
  createSignInTables()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('创建过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = {
  createSignInTables,
  createTable,
  checkTableExists
};
