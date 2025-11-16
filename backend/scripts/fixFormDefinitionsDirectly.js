/*
 * @Date: 2025-11-11 14:22:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 14:24:08
 * @FilePath: /lowCode_excel/backend/scripts/fixFormDefinitionsDirectly.js
 */
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/annual_leave.db',
  logging: console.log
});

/**
 * 直接修复 form_definitions 表的问题数据
 * 这个脚本会直接操作数据库，修复导致同步失败的问题
 */
async function fixFormDefinitionsDirectly() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    console.log('=== 开始直接修复 form_definitions 表 ===');
    
    // 1. 检查当前数据状态
    console.log('\n1. 检查当前数据状态...');
    const [currentData] = await sequelize.query('SELECT * FROM form_definitions');
    console.log(`当前 form_definitions 表共有 ${currentData.length} 条记录`);
    
    // 显示所有记录
    console.log('\n当前所有记录:');
    currentData.forEach((record, index) => {
      console.log(`[${index + 1}] id: ${record.id}, form_id: "${record.form_id}", name: "${record.name}"`);
    });
    
    // 2. 检查问题数据
    console.log('\n2. 检查问题数据...');
    
    // 检查 form_id 为 null 或空的记录
    const [nullFormIds] = await sequelize.query(`
      SELECT COUNT(*) as count FROM form_definitions 
      WHERE form_id IS NULL OR form_id = '' OR TRIM(form_id) = ''
    `);
    console.log(`- form_id 为 null 或空的记录: ${nullFormIds[0].count} 条`);
    
    // 检查重复的 form_id
    const [duplicates] = await sequelize.query(`
      SELECT form_id, COUNT(*) as count 
      FROM form_definitions 
      WHERE form_id IS NOT NULL AND form_id != '' 
      GROUP BY form_id 
      HAVING COUNT(*) > 1
    `);
    console.log(`- 重复的 form_id 数量: ${duplicates.length} 组`);
    
    // 3. 修复问题数据
    console.log('\n3. 开始修复问题数据...');
    
    // 3.1 修复 form_id 为 null 或空的记录
    if (nullFormIds[0].count > 0) {
      console.log('\n修复 form_id 为 null 或空的记录...');
      
      // 获取这些记录
      const [nullRecords] = await sequelize.query(`
        SELECT id, form_id, name FROM form_definitions 
        WHERE form_id IS NULL OR form_id = '' OR TRIM(form_id) = ''
      `);
      
      for (const record of nullRecords) {
        // 生成新的 form_id
        const newFormId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`  - 修复记录 id=${record.id}: form_id="${record.form_id}" -> "${newFormId}"`);
        
        await sequelize.query('UPDATE form_definitions SET form_id = ? WHERE id = ?', {
          replacements: [newFormId, record.id]
        });
      }
      
      console.log(`✅ 已修复 ${nullRecords.length} 条 form_id 为 null 或空的记录`);
    }
    
    // 3.2 修复重复的 form_id
    if (duplicates.length > 0) {
      console.log('\n修复重复的 form_id...');
      
      for (const dup of duplicates) {
        console.log(`\n处理重复的 form_id: "${dup.form_id}" (${dup.count} 条记录)`);
        
        // 获取所有重复记录，按创建时间排序
        const [duplicateRecords] = await sequelize.query(`
          SELECT id, form_id, name, created_at 
          FROM form_definitions 
          WHERE form_id = ? 
          ORDER BY created_at ASC
        `, { replacements: [dup.form_id] });
        
        // 保留最新的记录，为其他记录生成新的 form_id
        const recordsToKeep = duplicateRecords.slice(-1); // 保留最新的
        const recordsToFix = duplicateRecords.slice(0, -1); // 修复旧的
        
        for (const record of recordsToFix) {
          const newFormId = `${record.form_id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          console.log(`  - 修复重复记录 id=${record.id}: form_id="${record.form_id}" -> "${newFormId}"`);
          
          await sequelize.query('UPDATE form_definitions SET form_id = ? WHERE id = ?', {
            replacements: [newFormId, record.id]
          });
        }
        
        console.log(`  - 保留记录: id=${recordsToKeep[0].id}, form_id="${recordsToKeep[0].form_id}"`);
      }
      
      console.log(`✅ 已修复 ${duplicates.length} 组重复的 form_id`);
    }
    
    // 4. 验证修复结果
    console.log('\n4. 验证修复结果...');
    const [finalData] = await sequelize.query('SELECT * FROM form_definitions');
    console.log(`修复后 form_definitions 表共有 ${finalData.length} 条记录`);
    
    // 显示修复后的记录
    console.log('\n修复后所有记录:');
    finalData.forEach((record, index) => {
      console.log(`[${index + 1}] id: ${record.id}, form_id: "${record.form_id}", name: "${record.name}"`);
    });
    
    // 检查是否还有问题数据
    const [remainingNull] = await sequelize.query(`
      SELECT COUNT(*) as count FROM form_definitions 
      WHERE form_id IS NULL OR form_id = '' OR TRIM(form_id) = ''
    `);
    
    const [remainingDuplicates] = await sequelize.query(`
      SELECT form_id, COUNT(*) as count 
      FROM form_definitions 
      WHERE form_id IS NOT NULL AND form_id != '' 
      GROUP BY form_id 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingNull[0].count === 0 && remainingDuplicates.length === 0) {
      console.log('\n✅ 数据修复完成，所有问题数据已修复');
    } else {
      console.log('\n⚠️ 仍有问题数据存在:');
      if (remainingNull[0].count > 0) {
        console.log(`  - form_id 为 null 或空的记录: ${remainingNull[0].count} 条`);
      }
      if (remainingDuplicates.length > 0) {
        console.log(`  - 重复的 form_id: ${remainingDuplicates.length} 组`);
      }
    }
    
    // 5. 生成修复报告
    console.log('\n5. 修复报告:');
    console.log(`- 初始记录数: ${currentData.length}`);
    console.log(`- 最终记录数: ${finalData.length}`);
    console.log(`- 修复 null/空 form_id: ${nullFormIds[0].count}`);
    console.log(`- 修复重复 form_id: ${duplicates.length} 组`);
    
    console.log('\n=== 数据修复完成 ===');
    
  } catch (error) {
    console.error('数据修复失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixFormDefinitionsDirectly()
    .then(() => {
      console.log('数据修复脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据修复脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = fixFormDefinitionsDirectly;
