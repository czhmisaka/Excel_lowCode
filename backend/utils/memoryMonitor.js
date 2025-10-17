/*
 * @Date: 2025-10-17 11:05:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-17 11:06:22
 * @FilePath: /lowCode_excel/backend/utils/memoryMonitor.js
 */

/**
 * 内存监控工具 - 用于监控和处理大文件时的内存使用
 */
class MemoryMonitor {
    constructor(options = {}) {
        this.options = {
            warningThreshold: options.warningThreshold || 0.8, // 80%内存使用警告
            criticalThreshold: options.criticalThreshold || 0.9, // 90%内存使用临界值
            maxHeapSize: options.maxHeapSize || 1024 * 1024 * 1024, // 默认1GB
            checkInterval: options.checkInterval || 5000, // 5秒检查一次
            ...options
        };

        this.isMonitoring = false;
        this.monitorInterval = null;
        this.listeners = {
            warning: [],
            critical: [],
            normal: []
        };
    }

    /**
     * 获取当前内存使用情况
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: usage.rss, // Resident Set Size
            heapTotal: usage.heapTotal,
            heapUsed: usage.heapUsed,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers,
            timestamp: Date.now()
        };
    }

    /**
     * 获取内存使用百分比
     */
    getMemoryUsagePercentage() {
        const usage = this.getMemoryUsage();
        return {
            heapUsedPercentage: usage.heapUsed / usage.heapTotal,
            rssPercentage: usage.rss / this.options.maxHeapSize,
            overall: Math.max(usage.heapUsed / usage.heapTotal, usage.rss / this.options.maxHeapSize)
        };
    }

    /**
     * 检查内存状态
     */
    checkMemoryStatus() {
        const percentages = this.getMemoryUsagePercentage();
        const status = {
            level: 'normal',
            message: '内存使用正常',
            percentages,
            usage: this.getMemoryUsage()
        };

        if (percentages.overall >= this.options.criticalThreshold) {
            status.level = 'critical';
            status.message = `内存使用达到临界值: ${(percentages.overall * 100).toFixed(2)}%`;
            this.emit('critical', status);
        } else if (percentages.overall >= this.options.warningThreshold) {
            status.level = 'warning';
            status.message = `内存使用达到警告值: ${(percentages.overall * 100).toFixed(2)}%`;
            this.emit('warning', status);
        } else {
            this.emit('normal', status);
        }

        return status;
    }

    /**
     * 开始内存监控
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('内存监控已经在运行中');
            return;
        }

        this.isMonitoring = true;
        console.log('开始内存监控...');

        this.monitorInterval = setInterval(() => {
            const status = this.checkMemoryStatus();

            if (status.level === 'critical') {
                console.error(`内存临界警告: ${status.message}`);
                console.error('内存使用详情:', status.usage);

                // 在临界状态下尝试强制垃圾回收
                if (global.gc) {
                    console.log('执行强制垃圾回收...');
                    global.gc();
                }
            } else if (status.level === 'warning') {
                console.warn(`内存警告: ${status.message}`);
            }
        }, this.options.checkInterval);
    }

    /**
     * 停止内存监控
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.isMonitoring = false;
        console.log('停止内存监控');
    }

    /**
     * 强制垃圾回收（如果可用）
     */
    forceGarbageCollection() {
        if (global.gc) {
            console.log('执行强制垃圾回收...');
            global.gc();
            return true;
        } else {
            console.warn('强制垃圾回收不可用，请使用 --expose-gc 启动Node.js');
            return false;
        }
    }

    /**
     * 检查是否应该暂停处理以避免内存溢出
     */
    shouldPauseProcessing() {
        const percentages = this.getMemoryUsagePercentage();
        return percentages.overall >= this.options.criticalThreshold;
    }

    /**
     * 等待内存释放
     */
    async waitForMemoryRelease(targetPercentage = 0.7, timeout = 30000) {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const percentages = this.getMemoryUsagePercentage();

                if (percentages.overall <= targetPercentage) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`等待内存释放超时，当前使用率: ${(percentages.overall * 100).toFixed(2)}%`));
                } else {
                    // 尝试强制垃圾回收
                    this.forceGarbageCollection();
                }
            }, 1000);
        });
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`内存监控事件处理错误: ${error.message}`);
                }
            });
        }
    }

    /**
     * 获取监控报告
     */
    getReport() {
        const usage = this.getMemoryUsage();
        const percentages = this.getMemoryUsagePercentage();

        return {
            timestamp: new Date().toISOString(),
            isMonitoring: this.isMonitoring,
            memoryUsage: {
                rss: this.formatBytes(usage.rss),
                heapTotal: this.formatBytes(usage.heapTotal),
                heapUsed: this.formatBytes(usage.heapUsed),
                external: this.formatBytes(usage.external),
                arrayBuffers: this.formatBytes(usage.arrayBuffers)
            },
            memoryPercentages: {
                heapUsed: `${(percentages.heapUsedPercentage * 100).toFixed(2)}%`,
                rss: `${(percentages.rssPercentage * 100).toFixed(2)}%`,
                overall: `${(percentages.overall * 100).toFixed(2)}%`
            },
            thresholds: {
                warning: `${(this.options.warningThreshold * 100).toFixed(2)}%`,
                critical: `${(this.options.criticalThreshold * 100).toFixed(2)}%`
            },
            status: this.checkMemoryStatus()
        };
    }

    /**
     * 格式化字节大小
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 销毁监控器
     */
    destroy() {
        this.stopMonitoring();
        this.listeners = {
            warning: [],
            critical: [],
            normal: []
        };
    }
}

// 创建全局内存监控实例
const globalMemoryMonitor = new MemoryMonitor();

module.exports = {
    MemoryMonitor,
    globalMemoryMonitor
};
