/*
 * @Date: 2025-10-17 11:02:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-17 11:06:41
 * @FilePath: /lowCode_excel/backend/controllers/largeFileUploadController.js
 */
const { generateHash } = require('../utils/hashGenerator');
const StreamExcelParser = require('../utils/streamExcelParser');
const { globalMemoryMonitor } = require('../utils/memoryMonitor');
const { TableMapping, getDynamicModel } = require('../models');
const fs = require('fs');

// 进度跟踪存储（在实际生产环境中应该使用Redis等）
const uploadProgress = new Map();

/**
 * 大文件上传控制器 - 支持1000MB以上文件
 */
const uploadLargeFile = async (req, res) => {
    let streamParser = null;

    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的Excel文件'
            });
        }

        // 生成唯一哈希值 - 使用文件路径而不是buffer
        const fileBuffer = fs.readFileSync(file.path);
        const hashValue = generateHash(file.originalname, fileBuffer);

        // 检查是否已存在相同哈希值的表
        const existingMapping = await TableMapping.findOne({
            where: { hashValue }
        });

        if (existingMapping) {
            // 清理临时文件
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: '该文件已上传过，请勿重复上传'
            });
        }

        // 初始化进度跟踪
        const progressId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        uploadProgress.set(progressId, {
            status: 'initializing',
            processedRows: 0,
            totalRows: 0,
            currentBatch: 0,
            message: '开始解析Excel文件...'
        });

        // 使用流式解析器
        streamParser = new StreamExcelParser(file.path, {
            batchSize: 500, // 每批500行，平衡性能和内存使用
            maxMemoryUsage: 300 * 1024 * 1024 // 最大内存使用300MB
        });

        // 解析Excel文件结构
        const parseResult = await streamParser.parse();

        if (!parseResult.success) {
            // 清理临时文件
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: `Excel文件解析失败: ${parseResult.error}`
            });
        }

        const { data: excelData } = parseResult;

        // 更新进度
        uploadProgress.set(progressId, {
            ...uploadProgress.get(progressId),
            status: 'creating_table',
            totalRows: excelData.totalRows,
            message: '创建数据库表结构...'
        });

        // 创建动态表模型
        const DynamicModel = getDynamicModel(hashValue, excelData.columnDefinitions);

        // 同步动态表到数据库
        await DynamicModel.sync();

        let totalInserted = 0;
        let batchErrors = [];

        // 开始内存监控
        globalMemoryMonitor.startMonitoring();

        // 流式处理数据批次
        const processResult = await streamParser.processInBatches(async (batchData, progress) => {
            try {
                // 检查内存使用情况，如果达到临界值则暂停处理
                if (globalMemoryMonitor.shouldPauseProcessing()) {
                    uploadProgress.set(progressId, {
                        ...uploadProgress.get(progressId),
                        status: 'paused',
                        message: '内存使用过高，暂停处理等待内存释放...'
                    });

                    console.warn('内存使用过高，暂停处理等待内存释放...');
                    await globalMemoryMonitor.waitForMemoryRelease(0.7, 60000); // 等待内存释放到70%以下，最多60秒

                    uploadProgress.set(progressId, {
                        ...uploadProgress.get(progressId),
                        status: 'inserting_data',
                        message: '内存已释放，继续处理数据...'
                    });
                }

                // 更新进度
                uploadProgress.set(progressId, {
                    ...uploadProgress.get(progressId),
                    status: 'inserting_data',
                    processedRows: progress.processedRows,
                    currentBatch: progress.currentBatch,
                    message: `正在插入数据... (${progress.processedRows}/${progress.totalRows})`
                });

                // 分批插入数据
                if (batchData.length > 0) {
                    const result = await DynamicModel.bulkCreate(batchData, {
                        validate: true,
                        ignoreDuplicates: true,
                        transaction: null // 不使用事务，避免大事务锁表
                    });
                    totalInserted += result.length;
                }

            } catch (batchError) {
                console.error(`批次 ${progress.currentBatch} 插入失败:`, batchError);
                batchErrors.push({
                    batch: progress.currentBatch,
                    error: batchError.message
                });

                // 继续处理下一个批次，而不是中断整个流程
                uploadProgress.set(progressId, {
                    ...uploadProgress.get(progressId),
                    status: 'warning',
                    message: `批次 ${progress.currentBatch} 处理失败，继续处理后续数据...`
                });
            }
        });

        // 停止内存监控
        globalMemoryMonitor.stopMonitoring();

        if (!processResult.success) {
            throw new Error(`数据处理失败: ${processResult.error}`);
        }

        // 保存映射关系
        const tableMapping = await TableMapping.create({
            tableName: excelData.sheetName,
            hashValue: hashValue,
            originalFileName: file.originalname,
            columnCount: excelData.columnCount,
            rowCount: totalInserted, // 使用实际插入的行数
            columnDefinitions: excelData.columnDefinitions
        });

        // 清理临时文件
        streamParser.cleanup();

        // 清理进度跟踪
        uploadProgress.delete(progressId);

        res.json({
            success: true,
            message: '大文件上传成功',
            data: {
                hash: hashValue,
                tableName: excelData.sheetName,
                originalFileName: file.originalname,
                recordCount: totalInserted,
                columnCount: excelData.columnCount,
                batchErrors: batchErrors.length > 0 ? batchErrors : undefined,
                createdAt: tableMapping.createdAt
            }
        });

    } catch (error) {
        console.error('大文件上传错误:', error);

        // 清理资源
        if (streamParser) {
            streamParser.cleanup();
        } else if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        res.status(500).json({
            success: false,
            message: `大文件上传失败: ${error.message}`
        });
    }
};

/**
 * 获取上传进度
 */
const getUploadProgress = async (req, res) => {
    const { progressId } = req.params;

    if (!progressId) {
        return res.status(400).json({
            success: false,
            message: '缺少进度ID'
        });
    }

    const progress = uploadProgress.get(progressId);

    if (!progress) {
        return res.status(404).json({
            success: false,
            message: '进度信息不存在或已过期'
        });
    }

    res.json({
        success: true,
        data: progress
    });
};

/**
 * 智能文件上传 - 根据文件大小自动选择处理方式
 */
const smartUploadFile = async (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).json({
            success: false,
            message: '请选择要上传的Excel文件'
        });
    }

    // 根据文件大小选择处理方式
    const largeFileThreshold = 50 * 1024 * 1024; // 50MB以上使用大文件处理

    if (file.size > largeFileThreshold) {
        // 使用大文件处理
        return await uploadLargeFile(req, res);
    } else {
        // 使用原有小文件处理（需要导入原有控制器）
        const { uploadFile } = require('./uploadController');
        return await uploadFile(req, res);
    }
};

module.exports = {
    uploadLargeFile,
    getUploadProgress,
    smartUploadFile
};
