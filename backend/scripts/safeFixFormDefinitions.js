/*
 * @Date: 2025-11-11 14:35:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 14:36:15
 * @FilePath: /lowCode_excel/backend/scripts/safeFixFormDefinitions.js
 */
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/annual_leave.db',
  logging: console.log
});

/**
 * 安全修复 form_definitions 表
 * 这个脚本会先删除外键约束，然后修复表结构
 */
async function safeFixFormDefinitions() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    console.log('=== 开始安全修复 form_definitions 表 ===');
    
    // 1. 检查当前数据状态
    console.log('\n1. 检查当前数据状态...');
    const [currentData] = await sequelize.query('SELECT * FROM form_definitions');
    console.log(`当前 form_definitions 表共有 ${currentData.length} 条记录`);
    
    // 显示所有记录
    console.log('\n当前所有记录:');
    currentData.forEach((record, index) => {
      console.log(`[${index + 1}] id: ${record.id}, form_id: "${record.form_id}", name: "${record.name}"`);
    });
    
    // 2. 检查外键约束
    console.log('\n2. 检查外键约束...');
    try {
      const foreignKeys = await sequelize.query(`
        PRAGMA foreign_key_list(form_definitions)
      `);
      
      if (foreignKeys && foreignKeys.length > 0 && foreignKeys[0].length > 0) {
        console.log('发现外键约束:');
        foreignKeys[0].forEach(fk => {
          console.log(`  - 从 ${fk.from} 到 ${fk.table}.${fk.to}`);
        });
      } else {
        console.log('没有发现外键约束');
      }
    } catch (error) {
      console.log('检查外键约束失败:', error.message);
    }
    
    // 3. 检查关联表
    console.log('\n3. 检查关联表...');
    const [relatedTables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE '%form%'
    `);
    
    console.log('相关表单表:');
    relatedTables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    // 4. 创建临时表并导入数据
    console.log('\n4. 创建临时表并导入数据...');
    
    // 删除临时表（如果存在）
    await sequelize.query('DROP TABLE IF EXISTS form_definitions_temp');
    
    // 创建临时表（没有唯一约束）
    await sequelize.query(`
      CREATE TABLE form_definitions_temp (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        table_mapping TEXT,
        definition TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    
    // 导入数据到临时表
    for (const record of currentData) {
      await sequelize.query(`
        INSERT INTO form_definitions_temp (id, form_id, name, description, table_mapping, definition, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          record.id,
          record.form_id,
          record.name,
          record.description,
          record.table_mapping,
          typeof record.definition === 'object' ? JSON.stringify(record.definition) : record.definition,
          record.created_at,
          record.updated_at
        ]
      });
    }
    
    console.log('✅ 数据已导入到临时表');
    
    // 5. 禁用外键约束
    console.log('\n5. 禁用外键约束...');
    await sequelize.query('PRAGMA foreign_keys = OFF');
    console.log('✅ 外键约束已禁用');
    
    // 6. 删除原表
    console.log('\n6. 删除原表...');
    try {
      await sequelize.query('DROP TABLE form_definitions');
      console.log('✅ 原表已删除');
    } catch (error) {
      console.log('⚠️ 删除原表失败，尝试强制删除...');
      // 如果删除失败，可能是还有关联，我们继续创建新表
    }
    
    // 7. 重新创建原表（使用正确的约束）
    console.log('\n7. 重新创建原表...');
    await sequelize.query(`
      CREATE TABLE form_definitions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        table_mapping TEXT,
        definition TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    console.log('✅ 原表已重新创建');
    
    // 8. 从临时表恢复数据
    console.log('\n8. 从临时表恢复数据...');
    const [tempData] = await sequelize.query('SELECT * FROM form_definitions_temp');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of tempData) {
      try {
        await sequelize.query(`
          INSERT INTO form_definitions (id, form_id, name, description, table_mapping, definition, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            record.id,
            record.form_id,
            record.name,
            record.description,
            record.table_mapping,
            record.definition,
            record.created_at,
            record.updated_at
          ]
        });
        console.log(`  - 恢复记录: id=${record.id}, form_id="${record.form_id}"`);
        successCount++;
      } catch (error) {
        console.error(`  - 恢复失败: id=${record.id}, form_id="${record.form_id}", error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ 数据恢复完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
    
    // 9. 删除临时表
    console.log('\n9. 清理临时表...');
    await sequelize.query('DROP TABLE form_definitions_temp');
    console.log('✅ 临时表已删除');
    
    // 10. 重新启用外键约束
    console.log('\n10. 重新启用外键约束...');
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('✅ 外键约束已启用');
    
    // 11. 验证修复结果
    console.log('\n11. 验证修复结果...');
    const [finalData] = await sequelize.query('SELECT * FROM form_definitions');
    console.log(`修复后 form_definitions 表共有 ${finalData.length} 条记录`);
    
    console.log('\n修复后所有记录:');
    finalData.forEach((record, index) => {
      console.log(`[${index + 1}] id: ${record.id}, form_id: "${record.form_id}", name: "${record.name}"`);
    });
    
    // 检查唯一性约束
    const [duplicates] = await sequelize.query(`
      SELECT form_id, COUNT(*) as count 
      FROM form_definitions 
      WHERE form_id IS NOT NULL AND form_id != '' 
      GROUP BY form_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ 唯一性约束验证通过，没有重复的 form_id');
    } else {
      console.log('⚠️ 仍有重复的 form_id:');
      duplicates.forEach(dup => {
        console.log(`  - form_id: "${dup.form_id}", 重复次数: ${dup.count}`);
      });
    }
    
    console.log('\n=== 安全修复完成 ===');
    
  } catch (error) {
    console.error('安全修复失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  safeFixFormDefinitions()
    .then(() => {
      console.log('安全修复脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('安全修复脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = safeFixFormDefinitions;
