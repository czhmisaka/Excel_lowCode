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

            const result = await httpClient.get(`/api/data/${args.hash}`, {
                page,
                limit,
                ...conditions
            });

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

            const result = await httpClient.post(`/api/data/${args.hash}/add`, args.data);

            return {
                content: [{
                    type: 'text',
                    text: `新增记录成功:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`新增表记录失败: ${error.message}`);
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

            const result = await httpClient.delete(`/api/data/${args.hash}?conditions=${encodeURIComponent(JSON.stringify(args.conditions))}`);

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
