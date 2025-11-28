// 用户信息管理控制器
const { User, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取用户列表
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, companyId, isActive } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { realName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const users = await User.findAndCountAll({
      where,
      include: [
        {
          model: Company,
          attributes: ['id', 'name', 'code']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.count,
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

/**
 * 根据手机号获取用户信息
 */
const getUserByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    const user = await User.findOne({
      where: { phone },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

/**
 * 手机号登录/自动注册
 */
const loginByPhone = async (req, res) => {
  try {
    const { phone, companyCode } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号是必填项'
      });
    }

    let user;
    
    if (companyCode) {
      // 根据公司代码查找公司
      const company = await Company.findOne({ 
        where: { 
          code: companyCode,
          isActive: true 
        } 
      });

      if (!company) {
        return res.status(400).json({
          success: false,
          message: '公司不存在或已停用'
        });
      }

      // 查找用户或自动创建
      user = await User.findOne({ 
        where: { 
          phone, 
          companyId: company.id 
        } 
      });

      if (!user) {
        user = await User.create({
          username: `user_${phone}`,
          realName: `用户${phone}`,
          phone,
          companyId: company.id
        });
      }
    } else {
      // 没有公司代码，只查找用户
      user = await User.findOne({ 
        where: { phone } 
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
    }

    res.json({
      success: true,
      message: '登录成功',
      data: user
    });
  } catch (error) {
    console.error('手机号登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

/**
 * 创建用户
 */
const createUser = async (req, res) => {
  try {
    const { username, realName, phone, companyId, role = 'employee' } = req.body;

    // 验证必填字段
    if (!username || !realName || !phone || !companyId) {
      return res.status(400).json({
        success: false,
        message: '用户名、真实姓名、手机号和公司ID是必填项'
      });
    }

    // 检查手机号是否已存在
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '手机号已存在'
      });
    }

    // 检查公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      realName,
      phone,
      companyId,
      role
    });

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    
    let errorMessage = '创建用户失败';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = '数据验证失败: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = '手机号已存在';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * 更新用户信息
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { realName, role, isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    await user.update({
      realName: realName || user.realName,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
};

/**
 * 删除用户
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 删除用户
    await user.destroy();

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
};

/**
 * 批量导入用户
 */
const batchImportUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要导入的用户数据数组'
      });
    }

    // 验证数据
    const validUsers = [];
    const errors = [];

    for (const userData of users) {
      if (!userData.username || !userData.realName || !userData.phone || !userData.companyId) {
        errors.push(`用户 ${userData.realName || '未知'} 缺少必要字段`);
        continue;
      }

      // 检查手机号是否已存在
      const existingUser = await User.findOne({ where: { phone: userData.phone } });
      if (existingUser) {
        errors.push(`手机号 ${userData.phone} 已存在`);
        continue;
      }

      // 检查公司是否存在
      const company = await Company.findByPk(userData.companyId);
      if (!company) {
        errors.push(`公司ID ${userData.companyId} 不存在`);
        continue;
      }

      validUsers.push(userData);
    }

    if (validUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的用户数据',
        errors
      });
    }

    // 批量创建用户
    const createdUsers = await User.bulkCreate(validUsers);

    res.status(201).json({
      success: true,
      message: `成功导入 ${createdUsers.length} 个用户`,
      data: createdUsers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('批量导入用户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量导入用户失败',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserByPhone,
  loginByPhone,
  createUser,
  updateUser,
  deleteUser,
  batchImportUsers
};
