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
}
