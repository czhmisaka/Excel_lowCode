// 签到控制器
const { CheckinRecord, Company, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取一天的开始和结束时间
 */
function getDayRange(date = new Date()) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { startOfDay, endOfDay };
}

/**
 * 计算工作时长（分钟）
 */
function calculateWorkDuration(checkinTime, checkoutTime) {
  const durationMs = checkoutTime.getTime() - checkinTime.getTime();
  return Math.floor(durationMs / (1000 * 60)); // 转换为分钟
}

/**
 * 获取公司的劳务来源选项
 */
const getCompanyLaborSources = async (companyId) => {
  try {
    const { LaborSource } = require('../models');
    const laborSources = await LaborSource.findAll({
      where: {
        companyId: companyId,
        isActive: true
      },
      attributes: ['code', 'name'],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
    
    return laborSources.map(source => source.code);
  } catch (error) {
    console.error('获取公司劳务来源失败:', error);
    return [];
  }
};

/**
 * 签到逻辑
 */
const checkin = async (req, res) => {
  try {
    const { realName, phone, companyCode, location, remark, laborSource } = req.body;
    
    // 验证必填字段
    if (!laborSource) {
      return res.status(400).json({
        success: false,
        message: '劳务来源为必填项'
      });
    }
    
    // 1. 根据公司代码获取公司信息
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
    
    // 获取公司的劳务来源选项
    const validLaborSources = await getCompanyLaborSources(company.id);
    
    if (validLaborSources.length === 0) {
      return res.status(400).json({
        success: false,
        message: '该公司未配置劳务来源选项，请联系管理员配置'
      });
    }
    
    // 验证劳务来源选项
    if (!validLaborSources.includes(laborSource)) {
      return res.status(400).json({
        success: false,
        message: '劳务来源选项无效，请选择有效的劳务来源'
      });
    }
    
    
    // 2. 检查今日是否已签到
    const { startOfDay, endOfDay } = getDayRange();
    
    const existingCheckin = await CheckinRecord.findOne({
      where: {
        phone: phone,
        companyId: company.id,
        checkinType: 'checkin',
        isActive: true, // 只检查有效的签到记录
        checkinTime: { [Op.between]: [startOfDay, endOfDay] }
      }
    });
    
    if (existingCheckin) {
      return res.json({ 
        success: false, 
        message: '今日已签到，请勿重复签到' 
      });
    }
    
    // 3. 记录签到
    const checkinRecord = await CheckinRecord.create({
      realName: realName,
      phone: phone,
      companyId: company.id,
      checkinType: 'checkin',
      checkinTime: new Date(),
      location,
      remark,
      laborSource,
      deviceInfo: req.headers['user-agent']
    });
    
    res.json({ 
      success: true, 
      message: '签到成功',
      data: { 
        user: {
          realName: realName,
          phone: phone
        },
        checkinRecord: {
          id: checkinRecord.id,
          checkinTime: checkinRecord.checkinTime,
          location: checkinRecord.location
        },
        company: {
          name: company.name,
          code: company.code
        }
      }
    });
    
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({
      success: false,
      message: '签到失败',
      error: error.message
    });
  }
};

/**
 * 签退逻辑
 */
const checkout = async (req, res) => {
  try {
    const { phone, companyCode, remark } = req.body;
    
    // 1. 根据公司代码获取公司信息
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
    
    // 检查公司是否需要签退
    if (!company.requireCheckout) {
      return res.status(400).json({
        success: false,
        message: '该公司只需签到，无需签退'
      });
    }
    
    // 2. 查找今日的签到记录
    const { startOfDay, endOfDay } = getDayRange();
    
    const todayCheckin = await CheckinRecord.findOne({
      where: {
        phone: phone,
        companyId: company.id,
        checkinType: 'checkin',
        isActive: true, // 只查找有效的签到记录
        checkinTime: { [Op.between]: [startOfDay, endOfDay] }
      }
    });
    
    if (!todayCheckin) {
      return res.status(400).json({
        success: false,
        message: '今日未签到，无法签退'
      });
    }
    
    // 3. 更新当天的签到记录，添加签退信息
    const checkoutTime = new Date();
    const workDuration = calculateWorkDuration(todayCheckin.checkinTime, checkoutTime);
    
    // 更新签到记录，添加工作时长和备注
    await todayCheckin.update({
      workDuration: workDuration,
      remark: remark,
      deviceInfo: req.headers['user-agent'] // 更新设备信息为签退时的设备
    });
    
    res.json({ 
      success: true, 
      message: '签退成功',
      data: { 
        user: {
          realName: todayCheckin.realName,
          phone: todayCheckin.phone
        },
        checkoutRecord: {
          id: todayCheckin.id,
          checkoutTime: checkoutTime,
          workDuration: workDuration
        },
        checkinRecord: {
          checkinTime: todayCheckin.checkinTime
        },
        company: {
          name: company.name,
          code: company.code
        }
      }
    });
    
  } catch (error) {
    console.error('签退失败:', error);
    res.status(500).json({
      success: false,
      message: '签退失败',
      error: error.message
    });
  }
};

/**
 * 获取签到历史
 */
const getCheckinHistory = async (req, res) => {
  try {
    const { phone, companyId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const where = {
      isActive: true // 默认只查询有效的签到记录
    };
    
    if (phone) where.phone = phone;
    if (companyId) where.companyId = companyId;
    
    if (startDate && endDate) {
      where.checkinTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const offset = (page - 1) * limit;
    
    const records = await CheckinRecord.findAndCountAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code', 'isActive'],
          where: {
            isActive: true // 只关联有效的公司
          }
        }
      ],
      order: [['checkinTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: records.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: records.count,
        pages: Math.ceil(records.count / limit)
      }
    });
    
  } catch (error) {
    console.error('获取签到历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取签到历史失败',
      error: error.message
    });
  }
};

/**
 * 获取今日签到状态
 */
const getTodayStatus = async (req, res) => {
  try {
    const { phone, companyId } = req.query;
    
    if (!phone || !companyId) {
      return res.status(400).json({
        success: false,
        message: '手机号和公司ID为必填参数'
      });
    }
    
    const { startOfDay, endOfDay } = getDayRange();
    
    const todayRecords = await CheckinRecord.findAll({
      where: {
        phone,
        companyId,
        isActive: true, // 只查询有效的签到记录
        checkinTime: { [Op.between]: [startOfDay, endOfDay] }
      },
      order: [['checkinTime', 'ASC']]
    });
    
    const checkinRecord = todayRecords.find(record => record.checkinType === 'checkin');
    
    // 基于签到记录的 workDuration 判断是否已签退
    const hasCheckedOut = checkinRecord && checkinRecord.workDuration !== null;
    
    res.json({
      success: true,
      data: {
        hasCheckedIn: !!checkinRecord,
        hasCheckedOut: hasCheckedOut,
        checkinTime: checkinRecord ? checkinRecord.checkinTime : null,
        checkoutTime: hasCheckedOut ? new Date(checkinRecord.checkinTime.getTime() + checkinRecord.workDuration * 60 * 1000) : null,
        workDuration: checkinRecord ? checkinRecord.workDuration : null
      }
    });
    
  } catch (error) {
    console.error('获取今日状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取今日状态失败',
      error: error.message
    });
  }
};

/**
 * 删除打卡记录（软删除）
 */
const deleteCheckinRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    // 查找打卡记录
    const record = await CheckinRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '打卡记录不存在'
      });
    }

    // 软删除打卡记录：设置 isActive 为 false
    await record.update({
      isActive: false
    });

    res.json({
      success: true,
      message: '打卡记录删除成功（已标记为无效）'
    });
  } catch (error) {
    console.error('删除打卡记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除打卡记录失败',
      error: error.message
    });
  }
};

/**
 * 导出打卡记录为Excel
 */
const exportCheckinRecords = async (req, res) => {
  try {
    const { companyId, startDate, endDate, search, page = 1, limit = 1000 } = req.query;
    
    // 构建查询条件
    const where = {
      isActive: true
    };
    
    if (companyId) where.companyId = companyId;
    
    // 日期范围筛选
    if (startDate && endDate) {
      where.checkinTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // 搜索条件（姓名或手机号）
    if (search) {
      where[Op.or] = [
        { realName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 查询所有符合条件的记录
    const records = await CheckinRecord.findAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['checkinTime', 'DESC']],
      limit: parseInt(limit)
    });
    
    // 准备Excel数据
    const excelData = records.map(record => ({
      'ID': record.id,
      '姓名': record.realName || '',
      '手机号': record.phone || '',
      '劳务来源': record.laborSource || '',
      '签到时间': record.checkinTime ? new Date(record.checkinTime).toLocaleString('zh-CN') : '',
      '工作时长(分钟)': record.workDuration || '',
      '工作时长(格式化)': record.workDuration ? 
        `${Math.floor(record.workDuration / 60)}小时${record.workDuration % 60}分钟` : '',
      '备注': record.remark || '',
      '公司名称': record.company?.name || '',
      '公司代码': record.company?.code || '',
      '创建时间': record.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN') : ''
    }));
    
    // 生成Excel文件
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // 设置列宽
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 10 },  // 姓名
      { wch: 15 },  // 手机号
      { wch: 15 },  // 劳务来源
      { wch: 20 },  // 签到时间
      { wch: 15 },  // 工作时长(分钟)
      { wch: 15 },  // 工作时长(格式化)
      { wch: 30 },  // 备注
      { wch: 15 },  // 公司名称
      { wch: 10 },  // 公司代码
      { wch: 20 }   // 创建时间
    ];
    worksheet['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    const sheetName = '打卡记录';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 生成Excel文件缓冲区
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `checkin_records_export_${timestamp}.xlsx`;
    
    // 设置响应头并发送文件
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('导出打卡记录失败:', error);
    res.status(500).json({
      success: false,
      message: `导出失败: ${error.message}`
    });
  }
};

/**
 * 批量删除打卡记录（软删除）
 */
const batchDeleteCheckinRecords = async (req, res) => {
  try {
    const { recordIds } = req.body;

    // 验证输入参数
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的记录ID数组'
      });
    }

    // 验证ID数组中的每个元素都是数字
    const invalidIds = recordIds.filter(id => isNaN(parseInt(id)));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `包含无效的记录ID: ${invalidIds.join(', ')}`
      });
    }

    // 使用事务确保批量操作的一致性
    const transaction = await CheckinRecord.sequelize.transaction();

    try {
      // 批量更新记录，设置 isActive 为 false（软删除）
      const [affectedCount] = await CheckinRecord.update(
        { isActive: false },
        {
          where: {
            id: { [Op.in]: recordIds },
            isActive: true // 只更新有效的记录
          },
          transaction
        }
      );

      // 提交事务
      await transaction.commit();

      res.json({
        success: true,
        message: `成功删除 ${affectedCount} 条打卡记录`,
        data: {
          deletedCount: affectedCount,
          totalRequested: recordIds.length
        }
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('批量删除打卡记录失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除打卡记录失败',
      error: error.message
    });
  }
};

module.exports = {
  checkin,
  checkout,
  getCheckinHistory,
  getTodayStatus,
  deleteCheckinRecord,
  exportCheckinRecords,
  batchDeleteCheckinRecords
};
