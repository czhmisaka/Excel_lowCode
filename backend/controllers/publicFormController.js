const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const OperationLogger = require('../utils/logger');

/**
 * 公开表单 - 新增数据（免认证）
 */
const addData = async (req, res) => {
    try {
        const { hash } = req.params;
        const { data } = req.body;

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

        // 验证请求参数
        if (!data || typeof data !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的新增数据'
            });
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, mapping.columnDefinitions);

        // 执行新增操作
        const newRecord = await DynamicModel.create(data);

        // 记录操作日志（使用二维码填写用户信息）
        const clientInfo = OperationLogger.extractClientInfo(req);

        await OperationLogger.logCreate({
            tableName: mapping.tableName,
            tableHash: hash,
            recordId: newRecord.id,
            oldData: null,
            newData: newRecord.toJSON(),
            description: `公开表单新增记录 #${newRecord.id}`,
            user: {
                id: 0,  // 使用0作为二维码填写用户的ID
                username: 'qrcode_user',
                displayName: '二维码填写'
            },
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        });

        res.json({
            success: true,
            message: '数据提交成功',
            data: newRecord
        });

    } catch (error) {
        console.error('公开表单新增数据错误:', error);
        res.status(500).json({
            success: false,
            message: `数据提交失败: ${error.message}`
        });
    }
};

/**
 * 公开表单 - 获取表结构信息（免认证）
 */
const getTableStructure = async (req, res) => {
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
            where: { hashValue: hash },
            attributes: ['id', 'tableName', 'hashValue', 'columnDefinitions']
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 解析columnDefinitions
        let columnDefinitions = [];
        if (mapping.columnDefinitions) {
            if (typeof mapping.columnDefinitions === 'string') {
                try {
                    columnDefinitions = JSON.parse(mapping.columnDefinitions);
                } catch (error) {
                    console.error('解析columnDefinitions失败:', error);
                    columnDefinitions = [];
                }
            } else {
                columnDefinitions = mapping.columnDefinitions;
            }
        }

        res.json({
            success: true,
            data: {
                columns: columnDefinitions,
                tableName: mapping.tableName
            }
        });

    } catch (error) {
        console.error('获取公开表单表结构失败:', error);
        res.status(500).json({
            success: false,
            message: '获取表结构失败',
            error: error.message
        });
    }
};

module.exports = {
    addData,
    getTableStructure
};
