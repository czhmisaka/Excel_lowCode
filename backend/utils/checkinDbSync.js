/*
 * @Date: 2025-11-27
 * @LastEditors: CZH
 * @FilePath: /打卡/backend/utils/checkinDbSync.js
 * @Description: 公司和签到模块数据库同步工具
 */

const { sequelize } = require('../config/database');
const { initModels } = require('../models');

/**
 * 公司和签到模块数据库同步器
 * 独立于自动建表系统，专门管理核心业务模块的表结构
 */
class CheckinDbSync {
  constructor() {
    this.models = null;
  }

  /**
   * 初始化模型实例
   */
  async initModels() {
    if (!this.models) {
      // 使用全局的模型实例
      const models = await initModels();
      this.models = {
        Company: models.Company,
        User: models.User,
        CheckinRecord: models.CheckinRecord
      };
    }
    return this.models;
  }

  /**
   * 检查表结构是否需要更新
   * @param {string} tableName 表名
   * @returns {Promise<boolean>} 是否需要更新
   */
  async checkTableNeedsUpdate(tableName) {
    try {
      // 检查表是否存在
      const [results] = await sequelize.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
        {
          replacements: [tableName],
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (!results) {
        console.log(`表 ${tableName} 不存在，需要创建`);
        return true;
      }

      // 检查表结构是否与模型定义一致
      const [columns] = await sequelize.query(
        `PRAGMA table_info("${tableName}")`,
        { type: sequelize.QueryTypes.SELECT }
      );

      // 这里可以添加更详细的表结构检查逻辑
      // 目前我们主要关注 is_active 字段是否存在
      const hasIsActive = columns.some(col => col.name === 'is_active');
      
      if (!hasIsActive && tableName === 'companies') {
        console.log(`表 ${tableName} 缺少 is_active 字段，需要更新`);
        return true;
      }

      console.log(`表 ${tableName} 结构正常`);
      return false;
    } catch (error) {
      console.error(`检查表 ${tableName} 结构时出错:`, error);
      return true;
    }
  }

  /**
   * 同步单个模型到数据库
   * @param {string} modelName 模型名称
   * @param {object} model 模型实例
   * @returns {Promise<boolean>} 同步是否成功
   */
  async syncModel(modelName, model) {
    try {
      console.log(`开始同步 ${modelName} 模型...`);
      
      // 使用 Sequelize 的 sync 方法同步表结构
      await model.sync({ alter: true });
      
      console.log(`✅ ${modelName} 模型同步成功`);
      return true;
    } catch (error) {
      console.error(`❌ ${modelName} 模型同步失败:`, error.message);
      return false;
    }
  }

  /**
   * 同步所有公司和签到相关模型
   * @returns {Promise<Object>} 同步结果
   */
  async syncAllModels() {
    const result = {
      success: true,
      syncedModels: [],
      failedModels: [],
      timestamp: new Date().toISOString()
    };

    console.log('开始同步公司和签到模块数据库...');

    // 按依赖顺序同步模型
    const syncOrder = ['Company', 'User', 'CheckinRecord'];
    
    for (const modelName of syncOrder) {
      const model = this.models[modelName];
      if (!model) {
        console.warn(`⚠️ 模型 ${modelName} 未找到，跳过`);
        continue;
      }

      const syncSuccess = await this.syncModel(modelName, model);
      
      if (syncSuccess) {
        result.syncedModels.push(modelName);
      } else {
        result.failedModels.push(modelName);
        result.success = false;
      }
    }

    console.log('公司和签到模块数据库同步完成:');
    console.log(`- 成功同步: ${result.syncedModels.length} 个模型`);
    console.log(`- 同步失败: ${result.failedModels.length} 个模型`);
    console.log(`- 同步结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);

    return result;
  }

  /**
   * 获取同步状态报告
   * @returns {Promise<Object>} 状态报告
   */
  async getSyncStatus() {
    // 确保模型已初始化
    await this.initModels();
    
    const status = {
      healthy: true,
      models: {},
      timestamp: new Date().toISOString()
    };

    for (const [modelName, model] of Object.entries(this.models)) {
      try {
        const tableName = model.getTableName();
        const needsUpdate = await this.checkTableNeedsUpdate(tableName);
        
        status.models[modelName] = {
          tableName,
          needsUpdate,
          healthy: !needsUpdate
        };

        if (needsUpdate) {
          status.healthy = false;
        }
      } catch (error) {
        status.models[modelName] = {
          tableName: 'unknown',
          needsUpdate: true,
          healthy: false,
          error: error.message
        };
        status.healthy = false;
      }
    }

    return status;
  }

  /**
   * 初始化公司和签到模块数据库
   * @returns {Promise<Object>} 初始化结果
   */
  async initialize() {
    console.log('开始初始化公司和签到模块数据库...');
    
    // 确保模型已初始化
    await this.initModels();
    
    // 检查当前状态
    const status = await this.getSyncStatus();
    
    if (status.healthy) {
      console.log('✅ 公司和签到模块数据库结构完整，无需同步');
      return {
        success: true,
        message: '数据库结构完整',
        status
      };
    }
    
    // 需要同步
    console.log('发现数据库结构问题，开始同步...');
    const syncResult = await this.syncAllModels();
    
    // 同步后再次检查状态
    const finalStatus = await this.getSyncStatus();
    
    return {
      success: syncResult.success && finalStatus.healthy,
      message: syncResult.success ? '数据库同步成功' : '数据库同步失败',
      syncResult,
      finalStatus
    };
  }
}

// 创建单例实例
const checkinDbSync = new CheckinDbSync();

module.exports = checkinDbSync;
