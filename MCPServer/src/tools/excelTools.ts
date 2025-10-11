import httpClient from '../utils/httpClient.js';

/**
 * Excel工具定义
 */
export const excelTools = {
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
 * Excel工具处理器
 */
export class ExcelToolsHandler {
    /**
     * 上传Excel文件
     */
    static async uploadExcelFile(args: any): Promise<any> {
        try {
            // 检查API连接
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            // 这里需要实现文件上传逻辑
            // 由于MCP工具的限制，文件上传需要通过其他方式处理
            // 暂时返回提示信息
            return {
                content: [{
                    type: 'text',
                    text: `文件上传功能需要直接访问文件系统。请使用其他方式上传文件到Excel数据管理系统，然后使用其他工具进行数据操作。\n文件路径: ${args.file_path}${args.table_name ? `\n自定义表名: ${args.table_name}` : ''}`
                }]
            };
        } catch (error: any) {
            throw new Error(`上传Excel文件失败: ${error.message}`);
        }
    }

    /**
     * 列出Excel文件
     */
    static async listExcelFiles(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const page = args.page || 1;
            const limit = args.limit || 10;

            const result = await httpClient.get('/api/mappings', {
                page,
                limit
            });

            return {
                content: [{
                    type: 'text',
                    text: `Excel文件列表 (第${page}页，每页${limit}条):\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`获取Excel文件列表失败: ${error.message}`);
        }
    }

    /**
     * 获取Excel文件元数据
     */
    static async getExcelMetadata(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const result = await httpClient.get(`/api/mappings/${args.hash}`);

            return {
                content: [{
                    type: 'text',
                    text: `Excel文件元数据:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`获取Excel文件元数据失败: ${error.message}`);
        }
    }
}
