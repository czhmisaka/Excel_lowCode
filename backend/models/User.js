/*
 * @Date: 2025-10-28 14:28:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 14:28:54
 * @FilePath: /lowCode_excel/backend/models/User.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名',
        field: 'username',
        validate: {
            len: [3, 50],
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        comment: '邮箱',
        field: 'email',
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '密码哈希',
        field: 'password_hash'
    },
    displayName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '显示名称',
        field: 'display_name'
    },
    role: {
        type: DataTypes.ENUM('admin', 'user', 'guest'),
        allowNull: false,
        defaultValue: 'user',
        comment: '用户角色',
        field: 'role'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否激活',
        field: 'is_active'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后登录时间',
        field: 'last_login'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['username']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            fields: ['role']
        },
        {
            fields: ['created_at']
        }
    ]
});

// 实例方法：验证密码
User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

// 实例方法：更新最后登录时间
User.prototype.updateLastLogin = async function () {
    this.lastLogin = new Date();
    await this.save();
};

// 静态方法：创建用户（包含密码哈希）
User.createWithPassword = async function (userData) {
    const { password, ...rest } = userData;

    if (!password) {
        throw new Error('密码不能为空');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    return await this.create({
        ...rest,
        passwordHash
    });
};

// 静态方法：更新用户密码
User.updatePassword = async function (userId, newPassword) {
    const user = await this.findByPk(userId);
    if (!user) {
        throw new Error('用户不存在');
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    return user;
};

// 钩子：更新前自动更新时间戳
User.beforeUpdate((user) => {
    user.updatedAt = new Date();
});

module.exports = User;
