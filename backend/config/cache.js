/*
 * @Date: 2025-11-23 01:55:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 15:51:36
 * @FilePath: /lowCode_excel/backend/config/cache.js
 */
require('dotenv').config();

/**
 * 缓存配置
 */
const cacheConfig = {
    // 是否启用缓存
    enabled: false, // 暂时禁用缓存以测试内存泄漏
    
    // 内存缓存配置
    memory: {
        // 最大内存使用（字节）
        maxMemory: parseInt(process.env.CACHE_MAX_MEMORY) || 100 * 1024 * 1024, // 100MB
        // 缓存条目默认TTL（毫秒）
        defaultTTL: parseInt(process.env.CACHE_TTL) || 5 * 60 * 1000, // 5分钟
        // 检查间隔（毫秒）
        checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60 * 1000, // 1分钟
    },
    
    // Redis配置
    redis: {
        // 是否启用Redis
        enabled: process.env.REDIS_ENABLED === 'true',
        // Redis连接URL
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        // Redis密码
        password: process.env.REDIS_PASSWORD,
        // 连接超时（毫秒）
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
        // 命令超时（毫秒）
        commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
        // 重试策略
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
    },
    
    // 缓存键前缀
    keyPrefix: {
        data: 'cache:data:',
        table: 'cache:table:',
        mapping: 'cache:mapping:',
    },
    
    // 缓存统计配置
    stats: {
        // 是否启用统计
        enabled: process.env.CACHE_STATS_ENABLED !== 'false',
        // 统计间隔（毫秒）
        interval: parseInt(process.env.CACHE_STATS_INTERVAL) || 60000, // 1分钟
    }
};

module.exports = cacheConfig;
