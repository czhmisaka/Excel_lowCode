/*
 * @Date: 2025-10-11 15:11:16
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-11 15:11:52
 * @FilePath: /lowCode_excel/backend/utils/excelExporter.js
 */
const XLSX = require('xlsx');

/**
 * 将数据转换为Excel工作簿
 * @param {Array} data - 数据数组
 * @param {Array} columnDefinitions - 列定义
 * @param {Object} tableInfo - 表信息
 * @returns {Buffer} Excel文件缓冲区
 */
const generateExcelFromData = (data, columnDefinitions, tableInfo) => {
    try {
        // 创建工作簿
        const workbook = XLSX.utils.book_new();

        // 准备表头
        const headers = columnDefinitions.map(col => col.originalName || col.name);

        // 准备数据行
        const dataRows = data.map(row => {
            const processedRow = {};
            columnDefinitions.forEach(col => {
                let value = row[col.name];

                // 根据数据类型处理值
                if (value === null || value === undefined) {
                    value = '';
                } else if (col.type === 'date' && value instanceof Date) {
                    // 日期格式处理
                    value = value.toISOString().split('T')[0]; // YYYY-MM-DD格式
                } else if (col.type === 'number') {
                    // 数字格式处理
                    value = Number(value);
                    if (isNaN(value)) value = '';
                } else if (col.type === 'boolean') {
                    // 布尔值处理
                    value = value ? '是' : '否';
                }

                processedRow[col.originalName || col.name] = value;
            });
            return processedRow;
        });

        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });

        // 设置列宽
        const colWidths = headers.map(header => ({
            wch: Math.max(header.length * 2, 10) // 根据表头长度设置列宽
        }));
        worksheet['!cols'] = colWidths;

        // 添加工作表到工作簿
        const sheetName = tableInfo.tableName || 'Sheet1';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // 生成Excel文件缓冲区
        const excelBuffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
            compression: true
        });

        return excelBuffer;

    } catch (error) {
        console.error('生成Excel文件失败:', error);
        throw new Error(`生成Excel文件失败: ${error.message}`);
    }
};

/**
 * 生成下载文件名
 * @param {Object} tableInfo - 表信息
 * @returns {string} 文件名
 */
const generateFileName = (tableInfo) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const originalName = tableInfo.originalFileName || tableInfo.tableName || 'data';
    const cleanName = originalName.replace(/\.xlsx?$/i, ''); // 移除原有扩展名

    return `${cleanName}_export_${timestamp}.xlsx`;
};

module.exports = {
    generateExcelFromData,
    generateFileName
};
