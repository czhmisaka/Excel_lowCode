const XLSX = require('xlsx');
const fs = require('fs');
const { inferDataType } = require('./excelParser');

/**
 * 流式Excel解析器 - 支持大文件处理
 */
class StreamExcelParser {
    constructor(filePath, options = {}) {
        this.filePath = filePath;
        this.options = {
            batchSize: options.batchSize || 1000, // 每批处理的行数
            maxMemoryUsage: options.maxMemoryUsage || 500 * 1024 * 1024, // 最大内存使用500MB
            ...options
        };
        this.progress = {
            totalRows: 0,
            processedRows: 0,
            currentBatch: 0,
            status: 'initializing'
        };
    }

    /**
     * 解析Excel文件
     * @returns {Promise<Object>} 解析结果
     */
    async parse() {
        try {
            this.progress.status = 'reading_file';

            // 检查文件是否存在
            if (!fs.existsSync(this.filePath)) {
                throw new Error(`文件不存在: ${this.filePath}`);
            }

            // 使用流式读取模式
            const workbook = XLSX.readFile(this.filePath, {
                type: 'file',
                cellStyles: true,
                cellDates: true
            });

            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            if (!worksheet) {
                throw new Error('Excel文件中没有找到工作表');
            }

            // 获取工作表范围
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const totalRows = range.e.r - range.s.r + 1;
            this.progress.totalRows = totalRows;

            if (totalRows === 0) {
                throw new Error('Excel文件为空或没有数据');
            }

            // 获取表头（第一行）
            const headers = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
                const cell = worksheet[cellAddress];
                headers.push(cell ? cell.v : `column_${col + 1}`);
            }

            if (headers.length === 0) {
                throw new Error('Excel文件没有表头');
            }

            // 处理表头
            const processedHeaders = this.processHeaders(headers);

            // 分析数据类型
            const columnDefinitions = await this.analyzeColumnTypes(worksheet, processedHeaders, range);

            return {
                success: true,
                data: {
                    sheetName: firstSheetName,
                    headers: processedHeaders,
                    originalHeaders: headers,
                    columnDefinitions,
                    totalRows: totalRows - 1, // 减去表头行
                    columnCount: processedHeaders.length,
                    parser: this // 返回解析器实例用于流式处理
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 处理表头
     */
    processHeaders(headers) {
        return headers.map((header, index) => {
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
    }

    /**
     * 分析列数据类型
     */
    async analyzeColumnTypes(worksheet, headers, range) {
        const columnDefinitions = headers.map((header, columnIndex) => {
            return {
                name: header,
                originalName: headers[columnIndex],
                type: 'string', // 默认类型，后续会更新
                index: columnIndex
            };
        });

        // 采样分析数据类型（前100行）
        const sampleSize = Math.min(100, this.progress.totalRows - 1);
        const sampleData = [];

        for (let row = range.s.r + 1; row <= range.s.r + sampleSize && row <= range.e.r; row++) {
            const rowData = {};
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellAddress];
                const header = headers[col - range.s.c];
                rowData[header] = cell ? cell.v : null;
            }
            sampleData.push(rowData);
        }

        // 分析每列的数据类型
        columnDefinitions.forEach(columnDef => {
            const columnValues = sampleData.map(row => row[columnDef.name])
                .filter(value => value !== null && value !== undefined && value !== '');

            if (columnValues.length > 0) {
                const sampleValues = columnValues.slice(0, 10);
                const types = sampleValues.map(value => inferDataType(value, columnDef.name));

                const uniqueTypes = [...new Set(types)];
                if (uniqueTypes.length === 1) {
                    columnDef.type = uniqueTypes[0];
                } else if (types.includes('number')) {
                    columnDef.type = 'number';
                } else if (types.includes('date')) {
                    columnDef.type = 'date';
                }
            }
        });

        return columnDefinitions;
    }

    /**
     * 流式读取数据批次
     * @param {Function} onBatch - 批次处理回调
     * @returns {Promise<Object>} 处理结果
     */
    async processInBatches(onBatch) {
        try {
            this.progress.status = 'processing_batches';

            const workbook = XLSX.readFile(this.filePath, {
                type: 'file',
                cellStyles: true,
                cellDates: true
            });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const range = XLSX.utils.decode_range(worksheet['!ref']);

            const headers = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
                const cell = worksheet[cellAddress];
                headers.push(cell ? cell.v : `column_${col + 1}`);
            }

            const processedHeaders = this.processHeaders(headers);
            const totalDataRows = range.e.r - range.s.r;
            let processedRows = 0;

            // 分批处理数据
            for (let startRow = range.s.r + 1; startRow <= range.e.r; startRow += this.options.batchSize) {
                const endRow = Math.min(startRow + this.options.batchSize - 1, range.e.r);
                const batchData = [];

                for (let row = startRow; row <= endRow; row++) {
                    const rowData = {};
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                        const cell = worksheet[cellAddress];
                        const header = processedHeaders[col - range.s.c];

                        let value = cell ? cell.v : null;

                        // 处理空值
                        if (value === null || value === undefined || value === '') {
                            value = null;
                        }

                        rowData[header] = value;
                    }
                    batchData.push(rowData);
                    processedRows++;
                }

                // 更新进度
                this.progress.processedRows = processedRows;
                this.progress.currentBatch++;

                // 处理当前批次
                await onBatch(batchData, this.progress);

                // 检查内存使用
                if (this.shouldCleanMemory()) {
                    global.gc && global.gc();
                }
            }

            this.progress.status = 'completed';
            return {
                success: true,
                totalProcessed: processedRows
            };

        } catch (error) {
            this.progress.status = 'error';
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 检查是否需要清理内存
     */
    shouldCleanMemory() {
        if (global.gc) {
            const used = process.memoryUsage();
            return used.heapUsed > this.options.maxMemoryUsage;
        }
        return false;
    }

    /**
     * 获取当前进度
     */
    getProgress() {
        return { ...this.progress };
    }

    /**
     * 清理临时文件
     */
    cleanup() {
        try {
            if (fs.existsSync(this.filePath)) {
                fs.unlinkSync(this.filePath);
            }
        } catch (error) {
            console.warn('清理临时文件失败:', error.message);
        }
    }
}

module.exports = StreamExcelParser;
