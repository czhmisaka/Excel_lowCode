import httpClient from '../utils/httpClient.js';

/**
 * 映射关系操作工具
 */
export const mappingTools = {
    /**
     * 列出表映射关系
     */
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

    /**
     * 获取表详细信息
     */
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

    /**
     * 更新表名
     */
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
                table_name: {
                    type: 'string',
                    description: '新的表名'
                }
            },
            required: ['hash', 'table_name']
        }
    },

    /**
     * 删除表映射
     */
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

    /**
     * 检查系统健康状态
     */
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
 * 映射关系工具实现
 */
export class MappingToolsHandler {
    /**
     * 列出表映射关系
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 映射关系列表
     */
    static async listTableMappings(args) {
        try {
            const params = {};
            if (args.page) params.page = args.page;
            if (args.limit) params.limit = args.limit;

            const response = await httpClient.get('/api/mappings', params);

            if (!response.success) {
                throw new Error(response.message || '获取映射关系列表失败');
            }

            const mappings = response.data || [];

            if (mappings.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '没有找到任何表映射关系'
                        }
                    ]
                };
            }

            const mappingList = mappings.map(mapping => {
                let columnCount = '未知';
                try {
                    if (mapping.columnDefinitions) {
                        const columns = typeof mapping.columnDefinitions === 'string'
                            ? JSON.parse(mapping.columnDefinitions)
                            : mapping.columnDefinitions;
                        columnCount = Array.isArray(columns) ? columns.length : '未知';
                    }
                } catch (e) {
                    columnCount = '解析失败';
                }

                return `- 表名：${mapping.tableName}\n  哈希值：${mapping.hashValue}\n  列数：${columnCount}\n  创建时间：${new Date(mapping.createdAt).toLocaleString()}`;
            }).join('\n\n');

            return {
                content: [
                    {
                        type: 'text',
                        text: `找到 ${mappings.length} 个表映射关系：\n\n${mappingList}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `获取表映射关系列表失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 获取表详细信息
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 表详细信息
     */
    static async getTableInfo(args) {
        try {
            // 获取基本映射信息
            const mappingResponse = await httpClient.get(`/api/mappings/${args.hash}`);

            if (!mappingResponse.success) {
                throw new Error(mappingResponse.message || '获取表信息失败');
            }

            const mapping = mappingResponse.data;
            let columnInfo = '';
            let sampleData = '';

            // 获取列信息
            try {
                const columnsResponse = await httpClient.get(`/api/mappings/${args.hash}/columns`);
                if (columnsResponse.success && columnsResponse.data) {
                    const columns = columnsResponse.data.map(col =>
                        `  - ${col.name} (${col.type})${col.nullable ? ' [可为空]' : ''}${col.defaultValue ? ` 默认值: ${col.defaultValue}` : ''}`
                    ).join('\n');
                    columnInfo = `\n\n列定义：\n${columns}`;
                }
            } catch (columnError) {
                columnInfo = `\n\n列信息获取失败：${columnError.message}`;
            }

            // 获取样本数据
            try {
                const dataResponse = await httpClient.get(`/api/data/${args.hash}`, { limit: 3 });
                if (dataResponse.success && dataResponse.data && dataResponse.data.length > 0) {
                    const sampleRecords = dataResponse.data.slice(0, 3).map((record, index) => {
                        const fields = Object.entries(record)
                            .map(([key, value]) => `    ${key}: ${value}`)
                            .join('\n');
                        return `样本记录 ${index + 1}:\n${fields}`;
                    }).join('\n\n');
                    sampleData = `\n\n样本数据（前3条）：\n${sampleRecords}`;
                }
            } catch (dataError) {
                sampleData = `\n\n样本数据获取失败：${dataError.message}`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `表详细信息：\n- 表名：${mapping.tableName}\n- 哈希值：${mapping.hashValue}\n- 创建时间：${new Date(mapping.createdAt).toLocaleString()}\n- 更新时间：${new Date(mapping.updatedAt).toLocaleString()}${columnInfo}${sampleData}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `获取表详细信息失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 更新表名
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 更新结果
     */
    static async updateTableName(args) {
        try {
            const response = await httpClient.put(`/api/mappings/${args.hash}`, {
                tableName: args.table_name
            });

            if (!response.success) {
                throw new Error(response.message || '更新表名失败');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `表名更新成功！\n新表名：${args.table_name}\n哈希值：${args.hash}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `更新表名失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 删除表映射
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 删除结果
     */
    static async deleteTableMapping(args) {
        try {
            const response = await httpClient.delete(`/api/mappings/${args.hash}`);

            if (!response.success) {
                throw new Error(response.message || '删除表映射失败');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `表映射删除成功！\n已删除表：${response.data?.tableName || '未知'}\n哈希值：${args.hash}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `删除表映射失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 检查系统健康状态
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 健康状态
     */
    static async checkSystemHealth(args) {
        try {
            const response = await httpClient.get('/health');

            const statusInfo = `系统健康状态：\n- 状态：${response.status}\n- 数据库：${response.database}\n- 环境：${response.environment}\n- 时间戳：${new Date(response.timestamp).toLocaleString()}`;

            return {
                content: [
                    {
                        type: 'text',
                        text: statusInfo
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `检查系统健康状态失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
}
