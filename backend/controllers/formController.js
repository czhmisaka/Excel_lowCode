// 表单管理控制器
const { FormDefinition, FormHook, FormSubmission } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * 获取表单列表
 */
const getForms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    if (search) {
      where.name = {
        [Op.like]: `%${search}%`
      };
    }

    const forms = await FormDefinition.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: forms.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: forms.count,
        pages: Math.ceil(forms.count / limit)
      }
    });
  } catch (error) {
    console.error('获取表单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表单列表失败',
      error: error.message
    });
  }
};

/**
 * 获取表单详情
 */
const getForm = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await FormDefinition.findOne({
      where: { formId },
      include: [{
        model: FormHook,
        as: 'hooks',
        where: { enabled: true },
        required: false
      }]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('获取表单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表单详情失败',
      error: error.message
    });
  }
};

/**
 * 验证表单数据
 */
const validateFormData = (data) => {
  const errors = [];

  // 验证 formId
  if (!data.formId || data.formId.trim() === '') {
    errors.push('表单ID不能为空');
  } else if (data.formId.length > 255) {
    errors.push('表单ID长度不能超过255个字符');
  }

  // 验证 name
  if (!data.name || data.name.trim() === '') {
    errors.push('表单名称不能为空');
  } else if (data.name.length > 255) {
    errors.push('表单名称长度不能超过255个字符');
  }

  // 验证 definition
  if (!data.definition) {
    errors.push('表单定义不能为空');
  } else if (typeof data.definition !== 'object') {
    errors.push('表单定义必须是有效的JSON对象');
  }

  // 验证 tableMapping
  if (data.tableMapping && data.tableMapping.length > 64) {
    errors.push('表映射字段长度不能超过64个字符');
  }

  return errors;
};

/**
 * 清理表单数据
 */
const sanitizeFormData = (data) => {
  const sanitized = { ...data };

  // 清理字符串字段
  if (sanitized.formId) sanitized.formId = sanitized.formId.trim();
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.tableMapping) sanitized.tableMapping = sanitized.tableMapping.trim();

  return sanitized;
};

/**
 * 创建表单
 */
const createForm = async (req, res) => {
  try {
    const { formId, name, description, tableMapping, definition } = req.body;

    // 清理数据
    const sanitizedData = sanitizeFormData({
      formId,
      name,
      description,
      tableMapping,
      definition
    });

    // 验证数据
    const validationErrors = validateFormData(sanitizedData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validationErrors
      });
    }

    // 检查表单ID是否已存在
    const existingForm = await FormDefinition.findOne({ where: { formId: sanitizedData.formId } });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        message: '表单ID已存在'
      });
    }

    // 创建表单
    const form = await FormDefinition.create({
      id: uuidv4(),
      formId: sanitizedData.formId,
      name: sanitizedData.name,
      description: sanitizedData.description,
      tableMapping: sanitizedData.tableMapping,
      definition: sanitizedData.definition
    });

    res.status(201).json({
      success: true,
      message: '表单创建成功',
      data: form
    });
  } catch (error) {
    console.error('创建表单失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '创建表单失败';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = '数据验证失败: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = '表单ID已存在';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * 更新表单
 */
const updateForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { name, description, tableMapping, definition } = req.body;

    const form = await FormDefinition.findOne({ where: { formId } });
    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    // 更新表单
    await form.update({
      name: name || form.name,
      description: description !== undefined ? description : form.description,
      tableMapping: tableMapping !== undefined ? tableMapping : form.tableMapping,
      definition: definition || form.definition
    });

    res.json({
      success: true,
      message: '表单更新成功',
      data: form
    });
  } catch (error) {
    console.error('更新表单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新表单失败',
      error: error.message
    });
  }
};

/**
 * 删除表单
 */
const deleteForm = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await FormDefinition.findOne({ where: { formId } });
    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    // 删除关联的Hook和提交记录
    await FormHook.destroy({ where: { formId } });
    await FormSubmission.destroy({ where: { formId } });

    // 删除表单
    await form.destroy();

    res.json({
      success: true,
      message: '表单删除成功'
    });
  } catch (error) {
    console.error('删除表单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除表单失败',
      error: error.message
    });
  }
};

/**
 * 获取表单的Hook列表
 */
const getFormHooks = async (req, res) => {
  try {
    const { formId } = req.params;

    const hooks = await FormHook.findAll({
      where: { formId },
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: hooks
    });
  } catch (error) {
    console.error('获取表单Hook列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表单Hook列表失败',
      error: error.message
    });
  }
};

/**
 * 创建Hook
 */
const createHook = async (req, res) => {
  try {
    const { formId } = req.params;
    const { type, triggerType, config, enabled = true } = req.body;

    // 验证必填字段
    if (!type || !triggerType || !config) {
      return res.status(400).json({
        success: false,
        message: 'Hook类型、触发时机和配置是必填项'
      });
    }

    // 检查表单是否存在
    const form = await FormDefinition.findOne({ where: { formId } });
    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    // 创建Hook
    const hook = await FormHook.create({
      id: uuidv4(),
      formId,
      type,
      triggerType,
      config,
      enabled
    });

    res.status(201).json({
      success: true,
      message: 'Hook创建成功',
      data: hook
    });
  } catch (error) {
    console.error('创建Hook失败:', error);
    res.status(500).json({
      success: false,
      message: '创建Hook失败',
      error: error.message
    });
  }
};

module.exports = {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  getFormHooks,
  createHook
};
