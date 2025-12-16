// 公司配置管理控制器
const { Company, LaborSource } = require('../models');

/**
 * 获取公司列表
 */
const getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件 - 默认只查询有效的公司
    const where = {
      isActive: true
    };
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const companies = await Company.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: companies.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: companies.count,
        pages: Math.ceil(companies.count / limit)
      }
    });
  } catch (error) {
    console.error('获取公司列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公司列表失败',
      error: error.message
    });
  }
};

/**
 * 根据公司代码获取公司信息
 */
const getCompanyByCode = async (req, res) => {
  try {
    const { companyCode } = req.params;

    const company = await Company.findOne({
      where: { 
        code: companyCode,
        isActive: true // 只查询有效的公司
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在或已停用'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('获取公司信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公司信息失败',
      error: error.message
    });
  }
};

/**
 * 根据公司ID获取公司信息
 */
const getCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findOne({
      where: {
        id: companyId,
        isActive: true // 只查询有效的公司
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在或已停用'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('获取公司信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公司信息失败',
      error: error.message
    });
  }
};

/**
 * 为指定公司创建默认劳务来源
 */
const createDefaultLaborSources = async (companyId) => {
  try {
    const defaultLaborSources = [
      { name: '汇博劳务公司', code: '汇博劳务公司', description: '默认劳务公司 - 汇博劳务公司', sortOrder: 1 },
      { name: '恒信劳务公司', code: '恒信劳务公司', description: '默认劳务公司 - 恒信劳务公司', sortOrder: 2 },
      { name: '其他类（临时工）', code: '其他类（临时工）', description: '默认劳务公司 - 其他类（临时工）', sortOrder: 3 }
    ];

    const createdSources = [];
    
    for (const sourceData of defaultLaborSources) {
      // 检查是否已存在相同代码的劳务来源
      const existingSource = await LaborSource.findOne({
        where: {
          companyId,
          code: sourceData.code
        }
      });

      if (!existingSource) {
        const laborSource = await LaborSource.create({
          ...sourceData,
          companyId,
          isActive: true
        });
        createdSources.push(laborSource);
      }
    }

    console.log(`为公司ID ${companyId} 创建了 ${createdSources.length} 个默认劳务来源`);
    return createdSources;
  } catch (error) {
    console.error('创建默认劳务来源失败:', error);
    // 不抛出错误，避免影响公司创建
    return [];
  }
};

/**
 * 创建公司
 */
const createCompany = async (req, res) => {
  try {
    const { name, code, description, requireCheckout = true } = req.body;

    // 验证必填字段
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: '公司名称和代码是必填项'
      });
    }

    // 检查公司代码是否已存在
    const existingCompany = await Company.findOne({ where: { code } });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: '公司代码已存在'
      });
    }

    // 自动生成签到和签退页面URL - 使用前端完整URL
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const checkinUrl = `${frontendBaseUrl}/checkin/${code}`;
    const checkoutUrl = `${frontendBaseUrl}/checkout/${code}`;

    // 创建公司
    const company = await Company.create({
      name,
      code,
      description,
      checkinUrl,
      checkoutUrl,
      requireCheckout
    });

    // 为公司创建默认劳务来源
    await createDefaultLaborSources(company.id);

    res.status(201).json({
      success: true,
      message: '公司创建成功',
      data: company
    });
  } catch (error) {
    console.error('创建公司失败:', error);
    
    let errorMessage = '创建公司失败';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = '数据验证失败: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = '公司代码已存在';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * 更新公司信息
 */
const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, description, isActive, requireCheckout } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 更新公司信息
    await company.update({
      name: name || company.name,
      description: description !== undefined ? description : company.description,
      isActive: isActive !== undefined ? isActive : company.isActive,
      requireCheckout: requireCheckout !== undefined ? requireCheckout : company.requireCheckout
    });

    res.json({
      success: true,
      message: '公司信息更新成功',
      data: company
    });
  } catch (error) {
    console.error('更新公司信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新公司信息失败',
      error: error.message
    });
  }
};

/**
 * 删除公司（软删除）
 */
const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    // 软删除公司：设置 isActive 为 false 和 status 为 'inactive'
    await company.update({
      isActive: false,
      status: 'inactive'
    });

    res.json({
      success: true,
      message: '公司删除成功（已停用）'
    });
  } catch (error) {
    console.error('删除公司失败:', error);
    res.status(500).json({
      success: false,
      message: '删除公司失败',
      error: error.message
    });
  }
};

/**
 * 批量创建公司
 */
const batchCreateCompanies = async (req, res) => {
  try {
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要创建的公司数据数组'
      });
    }

    // 验证数据
    const validCompanies = [];
    const errors = [];

    for (const companyData of companies) {
      if (!companyData.name || !companyData.code) {
        errors.push(`公司 ${companyData.name || '未知'} 缺少名称或代码`);
        continue;
      }

      // 检查代码是否已存在
      const existingCompany = await Company.findOne({ where: { code: companyData.code } });
      if (existingCompany) {
        errors.push(`公司代码 ${companyData.code} 已存在`);
        continue;
      }

      // 使用前端完整URL
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      validCompanies.push({
        ...companyData,
        checkinUrl: `${frontendBaseUrl}/checkin/${companyData.code}`,
        checkoutUrl: `${frontendBaseUrl}/checkout/${companyData.code}`
      });
    }

    if (validCompanies.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的公司数据',
        errors
      });
    }

    // 批量创建公司
    const createdCompanies = await Company.bulkCreate(validCompanies);

    // 为每个新创建的公司创建默认劳务来源
    const laborSourcePromises = createdCompanies.map(company => 
      createDefaultLaborSources(company.id)
    );
    
    await Promise.all(laborSourcePromises);

    res.status(201).json({
      success: true,
      message: `成功创建 ${createdCompanies.length} 个公司`,
      data: createdCompanies,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('批量创建公司失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建公司失败',
      error: error.message
    });
  }
};

module.exports = {
  getCompanies,
  getCompanyByCode,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  batchCreateCompanies
};
