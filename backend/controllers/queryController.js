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

        // 构建查询条件 - 直接使用原始搜索参数，不进行 Sequelize 转换
        const whereClause = {};
        let hasNumberLikeCondition = false;

        if (search) {
            try {
                const searchConditions = JSON.parse(search);
                console.log('原始搜索条件:', searchConditions);
                
                // 处理字段名映射 - 确保查询条件中的字段名与数据库中的字段名匹配
                const processFieldMapping = (conditions, columnDefs = columnDefinitions) => {
                    const processedConditions = {};
                    
                    for (const [field, condition] of Object.entries(conditions)) {
                        // 处理特殊操作符
                        if (field === '$or' && Array.isArray(condition)) {
                            processedConditions[field] = condition.map(nestedCondition => 
                                processFieldMapping(nestedCondition, columnDefs)
                            );
                        } else if (field === '$and' && Array.isArray(condition)) {
                            processedConditions[field] = condition.map(nestedCondition => 
                                processFieldMapping(nestedCondition, columnDefs)
                            );
                        } else {
                            // 处理普通字段条件
                            // 查找对应的列定义，确保字段名正确
                            const columnDef = columnDefs.find(col => col.name === field);
                            if (columnDef) {
                                // 使用数据库中的实际字段名
                                processedConditions[field] = condition;
                            } else {
                                console.warn(`字段 ${field} 在表结构中不存在，跳过该条件`);
                                // 跳过不存在的字段条件
                            }
                        }
                    }
                    
                    return processedConditions;
                };
                
                // 应用字段名映射处理
                const processedConditions = processFieldMapping(searchConditions);
                Object.assign(whereClause, processedConditions);
                
                // 检查是否有数字字段的模糊查询
                const checkNumberLikeConditions = (conditions) => {
                    for (const [field, condition] of Object.entries(conditions)) {
                        if (field === '$or' && Array.isArray(condition)) {
                            // 递归检查 $or 中的条件
                            for (const nestedCondition of condition) {
                                checkNumberLikeConditions(nestedCondition);
                            }
                        } else if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
                            // 检查字段类型和操作符
                            const columnDef = columnDefinitions.find(col => col.name === field);
                            const fieldType = columnDef ? columnDef.type : 'string';
                            
                            for (const [operator, value] of Object.entries(condition)) {
                                if (operator === '$like' && fieldType === 'number') {
                                    hasNumberLikeCondition = true;
                                    console.log(`检测到数字字段模糊查询: ${field}, 值: ${value}`);
                                }
                            }
                        }
                    }
                };
                
                checkNumberLikeConditions(searchConditions);
                
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
        
        // 调试：检查 whereClause 的实际结构
        console.log('whereClause 详细结构:');
        console.log('whereClause 对象:', whereClause);
        console.log('whereClause 键:', Object.keys(whereClause));
        console.log('whereClause Symbol 键:', Object.getOwnPropertySymbols(whereClause));
        
        // 检查是否有 Sequelize Op.or 符号
        const symbolKeys = Object.getOwnPropertySymbols(whereClause);
        console.log('Symbol 键数量:', symbolKeys.length);
        for (const symbolKey of symbolKeys) {
            console.log(`Symbol 键:`, symbolKey);
            console.log(`Symbol 值:`, whereClause[symbolKey]);
            if (symbolKey === Op.or) {
                console.log('检测到 Sequelize Op.or 符号');
                console.log('Op.or 值:', whereClause[symbolKey]);
            }
        }
        
        // 如果 whereClause 是空的，说明 $or 操作符转换有问题
        if (Object.keys(whereClause).length === 0 && symbolKeys.length === 0) {
            console.log('警告: whereClause 为空，$or 操作符可能没有被正确转换');
            console.log('尝试直接处理原始搜索参数...');
            
            // 直接处理原始搜索参数
            try {
                const searchConditions = JSON.parse(search);
                console.log('原始搜索条件:', searchConditions);
                
                // 如果包含 $or 操作符，直接构建 SQL 条件
                if (searchConditions.$or && Array.isArray(searchConditions.$or)) {
                    console.log('检测到 $or 操作符，直接构建 SQL 条件');
                    hasNumberLikeCondition = true; // 强制使用原始 SQL 查询
                    
                    // 直接构建 whereClause 用于后续处理
                    whereClause.$or = searchConditions.$or;
                    console.log('重新构建的 whereClause:', whereClause);
                }
            } catch (error) {
                console.log('解析原始搜索参数失败:', error.message);
            }
        }

        try {
            let count, rows;

            // 如果包含 $or 操作符或者有数字字段的模糊查询，使用原始SQL查询
            if (hasNumberLikeCondition || (whereClause.$or && Array.isArray(whereClause.$or))) {
                // 对于复杂查询，直接使用原始SQL查询
                const tableName = `data_${hash}`;
                console.log('检测到复杂查询条件，使用原始SQL查询');

                // 构建完整的WHERE条件
                const buildCompleteWhereSQL = (conditions, columnDefs = columnDefinitions) => {
                    const sqlConditions = [];
                    const params = [];

                    const processCondition = (condition) => {
                        console.log('开始处理条件:', condition);
                        const currentConditions = [];
                        const currentParams = [];

                        
                        for (const [field, value] of Object.entries(condition)) {
                            console.log('处理字段:' + field, '字段类型:', typeof field, '值:', value);
                            
                            // 处理特殊操作符
                            if (field === '$or' && Array.isArray(value)) {
                                const orConditions = [];
                                for (const orCondition of value) {
                                    const orResult = processCondition(orCondition);
                                    if (orResult.conditions.length > 0) {
                                        orConditions.push(`(${orResult.conditions.join(' AND ')})`);
                                        currentParams.push(...orResult.params);
                                    }
                                }
                                if (orConditions.length > 0) {
                                    currentConditions.push(`(${orConditions.join(' OR ')})`);
                                }
                            } else if (field === '$and' && Array.isArray(value)) {
                                const andConditions = [];
                                for (const andCondition of value) {
                                    const andResult = processCondition(andCondition);
                                    if (andResult.conditions.length > 0) {
                                        andConditions.push(`(${andResult.conditions.join(' AND ')})`);
                                        currentParams.push(...andResult.params);
                                    }
                                }
                                if (andConditions.length > 0) {
                                    currentConditions.push(`(${andConditions.join(' AND ')})`);
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
                                                    currentConditions.push(`CAST(\`${field}\` AS CHAR) LIKE ?`);
                                                } else {
                                                    // 字符串字段直接使用
                                                    currentConditions.push(`\`${field}\` LIKE ?`);
                                                }
                                                console.log(`检测到模糊查询，字段: ${field}, 值: ${processedValue}, 类型: ${fieldType}`);
                                                currentParams.push(processedValue);
                                                break; // 跳过后续处理
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
                                            currentConditions.push(`\`${field}\` ${sqlOperator} ?`);
                                            currentParams.push(processedValue);
                                        }
                                    }
                                } else {
                                    // 简单相等条件
                                    currentConditions.push(`\`${field}\` = ?`);
                                    currentParams.push(value);
                                }
                            }
                        }
                        console.log('当前层级SQL条件:', currentConditions, currentParams);
                        return { conditions: currentConditions, params: currentParams };
                    };

                    const result = processCondition(conditions);
                    sqlConditions.push(...result.conditions);
                    params.push(...result.params);
                    
                    console.log('最终SQL条件:', sqlConditions, params);
                    return { conditions: sqlConditions, params };
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
            } else {
                // 对于简单查询，使用 Sequelize 查询
                console.log('使用 Sequelize 进行简单查询');
                
                // 将原始条件转换为 Sequelize 格式
                const convertToSequelizeFormat = (conditions) => {
                    const converted = {};
                    
                    for (const [field, condition] of Object.entries(conditions)) {
                        if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
                            const fieldCondition = {};
                            
                            for (const [operator, value] of Object.entries(condition)) {
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
                                    default:
                                        // 跳过不支持的操作符
                                        continue;
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
                
                const sequelizeWhereClause = convertToSequelizeFormat(whereClause);
                console.log('转换后的 Sequelize 条件:', sequelizeWhereClause);
                
                const result = await DynamicModel.findAndCountAll({
                    where: sequelizeWhereClause,
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

        // 处理大数字，避免精度丢失，并转换为纯对象
        const processedRows = rows.map(row => {
            // 将 Sequelize 模型实例转换为纯对象
            const plainRow = row.get ? row.get({ plain: true }) : row;
            const processedRow = {};
            
            for (const [key, value] of Object.entries(plainRow)) {
                // 如果值大于100000且是数字类型，转换为字符串避免精度问题
                if (typeof value === 'number' && Math.abs(value) > 100000) {
                    processedRow[key] = value.toString();
                } else {
                    processedRow[key] = value;
                }
            }
            return processedRow;
        });

        // 构建响应数据
        const responseData = {
            success: true,
            data: processedRows,
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
