/*
 * @Date: 2025-11-11 00:36:32
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 00:36:52
 * @FilePath: /lowCode_excel/backend/models/FormHook.js
 */
// Hook配置模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FormHook = sequelize.define('FormHook', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  formId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'form_id',
    comment: '关联的表单ID'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['javascript', 'http', 'database', 'conditional']]
    },
    comment: 'Hook类型: javascript, http, database, conditional'
  },
  triggerType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'trigger_type',
    validate: {
      isIn: [['beforeSubmit', 'afterSubmit', 'onError']]
    },
    comment: '触发时机: beforeSubmit, afterSubmit, onError'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Hook配置JSON'
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  }
}, {
  tableName: 'form_hooks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'Hook配置表'
});

module.exports = FormHook;
