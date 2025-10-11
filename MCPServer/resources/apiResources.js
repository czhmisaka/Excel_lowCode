import httpClient from '../utils/httpClient.js';

/**
 * API资源配置
 */
export const apiResources = {
    /**
     * Excel表资源
     */
    excel_tables: {
        name: 'excel_tables',
        description: 'Excel文件与动态表的映射关系',
        mimeType: 'application/json'
    },

    /**
     * 表映射资源
     */
    table_mappings: {
        name: 'table_mappings',
        description: '所有表映射关系的详细信息',
        mimeType: 'application/json'
    },

    /**
     * 系统状态资源
     */
    system_status: {
        name: 'system_status',
        description: 'Excel数据管理系统的健康状态',
        mimeType: 'application/json'
    }
};

/**
 * 资源处理器
 */
export class ResourceHandler {
    /**
     * 获取Excel表资源
     * @param {object} uri - 资源URI
     * @returns {Promise<object>} 资源内容
     */
    static async getExcelTables(uri) {
        try {
            const response = await httpClient.get('/api/mappings');

            if (!response.success) {
                throw new Error(response.message || '获取Excel表资源失败');
            }

            const tables = response.data || [];

            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            success: true,
                            data: tables,
                            total: tables.length,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    /**
     * 获取表映射资源
     * @param {object} uri - 资源URI
     * @returns {Promise<object>} 资源内容
     */
    static async getTableMappings(uri) {
        try {
            // 获取所有映射关系
            const mappingsResponse = await httpClient.get('/api/mappings');

            if (!mappingsResponse.success) {
                throw new Error(mappingsResponse.message || '获取表映射资源失败');
            }

            const mappings = mappingsResponse.data || [];

            // 为每个映射获取详细信息
            const detailedMappings = await Promise.all(
                mappings.map(async (mapping) => {
                    try {
                        // 获取列信息
                        const columnsResponse = await httpClient.get(`/api/mappings/${mapping.hashValue}/columns`);
                        const columns = columnsResponse.success ? columnsResponse.data : [];

                        // 获取数据统计
                        const dataResponse = await httpClient.get(`/api/data/${mapping.hashValue}`, { limit: 1 });
                        const totalRecords = dataResponse.pagination?.total || 0;

                        return {
                            ...mapping,
                            columns: columns,
                            totalRecords: totalRecords,
                            lastUpdated: mapping.updatedAt
                        };
                    } catch (error) {
                        return {
                            ...mapping,
                            columns: [],
                            totalRecords: 0,
                            error: error.message
                        };
                    }
                })
            );

            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            success: true,
                            data: detailedMappings,
                            total: detailedMappings.length,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    /**
     * 获取系统状态资源
     * @param {object} uri - 资源URI
     * @returns {Promise<object>} 资源内容
     */
    static async getSystemStatus(uri) {
        try {
            const healthResponse = await httpClient.get('/health');

            // 获取映射关系统计
            const mappingsResponse = await httpClient.get('/api/mappings');
            const totalTables = mappingsResponse.success ? mappingsResponse.data.length : 0;

            // 获取总记录数（简化处理，实际可能需要更复杂的统计）
            let totalRecords = 0;
            if (mappingsResponse.success && mappingsResponse.data.length > 0) {
                // 只统计前几个表，避免性能问题
                const sampleTables = mappingsResponse.data.slice(0, 5);
                for (const table of sampleTables) {
                    try {
                        const dataResponse = await httpClient.get(`/api/data/${table.hashValue}`, { limit: 1 });
                        totalRecords += dataResponse.pagination?.total || 0;
                    } catch (error) {
                        // 忽略单个表的错误
                    }
                }
            }

            const statusInfo = {
                system: {
                    status: healthResponse.status,
                    database: healthResponse.database,
                    environment: healthResponse.environment,
                    timestamp: healthResponse.timestamp
                },
                statistics: {
                    totalTables: totalTables,
                    totalRecords: totalRecords,
                    apiBaseUrl: httpClient.baseURL
                },
                server: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    uptime: process.uptime()
                }
            };

            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify(statusInfo, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    /**
     * 根据URI获取资源
     * @param {object} uri - 资源URI
     * @returns {Promise<object>} 资源内容
     */
    static async getResource(uri) {
        const resourceName = uri.pathname.split('/').pop();

        switch (resourceName) {
            case 'excel_tables':
                return this.getExcelTables(uri);
            case 'table_mappings':
                return this.getTableMappings(uri);
            case 'system_status':
                return this.getSystemStatus(uri);
            default:
                throw new Error(`未知资源: ${resourceName}`);
        }
    }
}
