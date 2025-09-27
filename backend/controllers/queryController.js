const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');

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
                Object.assign(whereClause, searchConditions);
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: '搜索条件格式错误，必须是有效的JSON字符串'
                });
            }
        }

        // 计算分页
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 查询数据
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

module.exports = {
    getMappings,
    queryData,
    getTableInfo
};
