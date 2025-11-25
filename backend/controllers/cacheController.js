/*
 * @Date: 2025-11-23 02:03:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 02:04:12
 * @FilePath: /lowCode_excel/backend/controllers/cacheController.js
 */
const cacheService = require('../utils/cacheService');

/**
 * 获取缓存统计信息
 */
const getCacheStats = async (req, res) => {
    try {
        const stats = cacheService.getStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('获取缓存统计信息错误:', error);
        res.status(500).json({
            success: false,
            message: `获取缓存统计信息失败: ${error.message}`
        });
    }
};

/**
 * 重置缓存统计信息
 */
const resetCacheStats = async (req, res) => {
    try {
        cacheService.resetStats();

        res.json({
            success: true,
            message: '缓存统计信息已重置'
        });

    } catch (error) {
        console.error('重置缓存统计信息错误:', error);
        res.status(500).json({
            success: false,
            message: `重置缓存统计信息失败: ${error.message}`
        });
    }
};

/**
 * 清除指定表的缓存
 */
const clearTableCache = async (req, res) => {
    try {
        const { hash } = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: '表哈希值不能为空'
            });
        }

        const result = await cacheService.clearTableCache(hash);

        if (result) {
            res.json({
                success: true,
                message: `表 ${hash} 的缓存已清除`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '清除表缓存失败'
            });
        }

    } catch (error) {
        console.error('清除表缓存错误:', error);
        res.status(500).json({
            success: false,
            message: `清除表缓存失败: ${error.message}`
        });
    }
};

/**
 * 清除所有缓存
 */
const clearAllCache = async (req, res) => {
    try {
        const result = await cacheService.clearAll();

        if (result) {
            res.json({
                success: true,
                message: '所有缓存已清除'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '清除所有缓存失败'
            });
        }

    } catch (error) {
        console.error('清除所有缓存错误:', error);
        res.status(500).json({
            success: false,
            message: `清除所有缓存失败: ${error.message}`
        });
    }
};

/**
 * 获取缓存状态
 */
const getCacheStatus = async (req, res) => {
    try {
        const stats = cacheService.getStats();

        const status = {
            enabled: stats.enabled,
            memoryCache: {
                enabled: stats.memoryCache.enabled,
                usage: `${stats.memoryCache.usagePercentage}%`,
                hitRate: `${stats.memoryCache.hitRate}%`
            },
            redisCache: {
                enabled: stats.redisCache.enabled,
                connected: stats.redisCache.connected,
                hitRate: `${stats.redisCache.hitRate}%`
            },
            overall: {
                hitRate: `${stats.overall.hitRate}%`,
                totalQueries: stats.overall.totalQueries
            }
        };

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('获取缓存状态错误:', error);
        res.status(500).json({
            success: false,
            message: `获取缓存状态失败: ${error.message}`
        });
    }
};

module.exports = {
    getCacheStats,
    resetCacheStats,
    clearTableCache,
    clearAllCache,
    getCacheStatus
};
