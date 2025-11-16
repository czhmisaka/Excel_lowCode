/*
 * @Date: 2025-11-11 00:36:10
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 14:17:35
 * @FilePath: /lowCode_excel/backend/models/FormDefinition.js
 */
// 表单定义模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FormDefinition = sequelize.define('FormDefinition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  formId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'form_id',
    comment: '表单唯一标识',
    validate: {
      notEmpty: {
        msg: 'formId 不能为空'
      },
      notNull: {
        msg: 'formId 不能为 null'
      },
      len: {
        args: [1, 255],
        msg: 'formId 长度必须在 1 到 255 个字符之间'
      }
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '表单名称',
    validate: {
      notEmpty: {
        msg: '表单名称不能为空'
      },
      notNull: {
        msg: '表单名称不能为 null'
      },
      len: {
        args: [1, 255],
        msg: '表单名称长度必须在 1 到 255 个字符之间'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '表单描述'
  },
  tableMapping: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'table_mapping',
    comment: '关联的数据表哈希'
  },
  definition: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '表单定义JSON',
    validate: {
      notNull: {
        msg: '表单定义不能为 null'
      },
      isValidDefinition(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('表单定义必须是有效的 JSON 对象');
        }
      }
    }
  }
}, {
  tableName: 'form_definitions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '表单定义表',
  hooks: {
    beforeValidate: (formDefinition, options) => {
      // 确保 formId 有值，如果没有则生成一个
      if (!formDefinition.formId) {
        const { v4: uuidv4 } = require('uuid');
        formDefinition.formId = `form_${uuidv4()}`;
      }
    }
  }
});

module.exports = FormDefinition;
