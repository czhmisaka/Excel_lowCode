/*
 * @Date: 2025-11-25 19:12:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 19:13:34
 * @FilePath: /lowCode_excel/backend/utils/modelParser.js
 * @Description: 模型解析器 - 从Sequelize模型提取表结构信息
 */

/**
 * 模型解析器类
 * 负责从Sequelize模型定义中提取表结构信息
 */
class ModelParser {
  /**
   * 解析Sequelize模型，生成表结构定义
   * @param {Object} model Sequelize模型实例
   * @param {string} dialect 数据库类型 ('sqlite' | 'mysql')
   * @returns {Object} 表结构定义
   */
  static parseModel(model, dialect = 'sqlite') {
    const tableName = model.tableName || model.name.toLowerCase() + 's';
    const attributes = model.rawAttributes;
    
    const columns = Object.keys(attributes).map(fieldName => {
      const attr = attributes[fieldName];
      return {
        name: attr.field || fieldName,
        type: this.mapDataType(attr.type, dialect),
        primaryKey: attr.primaryKey || false,
        autoIncrement: attr.autoIncrement || false,
        allowNull: attr.allowNull !== false,
        unique: attr.unique || false,
        defaultValue: this.mapDefaultValue(attr.defaultValue, dialect),
        comment: attr.comment || null
      };
    });
    
    // 提取索引信息
    const indexes = this.extractIndexes(model, dialect);
    
    return {
      name: tableName,
      description: `${model.name} 表`,
      columns: columns,
      indexes: indexes
    };
  }
  
  /**
   * 将Sequelize数据类型映射到数据库特定的数据类型
   * @param {Object} sequelizeType Sequelize数据类型
   * @param {string} dialect 数据库类型
   * @returns {string} 数据库特定的数据类型
   */
  static mapDataType(sequelizeType, dialect) {
    const typeKey = sequelizeType.key || sequelizeType.constructor.key;
    
    const typeMap = {
      sqlite: {
        'STRING': 'TEXT',
        'CHAR': 'TEXT',
        'TEXT': 'TEXT',
        'INTEGER': 'INTEGER',
        'BIGINT': 'INTEGER',
        'FLOAT': 'REAL',
        'DOUBLE': 'REAL',
        'DECIMAL': 'REAL',
        'BOOLEAN': 'INTEGER', // SQLite用0/1表示布尔值
        'DATE': 'TEXT',
        'DATEONLY': 'TEXT',
        'TIME': 'TEXT',
        'JSON': 'TEXT',
        'JSONB': 'TEXT',
        'ENUM': 'TEXT',
        'UUID': 'TEXT',
        'BLOB': 'BLOB'
      },
      mysql: {
        'STRING': 'VARCHAR(255)',
        'CHAR': 'CHAR(255)',
        'TEXT': 'TEXT',
        'INTEGER': 'INTEGER',
        'BIGINT': 'BIGINT',
        'FLOAT': 'FLOAT',
        'DOUBLE': 'DOUBLE',
        'DECIMAL': 'DECIMAL(10,2)',
        'BOOLEAN': 'BOOLEAN',
        'DATE': 'DATETIME',
        'DATEONLY': 'DATE',
        'TIME': 'TIME',
        'JSON': 'JSON',
        'JSONB': 'JSON',
        'ENUM': 'VARCHAR(50)',
        'UUID': 'VARCHAR(36)',
        'BLOB': 'BLOB'
      }
    };
    
    return typeMap[dialect][typeKey] || 'TEXT';
  }
  
  /**
   * 映射默认值
   * @param {*} defaultValue 原始默认值
   * @param {string} dialect 数据库类型
   * @returns {*} 映射后的默认值
   */
  static mapDefaultValue(defaultValue, dialect) {
    if (defaultValue === undefined || defaultValue === null) {
      return null;
    }
    
    // 处理函数默认值
    if (typeof defaultValue === 'function') {
      const funcName = defaultValue.name || defaultValue.toString();
      if (funcName.includes('NOW') || funcName.includes('Date')) {
        return dialect === 'sqlite' ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP';
      }
      return null;
    }
    
    // 处理特殊值
    if (defaultValue === 'UUID') {
      return null; // UUID由应用层生成
    }
    
    return defaultValue;
  }
  
  /**
   * 从模型定义中提取索引信息
   * @param {Object} model Sequelize模型
   * @param {string} dialect 数据库类型
   * @returns {Array} 索引定义数组
   */
  static extractIndexes(model, dialect) {
    const indexes = [];
    
    // 处理唯一约束
    Object.keys(model.rawAttributes).forEach(fieldName => {
      const attr = model.rawAttributes[fieldName];
      if (attr.unique) {
        indexes.push({
          name: `idx_${model.tableName}_${attr.field || fieldName}_unique`,
          columns: [attr.field || fieldName],
          unique: true
        });
      }
    });
    
    // 处理模型定义的索引
    if (model.options.indexes) {
      model.options.indexes.forEach((indexDef, index) => {
        const indexName = indexDef.name || `idx_${model.tableName}_${index}`;
        indexes.push({
          name: indexName,
          columns: indexDef.fields || [],
          unique: indexDef.unique || false
        });
      });
    }
    
    return indexes;
  }
  
  /**
   * 批量解析所有模型
   * @param {Object} models 模型对象集合
   * @param {string} dialect 数据库类型
   * @returns {Object} 所有表的结构定义
   */
  static parseAllModels(models, dialect = 'sqlite') {
    const tableDefinitions = {};
    
    for (const [modelName, model] of Object.entries(models)) {
      if (model && model.rawAttributes) {
        const tableDef = this.parseModel(model, dialect);
        tableDefinitions[tableDef.name] = tableDef;
      }
    }
    
    return tableDefinitions;
  }
}

module.exports = ModelParser;
