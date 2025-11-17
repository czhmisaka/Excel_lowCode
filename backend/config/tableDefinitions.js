/*
 * @Date: 2025-11-17 09:23:33
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-17 09:25:23
 * @FilePath: /lowCode_excel/backend/config/tableDefinitions.js
 * @Description: 数据库表结构定义配置
 */

/**
 * 系统必需的表结构定义
 * 用于自动建表模块
 */
const tableDefinitions = {
  // 表映射关系表
  table_mappings: {
    name: 'table_mappings',
    description: '表映射关系表',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'table_name', type: 'VARCHAR(255)', allowNull: false },
      { name: 'hash_value', type: 'VARCHAR(64)', allowNull: false, unique: true },
      { name: 'original_file_name', type: 'VARCHAR(255)', allowNull: true },
      { name: 'column_count', type: 'INTEGER', allowNull: false, defaultValue: 0 },
      { name: 'row_count', type: 'INTEGER', allowNull: false, defaultValue: 0 },
      { name: 'header_row', type: 'INTEGER', allowNull: false, defaultValue: 0 },
      { name: 'column_definitions', type: 'JSON', allowNull: true },
      { name: 'form_config', type: 'JSON', allowNull: true },
      { name: 'created_at', type: 'DATETIME', allowNull: false },
      { name: 'updated_at', type: 'DATETIME', allowNull: false }
    ],
    indexes: [
      { name: 'idx_hash_value', columns: ['hash_value'] },
      { name: 'idx_table_name', columns: ['table_name'] }
    ]
  },

  // 表单定义表
  form_definitions: {
    name: 'form_definitions',
    description: '表单定义表',
    columns: [
      { name: 'id', type: 'UUID', primaryKey: true, defaultValue: 'UUID' },
      { name: 'form_id', type: 'VARCHAR(255)', allowNull: false, unique: true },
      { name: 'name', type: 'VARCHAR(255)', allowNull: false },
      { name: 'description', type: 'TEXT', allowNull: true },
      { name: 'table_mapping', type: 'VARCHAR(64)', allowNull: true },
      { name: 'definition', type: 'JSON', allowNull: false },
      { name: 'created_at', type: 'DATETIME', allowNull: false },
      { name: 'updated_at', type: 'DATETIME', allowNull: false }
    ],
    indexes: [
      { name: 'idx_form_id', columns: ['form_id'] },
      { name: 'idx_table_mapping', columns: ['table_mapping'] }
    ]
  },

  // 表单Hook配置表
  form_hooks: {
    name: 'form_hooks',
    description: '表单Hook配置表',
    columns: [
      { name: 'id', type: 'UUID', primaryKey: true, defaultValue: 'UUID' },
      { name: 'form_id', type: 'VARCHAR(255)', allowNull: false },
      { name: 'name', type: 'VARCHAR(255)', allowNull: false },
      { name: 'type', type: 'VARCHAR(50)', allowNull: false },
      { name: 'trigger_type', type: 'VARCHAR(50)', allowNull: false },
      { name: 'config', type: 'JSON', allowNull: false },
      { name: 'enabled', type: 'BOOLEAN', allowNull: false, defaultValue: true },
      { name: 'description', type: 'TEXT', allowNull: true },
      { name: 'created_at', type: 'DATETIME', allowNull: false },
      { name: 'updated_at', type: 'DATETIME', allowNull: false }
    ],
    indexes: [
      { name: 'idx_form_id', columns: ['form_id'] },
      { name: 'idx_type', columns: ['type'] },
      { name: 'idx_trigger_type', columns: ['trigger_type'] }
    ]
  },

  // 表单提交记录表
  form_submissions: {
    name: 'form_submissions',
    description: '表单提交记录表',
    columns: [
      { name: 'id', type: 'UUID', primaryKey: true, defaultValue: 'UUID' },
      { name: 'form_id', type: 'VARCHAR(255)', allowNull: false },
      { name: 'submission_data', type: 'JSON', allowNull: false },
      { name: 'processed_data', type: 'JSON', allowNull: true },
      { name: 'status', type: 'VARCHAR(20)', allowNull: false, defaultValue: 'pending' },
      { name: 'error_message', type: 'TEXT', allowNull: true },
      { name: 'created_at', type: 'DATETIME', allowNull: false },
      { name: 'updated_at', type: 'DATETIME', allowNull: true }
    ],
    indexes: [
      { name: 'idx_form_id', columns: ['form_id'] },
      { name: 'idx_status', columns: ['status'] },
      { name: 'idx_created_at', columns: ['created_at'] }
    ]
  },

  // 用户表
  users: {
    name: 'users',
    description: '用户表',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'username', type: 'VARCHAR(255)', allowNull: false, unique: true },
      { name: 'password', type: 'VARCHAR(255)', allowNull: false },
      { name: 'email', type: 'VARCHAR(255)', allowNull: true },
      { name: 'role', type: 'VARCHAR(50)', allowNull: false, defaultValue: 'user' },
      { name: 'is_active', type: 'BOOLEAN', allowNull: false, defaultValue: true },
      { name: 'last_login', type: 'DATETIME', allowNull: true },
      { name: 'created_at', type: 'DATETIME', allowNull: false },
      { name: 'updated_at', type: 'DATETIME', allowNull: false }
    ],
    indexes: [
      { name: 'idx_username', columns: ['username'] },
      { name: 'idx_email', columns: ['email'] },
      { name: 'idx_role', columns: ['role'] }
    ]
  },

  // 表操作日志表
  table_logs: {
    name: 'table_logs',
    description: '表操作日志表',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'table_name', type: 'VARCHAR(255)', allowNull: false },
      { name: 'operation', type: 'VARCHAR(50)', allowNull: false },
      { name: 'record_id', type: 'VARCHAR(255)', allowNull: true },
      { name: 'old_data', type: 'JSON', allowNull: true },
      { name: 'new_data', type: 'JSON', allowNull: true },
      { name: 'user_id', type: 'INTEGER', allowNull: true },
      { name: 'ip_address', type: 'VARCHAR(45)', allowNull: true },
      { name: 'user_agent', type: 'TEXT', allowNull: true },
      { name: 'created_at', type: 'DATETIME', allowNull: false }
    ],
    indexes: [
      { name: 'idx_table_name', columns: ['table_name'] },
      { name: 'idx_operation', columns: ['operation'] },
      { name: 'idx_created_at', columns: ['created_at'] }
    ]
  }
};

/**
 * 获取所有必需的表名
 */
const getRequiredTableNames = () => {
  return Object.keys(tableDefinitions);
};

/**
 * 获取表的SQL创建语句
 * @param {string} tableName 表名
 * @param {string} dialect 数据库类型 ('sqlite' | 'mysql')
 * @returns {string} SQL创建语句
 */
const getTableCreateSQL = (tableName, dialect = 'sqlite') => {
  const definition = tableDefinitions[tableName];
  if (!definition) {
    throw new Error(`表定义不存在: ${tableName}`);
  }

  const columns = definition.columns.map(col => {
    let columnDef = `"${col.name}" ${col.type}`;
    
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
    
    if (col.defaultValue) {
      if (col.defaultValue === 'UUID') {
        columnDef += dialect === 'sqlite' ? ' DEFAULT (lower(hex(randomblob(4)) || \'-\' || hex(randomblob(2)) || \'-\' || hex(randomblob(2)) || \'-\' || hex(randomblob(2)) || \'-\' || hex(randomblob(6))))' : ' DEFAULT (UUID())';
      } else if (typeof col.defaultValue === 'string' && col.defaultValue !== 'CURRENT_TIMESTAMP') {
        columnDef += ` DEFAULT '${col.defaultValue}'`;
      } else {
        columnDef += ` DEFAULT ${col.defaultValue}`;
      }
    }
    
    return columnDef;
  }).join(',\n  ');

  let sql = `CREATE TABLE IF NOT EXISTS "${definition.name}" (\n  ${columns}\n)`;

  // 添加表注释（MySQL支持）
  if (dialect === 'mysql' && definition.description) {
    sql += ` COMMENT '${definition.description}'`;
  }

  return sql + ';';
};

/**
 * 获取表的索引创建语句
 * @param {string} tableName 表名
 * @param {string} dialect 数据库类型 ('sqlite' | 'mysql')
 * @returns {string[]} 索引创建语句数组
 */
const getTableIndexSQL = (tableName, dialect = 'sqlite') => {
  const definition = tableDefinitions[tableName];
  if (!definition || !definition.indexes) {
    return [];
  }

  return definition.indexes.map(index => {
    const columns = index.columns.map(col => `"${col}"`).join(', ');
    if (dialect === 'sqlite') {
      return `CREATE INDEX IF NOT EXISTS "${index.name}" ON "${definition.name}" (${columns});`;
    } else {
      return `CREATE INDEX "${index.name}" ON \`${definition.name}\` (${columns});`;
    }
  });
};

module.exports = {
  tableDefinitions,
  getRequiredTableNames,
  getTableCreateSQL,
  getTableIndexSQL
};
