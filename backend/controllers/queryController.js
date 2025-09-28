const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const { Op } = require('sequelize');

/**
 * 获取所有映射关系
 */
const getMappings = async (req, res) => {
    try {
        const mappings = await TableMapping.findAll({
            attributes: ['id', 'tableName', 'hashValue', 'originalFileName', 'columnCount', 'rowCount', 'createdAt'],
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
 * 查询数据
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

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, columnDefinitions);

        // 构建查询条件
        const whereClause = {};
        if (search) {
            try {
                const searchConditions = JSON.parse(search);

                // 递归转换查询条件
                const convertConditions = (conditions) => {
                    const converted = {};

                    for (const [field, condition] of Object.entries(conditions)) {
                        // 处理特殊操作符 ($or, $and 等)
                        if (field === '$or') {
                            if (Array.isArray(condition)) {
                                // 递归处理嵌套条件，使用 Sequelize Op.or
                                converted[Op.or] = condition.map(nestedCondition =>
                                    convertConditions(nestedCondition)
                                );
                            } else {
                                throw new Error('$or 操作符的值必须是数组');
                            }
                        } else if (field === '$and') {
                            if (Array.isArray(condition)) {
                                // 递归处理嵌套条件，使用 Sequelize Op.and
                                converted[Op.and] = condition.map(nestedCondition =>
                                    convertConditions(nestedCondition)
                                );
                            } else {
                                throw new Error('$and 操作符的值必须是数组');
                            }
                        } else if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
                            // 处理普通字段条件
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

        try {
            const { count, rows } = await DynamicModel.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: offset,
                order: [['id', 'ASC']]
            });

            // 获取表结构信息
            const tableInfo = {
                tableName: mapping.tableName,
                originalFileName: mapping.originalFileName,
                columnDefinitions: mapping.columnDefinitions,
                totalRecords: count
            };

            res.json({
                success: true,
                data: rows,
                tableInfo: tableInfo,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / parseInt(limit))
                }
            });

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
}

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

        res.json({
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
        });

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

module.exports = {
    getMappings,
    queryData,
    getTableInfo
};
