const { TableMapping, getDynamicModel } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const { generateExcelFromData, generateFileName } = require('../utils/excelExporter');

/**
 * 导出数据为Excel文件
 */
const exportData = async (req, res) => {
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

        // 查询所有数据（不分页）
        const allData = await DynamicModel.findAll({
            order: [['id', 'ASC']]
        });

        // 准备表信息
        const tableInfo = {
            tableName: mapping.tableName,
            originalFileName: mapping.originalFileName,
            columnCount: mapping.columnCount,
            rowCount: mapping.rowCount
        };

        // 生成Excel文件
        const excelBuffer = generateExcelFromData(allData, columnDefinitions, tableInfo);

        // 生成文件名
        const fileName = generateFileName(tableInfo);

        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Length', excelBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        // 发送文件
        res.send(excelBuffer);

    } catch (error) {
        console.error('导出数据失败:', error);

        // 如果是Excel生成错误，返回具体的错误信息
        if (error.message.includes('生成Excel文件失败')) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: `导出数据失败: ${error.message}`
        });
    }
};

/**
 * 获取导出状态（用于大文件导出时的进度查询）
 */
const getExportStatus = async (req, res) => {
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
            attributes: ['id', 'tableName', 'originalFileName', 'columnCount', 'rowCount', 'createdAt']
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
                createdAt: mapping.createdAt,
                exportSupported: true
            }
        });

    } catch (error) {
        console.error('获取导出状态失败:', error);
        res.status(500).json({
            success: false,
            message: `获取导出状态失败: ${error.message}`
        });
    }
};

module.exports = {
    exportData,
    getExportStatus
};
