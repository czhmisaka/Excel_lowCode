import httpClient from '../utils/httpClient.js';

/**
 * Excel文件操作工具
 */
export const excelTools = {
    /**
     * 上传Excel文件
     */
    upload_excel_file: {
        name: 'upload_excel_file',
        description: '上传Excel文件并创建对应的数据表',
        inputSchema: {
            type: 'object',
            properties: {
                file_path: {
                    type: 'string',
                    description: 'Excel文件的本地路径'
                },
                table_name: {
                    type: 'string',
                    description: '自定义表名（可选）'
                }
            },
            required: ['file_path']
        }
    },

    /**
     * 列出已上传的Excel文件
     */
    list_excel_files: {
        name: 'list_excel_files',
        description: '列出所有已上传的Excel文件及其映射关系',
        inputSchema: {
            type: 'object',
            properties: {
                page: {
                    type: 'number',
                    description: '页码（可选，默认1）',
                    minimum: 1
                },
                limit: {
                    type: 'number',
                    description: '每页数量（可选，默认10）',
                    minimum: 1,
                    maximum: 100
                }
            }
        }
    },

    /**
     * 获取Excel文件元数据
     */
    get_excel_metadata: {
        name: 'get_excel_metadata',
        description: '根据哈希值获取Excel文件的详细信息',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: 'Excel文件的哈希值'
                }
            },
            required: ['hash']
        }
    }
};

/**
 * Excel工具实现
 */
export class ExcelToolsHandler {
    /**
     * 上传Excel文件
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 上传结果
     */
    static async uploadExcelFile(args) {
        try {
            // 注意：实际的文件上传需要处理multipart/form-data
            // 这里简化处理，实际实现需要处理文件上传
            throw new Error('文件上传功能需要实现multipart/form-data处理');

            // 示例实现（需要实际文件处理）：
            // const formData = new FormData();
            // const file = await fs.readFile(args.file_path);
            // formData.append('file', file, path.basename(args.file_path));
            // 
            // const response = await httpClient.post('/api/upload', formData, {
            //     headers: {
            //         'Content-Type': 'multipart/form-data'
            //     }
            // });
            // 
            // return {
            //     content: [
            //         {
            //             type: 'text',
            //             text: `Excel文件上传成功：\n- 哈希值：${response.data.hash}\n- 表名：${response.data.tableName}\n- 记录数：${response.data.recordCount}`
            //         }
            //     ]
            // };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `上传Excel文件失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 列出Excel文件
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 文件列表
     */
    static async listExcelFiles(args) {
        try {
            const params = {};
            if (args.page) params.page = args.page;
            if (args.limit) params.limit = args.limit;

            const response = await httpClient.get('/api/mappings', params);

            if (!response.success) {
                throw new Error(response.message || '获取文件列表失败');
            }

            const files = response.data || [];

            if (files.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '没有找到任何Excel文件映射'
                        }
                    ]
                };
            }

            const fileList = files.map(file =>
                `- 表名：${file.tableName}\n  哈希值：${file.hashValue}\n  创建时间：${new Date(file.createdAt).toLocaleString()}\n  列数：${file.columnDefinitions ? JSON.parse(file.columnDefinitions).length : '未知'}`
            ).join('\n\n');

            return {
                content: [
                    {
                        type: 'text',
                        text: `找到 ${files.length} 个Excel文件映射：\n\n${fileList}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `获取Excel文件列表失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 获取Excel文件元数据
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 文件元数据
     */
    static async getExcelMetadata(args) {
        try {
            const response = await httpClient.get(`/api/mappings/${args.hash}`);

            if (!response.success) {
                throw new Error(response.message || '获取文件元数据失败');
            }

            const metadata = response.data;
            let columnInfo = '';

            // 获取列信息
            try {
                const columnsResponse = await httpClient.get(`/api/mappings/${args.hash}/columns`);
                if (columnsResponse.success && columnsResponse.data) {
                    const columns = columnsResponse.data.map(col =>
                        `  - ${col.name} (${col.type})${col.nullable ? ' [可为空]' : ''}${col.defaultValue ? ` 默认值: ${col.defaultValue}` : ''}`
                    ).join('\n');
                    columnInfo = `\n列定义：\n${columns}`;
                }
            } catch (columnError) {
                columnInfo = `\n列信息获取失败：${columnError.message}`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `Excel文件详细信息：\n- 表名：${metadata.tableName}\n- 哈希值：${metadata.hashValue}\n- 创建时间：${new Date(metadata.createdAt).toLocaleString()}\n- 更新时间：${new Date(metadata.updatedAt).toLocaleString()}${columnInfo}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `获取Excel文件元数据失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
}
