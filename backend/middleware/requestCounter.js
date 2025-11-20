/*
 * @Date: 2025-11-20 16:30:44
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-20 16:31:06
 * @FilePath: /lowCode_excel/backend/middleware/requestCounter.js
 */
/**
 * 请求计数器中间件
 * 用于统计每分钟请求次数
 */

// 请求时间戳队列（存储最近60秒内的请求时间戳）
let requestTimestamps = [];

/**
 * 清理过期的时间戳（超过60秒的）
 */
function cleanupExpiredTimestamps() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 60秒前
    
    // 过滤掉超过60秒的时间戳
    requestTimestamps = requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
}

/**
 * 获取每分钟请求数
 * @returns {number} 每分钟请求数
 */
function getRequestsPerMinute() {
    cleanupExpiredTimestamps();
    return requestTimestamps.length;
}

/**
 * 请求计数器中间件
 */
const requestCounter = (req, res, next) => {
    // 记录当前请求的时间戳
    const now = Date.now();
    requestTimestamps.push(now);
    
    // 清理过期的时间戳
    cleanupExpiredTimestamps();
    
    // 继续处理请求
    next();
};

module.exports = {
    requestCounter,
    getRequestsPerMinute
};
