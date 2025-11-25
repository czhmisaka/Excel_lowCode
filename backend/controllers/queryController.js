const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const cacheService = require('../utils/cacheService');
const dynamicTableIndexManager = require('../utils/dynamicTableIndexManager');
const queryOptimizer = require('../utils/queryOptimizer');

/**
 * 获取所有映射关系
 */
const getMappings = async (req, res) => {
    try {
        const mappings = await TableMapping.findAll({
            attributes: ['id', 'tableName', 'hashValue', 'originalFileName', 'columnCount', 'rowCount', 'headerRow', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: mappings,
            total: mappings.length
        });

    } catch (error) {
        console.error('获取映射关系错误:', error);
        res.status(500).json({
            success: false,
            message: `获取映射关系失败: ${error.message}`
        });
    }
};

/**
 * 查询数据（带缓存支持）
 */
const queryData = async (req, res) => {
    try {
        const { hash } = req.params;
        const { page = 1, limit = 10, search } = req.query;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 生成缓存键
        const cacheKey = cacheService.getDataCacheKey(hash, page, limit, search);

        // 尝试从缓存获取数据
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult) {
            console.log(`缓存命中: ${cacheKey}`);
            return res.json(cachedResult);
        }

        console.log(`缓存未命中: ${cacheKey}, 从数据库查询`);

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 确保columnDefinitions是数组格式
        let columnDefinitions = mapping.columnDefinitions;
        if (typeof columnDefinitions === 'string') {
            try {
                columnDefinitions = JSON.parse(columnDefinitions);
            } catch (error) {
                console.error('解析columnDefinitions失败:', error);
                return res.status(500).json({
                    success: false,
                    message: '列定义数据格式错误'
                });
            }
        }

        // 获取动态表模型 - 使用统一的表名格式：data_${hash}
        const actualTableName = `data_${hash}`;
        const DynamicModel = getDynamicModel(hash, columnDefinitions, actualTableName);

        // 为动态表自动创建索引（异步执行，不阻塞查询）
        createIndexesForTableAsync(actualTableName, columnDefinitions);

        // 构建查询条件
        const whereClause = {};
        let hasNumberLikeCondition = false;

        if (search) {
            try {
                const searchConditions = JSON.parse(search);

                // 递归转换查询条件
                const convertConditions = (conditions, columnDefs = columnDefinitions) => {
                    const converted = {};

                    for (const [field, condition] of Object.entries(conditions)) {
                        // 处理特殊操作符 ($or, $and 等)
                        if (field === '$or') {
                            if (Array.isArray(condition)) {
                                // 递归处理嵌套条件，使用 Sequelize Op.or
                                converted[Op.or] = condition.map(nestedCondition =>
                                    convertConditions(nestedCondition, columnDefs)
                                );
                            } else {
                                throw new Error('$or 操作符的值必须是数组');
                            }
                        } else if (field === '$and') {
                            if (Array.isArray(condition)) {
                                // 递归处理嵌套条件，使用 Sequelize Op.and
                                converted[Op.and] = condition.map(nestedCondition =>
                                    convertConditions(nestedCondition, columnDefs)
                                );
                            } else {
                                throw new Error('$and 操作符的值必须是数组');
                            }
                        } else if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
                            // 处理普通字段条件
                            const fieldCondition = {};

                            // 获取字段类型
                            let fieldType = 'string'; // 默认字符串类型
                            if (columnDefs && Array.isArray(columnDefs)) {
                                const columnDef = columnDefs.find(col => col.name === field);
                                if (columnDef && columnDef.type) {
                                    fieldType = columnDef.type;
                                }
                            }

                            for (const [operator, value] of Object.entries(condition)) {
                                // 特殊处理数字字段的 $like 操作符
                                if (operator === '$like' && fieldType === 'number') {
                                    // 对于数字字段的模糊查询，标记需要特殊处理
                                    hasNumberLikeCondition = true;
                                    fieldCondition[Op.like] = value;
                                } else {
                                    switch (operator) {
                                        case '$eq':
                                            fieldCondition[Op.eq] = value;
                                            break;
                                        case '$ne':
                                            fieldCondition[Op.ne] = value;
                                            break;
                                        case '$like':
                                            fieldCondition[Op.like] = value;
                                            break;
                                        case '$gt':
                                            fieldCondition[Op.gt] = value;
                                            break;
                                        case '$lt':
                                            fieldCondition[Op.lt] = value;
                                            break;
                                        case '$gte':
                                            fieldCondition[Op.gte] = value;
                                            break;
                                        case '$lte':
                                            fieldCondition[Op.lte] = value;
                                            break;
                                        case '$in':
                                            fieldCondition[Op.in] = value;
                                            break;
                                        case '$notIn':
                                            fieldCondition[Op.notIn] = value;
                                            break;
                                        default:
                                            throw new Error(`不支持的操作符: ${operator}`);
                                    }
                                }
                            }
                            converted[field] = fieldCondition;
                        } else {
                            // 简单相等条件
                            converted[field] = condition;
                        }
                    }

                    return converted;
                };

                Object.assign(whereClause, convertConditions(searchConditions));
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: parseError.message || '搜索条件格式错误，必须是有效的JSON字符串'
                });
            }
        }

        // 计算分页
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 查询数据
        console.log('执行查询，条件:', JSON.stringify(whereClause, null, 2));
        console.log('查询条件类型检查:', typeof whereClause, Array.isArray(whereClause));
        console.log('是否有数字字段的like条件:', hasNumberLikeCondition);
        console.log('原始搜索参数:', search);
        console.log('表哈希:', hash);
        console.log('分页参数:', { page, limit, offset });

        try {
            let count, rows;

            if (hasNumberLikeCondition) {
                // 对于数字字段的模糊查询，使用原始SQL查询
                const tableName = `data_${hash}`;

                // 简化处理：只处理包含数字字段模糊查询的简单条件
                // 对于复杂的 $or 条件，回退到正常查询
                try {
                    // 尝试使用正常查询
                    const result = await DynamicModel.findAndCountAll({
                        where: whereClause,
                        limit: parseInt(limit),
                        offset: offset,
                        order: [['id', 'ASC']]
                    });
                    count = result.count;
                    rows = result.rows;
                } catch (error) {
                    console.log('正常查询失败，尝试原始SQL查询:', error.message);

                    // 构建完整的WHERE条件
                    const buildCompleteWhereSQL = (conditions, columnDefs = columnDefinitions) => {
                        const sqlConditions = [];
                        const params = [];

                        const processCondition = (condition, parentField = null) => {
                            for (const [field, value] of Object.entries(condition)) {
                                // 处理特殊操作符
                                if (field === '$or' && Array.isArray(value)) {
                                    const orConditions = [];
                                    for (const orCondition of value) {
                                        const orResult = processCondition(orCondition);
                                        if (orResult.conditions.length > 0) {
                                            orConditions.push(`(${orResult.conditions.join(' AND ')})`);
                                            params.push(...orResult.params);
                                        }
                                    }
                                    if (orConditions.length > 0) {
                                        sqlConditions.push(`(${orConditions.join(' OR ')})`);
                                    }
                                } else if (field === '$and' && Array.isArray(value)) {
                                    const andConditions = [];
                                    for (const andCondition of value) {
                                        const andResult = processCondition(andCondition);
                                        if (andResult.conditions.length > 0) {
                                            andConditions.push(`(${andResult.conditions.join(' AND ')})`);
                                            params.push(...andResult.params);
                                        }
                                    }
                                    if (andConditions.length > 0) {
                                        sqlConditions.push(`(${andConditions.join(' AND ')})`);
                                    }
                                } else {
                                    // 处理普通字段条件
                                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                                        // 字段操作符条件
                                        for (const [operator, opValue] of Object.entries(value)) {
                                            let sqlOperator = '';
                                            let processedValue = opValue;

                                            switch (operator) {
                                                case '$eq':
                                                    sqlOperator = '=';
                                                    break;
                                                case '$ne':
                                                    sqlOperator = '!=';
                                                    break;
                                                case '$like':
                                                    sqlOperator = 'LIKE';
                                                    // 检查字段类型
                                                    const columnDef = columnDefs.find(col => col.name === field);
                                                    const fieldType = columnDef ? columnDef.type : 'string';

                                                    if (fieldType === 'number') {
                                                        // 数字字段的模糊查询需要类型转换
                                                        sqlConditions.push(`CAST(\`${field}\` AS CHAR) LIKE ?`);
                                                    } else {
                                                        // 字符串字段直接使用
                                                        sqlConditions.push(`\`${field}\` LIKE ?`);
                                                    }
                                                    params.push(processedValue);
                                                    continue; // 跳过后续处理
                                                case '$gt':
                                                    sqlOperator = '>';
                                                    break;
                                                case '$lt':
                                                    sqlOperator = '<';
                                                    break;
                                                case '$gte':
                                                    sqlOperator = '>=';
                                                    break;
                                                case '$lte':
                                                    sqlOperator = '<=';
                                                    break;
                                                default:
                                                    continue; // 跳过不支持的操作符
                                            }

                                            if (sqlOperator) {
                                                sqlConditions.push(`\`${field}\` ${sqlOperator} ?`);
                                                params.push(processedValue);
                                            }
                                        }
                                    } else {
                                        // 简单相等条件
                                        sqlConditions.push(`\`${field}\` = ?`);
                                        params.push(value);
                                    }
                                }
                            }
                            return { conditions: sqlConditions, params };
                        };

                        return processCondition(conditions);
                    };

                    const whereResult = buildCompleteWhereSQL(whereClause);
                    let whereSQL = '';
                    if (whereResult.conditions.length > 0) {
                        whereSQL = `WHERE ${whereResult.conditions.join(' AND ')}`;
                    }

                    // 执行原始查询
                    const countQuery = `SELECT COUNT(*) as total FROM \`${tableName}\` ${whereSQL}`;
                    const dataQuery = `SELECT * FROM \`${tableName}\` ${whereSQL} ORDER BY id ASC LIMIT ${offset}, ${limit}`;

                    console.log('执行原始查询 - count:', countQuery);
                    console.log('执行原始查询 - data:', dataQuery);
                    console.log('查询参数:', whereResult.params);

                    const [countResult] = await sequelize.query(countQuery, { replacements: whereResult.params });
                    const [dataResult] = await sequelize.query(dataQuery, { replacements: whereResult.params });

                    count = countResult[0].total;
                    rows = dataResult;
                }
            } else {
                // 正常查询
                const result = await DynamicModel.findAndCountAll({
                    where: whereClause,
                    limit: parseInt(limit),
                    offset: offset,
                    order: [['id', 'ASC']]
                });
                count = result.count;
                rows = result.rows;
            }

            // 获取表结构信息
            const tableInfo = {
                tableName: mapping.tableName,
                originalFileName: mapping.originalFileName,
                columnDefinitions: mapping.columnDefinitions,
                totalRecords: count
            };

            // 构建响应数据
            const responseData = {
                success: true,
                data: rows,
                tableInfo: tableInfo,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / parseInt(limit))
                }
            };

            // 将结果存入缓存
            await cacheService.set(cacheKey, responseData);

            res.json(responseData);

        } catch (error) {
            console.error('查询数据错误:', error);
            res.status(500).json({
                success: false,
                message: `查询数据失败: ${error.message}`
            });
        }
    } catch (error) {
        console.error('查询数据失败:', error);
        res.status(500).json({
            success: false,
            message: `查询数据失败: ${error.message}`
        });
    }
};

/**
 * 获取表结构信息
 */
const getTableInfo = async (req, res) => {
    try {
        const { hash } = req.params;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 生成缓存键
        const cacheKey = cacheService.getTableInfoCacheKey(hash);

        // 尝试从缓存获取数据
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult) {
            console.log(`表信息缓存命中: ${cacheKey}`);
            return res.json(cachedResult);
        }

        console.log(`表信息缓存未命中: ${cacheKey}, 从数据库查询`);

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        const responseData = {
            success: true,
            data: {
                tableName: mapping.tableName,
                originalFileName: mapping.originalFileName,
                columnCount: mapping.columnCount,
                rowCount: mapping.rowCount,
                columnDefinitions: mapping.columnDefinitions,
                createdAt: mapping.createdAt,
                updatedAt: mapping.updatedAt
            }
        };

        // 将结果存入缓存
        await cacheService.set(cacheKey, responseData);

        res.json(responseData);

    } catch (error) {
        console.error('获取表信息错误:', error);
        res.status(500).json({
            success: false,
            message: `获取表信息失败: ${error.message}`
        });
    }
};

/**
 * 验证和清理查询条件
 * @param {Object} conditions 查询条件对象
 * @returns {Object} 验证结果 { valid: boolean, conditions: Object, error: string }
 */
const validateSearchConditions = (conditions) => {
    try {
        if (!conditions || typeof conditions !== 'object') {
            return {
                valid: false,
                conditions: {},
                error: '查询条件必须是对象格式'
            };
        }

        const validatedConditions = {};

        // 遍历查询条件
        for (const [field, condition] of Object.entries(conditions)) {
            // 检查字段名是否有效
            if (typeof field !== 'string' || field.trim() === '') {
                return {
                    valid: false,
                    conditions: {},
                    error: `无效的字段名: ${field}`
                };
            }

            // 处理特殊操作符 ($or, $and 等)
            if (field.startsWith('$')) {
                if (field === '$or' || field === '$and') {
                    if (!Array.isArray(condition)) {
                        return {
                            valid: false,
                            conditions: {},
                            error: `${field} 操作符的值必须是数组`
                        };
                    }

                    // 递归验证嵌套条件
                    const validatedNestedConditions = condition.map(nestedCondition => {
                        const result = validateSearchConditions(nestedCondition);
                        if (!result.valid) {
                            throw new Error(result.error);
                        }
                        return result.conditions;
                    });

                    validatedConditions[field] = validatedNestedConditions;
                } else {
                    return {
                        valid: false,
                        conditions: {},
                        error: `不支持的操作符: ${field}`
                    };
                }
            } else {
                // 处理普通字段条件
                if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
                    // 检查是否是 Sequelize 操作符格式
                    const validatedFieldCondition = {};

                    for (const [operator, value] of Object.entries(condition)) {
                        // 将操作符映射到 Sequelize Op
                        let opSymbol;
                        switch (operator) {
                            case '$eq':
                                opSymbol = Op.eq;
                                break;
                            case '$ne':
                                opSymbol = Op.ne;
                                break;
                            case '$like':
                                opSymbol = Op.like;
                                break;
                            case '$gt':
                                opSymbol = Op.gt;
                                break;
                            case '$lt':
                                opSymbol = Op.lt;
                                break;
                            case '$gte':
                                opSymbol = Op.gte;
                                break;
                            case '$lte':
                                opSymbol = Op.lte;
                                break;
                            case '$in':
                                opSymbol = Op.in;
                                break;
                            case '$notIn':
                                opSymbol = Op.notIn;
                                break;
                            default:
                                return {
                                    valid: false,
                                    conditions: {},
                                    error: `不支持的操作符: ${operator}`
                                };
                        }

                        // 验证值
                        if (value === undefined || value === null) {
                            return {
                                valid: false,
                                conditions: {},
                                error: `操作符 ${operator} 的值不能为空`
                            };
                        }

                        // 特殊处理 $like 操作符，确保值格式正确
                        if (operator === '$like') {
                            if (typeof value !== 'string') {
                                return {
                                    valid: false,
                                    conditions: {},
                                    error: '$like 操作符的值必须是字符串'
                                };
                            }
                            // 确保 $like 值包含通配符
                            if (!value.includes('%') && !value.includes('_')) {
                                validatedFieldCondition[opSymbol] = `%${value}%`;
                            } else {
                                validatedFieldCondition[opSymbol] = value;
                            }
                        } else {
                            validatedFieldCondition[opSymbol] = value;
                        }
                    }

                    validatedConditions[field] = validatedFieldCondition;
                } else {
                    // 简单相等条件
                    validatedConditions[field] = condition;
                }
            }
        }

        return {
            valid: true,
            conditions: validatedConditions,
            error: null
        };

    } catch (error) {
        return {
            valid: false,
            conditions: {},
            error: `查询条件验证失败: ${error.message}`
        };
    }
};

/**
 * 异步为表创建索引（不阻塞查询）
 * @param {string} tableName 表名
 * @param {Array} columnDefinitions 列定义
 */
const createIndexesForTableAsync = (tableName, columnDefinitions) => {
    // 异步执行索引创建，不阻塞查询
    dynamicTableIndexManager.createIndexesForTable(tableName, columnDefinitions)
        .then(result => {
            console.log(`表 ${tableName} 索引创建完成:`, {
                created: result.indexesCreated.length,
                skipped: result.indexesSkipped.length,
                errors: result.errors.length
            });
        })
        .catch(error => {
            console.error(`表 ${tableName} 索引创建失败:`, error.message);
        });
};

module.exports = {
    getMappings,
    queryData,
    getTableInfo,
    createIndexesForTableAsync
};
