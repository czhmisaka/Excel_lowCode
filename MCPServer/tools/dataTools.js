import httpClient from '../utils/httpClient.js';

/**
 * 数据操作工具
 */
export const dataTools = {
    /**
     * 查询表数据
     */
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
                search: {
                    type: 'string',
                    description: '搜索条件（JSON字符串，可选）'
                }
            },
            required: ['hash']
        }
    },

    /**
     * 新增表记录
     */
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
                    description: '要新增的数据对象'
                }
            },
            required: ['hash', 'data']
        }
    },

    /**
     * 更新表记录
     */
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
                    description: '更新内容'
                }
            },
            required: ['hash', 'conditions', 'updates']
        }
    },

    /**
     * 删除表记录
     */
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
 * 数据工具实现
 */
export class DataToolsHandler {
    /**
     * 查询表数据
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 查询结果
     */
    static async queryTableData(args) {
        try {
            const params = {};
            if (args.page) params.page = args.page;
            if (args.limit) params.limit = args.limit;

            // 正确编码查询条件为JSON字符串，通过search参数传递
            if (args.conditions && Object.keys(args.conditions).length > 0) {
                params.search = JSON.stringify(args.conditions);
            }

            const response = await httpClient.get(`/api/data/${args.hash}`, params);

            if (!response.success) {
                throw new Error(response.message || '查询数据失败');
            }

            const data = response.data || [];
            const pagination = response.pagination || {};

            if (data.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '表中没有数据'
                        }
                    ]
                };
            }

            // 格式化数据展示
            const dataRows = data.map((record, index) => {
                const fields = Object.entries(record)
                    .map(([key, value]) => `    ${key}: ${value}`)
                    .join('\n');
                return `记录 ${index + 1}:\n${fields}`;
            }).join('\n\n');

            const paginationInfo = pagination.total ?
                `\n\n分页信息：\n- 当前页：${pagination.page || 1}\n- 每页数量：${pagination.limit || 10}\n- 总记录数：${pagination.total}\n- 总页数：${pagination.pages || 1}` : '';

            return {
                content: [
                    {
                        type: 'text',
                        text: `查询到 ${data.length} 条记录：\n\n${dataRows}${paginationInfo}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `查询表数据失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 新增表记录
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 新增结果
     */
    static async addTableRecord(args) {
        try {
            // 修正请求格式：后端期望 { data: {...} } 格式
            const requestBody = {
                data: args.data
            };

            console.log('发送新增记录请求:', {
                hash: args.hash,
                data: args.data,
                requestBody: requestBody
            });

            const response = await httpClient.post(`/api/data/${args.hash}/add`, requestBody);

            if (!response.success) {
                throw new Error(response.message || '新增数据失败');
            }

            const newRecord = response.data;

            return {
                content: [
                    {
                        type: 'text',
                        text: `数据新增成功！\n新增记录ID：${newRecord.id}\n完整记录：\n${JSON.stringify(newRecord, null, 2)}`
                    }
                ]
            };
        } catch (error) {
            // 提供更详细的错误信息
            const errorMessage = error.message.includes('400')
                ? `新增表记录失败: 请求格式错误 (400) - 请检查数据格式是否符合表结构要求`
                : `新增表记录失败: ${error.message}`;

            return {
                content: [
                    {
                        type: 'text',
                        text: errorMessage
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 更新表记录
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 更新结果
     */
    static async updateTableRecord(args) {
        try {
            const response = await httpClient.put(`/api/data/${args.hash}`, {
                conditions: args.conditions,
                updates: args.updates
            });

            if (!response.success) {
                throw new Error(response.message || '更新数据失败');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `数据更新成功！\n影响记录数：${response.affectedRows}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `更新表记录失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    /**
     * 删除表记录
     * @param {object} args - 参数对象
     * @returns {Promise<object>} 删除结果
     */
    static async deleteTableRecord(args) {
        try {
            const response = await httpClient.delete(`/api/data/${args.hash}`, {
                conditions: args.conditions
            });

            if (!response.success) {
                throw new Error(response.message || '删除数据失败');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `数据删除成功！\n删除记录数：${response.affectedRows}`
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `删除表记录失败：${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
}
