/*
 * @Date: 2025-11-26 16:24:17
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-17 14:18:15
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
  enableCheckinTimeLimit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'enable_checkin_time_limit',
    comment: '是否开启签到时间限制'
  },
  checkinStartTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'checkin_start_time',
    comment: '签到开始时间（HH:mm）'
  },
  checkinEndTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'checkin_end_time',
    comment: '签到结束时间（HH:mm）'
  },
  enableCheckoutTimeLimit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'enable_checkout_time_limit',
    comment: '是否开启签退时间限制'
  },
  checkoutStartTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'checkout_start_time',
    comment: '签退开始时间（HH:mm）'
  },
  checkoutEndTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'checkout_end_time',
    comment: '签退结束时间（HH:mm）'
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
