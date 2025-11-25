/*
 * @Date: 2025-11-17 09:25:23
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 15:17:01
 * @FilePath: /lowCode_excel/backend/utils/autoTableCreator.js
 * @Description: 自动建表模块核心功能
 */

const { sequelize } = require('../config/database');
const { getRequiredTableNames, getTableCreateSQL, getTableIndexSQL } = require('../config/tableDefinitions');

/**
 * 自动建表模块
 * 负责检查、创建和维护数据库表结构
 */
class AutoTableCreator {
  constructor() {
    this.dialect = sequelize.getDialect();
    this.requiredTables = getRequiredTableNames();
  }

  /**
   * 检查表是否存在
   * @param {string} tableName 表名
   * @returns {Promise<boolean>} 表是否存在
   */
  async checkTableExists(tableName) {
    try {
      const dialect = this.dialect;
      
      if (dialect === 'sqlite') {
        // SQLite: 使用 sqlite_master 表
        const [results] = await sequelize.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
          {
            replacements: [tableName],
            type: sequelize.QueryTypes.SELECT
          }
        );
        return !!results;
      } else if (dialect === 'mysql') {
        // MySQL: 使用 INFORMATION_SCHEMA.TABLES
        const [results] = await sequelize.query(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          {
            replacements: [sequelize.config.database, tableName],
            type: sequelize.QueryTypes.SELECT
          }
        );
        return !!results;
      } else {
        throw new Error(`不支持的数据库类型: ${dialect}`);
      }
    } catch (error) {
      console.error(`检查表 ${tableName} 是否存在时出错:`, error);
      return false;
    }
  }

  /**
   * 创建表
   * @param {string} tableName 表名
   * @returns {Promise<boolean>} 创建是否成功
   */
  async createTable(tableName) {
    try {
      console.log(`正在创建表: ${tableName}`);
      
      // 获取创建表的SQL语句
      const createSQL = getTableCreateSQL(tableName, this.dialect);
      console.log(`执行建表SQL: ${createSQL}`);
      
      // 执行建表语句
      await sequelize.query(createSQL);
      console.log(`✅ 表 ${tableName} 创建成功`);
      
      // 创建索引
      const indexSQLs = getTableIndexSQL(tableName, this.dialect);
      for (const indexSQL of indexSQLs) {
        try {
          await sequelize.query(indexSQL);
          console.log(`✅ 索引创建成功: ${indexSQL}`);
        } catch (indexError) {
          // 索引可能已经存在，忽略重复创建的错误
          if (indexError.message && indexError.message.includes('already exists')) {
            console.log(`ℹ️ 索引已存在: ${indexSQL}`);
          } else {
            console.warn(`⚠️ 索引创建失败: ${indexSQL}`, indexError.message);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`❌ 创建表 ${tableName} 失败:`, error.message);
      
      // 如果是表已存在的错误，忽略
      if (error.message && (
        error.message.includes('already exists') ||
        error.message.includes('table already exists') ||
        error.message.includes('Duplicate table')
      )) {
        console.log(`ℹ️ 表 ${tableName} 已存在`);
        return true;
      }
      
      return false;
    }
  }

  /**
   * 检查表结构完整性（优化版本，减少内存使用）
   * @param {string} tableName 表名
   * @returns {Promise<boolean>} 表结构是否完整
   */
  async checkTableStructure(tableName) {
    try {
      // 优化检查：只检查表是否存在，不加载表结构详情
      // 这样可以避免加载大量字段信息导致内存溢出
      if (this.dialect === 'sqlite') {
        // SQLite: 使用更轻量的检查
        const [results] = await sequelize.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
          {
            replacements: [tableName],
            type: sequelize.QueryTypes.SELECT
          }
        );
        return !!results;
      } else {
        // MySQL: 使用更轻量的检查
        const [results] = await sequelize.query(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          {
            replacements: [sequelize.config.database, tableName],
            type: sequelize.QueryTypes.SELECT
          }
        );
        return !!results;
      }
    } catch (error) {
      console.error(`❌ 表 ${tableName} 结构检查失败:`, error.message);
      return false;
    }
  }

  /**
   * 检查所有必需表的状态
   * @returns {Promise<Object>} 表状态报告
   */
  async checkAllTables() {
    const report = {
      success: true,
      tables: {},
      missingTables: [],
      corruptedTables: [],
      totalTables: this.requiredTables.length,
      checkedAt: new Date().toISOString()
    };

    console.log(`开始检查 ${this.requiredTables.length} 个必需表...`);

    // 分批检查表，避免一次性加载过多数据
    const batchSize = 2; // 每次检查2个表
    for (let i = 0; i < this.requiredTables.length; i += batchSize) {
      const batch = this.requiredTables.slice(i, i + batchSize);
      
      for (const tableName of batch) {
        const tableReport = {
          name: tableName,
          exists: false,
          structureValid: false,
          error: null
        };

        try {
          // 检查表是否存在
          tableReport.exists = await this.checkTableExists(tableName);
          
          if (tableReport.exists) {
            // 简化表结构检查，避免加载大量数据
            tableReport.structureValid = await this.checkTableStructure(tableName);
            
            if (!tableReport.structureValid) {
              report.corruptedTables.push(tableName);
              report.success = false;
            }
          } else {
            report.missingTables.push(tableName);
            report.success = false;
          }
        } catch (error) {
          tableReport.error = error.message;
          report.success = false;
          console.error(`检查表 ${tableName} 时出错:`, error.message);
        }

        report.tables[tableName] = tableReport;
        
        // 添加短暂延迟，避免内存压力
        if (i + batchSize < this.requiredTables.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    console.log(`表检查完成:`);
    console.log(`- 总表数: ${report.totalTables}`);
    console.log(`- 缺失表: ${report.missingTables.length}`);
    console.log(`- 损坏表: ${report.corruptedTables.length}`);
    console.log(`- 检查结果: ${report.success ? '✅ 通过' : '❌ 失败'}`);

    return report;
  }

  /**
   * 自动修复缺失的表
   * @returns {Promise<Object>} 修复结果
   */
  async autoFixTables() {
    const report = {
      success: true,
      fixedTables: [],
      failedTables: [],
      totalAttempted: 0,
      fixedAt: new Date().toISOString()
    };

    console.log('开始自动修复缺失的表...');

    // 先检查所有表的状态
    const tableReport = await this.checkAllTables();
    
    // 修复缺失的表
    for (const tableName of tableReport.missingTables) {
      report.totalAttempted++;
      console.log(`尝试修复缺失的表: ${tableName}`);
      
      const createSuccess = await this.createTable(tableName);
      if (createSuccess) {
        report.fixedTables.push(tableName);
        console.log(`✅ 表 ${tableName} 修复成功`);
      } else {
        report.failedTables.push(tableName);
        report.success = false;
        console.error(`❌ 表 ${tableName} 修复失败`);
      }
    }

    // 尝试修复损坏的表（重新创建）
    for (const tableName of tableReport.corruptedTables) {
      report.totalAttempted++;
      console.log(`尝试修复损坏的表: ${tableName}`);
      
      try {
        // 先删除损坏的表
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
        console.log(`✅ 已删除损坏的表: ${tableName}`);
        
        // 重新创建表
        const createSuccess = await this.createTable(tableName);
        if (createSuccess) {
          report.fixedTables.push(tableName);
          console.log(`✅ 表 ${tableName} 重新创建成功`);
        } else {
          report.failedTables.push(tableName);
          report.success = false;
          console.error(`❌ 表 ${tableName} 重新创建失败`);
        }
      } catch (error) {
        report.failedTables.push(tableName);
        report.success = false;
        console.error(`❌ 修复损坏表 ${tableName} 失败:`, error.message);
      }
    }

    console.log(`自动修复完成:`);
    console.log(`- 尝试修复: ${report.totalAttempted}`);
    console.log(`- 成功修复: ${report.fixedTables.length}`);
    console.log(`- 修复失败: ${report.failedTables.length}`);
    console.log(`- 修复结果: ${report.success ? '✅ 成功' : '❌ 失败'}`);

    return report;
  }

  /**
   * 初始化数据库（确保所有必需表都存在）
   * @returns {Promise<Object>} 初始化结果
   */
  async initializeDatabase() {
    console.log('开始初始化数据库...');
    
    // 检查表状态
    const tableReport = await this.checkAllTables();
    
    if (tableReport.success) {
      console.log('✅ 数据库表结构完整，无需修复');
      return {
        success: true,
        message: '数据库表结构完整',
        tableReport
      };
    }
    
    // 需要修复
    console.log('发现表结构问题，开始自动修复...');
    const fixReport = await this.autoFixTables();
    
    // 修复后再次检查
    const finalReport = await this.checkAllTables();
    
    return {
      success: finalReport.success,
      message: finalReport.success ? '数据库初始化成功' : '数据库初始化失败',
      initialReport: tableReport,
      fixReport,
      finalReport
    };
  }

  /**
   * 获取数据库健康状态
   * @returns {Promise<Object>} 健康状态报告
   */
  async getHealthStatus() {
    try {
      // 测试数据库连接
      await sequelize.authenticate();
      
      // 检查表状态
      const tableReport = await this.checkAllTables();
      
      return {
        status: tableReport.success ? 'healthy' : 'degraded',
        database: 'connected',
        tables: {
          total: tableReport.totalTables,
          missing: tableReport.missingTables.length,
          corrupted: tableReport.corruptedTables.length,
          healthy: tableReport.totalTables - tableReport.missingTables.length - tableReport.corruptedTables.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
const autoTableCreator = new AutoTableCreator();

module.exports = autoTableCreator;
