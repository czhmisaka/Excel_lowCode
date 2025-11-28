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
 * 签到逻辑
 */
const checkin = async (req, res) => {
  try {
    const { realName, phone, idCard, companyCode, location, remark } = req.body;
    
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
    
    // 2. 检查用户是否存在
    const user = await User.findOne({ 
      where: { 
        phone,
        isActive: true 
      } 
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在，请先注册或联系管理员'
      });
    }
    
    // 3. 检查今日是否已签到
    const { startOfDay, endOfDay } = getDayRange();
    
    const existingCheckin = await CheckinRecord.findOne({
      where: {
        userId: user.id,
        companyId: company.id,
        checkinType: 'checkin',
        checkinTime: { [Op.between]: [startOfDay, endOfDay] }
      }
    });
    
    if (existingCheckin) {
      return res.json({ 
        success: false, 
        message: '今日已签到，请勿重复签到' 
      });
    }
    
    // 4. 记录签到
    const checkinRecord = await CheckinRecord.create({
      userId: user.id,
      companyId: company.id,
      checkinType: 'checkin',
      checkinTime: new Date(),
      location,
      remark,
      deviceInfo: req.headers['user-agent']
    });
    
    res.json({ 
      success: true, 
      message: '签到成功',
      data: { 
        user: {
          id: user.id,
          realName: user.realName,
          phone: user.phone
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
    
    // 2. 获取用户信息
    const user = await User.findOne({ 
      where: { 
        phone,
        isActive: true 
      } 
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 3. 不再检查是否已签退，允许当天多次签退更新
    const { startOfDay, endOfDay } = getDayRange();
    
    // 4. 查找今日的签到记录
    const todayCheckin = await CheckinRecord.findOne({
      where: {
        userId: user.id,
        companyId: company.id,
        checkinType: 'checkin',
        checkinTime: { [Op.between]: [startOfDay, endOfDay] }
      }
    });
    
    if (!todayCheckin) {
      return res.status(400).json({
        success: false,
        message: '今日未签到，无法签退'
      });
    }
    
    // 5. 更新当天的签到记录，添加签退信息
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
          id: user.id,
          realName: user.realName,
          phone: user.phone
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
    const { userId, companyId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    if (userId) where.userId = userId;
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
          model: User,
          as: 'user',
          attributes: ['id', 'realName', 'phone', 'idCard']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
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
    const { userId, companyId } = req.query;
    
    const { startOfDay, endOfDay } = getDayRange();
    
    const todayRecords = await CheckinRecord.findAll({
      where: {
        userId,
        companyId,
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
 * 删除打卡记录
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

    // 删除打卡记录
    await record.destroy();

    res.json({
      success: true,
      message: '打卡记录删除成功'
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

module.exports = {
  checkin,
  checkout,
  getCheckinHistory,
  getTodayStatus,
  deleteCheckinRecord
};
