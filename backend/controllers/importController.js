/*
 * @Date: 2025-10-22 16:58:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-22 17:15:03
 * @FilePath: /lowCode_excel/backend/controllers/importController.js
 */
const { parseExcel } = require('../utils/excelParser');
const { TableMapping, getDynamicModel } = require('../models');
const fs = require('fs');

/**
 * 导入Excel数据到现有表
 */
const importExcelData = async (req, res) => {
    try {
        const { file } = req;
        const { targetHash } = req.body;
        const headerRow = parseInt(req.body.headerRow) || 0;

        // 导入规则配置
        let importRules;
        try {
            importRules = typeof req.body.importRules === 'string'
                ? JSON.parse(req.body.importRules)
                : req.body.importRules;
        } catch (error) {
            console.warn('导入规则解析失败，使用默认规则:', error.message);
            importRules = {
                deduplicationFields: [],
                conflictStrategy: 'skip', // skip, overwrite, error
                validationRules: []
            };
        }

        // 确保导入规则有默认值
        importRules = {
            deduplicationFields: importRules.deduplicationFields || [],
            conflictStrategy: importRules.conflictStrategy || 'skip',
            validationRules: importRules.validationRules || []
        };

        console.log('导入请求参数:', {
            targetHash,
            headerRow,
            fileName: file?.originalname,
            importRules
        });

        if (!file) {
            return res.status(400).json({
                success: false,
                message: '请提供要导入的Excel文件'
            });
        }

        if (!targetHash) {
            return res.status(400).json({
                success: false,
                message: '请指定目标表的哈希值'
            });
        }

        // 检查目标表是否存在
        const targetMapping = await TableMapping.findOne({
            where: { hashValue: targetHash }
        });

        if (!targetMapping) {
            return res.status(404).json({
                success: false,
                message: '目标表不存在，请检查哈希值是否正确'
            });
        }

        // 安全地获取文件内容
        let fileBuffer;
        if (file.buffer) {
            fileBuffer = file.buffer;
        } else if (file.path && fs.existsSync(file.path)) {
            fileBuffer = fs.readFileSync(file.path);
        } else {
            return res.status(400).json({
                success: false,
                message: '无法获取文件内容'
            });
        }

        // 解析Excel文件
        const parseResult = parseExcel(fileBuffer, headerRow);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: `Excel文件解析失败: ${parseResult.error}`
            });
        }

        const { data: excelData } = parseResult;

        // 获取目标表的动态模型
        const TargetModel = getDynamicModel(targetHash, targetMapping.columnDefinitions);

        // 验证字段匹配
        const targetColumns = targetMapping.columnDefinitions.map(col => col.name);
        const excelColumns = excelData.columnDefinitions.map(col => col.name);

        const matchedColumns = excelColumns.filter(col => targetColumns.includes(col));
        const missingColumns = targetColumns.filter(col => !excelColumns.includes(col));

        console.log('字段匹配情况:', {
            targetColumns,
            excelColumns,
            matchedColumns,
            missingColumns
        });

        if (matchedColumns.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel文件字段与目标表字段不匹配，无法导入'
            });
        }

        // 导入数据
        let successCount = 0;
        let errorCount = 0;
        const errorMessages = [];

        // 构建导入数据，只包含匹配的字段
        const importData = excelData.data.map((row, index) => {
            const importRow = {};
            matchedColumns.forEach(column => {
                importRow[column] = row[column];
            });
            return importRow;
        });

        console.log(`准备导入 ${importData.length} 条记录`);
        console.log('第一条记录示例:', importData[0]);
        console.log('目标表字段定义:', targetMapping.columnDefinitions);

        // 根据冲突处理策略执行导入
        switch (importRules.conflictStrategy) {
            case 'skip':
                // 跳过重复记录
                for (const row of importData) {
                    try {
                        // 检查是否重复
                        let duplicate = false;

                        if (importRules.deduplicationFields.length > 0) {
                            const whereCondition = {};
                            importRules.deduplicationFields.forEach(field => {
                                if (row[field] !== undefined) {
                                    whereCondition[field] = row[field];
                                }
                            });

                            if (Object.keys(whereCondition).length > 0) {
                                const existing = await TargetModel.findOne({ where: whereCondition });
                                if (existing) {
                                    duplicate = true;
                                }
                            }
                        }

                        if (!duplicate) {
                            console.log('创建记录:', row);
                            const createdRecord = await TargetModel.create(row);
                            console.log('记录创建成功，ID:', createdRecord.id);
                            successCount++;
                        } else {
                            console.log('跳过重复记录:', row);
                        }
                    } catch (error) {
                        errorCount++;
                        const errorMsg = `记录导入失败: ${error.message}`;
                        errorMessages.push(errorMsg);
                        console.error('记录导入失败详情:', {
                            error: error.message,
                            stack: error.stack,
                            row: row
                        });
                    }
                }
                break;

            case 'overwrite':
                // 覆盖重复记录
                for (const row of importData) {
                    try {
                        let whereCondition = {};

                        if (importRules.deduplicationFields.length > 0) {
                            importRules.deduplicationFields.forEach(field => {
                                if (row[field] !== undefined) {
                                    whereCondition[field] = row[field];
                                }
                            });
                        }

                        if (Object.keys(whereCondition).length > 0) {
                            // 查找并更新
                            const [affectedCount] = await TargetModel.update(row, { where: whereCondition });
                            if (affectedCount === 0) {
                                // 没有找到重复记录，创建新记录
                                await TargetModel.create(row);
                            }
                            successCount++;
                        } else {
                            // 没有去重字段，直接创建
                            await TargetModel.create(row);
                            successCount++;
                        }
                    } catch (error) {
                        errorCount++;
                        const errorMsg = `记录导入失败: ${error.message}`;
                        errorMessages.push(errorMsg);
                        console.error('记录导入失败详情:', {
                            error: error.message,
                            stack: error.stack,
                            row: row
                        });
                    }
                }
                break;

            case 'error':
            default:
                // 遇到重复时报错
                for (const row of importData) {
                    try {
                        let duplicate = false;

                        if (importRules.deduplicationFields.length > 0) {
                            const whereCondition = {};
                            importRules.deduplicationFields.forEach(field => {
                                if (row[field] !== undefined) {
                                    whereCondition[field] = row[field];
                                }
                            });

                            if (Object.keys(whereCondition).length > 0) {
                                const existing = await TargetModel.findOne({ where: whereCondition });
                                if (existing) {
                                    duplicate = true;
                                    throw new Error(`发现重复记录: ${JSON.stringify(whereCondition)}`);
                                }
                            }
                        }

                        if (!duplicate) {
                            await TargetModel.create(row);
                            successCount++;
                        }
                    } catch (error) {
                        errorCount++;
                        const errorMsg = `记录导入失败: ${error.message}`;
                        errorMessages.push(errorMsg);
                        console.error('记录导入失败详情:', {
                            error: error.message,
                            stack: error.stack,
                            row: row
                        });
                    }
                }
                break;
        }

        // 清理临时文件
        if (file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (cleanupError) {
                console.warn('临时文件清理失败:', cleanupError.message);
            }
        }

        // 返回导入结果
        const result = {
            success: true,
            message: `导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`,
            data: {
                successCount,
                errorCount,
                totalRecords: importData.length,
                matchedColumns,
                missingColumns,
                errors: errorMessages.slice(0, 10) // 只返回前10个错误
            }
        };

        if (errorCount > 0) {
            result.message += `，${missingColumns.length > 0 ? ` ${missingColumns.length} 个字段缺失` : ''}`;
        }

        res.json(result);

    } catch (error) {
        console.error('Excel数据导入错误:', error);
        res.status(500).json({
            success: false,
            message: `Excel数据导入失败: ${error.message}`
        });
    }
};

module.exports = {
    importExcelData
};
