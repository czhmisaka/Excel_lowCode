/*
 * @Date: 2025-09-27 23:19:28
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-27 23:19:59
 * @FilePath: /backend/middleware/upload.js
 */
const multer = require('multer');
const path = require('path');

// 文件上传配置
const storage = multer.memoryStorage(); // 使用内存存储，处理完成后删除

const fileFilter = (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${fileExtension}。仅支持: ${allowedTypes.join(', ')}`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
        files: 1 // 每次只允许上传一个文件
    }
});

/**
 * 文件上传中间件
 */
const uploadMiddleware = upload.single('file');

/**
 * 文件验证中间件
 */
const validateFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: '请选择要上传的Excel文件'
        });
    }

    // 检查文件大小
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: `文件大小超过限制: ${maxSize / 1024 / 1024}MB`
        });
    }

    // 检查文件内容
    if (req.file.buffer.length === 0) {
        return res.status(400).json({
            success: false,
            message: '文件内容为空'
        });
    }

    next();
};

module.exports = {
    uploadMiddleware,
    validateFile
};
