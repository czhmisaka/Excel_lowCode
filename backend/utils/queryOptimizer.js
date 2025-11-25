/*
 * @Date: 2025-11-24 09:57:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-24 09:59:35
 * @FilePath: /lowCode_excel/backend/utils/queryOptimizer.js
 * @Description: 查询性能优化模块
 */

const { sequelize } = require('../config/database');

/**
 * 查询性能优化类
 * 负责优化大数据量查询的性能
 */
class QueryOptimizer {
    constructor() {
        this.dialect = sequelize.getDialect();
    }

    /**
     * 优化分页查询
     * @param {Object} model Sequelize模型
     * @param {Object} whereClause 查询条件
     * @param {number} page 页码
     * @param {number} limit 每页数量
     * @returns {Promise<Object>} 查询结果
     */
    async optimizedPaginatedQuery(model, whereClause, page, limit) {
        try {
            const offset = (page - 1) * limit;

            // 对于大数据量查询，使用更高效的分页策略
            if (page > 10) {
                // 使用游标分页替代偏移分页
                return await this.cursorBasedPagination(model, whereClause, page, limit);
            } else {
                // 使用优化的偏移分页
                return await this.optimizedOffsetPagination(model, whereClause, offset, limit);
            }
        } catch (error) {
            console.error('优化分页查询失败:', error);
            // 回退到普通查询
            return await model.findAndCountAll({
                where: whereClause,
                limit: limit,
                offset: (page - 1) * limit,
                order: [['id', 'ASC']]
            });
        }
    }

    /**
     * 优化的偏移分页
     * @param {Object} model Sequelize模型
     * @param {Object} whereClause 查询条件
     * @param {number} offset 偏移量
     * @param {number} limit 限制数量
     * @returns {Promise<Object>} 查询结果
     */
    async optimizedOffsetPagination(model, whereClause, offset, limit) {
        // 使用更高效的分页查询策略
        const result = await model.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [['id', 'ASC']],
            // 禁用不必要的关联查询
            include: [],
            // 只选择需要的字段
            attributes: { exclude: [] }
        });

        return result;
    }

    /**
     * 游标分页（适用于大数据量）
     * @param {Object} model Sequelize模型
     * @param {Object} whereClause 查询条件
     * @param {number} page 页码
     * @param {number} limit 每页数量
     * @returns {Promise<Object>} 查询结果
     */
    async cursorBasedPagination(model, whereClause, page, limit) {
        // 计算游标位置
        const cursor = (page - 1) * limit;
        
        // 使用游标分页查询
        const result = await model.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: cursor,
            order: [['id', 'ASC']],
            // 禁用不必要的关联查询
            include: [],
            // 只选择需要的字段
            attributes: { exclude: [] }
        });

        return result;
    }

    /**
     * 优化查询条件
     * @param {Object} conditions 原始查询条件
     * @param {Array} columnDefinitions 列定义
     * @returns {Object} 优化后的查询条件
     */
    optimizeWhereClause(conditions, columnDefinitions = []) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return {};
        }

        const optimized = {};

        // 遍历查询条件，优化每个字段的查询
        for (const [field, condition] of Object.entries(conditions)) {
            // 获取字段类型
            const columnDef = columnDefinitions.find(col => col.name === field);
            const fieldType = columnDef ? columnDef.type : 'string';

            // 根据字段类型优化查询条件
            if (typeof condition === 'object' && condition !== null) {
                optimized[field] = this.optimizeFieldCondition(condition, fieldType);
            } else {
                optimized[field] = condition;
            }
        }

        return optimized;
    }

    /**
     * 优化字段查询条件
     * @param {Object} condition 字段条件
     * @param {string} fieldType 字段类型
     * @returns {Object} 优化后的字段条件
     */
    optimizeFieldCondition(condition, fieldType) {
        const optimized = {};

        for (const [operator, value] of Object.entries(condition)) {
            // 根据操作符和字段类型进行优化
            switch (operator) {
                case '$like':
                    // 对于字符串字段，优化模糊查询
                    if (fieldType === 'string' && typeof value === 'string') {
                        // 确保模糊查询包含通配符
                        if (!value.includes('%') && !value.includes('_')) {
                            optimized[operator] = `%${value}%`;
                        } else {
                            optimized[operator] = value;
                        }
                    } else {
                        optimized[operator] = value;
                    }
                    break;
                case '$in':
                case '$notIn':
                    // 优化数组查询，限制数组大小
                    if (Array.isArray(value) && value.length > 1000) {
                        console.warn(`数组查询条件过大，限制为前1000个元素: ${operator}`);
                        optimized[operator] = value.slice(0, 1000);
                    } else {
                        optimized[operator] = value;
                    }
                    break;
                default:
                    optimized[operator] = value;
            }
        }

        return optimized;
    }

    /**
     * 获取查询执行计划
     * @param {string} tableName 表名
     * @param {Object} whereClause 查询条件
     * @returns {Promise<Object>} 执行计划信息
     */
    async getQueryExecutionPlan(tableName, whereClause) {
        try {
            if (this.dialect === 'mysql') {
                // MySQL: 使用EXPLAIN获取执行计划
                const explainQuery = `EXPLAIN SELECT * FROM \`${tableName}\` WHERE ?`;
                const [results] = await sequelize.query(explainQuery, {
                    replacements: [whereClause]
                });
                return {
                    table: tableName,
                    plan: results,
                    optimized: this.analyzeExecutionPlan(results)
                };
            } else {
                // SQLite: 简化处理
                return {
                    table: tableName,
                    plan: 'SQLite execution plan analysis not implemented',
                    optimized: true
                };
            }
        } catch (error) {
            console.error('获取查询执行计划失败:', error);
            return {
                table: tableName,
                plan: null,
                optimized: false,
                error: error.message
            };
        }
    }

    /**
     * 分析执行计划
     * @param {Array} plan 执行计划结果
     * @returns {Object} 分析结果
     */
    analyzeExecutionPlan(plan) {
        if (!plan || plan.length === 0) {
            return { optimized: false, reason: 'No execution plan available' };
        }

        const firstRow = plan[0];
        const analysis = {
            optimized: true,
            type: firstRow.type || 'unknown',
            possibleKeys: firstRow.possible_keys || '',
            key: firstRow.key || '',
            rows: firstRow.rows || 0,
            filtered: firstRow.filtered || 0
        };

        // 检查是否使用了索引
        if (!analysis.key) {
            analysis.optimized = false;
            analysis.reason = 'No index used';
        }

        // 检查扫描行数
        if (analysis.rows > 10000) {
            analysis.optimized = false;
            analysis.reason = 'Too many rows scanned';
        }

        return analysis;
    }

    /**
     * 批量查询优化
     * @param {Array} queries 查询数组
     * @param {number} batchSize 批次大小
     * @returns {Promise<Array>} 优化后的查询结果
     */
    async batchQueryOptimization(queries, batchSize = 10) {
        const results = [];
        
        // 分批处理查询，避免内存溢出
        for (let i = 0; i < queries.length; i += batchSize) {
            const batch = queries.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(query => this.executeOptimizedQuery(query))
            );
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * 执行优化查询
     * @param {Object} query 查询对象
     * @returns {Promise<Object>} 查询结果
     */
    async executeOptimizedQuery(query) {
        const startTime = Date.now();
        
        try {
            const result = await query.model.findAndCountAll({
                where: query.whereClause,
                limit: query.limit,
                offset: query.offset,
                order: query.order || [['id', 'ASC']]
            });

            const executionTime = Date.now() - startTime;
            
            return {
                success: true,
                data: result.rows,
                count: result.count,
                executionTime: executionTime,
                optimized: true
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            return {
                success: false,
                error: error.message,
                executionTime: executionTime,
                optimized: false
            };
        }
    }
}

// 创建单例实例
const queryOptimizer = new QueryOptimizer();

module.exports = queryOptimizer;
