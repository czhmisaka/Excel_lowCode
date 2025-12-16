/*
 * @Date: 2025-12-11 18:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-11 18:00:14
 * @FilePath: /打卡/backend/models/LaborSource.js
 * @Description: 劳务公司来源模型 - 每个公司独立的劳务来源配置
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LaborSource = sequelize.define('LaborSource', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '劳务来源名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '劳务来源代码（同一公司内唯一）'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '劳务来源描述'
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      comment: '所属公司ID'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
      comment: '排序顺序'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'labor_sources',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['company_id', 'code'],
        unique: true
      },
      {
        fields: ['company_id', 'is_active']
      },
      {
        fields: ['company_id', 'sort_order']
      }
    ],
    comment: '劳务公司来源配置表 - 每个公司独立的劳务来源选项'
  });

  return LaborSource;
};
