/*
 * @Date: 2025-11-26 16:23:34
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-27 10:31:10
 * @FilePath: /打卡/backend/models/CheckinRecord.js
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckinRecord = sequelize.define('CheckinRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  checkinType: {
    type: DataTypes.ENUM('checkin', 'checkout'),
    allowNull: false,
    field: 'checkin_type'
  },
  checkinTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'checkin_time'
  },
  location: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  workDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '工作时长（分钟）'
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
  tableName: 'checkin_records',
  indexes: [
    {
      fields: ['user_id', 'company_id', 'checkin_time']
    },
    {
      fields: ['company_id', 'checkin_type', 'checkin_time']
    }
  ]
});

  return CheckinRecord;
};
