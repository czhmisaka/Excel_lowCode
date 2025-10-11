import httpClient from '../utils/httpClient.js';

/**
 * 映射关系工具定义
 */
export const mappingTools = {
    list_table_mappings: {
        name: 'list_table_mappings',
        description: '列出所有Excel文件与动态表的映射关系',
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
    get_table_info: {
        name: 'get_table_info',
        description: '根据哈希值获取表的详细信息',
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
    },
    update_table_name: {
        name: 'update_table_name',
        description: '根据哈希值更新表映射关系的表名',
        inputSchema: {
            type: 'object',
            properties: {
                hash: {
                    type: 'string',
                    description: '表的哈希值'
                },
                new_table_name: {
                    type: 'string',
                    description: '新的表名'
                }
            },
            required: ['hash', 'new_table_name']
        }
    },
    delete_table_mapping: {
        name: 'delete_table_mapping',
        description: '根据哈希值删除表映射关系，并同步删除对应的数据表',
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
    },
    check_system_health: {
        name: 'check_system_health',
        description: '检查Excel数据管理系统的健康状态',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    }
};

/**
 * 映射关系工具处理器
 */
export class MappingToolsHandler {
    /**
     * 列出表映射关系
     */
    static async listTableMappings(args: any): Promise<any> {
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
                    text: `表映射关系列表 (第${page}页，每页${limit}条):\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`获取表映射关系列表失败: ${error.message}`);
        }
    }

    /**
     * 获取表信息
     */
    static async getTableInfo(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const result = await httpClient.get(`/api/mappings/${args.hash}`);

            return {
                content: [{
                    type: 'text',
                    text: `表详细信息:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`获取表信息失败: ${error.message}`);
        }
    }

    /**
     * 更新表名
     */
    static async updateTableName(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const result = await httpClient.put(`/api/mappings/${args.hash}`, {
                tableName: args.new_table_name
            });

            return {
                content: [{
                    type: 'text',
                    text: `更新表名成功:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`更新表名失败: ${error.message}`);
        }
    }

    /**
     * 删除表映射关系
     */
    static async deleteTableMapping(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();
            if (!isConnected) {
                throw new Error('无法连接到Excel数据管理系统API，请检查服务是否运行');
            }

            const result = await httpClient.delete(`/api/mappings/${args.hash}`);

            return {
                content: [{
                    type: 'text',
                    text: `删除表映射关系成功:\n${JSON.stringify(result, null, 2)}`
                }]
            };
        } catch (error: any) {
            throw new Error(`删除表映射关系失败: ${error.message}`);
        }
    }

    /**
     * 检查系统健康状态
     */
    static async checkSystemHealth(args: any): Promise<any> {
        try {
            const isConnected = await httpClient.checkConnection();

            return {
                content: [{
                    type: 'text',
                    text: `系统健康状态检查:\n- API连接状态: ${isConnected ? '正常' : '异常'}\n- 服务器时间: ${new Date().toISOString()}\n- 环境: ${process.env.NODE_ENV || 'development'}`
                }]
            };
        } catch (error: any) {
            throw new Error(`检查系统健康状态失败: ${error.message}`);
        }
    }
}
