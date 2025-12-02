/*
 * @Date: 2025-11-26 16:23:34
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-02 16:18:47
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
  realName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'real_name',
    comment: '用户真实姓名'
  },
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '用户手机号'
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
  laborSource: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'labor_source',
    comment: '劳务来源'
  },
  remark: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: '备注信息'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: '是否有效记录'
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
      fields: ['phone', 'company_id', 'checkin_time']
    },
    {
      fields: ['company_id', 'checkin_type', 'checkin_time']
    }
  ]
});

  return CheckinRecord;
};
