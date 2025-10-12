import httpClient from '../utils/httpClient.js';

/**
 * 数据操作工具定义
 */
export const dataTools = {
    query_table_data: {
        name: 'query_table_data',
        description: '根据哈希值查询对应表的数据（支持分页和条件查询）',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                },
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
                },
                conditions: {
                    type: 'object',
                    description: '查询条件（可选）'
                }
            },
            required: ['hash']
        }
    },
    add_table_record: {
        name: 'add_table_record',
        description: '向指定表中新增数据记录',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                },
                data: {
                    type: 'object',
                    description: '要新增的数据记录'
                }
            },
            required: ['hash', 'data']
        }
    },
    update_table_record: {
        name: 'update_table_record',
        description: '根据条件更新表中的数据记录',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                },
                conditions: {
                    type: 'object',
                    description: '更新条件'
                },
                updates: {
                    type: 'object',
                    description: '要更新的字段和值'
                }
            },
            required: ['hash', 'conditions', 'updates']
        }
    },
    delete_table_record: {
        name: 'delete_table_record',
        description: '根据条件删除表中的数据记录',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                },
                conditions: {
                    type: 'object',
                    description: '删除条件'
                }
            },
            required: ['hash', 'conditions']
        }
    },
    export_table_to_excel: {
        name: 'export_table_to_excel',
        description: '根据哈希值导出表的所有数据为Excel文件',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                },
                output_path: {
                    type: 'string',
                    description: 'Excel文件保存路径（可选）'
                }
            },
            required: ['hash']
        }
    },
    check_export_status: {
        name: 'check_export_status',
        description: '检查表是否存在以及是否支持导出',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                }
            },
            required: ['hash']
        }
    }
};

/**
 * 数据操作工具处理器
 */
export class DataToolsHandler {
    /**
     * 查询表数据
     */
    static async queryTableData(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const page = args.page || 1;
            const limit = args.limit || 10;
            const conditions = args.conditions || {};

            // 正确编码查询条件为JSON字符串，通过search参数传递
            const params: any = {
                page,
                limit
            };

            if (Object.keys(conditions).length > 0) {
                params.search = JSON.stringify(conditions);
            }

            const result = await httpClient.get(`/api/data/${args.hash}`, params);

            return {
                content: [{
                    type: 'text',
                    text: `表数据查询结果 (第${page}页，每页${limit}条):\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`查询表数据失败: ${error.message}`);
        }
    }

    /**
     * 新增表记录
     */
    static async addTableRecord(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            // 修正请求格式：后端期望 { data: {...} } 格式
            const requestBody = {
                data: args.data
            };

            console.log('发送新增记录请求:', {
                hash: args.hash,
                data: args.data,
                requestBody: requestBody
            });

            const result = await httpClient.post(`/api/data/${args.hash}/add`, requestBody);

            return {
                content: [{
                    type: 'text',
                    text: `新增记录成功:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            // 提供更详细的错误信息
            const errorMessage = error.message.includes('400')
                ? `新增表记录失败: 请求格式错误 (400) - 请检查数据格式是否符合表结构要求`
                : `新增表记录失败: ${error.message}`;

            throw new Error(errorMessage);
        }
    }

    /**
     * 更新表记录
     */
    static async updateTableRecord(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const result = await httpClient.put(`/api/data/${args.hash}`, {
                conditions: args.conditions,
                updates: args.updates
            });

            return {
                content: [{
                    type: 'text',
                    text: `更新记录成功:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`更新表记录失败: ${error.message}`);
        }
    }

    /**
     * 删除表记录
     */
    static async deleteTableRecord(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            // 使用请求体传递删除条件，而不是URL参数
            const result = await httpClient.delete(`/api/data/${args.hash}`, {
                conditions: args.conditions
            });

            return {
                content: [{
                    type: 'text',
                    text: `删除记录成功:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`删除表记录失败: ${error.message}`);
        }
    }

    /**
     * 导出表数据为Excel文件
     */
    static async exportTableToExcel(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            // 首先检查导出状态
            const statusResult = await httpClient.get(`/api/data/${args.hash}/export/status`);

            if (!statusResult.success) {
                throw new Error(`无法导出表数据: ${statusResult.message}`);
            }

            const tableInfo = statusResult.data;

            // 导出Excel文件
            const excelBuffer = await httpClient.getBinary(`/api/data/${args.hash}/export`);

            // 生成文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const fileName = `${tableInfo.tableName || 'data'}_export_${timestamp}.xlsx`;

            // 保存文件到exports目录
            const exportsDir = './exports';
            const filePath = `${exportsDir}/${fileName}`;

            // 确保exports目录存在
            const fs = await import('fs');
            const path = await import('path');

            if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
            }

            // 写入文件
            fs.writeFileSync(filePath, excelBuffer);

            // 生成下载地址
            const downloadUrl = `http://localhost:3001/export/${fileName}`;

            return {
                content: [{
                    type: 'text',
                    text: `Excel文件导出成功！\n表名: ${tableInfo.tableName}\n原始文件名: ${tableInfo.originalFileName}\n列数: ${tableInfo.columnCount}\n行数: ${tableInfo.rowCount}\n文件名: ${fileName}\n文件大小: ${excelBuffer.length} 字节\n下载地址: ${downloadUrl}\n\n您可以通过以下链接下载文件：\n${downloadUrl}`
                }]
            };
        } catch (error: any) {
            throw new Error(`导出表数据为Excel失败: ${error.message}`);
        }
    }

    /**
     * 检查导出状态
     */
    static async checkExportStatus(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const result = await httpClient.get(`/api/data/${args.hash}/export/status`);

            if (result.success) {
                const tableInfo = result.data;
                return {
                    content: [{
                        type: 'text',
                        text: `导出状态检查成功:\n表名: ${tableInfo.tableName}\n原始文件名: ${tableInfo.originalFileName}\n列数: ${tableInfo.columnCount}\n行数: ${tableInfo.rowCount}\n创建时间: ${tableInfo.createdAt}\n支持导出: ${tableInfo.exportSupported ? '是' : '否'}`
                    }]
                };
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            throw new Error(`检查导出状态失败: ${error.message}`);
        }
    }
}
