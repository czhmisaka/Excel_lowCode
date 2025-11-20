/*
 * @Date: 2025-11-20 10:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-20 15:35:13
 * @FilePath: /lowCode_excel/backend/controllers/tableController.js
 * @Description: 数据表管理控制器
 */

const { sequelize } = require('../config/database');
const TableMapping = require('../models/TableMapping');
const crypto = require('crypto');

/**
 * 数据表管理控制器
 * 提供数据表的创建、查询、删除等API接口
 */
class TableController {
  
  /**
   * 创建数据表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async createTable(req, res) {
    try {
      const { name, description, columns } = req.body;
      
      // 参数验证
      if (!name) {
        return res.status(400).json({
          success: false,
          message: '表名不能为空'
        });
      }
      
      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({
          success: false,
          message: '字段定义不能为空且必须为数组'
        });
      }
      
      // 验证字段定义
      for (const column of columns) {
        if (!column.name || !column.type) {
          return res.status(400).json({
            success: false,
            message: '字段定义必须包含name和type属性'
          });
        }
      }
      
      console.log(`正在创建数据表: ${name}`);
      
      // 检查表是否已存在
      const tableExists = await this.checkTableExists(name);
      if (tableExists) {
        return res.status(409).json({
          success: false,
          message: `数据表 ${name} 已存在`
        });
      }
      
      // 生成表的哈希值
      const hashValue = this.generateTableHash(name, columns);
      
      // 创建数据表（使用统一的表名格式）
      const createSuccess = await this.executeCreateTable(name, columns, hashValue);
      if (!createSuccess) {
        return res.status(500).json({
          success: false,
          message: '创建数据表失败'
        });
      }
      
      // 创建表映射记录
      const tableMapping = await TableMapping.create({
        tableName: name,
        hashValue: hashValue,
        originalFileName: null,
        columnCount: columns.length,
        rowCount: 0,
        headerRow: 0,
        columnDefinitions: columns,
        formConfig: null
      });
      
      console.log(`✅ 数据表 ${name} 创建成功，哈希值: ${hashValue}`);
      
      return res.status(201).json({
        success: true,
        message: '数据表创建成功',
        data: {
          tableName: name,
          hashValue: hashValue,
          columnCount: columns.length,
          mappingId: tableMapping.id
        }
      });
      
    } catch (error) {
      console.error('创建数据表失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建数据表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取数据表列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getTables(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const { count, rows } = await TableMapping.findAndCountAll({
        attributes: [
          'id', 'tableName', 'hashValue', 'columnCount', 'rowCount', 
          'createdAt', 'updatedAt'
        ],
        order: [['createdAt', 'DESC']],
        offset: parseInt(offset),
        limit: parseInt(limit)
      });
      
      return res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
      
    } catch (error) {
      console.error('获取数据表列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取数据表列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取数据表详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getTableDetail(req, res) {
    try {
      const { tableName } = req.params;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: '表名不能为空'
        });
      }
      
      // 查找表映射记录
      const tableMapping = await TableMapping.findOne({
        where: { tableName }
      });
      
      if (!tableMapping) {
        return res.status(404).json({
          success: false,
          message: `数据表 ${tableName} 不存在`
        });
      }
      
      // 获取表结构信息
      const tableStructure = await this.getTableStructure(tableName);
      
      return res.json({
        success: true,
        data: {
          mapping: tableMapping,
          structure: tableStructure
        }
      });
      
    } catch (error) {
      console.error('获取数据表详情失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取数据表详情失败',
        error: error.message
      });
    }
  }
  
  /**
   * 删除数据表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async deleteTable(req, res) {
    try {
      const { tableName } = req.params;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: '表名不能为空'
        });
      }
      
      // 检查表是否存在
      const tableExists = await this.checkTableExists(tableName);
      if (!tableExists) {
        return res.status(404).json({
          success: false,
          message: `数据表 ${tableName} 不存在`
        });
      }
      
      // 删除表映射记录
      await TableMapping.destroy({
        where: { tableName }
      });
      
      // 删除数据表
      await this.executeDropTable(tableName);
      
      console.log(`✅ 数据表 ${tableName} 删除成功`);
      
      return res.json({
        success: true,
        message: '数据表删除成功'
      });
      
    } catch (error) {
      console.error('删除数据表失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除数据表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 检查表是否存在
   * @param {string} tableName 表名
   * @returns {Promise<boolean>} 表是否存在
   */
  async checkTableExists(tableName) {
    try {
      const dialect = sequelize.getDialect();
      
      if (dialect === 'sqlite') {
        const [results] = await sequelize.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
          {
            replacements: [tableName],
            type: sequelize.QueryTypes.SELECT
          }
        );
        return !!results;
      } else if (dialect === 'mysql') {
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
   * 执行创建表操作
   * @param {string} tableName 表名（显示名称）
   * @param {Array} columns 字段定义
   * @param {string} hashValue 哈希值（用于实际表名）
   * @returns {Promise<boolean>} 创建是否成功
   */
  async executeCreateTable(tableName, columns, hashValue) {
    try {
      const dialect = sequelize.getDialect();
      
      // 使用统一的表名格式：data_${hashValue}
      const actualTableName = `data_${hashValue}`;
      
      // 构建字段定义SQL
      const columnDefinitions = columns.map(col => {
        let columnDef = dialect === 'sqlite' ? `"${col.name}" ${col.type}` : `\`${col.name}\` ${col.type}`;
        
        if (col.primaryKey) {
          columnDef += ' PRIMARY KEY';
          if (col.autoIncrement) {
            columnDef += dialect === 'sqlite' ? ' AUTOINCREMENT' : ' AUTO_INCREMENT';
          }
        }
        
        if (col.unique) {
          columnDef += ' UNIQUE';
        }
        
        if (!col.allowNull) {
          columnDef += ' NOT NULL';
        }
        
        if (col.defaultValue !== undefined && col.defaultValue !== null) {
          if (typeof col.defaultValue === 'string' && col.defaultValue !== 'CURRENT_TIMESTAMP') {
            columnDef += ` DEFAULT '${col.defaultValue}'`;
          } else {
            columnDef += ` DEFAULT ${col.defaultValue}`;
          }
        }
        
        return columnDef;
      }).join(',\n  ');
      
      // 添加创建时间和更新时间字段
      const fullColumnDefinitions = columnDefinitions + 
        `,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP` +
        `,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`;
      
      // 执行建表SQL
      const createSQL = dialect === 'sqlite' 
        ? `CREATE TABLE "${actualTableName}" (\n  ${fullColumnDefinitions}\n)`
        : `CREATE TABLE \`${actualTableName}\` (\n  ${fullColumnDefinitions}\n)`;
      
      await sequelize.query(createSQL);
      console.log(`✅ 表 ${actualTableName} (显示名称: ${tableName}) 创建SQL执行成功`);
      
      return true;
    } catch (error) {
      console.error(`创建表 ${tableName} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 执行删除表操作
   * @param {string} tableName 表名
   * @returns {Promise<boolean>} 删除是否成功
   */
  async executeDropTable(tableName) {
    try {
      const dialect = sequelize.getDialect();
      const dropSQL = dialect === 'sqlite' 
        ? `DROP TABLE IF EXISTS "${tableName}"`
        : `DROP TABLE IF EXISTS \`${tableName}\``;
      
      await sequelize.query(dropSQL);
      console.log(`✅ 表 ${tableName} 删除成功`);
      return true;
    } catch (error) {
      console.error(`删除表 ${tableName} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 获取表结构信息
   * @param {string} tableName 表名
   * @returns {Promise<Object>} 表结构信息
   */
  async getTableStructure(tableName) {
    try {
      const dialect = sequelize.getDialect();
      
      if (dialect === 'sqlite') {
        const [columns] = await sequelize.query(`PRAGMA table_info("${tableName}")`);
        return { columns };
      } else if (dialect === 'mysql') {
        const [columns] = await sequelize.query(`DESCRIBE \`${tableName}\``);
        return { columns };
      } else {
        throw new Error(`不支持的数据库类型: ${dialect}`);
      }
    } catch (error) {
      console.error(`获取表 ${tableName} 结构失败:`, error);
      return null;
    }
  }
  
  /**
   * 生成表的哈希值
   * @param {string} tableName 表名
   * @param {Array} columns 字段定义
   * @returns {string} 哈希值
   */
  generateTableHash(tableName, columns) {
    const tableInfo = {
      tableName,
      columns: columns.map(col => ({
        name: col.name,
        type: col.type,
        primaryKey: col.primaryKey || false,
        allowNull: col.allowNull !== false,
        unique: col.unique || false,
        defaultValue: col.defaultValue
      }))
    };
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(tableInfo));
    return hash.digest('hex');
  }
}

// 创建控制器实例
const tableController = new TableController();

// 确保方法正确绑定到实例
const boundController = {
  createTable: tableController.createTable.bind(tableController),
  getTables: tableController.getTables.bind(tableController),
  getTableDetail: tableController.getTableDetail.bind(tableController),
  deleteTable: tableController.deleteTable.bind(tableController),
  checkTableExists: tableController.checkTableExists.bind(tableController),
  executeCreateTable: tableController.executeCreateTable.bind(tableController),
  executeDropTable: tableController.executeDropTable.bind(tableController),
  getTableStructure: tableController.getTableStructure.bind(tableController),
  generateTableHash: tableController.generateTableHash.bind(tableController)
};

// 导出绑定后的实例
module.exports = boundController;

// 确保方法正确绑定
console.log('TableController loaded, methods:', Object.keys(boundController).filter(key => typeof boundController[key] === 'function'));
