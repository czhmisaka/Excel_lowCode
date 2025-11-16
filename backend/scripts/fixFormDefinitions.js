/*
 * @Date: 2025-11-11 01:56:20
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 01:56:42
 * @FilePath: /lowCode_excel/backend/scripts/fixFormDefinitions.js
 */
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/annual_leave.db',
  logging: false
});

async function fixFormDefinitions() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 检查form_definitions表数据
    const [results] = await sequelize.query('SELECT * FROM form_definitions');
    console.log('当前form_definitions表数据:', results);
    
    // 检查是否有重复的form_id或null值
    const formIds = results.map(row => row.form_id);
    const uniqueFormIds = [...new Set(formIds)];
    console.log('form_id统计:', {
      '总记录数': results.length,
      '唯一form_id数': uniqueFormIds.length,
      '重复form_id': formIds.length !== uniqueFormIds.length,
      '包含null值': formIds.includes(null)
    });
    
    // 如果有问题，修复数据
    if (formIds.length !== uniqueFormIds.length || formIds.includes(null)) {
      console.log('发现数据问题，正在修复...');
      
      // 删除有问题的记录
      await sequelize.query('DELETE FROM form_definitions WHERE form_id IS NULL OR form_id = ""');
      
      // 删除重复的记录，只保留最新的
      const [duplicates] = await sequelize.query(`
        SELECT form_id, COUNT(*) as count 
        FROM form_definitions 
        GROUP BY form_id 
        HAVING COUNT(*) > 1
      `);
      
      for (const dup of duplicates) {
        const [toDelete] = await sequelize.query(`
          SELECT id FROM form_definitions 
          WHERE form_id = ? 
          ORDER BY created_at ASC 
          LIMIT ${dup.count - 1}
        `, { replacements: [dup.form_id] });
        
        for (const row of toDelete) {
          await sequelize.query('DELETE FROM form_definitions WHERE id = ?', { replacements: [row.id] });
        }
      }
      
      console.log('数据修复完成');
    } else {
      console.log('数据正常，无需修复');
    }
    
  } catch (error) {
    console.error('修复数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

fixFormDefinitions();
