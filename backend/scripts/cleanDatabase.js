/*
 * @Date: 2025-11-11 01:59:43
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 02:00:00
 * @FilePath: /lowCode_excel/backend/scripts/cleanDatabase.js
 */
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/annual_leave.db',
  logging: false
});

async function cleanDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 先禁用外键约束
    await sequelize.query('PRAGMA foreign_keys = OFF');
    console.log('✅ 外键约束已禁用');
    
    // 按依赖顺序删除数据
    await sequelize.query('DELETE FROM form_submissions');
    console.log('✅ form_submissions表已清空');
    
    await sequelize.query('DELETE FROM form_hooks');
    console.log('✅ form_hooks表已清空');
    
    await sequelize.query('DELETE FROM form_definitions');
    console.log('✅ form_definitions表已清空');
    
    // 重新启用外键约束
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('✅ 外键约束已启用');
    
    console.log('🎉 数据库清理完成！可以重新启动服务器');
    
  } catch (error) {
    console.error('❌ 清理数据库失败:', error);
  } finally {
    await sequelize.close();
  }
}

cleanDatabase();
