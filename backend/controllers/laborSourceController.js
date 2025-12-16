/*
 * @Date: 2025-12-11 18:00:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-11 18:04:36
 * @FilePath: /打卡/backend/controllers/laborSourceController.js
 * @Description: 劳务公司来源配置控制器 - 每个公司独立的劳务来源管理
 */
const { LaborSource, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取公司的劳务来源列表
 */
const getLaborSources = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, search, isActive, sortBy = 'sortOrder', sortOrder = 'asc' } = req.query;
    const offset = (page - 1) * limit;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 构建查询条件
    const where = {
      companyId: parseInt(companyId)
    };
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 构建排序条件
    const order = [];
    if (sortBy === 'name') {
      order.push(['name', sortOrder.toUpperCase()]);
    } else if (sortBy === 'code') {
      order.push(['code', sortOrder.toUpperCase()]);
    } else if (sortBy === 'sortOrder') {
      order.push(['sortOrder', sortOrder.toUpperCase()]);
    } else {
      order.push(['sortOrder', 'ASC'], ['createdAt', 'DESC']);
    }

    const laborSources = await LaborSource.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
    });

    res.json({
      success: true,
      data: laborSources.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: laborSources.count,
        pages: Math.ceil(laborSources.count / limit)
      },
      company: {
        id: company.id,
        name: company.name,
        code: company.code
      }
    });
  } catch (error) {
    console.error('获取劳务来源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取劳务来源列表失败',
      error: error.message
    });
  }
};

/**
 * 获取公司启用的劳务来源列表（用于下拉选择）
 */
const getActiveLaborSources = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    const laborSources = await LaborSource.findAll({
      where: {
        companyId: parseInt(companyId),
        isActive: true
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'description']
    });

    res.json({
      success: true,
      data: laborSources,
      company: {
        id: company.id,
        name: company.name,
        code: company.code
      }
    });
  } catch (error) {
    console.error('获取启用的劳务来源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取启用的劳务来源列表失败',
      error: error.message
    });
  }
};

/**
 * 根据公司代码获取启用的劳务来源列表（用于签到页面）
 */
const getActiveLaborSourcesByCompanyCode = async (req, res) => {
  try {
    const { companyCode } = req.params;

    // 根据公司代码获取公司信息
    const company = await Company.findOne({
      where: {
        code: companyCode,
        isActive: true
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在或已停用'
      });
    }

    const laborSources = await LaborSource.findAll({
      where: {
        companyId: company.id,
        isActive: true
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'description']
    });

    res.json({
      success: true,
      data: laborSources,
      company: {
        id: company.id,
        name: company.name,
        code: company.code
      }
    });
  } catch (error) {
    console.error('根据公司代码获取劳务来源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取劳务来源列表失败',
      error: error.message
    });
  }
};

/**
 * 获取单个劳务来源
 */
const getLaborSource = async (req, res) => {
  try {
    const { companyId, laborSourceId } = req.params;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    const laborSource = await LaborSource.findOne({
      where: {
        id: laborSourceId,
        companyId: parseInt(companyId)
      }
    });

    if (!laborSource) {
      return res.status(404).json({
        success: false,
        message: '劳务来源不存在或不属于该公司'
      });
    }

    res.json({
      success: true,
      data: laborSource
    });
  } catch (error) {
    console.error('获取劳务来源失败:', error);
    res.status(500).json({
      success: false,
      message: '获取劳务来源失败',
      error: error.message
    });
  }
};

/**
 * 创建劳务来源
 */
const createLaborSource = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, code, description, isActive = true, sortOrder = 0 } = req.body;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 验证必填字段
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: '劳务来源名称和代码是必填项'
      });
    }

    // 检查同一公司内代码是否已存在
    const existingLaborSource = await LaborSource.findOne({
      where: {
        companyId: parseInt(companyId),
        code: code
      }
    });

    if (existingLaborSource) {
      return res.status(400).json({
        success: false,
        message: '该代码已在该公司中使用，请使用其他代码'
      });
    }

    // 创建劳务来源
    const laborSource = await LaborSource.create({
      name,
      code,
      description,
      companyId: parseInt(companyId),
      isActive,
      sortOrder
    });

    res.status(201).json({
      success: true,
      message: '劳务来源创建成功',
      data: laborSource
    });
  } catch (error) {
    console.error('创建劳务来源失败:', error);
    
    let errorMessage = '创建劳务来源失败';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = '数据验证失败: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = '劳务来源代码已存在';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * 更新劳务来源
 */
const updateLaborSource = async (req, res) => {
  try {
    const { companyId, laborSourceId } = req.params;
    const { name, description, isActive, sortOrder } = req.body;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 查找劳务来源
    const laborSource = await LaborSource.findOne({
      where: {
        id: laborSourceId,
        companyId: parseInt(companyId)
      }
    });

    if (!laborSource) {
      return res.status(404).json({
        success: false,
        message: '劳务来源不存在或不属于该公司'
      });
    }

    // 更新劳务来源信息
    await laborSource.update({
      name: name || laborSource.name,
      description: description !== undefined ? description : laborSource.description,
      isActive: isActive !== undefined ? isActive : laborSource.isActive,
      sortOrder: sortOrder !== undefined ? sortOrder : laborSource.sortOrder
    });

    res.json({
      success: true,
      message: '劳务来源信息更新成功',
      data: laborSource
    });
  } catch (error) {
    console.error('更新劳务来源失败:', error);
    res.status(500).json({
      success: false,
      message: '更新劳务来源失败',
      error: error.message
    });
  }
};

/**
 * 删除劳务来源（软删除）
 */
const deleteLaborSource = async (req, res) => {
  try {
    const { companyId, laborSourceId } = req.params;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 查找劳务来源
    const laborSource = await LaborSource.findOne({
      where: {
        id: laborSourceId,
        companyId: parseInt(companyId)
      }
    });

    if (!laborSource) {
      return res.status(404).json({
        success: false,
        message: '劳务来源不存在或不属于该公司'
      });
    }

    // 检查是否有签到记录使用该劳务来源
    const { CheckinRecord } = require('../models');
    const checkinRecordCount = await CheckinRecord.count({
      where: {
        companyId: parseInt(companyId),
        laborSource: laborSource.code
      }
    });

    if (checkinRecordCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该劳务来源已被 ${checkinRecordCount} 条签到记录使用，无法删除。请先停用或修改相关记录。`
      });
    }

    // 删除劳务来源
    await laborSource.destroy();

    res.json({
      success: true,
      message: '劳务来源删除成功'
    });
  } catch (error) {
    console.error('删除劳务来源失败:', error);
    res.status(500).json({
      success: false,
      message: '删除劳务来源失败',
      error: error.message
    });
  }
};

/**
 * 切换劳务来源启用状态
 */
const toggleLaborSourceStatus = async (req, res) => {
  try {
    const { companyId, laborSourceId } = req.params;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 查找劳务来源
    const laborSource = await LaborSource.findOne({
      where: {
        id: laborSourceId,
        companyId: parseInt(companyId)
      }
    });

    if (!laborSource) {
      return res.status(404).json({
        success: false,
        message: '劳务来源不存在或不属于该公司'
      });
    }

    // 切换启用状态
    const newStatus = !laborSource.isActive;
    await laborSource.update({
      isActive: newStatus
    });

    res.json({
      success: true,
      message: `劳务来源已${newStatus ? '启用' : '停用'}`,
      data: {
        id: laborSource.id,
        name: laborSource.name,
        isActive: newStatus
      }
    });
  } catch (error) {
    console.error('切换劳务来源状态失败:', error);
    res.status(500).json({
      success: false,
      message: '切换劳务来源状态失败',
      error: error.message
    });
  }
};

/**
 * 批量创建劳务来源
 */
const batchCreateLaborSources = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { laborSources } = req.body;

    // 验证公司是否存在
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    if (!laborSources || !Array.isArray(laborSources) || laborSources.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要创建的劳务来源数据数组'
      });
    }

    // 验证数据
    const validLaborSources = [];
    const errors = [];

    for (const laborSourceData of laborSources) {
      if (!laborSourceData.name || !laborSourceData.code) {
        errors.push(`劳务来源 ${laborSourceData.name || '未知'} 缺少名称或代码`);
        continue;
      }

      // 检查代码是否已存在
      const existingLaborSource = await LaborSource.findOne({
        where: {
          companyId: parseInt(companyId),
          code: laborSourceData.code
        }
      });

      if (existingLaborSource) {
        errors.push(`劳务来源代码 ${laborSourceData.code} 已在该公司中使用`);
        continue;
      }

      validLaborSources.push({
        ...laborSourceData,
        companyId: parseInt(companyId),
        isActive: laborSourceData.isActive !== undefined ? laborSourceData.isActive : true,
        sortOrder: laborSourceData.sortOrder || 0
      });
    }

    if (validLaborSources.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的劳务来源数据',
        errors
      });
    }

    // 批量创建劳务来源
    const createdLaborSources = await LaborSource.bulkCreate(validLaborSources);

    res.status(201).json({
      success: true,
      message: `成功创建 ${createdLaborSources.length} 个劳务来源`,
      data: createdLaborSources,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('批量创建劳务来源失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建劳务来源失败',
      error: error.message
    });
  }
};

module.exports = {
  getLaborSources,
  getActiveLaborSources,
  getActiveLaborSourcesByCompanyCode,
  getLaborSource,
  createLaborSource,
  updateLaborSource,
  deleteLaborSource,
  toggleLaborSourceStatus,
  batchCreateLaborSources
};
