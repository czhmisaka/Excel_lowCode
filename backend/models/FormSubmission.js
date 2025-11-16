/*
 * @Date: 2025-11-11 00:36:56
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 00:37:14
 * @FilePath: /lowCode_excel/backend/models/FormSubmission.js
 */
// 表单提交记录模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FormSubmission = sequelize.define('FormSubmission', {
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
  submissionData: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'submission_data',
    comment: '原始提交数据'
  },
  processedData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'processed_data',
    comment: '处理后的数据'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'success', 'error']]
    },
    comment: '处理状态: pending, success, error'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: '错误信息'
  }
}, {
  tableName: 'form_submissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '表单提交记录表'
});

module.exports = FormSubmission;
