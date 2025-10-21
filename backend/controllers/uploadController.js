/*
 * @Date: 2025-09-27 23:20:53
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-21 10:50:30
 * @FilePath: /lowCode_excel/backend/controllers/uploadController.js
 */
const { generateHash } = require('../utils/hashGenerator');
const { parseExcel } = require('../utils/excelParser');
const StreamExcelParser = require('../utils/streamExcelParser');
const { TableMapping, getDynamicModel } = require('../models');
const fs = require('fs');

/**
 * 文件上传控制器
 */
const uploadFile = async (req, res) => {
    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的Excel文件'
            });
        }

        // 安全地获取文件内容
        let fileBuffer;
        if (file.buffer) {
            // 如果文件在内存中
            fileBuffer = file.buffer;
        } else if (file.path && fs.existsSync(file.path)) {
            // 如果文件在磁盘上，从磁盘读取
            fileBuffer = fs.readFileSync(file.path);
        } else {
            return res.status(400).json({
                success: false,
                message: '无法获取文件内容，请重新上传文件'
            });
        }

        // 生成唯一哈希值
        const hashValue = generateHash(file.originalname, fileBuffer);

        // 检查是否已存在相同哈希值的表
        const existingMapping = await TableMapping.findOne({
            where: { hashValue }
        });

        if (existingMapping) {
            return res.status(400).json({
                success: false,
                message: '该文件已上传过，请勿重复上传'
            });
        }

        // 解析Excel文件
        const parseResult = parseExcel(fileBuffer);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: `Excel文件解析失败: ${parseResult.error}`
            });
        }

        const { data: excelData } = parseResult;

        // 创建动态表模型
        const DynamicModel = getDynamicModel(hashValue, excelData.columnDefinitions);

        // 同步动态表到数据库
        await DynamicModel.sync();

        // 批量插入数据
        if (excelData.data.length > 0) {
            await DynamicModel.bulkCreate(excelData.data, {
                validate: true,
                ignoreDuplicates: true
            });
        }

        // 保存映射关系
        const tableMapping = await TableMapping.create({
            tableName: excelData.sheetName,
            hashValue: hashValue,
            originalFileName: file.originalname,
            columnCount: excelData.columnCount,
            rowCount: excelData.rowCount,
            columnDefinitions: excelData.columnDefinitions
        });

        // 清理临时文件（如果存在）
        if (file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (cleanupError) {
                console.warn('临时文件清理失败:', cleanupError.message);
            }
        }

        res.json({
            success: true,
            message: '文件上传成功',
            data: {
                hash: hashValue,
                tableName: excelData.sheetName,
                originalFileName: file.originalname,
                recordCount: excelData.rowCount,
                columnCount: excelData.columnCount,
                createdAt: tableMapping.createdAt
            }
        });

    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({
            success: false,
            message: `文件上传失败: ${error.message}`
        });
    }
};

module.exports = {
    uploadFile
};
