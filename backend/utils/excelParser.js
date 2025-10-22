const XLSX = require('xlsx');

/**
 * 推断数据类型
 * @param {*} value - 单元格值
 * @param {string} fieldName - 字段名（可选）
 * @returns {string} 数据类型
 */
const inferDataType = (value, fieldName = '') => {
    if (value === null || value === undefined || value === '') {
        return 'string';
    }

    if (typeof value === 'number') {
        return 'number';
    }

    if (typeof value === 'boolean') {
        return 'boolean';
    }

    if (typeof value === 'string') {
        // 安全地处理字符串值
        const trimmedValue = value.trim();
        if (trimmedValue === '') {
            return 'string';
        }

        // 根据字段名关键词推断类型
        if (fieldName) {
            const lowerFieldName = fieldName.toLowerCase();

            // 时长、工作日、计算等关键词优先推断为数字类型
            if (lowerFieldName.includes('时长') ||
                lowerFieldName.includes('工作日') ||
                lowerFieldName.includes('计算') ||
                lowerFieldName.includes('数量') ||
                lowerFieldName.includes('数值') ||
                lowerFieldName.includes('数字')) {
                // 尝试解析为数字
                if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
                    return 'number';
                }
            }

            // 日期相关关键词优先推断为日期类型
            if (lowerFieldName.includes('时间') ||
                lowerFieldName.includes('日期') ||
                lowerFieldName.includes('到达') ||
                lowerFieldName.includes('结束')) {
                // 尝试解析为日期
                const date = new Date(trimmedValue);
                if (!isNaN(date.getTime())) {
                    return 'date';
                }
            }
        }

        // 尝试解析为日期
        const date = new Date(trimmedValue);
        if (!isNaN(date.getTime())) {
            return 'date';
        }

        // 尝试解析为数字
        if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
            return 'number';
        }

        // 检查布尔值
        const lowerValue = trimmedValue.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'false') {
            return 'boolean';
        }
    }

    return 'string';
};

/**
 * 解析Excel文件
 * @param {Buffer} fileBuffer - Excel文件缓冲区
 * @param {number} headerRow - 表头行号（从0开始），默认为0
 * @returns {Object} 解析结果
 */
const parseExcel = (fileBuffer, headerRow = 0) => {
    try {
        // 验证文件缓冲区
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw new Error('无效的文件缓冲区');
        }

        if (fileBuffer.length === 0) {
            throw new Error('文件内容为空');
        }

        // 读取Excel文件
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // 验证工作簿
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Excel文件格式无效或损坏');
        }

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
        }

        // 转换为JSON数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
            throw new Error('Excel文件为空或没有数据');
        }

        // 验证表头行号
        if (headerRow < 0 || headerRow >= jsonData.length) {
            throw new Error(`无效的表头行号: ${headerRow}，有效范围为 0 到 ${jsonData.length - 1}`);
        }

        // 获取表头（指定行）
        const headers = jsonData[headerRow];
        if (!headers || headers.length === 0) {
            throw new Error(`Excel文件第${headerRow + 1}行没有有效的表头数据`);
        }

        // 处理表头：移除特殊字符，转换为有效的字段名
        const processedHeaders = headers.map((header, index) => {
            // 处理空值：检查是否为undefined、null或空字符串
            if (header === undefined || header === null || header === '') {
                return `column_${index + 1}`;
            }

            // 安全地转换为字符串
            const headerString = String(header).trim();
            if (headerString === '') {
                return `column_${index + 1}`;
            }

            // 移除特殊字符，只保留字母、数字、下划线
            let fieldName = headerString
                .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');

            // 如果处理后为空，使用默认字段名
            if (!fieldName) {
                return `column_${index + 1}`;
            }

            return fieldName;
        });

        // 获取数据行（从表头行+1开始）
        const dataRows = jsonData.slice(headerRow + 1).filter(row =>
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );

        // 分析每列的数据类型
        const columnDefinitions = processedHeaders.map((header, columnIndex) => {
            const columnValues = dataRows.map(row => row[columnIndex]).filter(value =>
                value !== null && value !== undefined && value !== ''
            );

            // 推断数据类型
            let inferredType = 'string';
            if (columnValues.length > 0) {
                const sampleValues = columnValues.slice(0, 10); // 取前10个样本
                const types = sampleValues.map(value => inferDataType(value, header));

                // 如果所有样本都是同一种类型，使用该类型
                const uniqueTypes = [...new Set(types)];
                if (uniqueTypes.length === 1) {
                    inferredType = uniqueTypes[0];
                } else if (types.includes('number')) {
                    inferredType = 'number'; // 优先使用数字类型
                }
            }

            return {
                name: header,
                originalName: headers[columnIndex],
                type: inferredType,
                index: columnIndex
            };
        });

        // 处理数据行，确保每行都有正确的列数
        const processedData = dataRows.map((row, rowIndex) => {
            const processedRow = {};
            processedHeaders.forEach((header, columnIndex) => {
                let value = row[columnIndex];

                // 处理空值
                if (value === null || value === undefined || value === '') {
                    value = null;
                } else {
                    // 根据数据类型转换值
                    const columnDef = columnDefinitions.find(def => def.index === columnIndex);
                    if (columnDef) {
                        if (columnDef.type === 'number') {
                            value = Number(value);
                            if (isNaN(value)) value = null;
                        } else if (columnDef.type === 'boolean') {
                            value = Boolean(value);
                        } else if (columnDef.type === 'date') {
                            const date = new Date(value);
                            value = isNaN(date.getTime()) ? null : date;
                        }
                    }
                }

                processedRow[header] = value;
            });
            return processedRow;
        });

        return {
            success: true,
            data: {
                sheetName: firstSheetName,
                headers: processedHeaders,
                originalHeaders: headers,
                columnDefinitions,
                data: processedData,
                rowCount: processedData.length,
                columnCount: processedHeaders.length
            }
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * 预览Excel文件数据
 * @param {Buffer} fileBuffer - Excel文件缓冲区
 * @returns {Object} 预览结果
 */
const previewExcel = (fileBuffer) => {
    try {
        // 验证文件缓冲区
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw new Error('无效的文件缓冲区');
        }

        if (fileBuffer.length === 0) {
            throw new Error('文件内容为空');
        }

        // 读取Excel文件
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // 验证工作簿
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Excel文件格式无效或损坏');
        }

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
        }

        // 转换为JSON数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
            throw new Error('Excel文件为空或没有数据');
        }

        // 返回所有行数据供预览
        return {
            success: true,
            data: {
                sheetName: firstSheetName,
                totalRows: jsonData.length,
                totalColumns: jsonData[0] ? jsonData[0].length : 0,
                rows: jsonData.map((row, index) => ({
                    rowIndex: index,
                    data: row.map(cell => {
                        // 处理空值
                        if (cell === null || cell === undefined || cell === '') {
                            return '';
                        }
                        return String(cell);
                    })
                }))
            }
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    parseExcel,
    previewExcel,
    inferDataType
};
