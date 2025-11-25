/*
 * @Date: 2025-11-23 18:02:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 22:22:19
 * @FilePath: /lowCode_excel/backend/utils/dynamicTableIndexManager.js
 * @Description: 动态表索引管理模块
 */

const { sequelize } = require('../config/database');

/**
 * 动态表索引管理类
 * 负责为动态生成的表创建和管理索引
 */
class DynamicTableIndexManager {
    constructor() {
        this.dialect = sequelize.getDialect();
        this.indexedTables = new Set();
    }

    /**
     * 为动态表创建索引
     * @param {string} tableName 表名
     * @param {Array} columnDefinitions 列定义
     * @returns {Promise<Object>} 索引创建结果
     */
    async createIndexesForTable(tableName, columnDefinitions) {
        try {
            console.log(`开始为表 ${tableName} 创建索引...`);

            const indexResults = {
                tableName: tableName,
                indexesCreated: [],
                indexesSkipped: [],
                errors: []
            };

            // 检查表是否存在
            const tableExists = await this.checkTableExists(tableName);
            if (!tableExists) {
                throw new Error(`表 ${tableName} 不存在`);
            }

            // 获取现有索引
            const existingIndexes = await this.getTableIndexes(tableName);

            // 为常用字段创建索引
            const indexConfigs = this.generateIndexConfigs(columnDefinitions);

            for (const indexConfig of indexConfigs) {
                try {
                    // 检查索引是否已存在
                    const indexExists = existingIndexes.some(index => 
                        index.name === indexConfig.name
                    );

                    if (indexExists) {
                        indexResults.indexesSkipped.push(indexConfig.name);
                        console.log(`索引已存在: ${indexConfig.name}`);
                        continue;
                    }

                    // 创建索引
                    await this.createIndex(tableName, indexConfig);
                    indexResults.indexesCreated.push(indexConfig.name);
                    console.log(`✅ 索引创建成功: ${indexConfig.name}`);

                } catch (error) {
                    const errorMsg = `创建索引 ${indexConfig.name} 失败: ${error.message}`;
                    indexResults.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }

            // 标记表已索引
            this.indexedTables.add(tableName);

            console.log(`表 ${tableName} 索引创建完成:`);
            console.log(`- 成功创建: ${indexResults.indexesCreated.length}`);
            console.log(`- 跳过已存在: ${indexResults.indexesSkipped.length}`);
            console.log(`- 失败: ${indexResults.errors.length}`);

            return indexResults;

        } catch (error) {
            console.error(`为表 ${tableName} 创建索引失败:`, error);
            throw error;
        }
    }

    /**
     * 生成索引配置
     * @param {Array} columnDefinitions 列定义
     * @returns {Array} 索引配置数组
     */
    generateIndexConfigs(columnDefinitions) {
        const indexConfigs = [];

        // 总是为 id 字段创建索引
        indexConfigs.push({
            name: `idx_${Date.now()}_id`,
            columns: ['id'],
            type: 'BTREE'
        });

        if (!columnDefinitions || !Array.isArray(columnDefinitions)) {
            return indexConfigs;
        }

        // 为常用查询字段创建索引
        for (const column of columnDefinitions) {
            const columnName = column.name;
            
            // 跳过 id 字段（已处理）
            if (columnName === 'id') continue;

            // 根据字段类型和名称判断是否需要索引
            if (this.shouldCreateIndex(column)) {
                indexConfigs.push({
                    name: `idx_${Date.now()}_${columnName}`,
                    columns: [columnName],
                    type: 'BTREE'
                });
            }

            // 为日期时间字段创建索引
            if (column.type && column.type.toLowerCase().includes('date')) {
                indexConfigs.push({
                    name: `idx_${Date.now()}_${columnName}_date`,
                    columns: [columnName],
                    type: 'BTREE'
                });
            }
        }

        return indexConfigs;
    }

    /**
     * 判断是否应为字段创建索引
     * @param {Object} column 列定义
     * @returns {boolean} 是否创建索引
     */
    shouldCreateIndex(column) {
        const columnName = column.name.toLowerCase();
        const columnType = column.type ? column.type.toLowerCase() : '';

        // 常见需要索引的字段名模式
        const indexedNamePatterns = [
            'name', 'title', 'code', 'no', 'number', 'id', 'key',
            'date', 'time', 'created', 'updated', 'status', 'type',
            'category', 'user', 'customer', 'order', 'product'
        ];

        // 常见需要索引的字段类型
        const indexedTypes = ['varchar', 'char', 'int', 'integer', 'bigint', 'datetime', 'timestamp'];

        // 检查字段名是否匹配模式
        const nameMatch = indexedNamePatterns.some(pattern => 
            columnName.includes(pattern)
        );

        // 检查字段类型是否匹配
        const typeMatch = indexedTypes.some(type => 
            columnType.includes(type)
        );

        return nameMatch || typeMatch;
    }

    /**
     * 创建索引
     * @param {string} tableName 表名
     * @param {Object} indexConfig 索引配置
     */
    async createIndex(tableName, indexConfig) {
        const columns = indexConfig.columns.map(col => 
            this.dialect === 'sqlite' ? `"${col}"` : `\`${col}\``
        ).join(', ');

        let sql;
        if (this.dialect === 'sqlite') {
            sql = `CREATE INDEX IF NOT EXISTS "${indexConfig.name}" ON "${tableName}" (${columns})`;
        } else {
            sql = `CREATE INDEX \`${indexConfig.name}\` ON \`${tableName}\` (${columns})`;
        }

        await sequelize.query(sql);
    }

    /**
     * 获取表的索引信息
     * @param {string} tableName 表名
     * @returns {Promise<Array>} 索引数组
     */
    async getTableIndexes(tableName) {
        try {
            if (this.dialect === 'sqlite') {
                const [results] = await sequelize.query(
                    `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name = ?`,
                    {
                        replacements: [tableName],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                // SQLite 返回的是对象数组，需要转换为索引名数组
                if (Array.isArray(results)) {
                    return results.map(item => ({ name: item.name }));
                }
                return [];
            } else {
                const [results] = await sequelize.query(
                    `SELECT INDEX_NAME as name FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
                    {
                        replacements: [sequelize.config.database, tableName],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                return results || [];
            }
        } catch (error) {
            console.error(`获取表 ${tableName} 索引失败:`, error);
            return [];
        }
    }

    /**
     * 检查表是否存在
     * @param {string} tableName 表名
     * @returns {Promise<boolean>} 表是否存在
     */
    async checkTableExists(tableName) {
        try {
            if (this.dialect === 'sqlite') {
                const [results] = await sequelize.query(
                    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
                    {
                        replacements: [tableName],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                return !!results;
            } else {
                const [results] = await sequelize.query(
                    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
                    {
                        replacements: [sequelize.config.database, tableName],
                        type: sequelize.QueryTypes.SELECT
                    }
                );
                return !!results;
            }
        } catch (error) {
            console.error(`检查表 ${tableName} 是否存在失败:`, error);
            return false;
        }
    }

    /**
     * 删除表的索引
     * @param {string} tableName 表名
     * @param {string} indexName 索引名
     */
    async dropIndex(tableName, indexName) {
        try {
            let sql;
            if (this.dialect === 'sqlite') {
                sql = `DROP INDEX IF EXISTS "${indexName}"`;
            } else {
                sql = `DROP INDEX \`${indexName}\` ON \`${tableName}\``;
            }

            await sequelize.query(sql);
            console.log(`✅ 索引删除成功: ${indexName}`);
        } catch (error) {
            console.error(`删除索引 ${indexName} 失败:`, error);
            throw error;
        }
    }

    /**
     * 优化表索引（删除冗余索引）
     * @param {string} tableName 表名
     * @returns {Promise<Object>} 优化结果
     */
    async optimizeTableIndexes(tableName) {
        try {
            console.log(`开始优化表 ${tableName} 的索引...`);

            const existingIndexes = await this.getTableIndexes(tableName);
            const optimizationReport = {
                tableName: tableName,
                indexesRemoved: [],
                indexesKept: [],
                errors: []
            };

            // 分析索引冗余情况（简化版本）
            // 在实际项目中，这里应该实现更复杂的索引分析逻辑
            const redundantIndexes = this.analyzeRedundantIndexes(existingIndexes);

            for (const indexName of redundantIndexes) {
                try {
                    await this.dropIndex(tableName, indexName);
                    optimizationReport.indexesRemoved.push(indexName);
                } catch (error) {
                    const errorMsg = `删除冗余索引 ${indexName} 失败: ${error.message}`;
                    optimizationReport.errors.push(errorMsg);
                }
            }

            // 保留的索引
            optimizationReport.indexesKept = existingIndexes
                .filter(index => !redundantIndexes.includes(index.name))
                .map(index => index.name);

            console.log(`表 ${tableName} 索引优化完成:`);
            console.log(`- 保留索引: ${optimizationReport.indexesKept.length}`);
            console.log(`- 删除冗余索引: ${optimizationReport.indexesRemoved.length}`);
            console.log(`- 错误: ${optimizationReport.errors.length}`);

            return optimizationReport;

        } catch (error) {
            console.error(`优化表 ${tableName} 索引失败:`, error);
            throw error;
        }
    }

    /**
     * 分析冗余索引（简化版本）
     * @param {Array} indexes 索引数组
     * @returns {Array} 冗余索引名数组
     */
    analyzeRedundantIndexes(indexes) {
        // 在实际项目中，这里应该实现复杂的索引分析逻辑
        // 这里简化处理：删除以 "idx_" 开头的时间戳索引
        const redundant = [];
        const timestampPattern = /idx_\d{13}_/;

        for (const index of indexes) {
            if (timestampPattern.test(index.name)) {
                redundant.push(index.name);
            }
        }

        return redundant;
    }

    /**
     * 获取表索引统计信息
     * @param {string} tableName 表名
     * @returns {Promise<Object>} 索引统计
     */
    async getIndexStats(tableName) {
        try {
            const indexes = await this.getTableIndexes(tableName);
            
            return {
                tableName: tableName,
                totalIndexes: indexes.length,
                indexes: indexes.map(index => index.name),
                isIndexed: this.indexedTables.has(tableName),
                lastChecked: new Date().toISOString()
            };
        } catch (error) {
            console.error(`获取表 ${tableName} 索引统计失败:`, error);
            throw error;
        }
    }
}

// 创建单例实例
const dynamicTableIndexManager = new DynamicTableIndexManager();

module.exports = dynamicTableIndexManager;
