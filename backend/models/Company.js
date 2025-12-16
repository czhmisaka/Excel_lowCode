/*
 * @Date: 2025-11-26 16:24:17
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-12 09:20:48
 * @FilePath: /打卡/backend/models/Company.js
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checkinUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  checkoutUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    field: 'status'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  requireCheckout: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'require_checkout',
    comment: '是否需要签退（含工作时长计算）'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'companies',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['status']
    }
  ]
});

  return Company;
};
