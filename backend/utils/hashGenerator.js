/*
 * @Date: 2025-09-27 23:17:46
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-21 10:49:18
 * @FilePath: /lowCode_excel/backend/utils/hashGenerator.js
 */
const crypto = require('crypto');

/**
 * 生成唯一哈希值
 * @param {string} fileName - 文件名
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @returns {string} 哈希值
 */
const generateHash = (fileName, fileBuffer) => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString();

    // 安全地处理文件缓冲区
    let fileContent = '';
    if (fileBuffer && fileBuffer.toString) {
        try {
            fileContent = fileBuffer.toString('base64').substring(0, 100);
        } catch (error) {
            console.warn('文件缓冲区转换失败，使用空内容:', error.message);
            fileContent = '';
        }
    }

    // 使用文件名、时间戳、随机数和文件内容生成哈希
    const hashInput = `${fileName}_${timestamp}_${random}_${fileContent}`;

    return crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex')
        .substring(0, 32); // 取前32位作为哈希值
};

/**
 * 验证哈希值格式
 * @param {string} hash - 哈希值
 * @returns {boolean} 是否有效
 */
const validateHash = (hash) => {
    return typeof hash === 'string' &&
        hash.length === 32 &&
        /^[a-f0-9]+$/.test(hash);
};

module.exports = {
    generateHash,
    validateHash
};
