/*
 * @Date: 2025-11-23 01:55:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 15:50:04
 * @FilePath: /lowCode_excel/backend/utils/cacheService.js
 */
const { LRUCache } = require('lru-cache');
const Redis = require('ioredis');
const crypto = require('crypto');
const cacheConfig = require('../config/cache');

/**
 * 缓存服务类
 */
class CacheService {
    constructor() {
        this.config = cacheConfig;
        this.memoryCache = null;
        this.redisClient = null;
        this.memoryCacheEnabled = true;
        this.currentMemoryUsage = 0;
        this.stats = {
            memoryHits: 0,
            memoryMisses: 0,
            redisHits: 0,
            redisMisses: 0,
            totalQueries: 0,
            lastReset: new Date()
        };

        this.initialize();
    }

    /**
     * 初始化缓存服务
     */
    initialize() {
        if (!this.config.enabled) {
            console.log('缓存服务已禁用');
            return;
        }

        // 延迟初始化内存缓存，避免启动时内存压力
        setTimeout(() => {
            this.initializeMemoryCache();
        }, 5000); // 延迟5秒初始化

        // 延迟初始化Redis客户端
        if (this.config.redis.enabled) {
            setTimeout(() => {
                this.initializeRedis();
            }, 3000); // 延迟3秒初始化
        }

        // 延迟启动统计定时器
        if (this.config.stats.enabled) {
            setTimeout(() => {
                this.startStatsTimer();
            }, 10000); // 延迟10秒启动
        }

        console.log('缓存服务初始化计划完成（延迟初始化）');
    }

    /**
     * 初始化内存缓存
     */
    initializeMemoryCache() {
        this.memoryCache = new LRUCache({
            max: this.config.memory.maxMemory,
            length: (value, key) => {
                return this.calculateEntrySize(key, value);
            },
            maxAge: this.config.memory.defaultTTL,
            updateAgeOnGet: true
        });

        // 监听内存使用变化 - 使用dispose回调替代on事件
        // lru-cache v11+ 使用dispose回调而不是on事件
        // 注意：这里我们无法直接监听淘汰事件，因为lru-cache v11+移除了事件系统
        // 我们将在删除条目时手动更新内存使用统计
    }

    /**
     * 初始化Redis客户端
     */
    initializeRedis() {
        try {
            const redisOptions = {
                connectTimeout: this.config.redis.connectTimeout,
                commandTimeout: this.config.redis.commandTimeout,
                retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
                maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
                lazyConnect: true
            };

            if (this.config.redis.password) {
                redisOptions.password = this.config.redis.password;
            }

            this.redisClient = new Redis(this.config.redis.url, redisOptions);

            this.redisClient.on('connect', () => {
                console.log('Redis连接成功');
            });

            this.redisClient.on('error', (error) => {
                console.error('Redis连接错误:', error.message);
            });

            this.redisClient.on('close', () => {
                console.log('Redis连接关闭');
            });

        } catch (error) {
            console.error('Redis初始化失败:', error.message);
            this.redisClient = null;
        }
    }

    /**
     * 计算缓存条目大小
     */
    calculateEntrySize(key, value) {
        try {
            const keySize = Buffer.byteLength(key, 'utf8');
            const valueSize = Buffer.byteLength(JSON.stringify(value), 'utf8');
            return keySize + valueSize;
        } catch (error) {
            console.error('计算缓存条目大小失败:', error);
            return 1024; // 默认1KB
        }
    }

    /**
     * 检查是否可以使用内存缓存
     */
    canUseMemoryCache() {
        return this.memoryCacheEnabled && this.currentMemoryUsage < this.config.memory.maxMemory;
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(type, ...parts) {
        const prefix = this.config.keyPrefix[type] || 'cache:';
        const key = parts.join(':');
        
        // 对长键进行哈希处理
        if (key.length > 100) {
            const hash = crypto.createHash('md5').update(key).digest('hex');
            return `${prefix}${hash}`;
        }
        
        return `${prefix}${key}`;
    }

    /**
     * 获取数据缓存键
     */
    getDataCacheKey(hash, page, limit, search) {
        let searchHash = '';
        if (search) {
            try {
                const searchObj = typeof search === 'string' ? JSON.parse(search) : search;
                searchHash = crypto.createHash('md5').update(JSON.stringify(searchObj)).digest('hex');
            } catch (error) {
                searchHash = crypto.createHash('md5').update(String(search)).digest('hex');
            }
        }
        
        return this.generateCacheKey('data', hash, page, limit, searchHash);
    }

    /**
     * 获取表信息缓存键
     */
    getTableInfoCacheKey(hash) {
        return this.generateCacheKey('table', hash);
    }

    /**
     * 获取映射关系缓存键
     */
    getMappingsCacheKey() {
        return this.generateCacheKey('mapping', 'all');
    }

    /**
     * 从缓存获取数据
     */
    async get(key) {
        if (!this.config.enabled) {
            return null;
        }

        this.stats.totalQueries++;

        // 1. 尝试从内存缓存获取
        if (this.canUseMemoryCache()) {
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue !== undefined) {
                this.stats.memoryHits++;
                return memoryValue;
            }
            this.stats.memoryMisses++;
        }

        // 2. 尝试从Redis获取
        if (this.redisClient) {
            try {
                const redisValue = await this.redisClient.get(key);
                if (redisValue) {
                    const parsedValue = JSON.parse(redisValue);
                    
                    // 如果内存缓存可用，将Redis结果存入内存
                    if (this.canUseMemoryCache()) {
                        this.setMemoryCache(key, parsedValue);
                    }
                    
                    this.stats.redisHits++;
                    return parsedValue;
                }
                this.stats.redisMisses++;
            } catch (error) {
                console.error('从Redis获取数据失败:', error.message);
            }
        }

        return null;
    }

    /**
     * 设置内存缓存
     */
    setMemoryCache(key, value) {
        if (!this.canUseMemoryCache()) {
            return false;
        }

        try {
            const entrySize = this.calculateEntrySize(key, value);
            
            // 检查内存是否足够
            if (this.currentMemoryUsage + entrySize > this.config.memory.maxMemory) {
                // 尝试清理一些空间
                const cleanupSize = Math.min(this.config.memory.maxMemory * 0.2, entrySize * 2);
                this.cleanupMemoryCache(cleanupSize);
                
                // 清理后再次检查
                if (this.currentMemoryUsage + entrySize > this.config.memory.maxMemory) {
                    console.log(`内存不足，禁用内存缓存。当前使用: ${this.currentMemoryUsage} 字节`);
                    this.memoryCacheEnabled = false;
                    return false;
                }
            }

            this.memoryCache.set(key, value);
            this.currentMemoryUsage += entrySize;
            return true;
        } catch (error) {
            console.error('设置内存缓存失败:', error);
            return false;
        }
    }

    /**
     * 设置缓存数据
     */
    async set(key, value, ttl = null) {
        if (!this.config.enabled) {
            return false;
        }

        const cacheTTL = ttl || this.config.memory.defaultTTL;

        try {
            // 设置内存缓存
            const memorySuccess = this.setMemoryCache(key, value);

            // 设置Redis缓存
            let redisSuccess = false;
            if (this.redisClient) {
                try {
                    await this.redisClient.setex(key, Math.floor(cacheTTL / 1000), JSON.stringify(value));
                    redisSuccess = true;
                } catch (error) {
                    console.error('设置Redis缓存失败:', error.message);
                }
            }

            return memorySuccess || redisSuccess;
        } catch (error) {
            console.error('设置缓存失败:', error);
            return false;
        }
    }

    /**
     * 清理内存缓存空间
     */
    cleanupMemoryCache(targetSize) {
        try {
            const currentSize = this.currentMemoryUsage;
            if (currentSize <= targetSize) {
                return;
            }

            // LRU缓存会自动淘汰最旧的条目
            // 这里我们手动触发一些清理
            const keysToRemove = [];
            let removedSize = 0;
            const targetRemoval = currentSize - targetSize;

            for (const [key, value] of this.memoryCache.entries()) {
                if (removedSize >= targetRemoval) {
                    break;
                }
                
                const entrySize = this.calculateEntrySize(key, value);
                keysToRemove.push(key);
                removedSize += entrySize;
            }

            // 删除选中的键
            keysToRemove.forEach(key => {
                this.memoryCache.del(key);
            });

            console.log(`清理内存缓存: 移除了 ${keysToRemove.length} 个条目, 释放 ${removedSize} 字节`);

            // 如果清理后内存使用降到阈值以下，重新启用内存缓存
            if (this.currentMemoryUsage < this.config.memory.maxMemory * 0.8) {
                this.memoryCacheEnabled = true;
            }
        } catch (error) {
            console.error('清理内存缓存失败:', error);
        }
    }

    /**
     * 删除缓存数据
     */
    async delete(key) {
        if (!this.config.enabled) {
            return false;
        }

        try {
            // 从内存缓存删除
            if (this.memoryCache) {
                const value = this.memoryCache.get(key);
                if (value !== undefined) {
                    const entrySize = this.calculateEntrySize(key, value);
                    this.memoryCache.del(key);
                    this.currentMemoryUsage -= entrySize;
                }
            }

            // 从Redis删除
            if (this.redisClient) {
                try {
                    await this.redisClient.del(key);
                } catch (error) {
                    console.error('从Redis删除数据失败:', error.message);
                }
            }

            return true;
        } catch (error) {
            console.error('删除缓存失败:', error);
            return false;
        }
    }

    /**
     * 清除表相关的所有缓存
     */
    async clearTableCache(hash) {
        if (!this.config.enabled) {
            return false;
        }

        try {
            const pattern = `${this.config.keyPrefix.data}${hash}:*`;
            
            // 从内存缓存清除
            if (this.memoryCache) {
                const keysToDelete = [];
                for (const [key] of this.memoryCache.entries()) {
                    if (key.startsWith(pattern)) {
                        keysToDelete.push(key);
                    }
                }
                
                keysToDelete.forEach(key => {
                    const value = this.memoryCache.get(key);
                    if (value !== undefined) {
                        const entrySize = this.calculateEntrySize(key, value);
                        this.memoryCache.del(key);
                        this.currentMemoryUsage -= entrySize;
                    }
                });
            }

            // 从Redis清除
            if (this.redisClient) {
                try {
                    const keys = await this.redisClient.keys(pattern);
                    if (keys.length > 0) {
                        await this.redisClient.del(...keys);
                    }
                } catch (error) {
                    console.error('从Redis清除表缓存失败:', error.message);
                }
            }

            // 清除表信息缓存
            const tableInfoKey = this.getTableInfoCacheKey(hash);
            await this.delete(tableInfoKey);

            console.log(`清除表缓存完成: ${hash}`);
            return true;
        } catch (error) {
            console.error('清除表缓存失败:', error);
            return false;
        }
    }

    /**
     * 清除所有缓存
     */
    async clearAll() {
        if (!this.config.enabled) {
            return false;
        }

        try {
            // 清除内存缓存
            if (this.memoryCache) {
                this.memoryCache.reset();
                this.currentMemoryUsage = 0;
                this.memoryCacheEnabled = true;
            }

            // 清除Redis缓存
            if (this.redisClient) {
                try {
                    await this.redisClient.flushdb();
                } catch (error) {
                    console.error('清除Redis缓存失败:', error.message);
                }
            }

            console.log('所有缓存已清除');
            return true;
        } catch (error) {
            console.error('清除所有缓存失败:', error);
            return false;
        }
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        const memoryHitRate = this.stats.memoryHits + this.stats.memoryMisses > 0 
            ? (this.stats.memoryHits / (this.stats.memoryHits + this.stats.memoryMisses) * 100).toFixed(2)
            : 0;
        
        const redisHitRate = this.stats.redisHits + this.stats.redisMisses > 0
            ? (this.stats.redisHits / (this.stats.redisHits + this.stats.redisMisses) * 100).toFixed(2)
            : 0;

        const totalHits = this.stats.memoryHits + this.stats.redisHits;
        const totalMisses = this.stats.memoryMisses + this.stats.redisMisses;
        const totalRate = totalHits + totalMisses > 0
            ? (totalHits / (totalHits + totalMisses) * 100).toFixed(2)
            : 0;

        return {
            enabled: this.config.enabled,
            memoryCache: {
                enabled: this.memoryCacheEnabled,
                currentUsage: this.currentMemoryUsage,
                maxUsage: this.config.memory.maxMemory,
                usagePercentage: ((this.currentMemoryUsage / this.config.memory.maxMemory) * 100).toFixed(2),
                hits: this.stats.memoryHits,
                misses: this.stats.memoryMisses,
                hitRate: memoryHitRate
            },
            redisCache: {
                enabled: this.config.redis.enabled && this.redisClient !== null,
                connected: this.redisClient ? this.redisClient.status === 'ready' : false,
                hits: this.stats.redisHits,
                misses: this.stats.redisMisses,
                hitRate: redisHitRate
            },
            overall: {
                totalQueries: this.stats.totalQueries,
                totalHits: totalHits,
                totalMisses: totalMisses,
                hitRate: totalRate,
                lastReset: this.stats.lastReset
            }
        };
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            memoryHits: 0,
            memoryMisses: 0,
            redisHits: 0,
            redisMisses: 0,
            totalQueries: 0,
            lastReset: new Date()
        };
    }

    /**
     * 启动统计定时器
     */
    startStatsTimer() {
        setInterval(() => {
            const stats = this.getStats();
            console.log('缓存统计:', JSON.stringify(stats, null, 2));
        }, this.config.stats.interval);
    }

    /**
     * 关闭缓存服务
     */
    async close() {
        if (this.memoryCache) {
            this.memoryCache.reset();
        }

        if (this.redisClient) {
            await this.redisClient.quit();
        }

        console.log('缓存服务已关闭');
    }
}

// 创建全局缓存服务实例
const cacheService = new CacheService();

module.exports = cacheService;
