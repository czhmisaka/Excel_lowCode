/*
 * @Date: 2025-09-27 23:19:28
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-17 10:59:12
 * @FilePath: /lowCode_excel/backend/middleware/upload.js
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保临时目录存在
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// 文件上传配置 - 使用磁盘存储支持大文件
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名，避免冲突
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 1024, // 默认1GB，支持1000MB大文件
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
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 1024; // 默认1GB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: `文件大小超过限制: ${maxSize / 1024 / 1024}MB`
        });
    }

    // 检查文件内容 - 对于磁盘存储，检查文件是否存在且不为空
    if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
            success: false,
            message: '文件上传失败，请重新上传'
        });
    }

    const stats = fs.statSync(req.file.path);
    if (stats.size === 0) {
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
