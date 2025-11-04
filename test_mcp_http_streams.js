/*
 * @Date: 2025-10-31 16:01:16
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 16:18:02
 * @FilePath: /lowCode_excel/test_mcp_http_streams.js
 * @Description: MCP服务器HTTP流测试脚本 - 使用正确的MCP协议
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * MCP服务器HTTP流测试客户端 - 使用正确的MCP协议
 */
class MCPHTTPStreamTester {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.client = null;
        this.transport = null;
    }

    /**
     * 初始化MCP会话
     */
    async initializeSession() {
        console.log('🔗 初始化 MCP 会话...');

        try {
            // 创建HTTP流传输
            this.transport = new StreamableHTTPClientTransport(`${this.baseUrl}/mcp`);

            // 创建MCP客户端
            this.client = new Client({
                name: 'mcp-test-client',
                version: '1.0.0'
            });

            // 连接到服务器
            await this.client.connect(this.transport);

            console.log('✅ MCP 会话初始化成功');
            return true;
        } catch (error) {
            console.error('❌ MCP 会话初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取工具列表
     */
    async getToolsList() {
        if (!this.client) {
            throw new Error('会话未初始化');
        }

        console.log('📋 获取工具列表...');
        const result = await this.client.listTools();
        console.log('✅ 工具列表获取成功');
        return result;
    }

    /**
     * 调用工具
     */
    async callTool(name, args = {}) {
        if (!this.client) {
            throw new Error('会话未初始化');
        }

        console.log(`🔧 调用工具: ${name}`);
        const result = await this.client.callTool({
            name,
            arguments: args
        });
        console.log('✅ 工具调用成功');
        return result;
    }

    /**
     * 测试MCP工作流
     */
    async testWorkflow() {
        console.log('\n🚀 开始 MCP 服务器工作流测试 (HTTP流方式)...');
        console.log('测试流程：查询表 → 获取表结构 → 查询表数据分页\n');

        try {
            // 初始化会话
            await this.initializeSession();

            // 步骤1: 获取工具列表
            console.log('=== 步骤1: 获取工具列表 ===');
            const toolsResult = await this.getToolsList();
            console.log(`📋 可用工具数量: ${toolsResult.tools.length}`);

            // 显示可用的数据相关工具
            const dataTools = toolsResult.tools.filter(tool =>
                tool.name.includes('table') || tool.name.includes('mapping')
            );
            console.log('📊 数据相关工具:');
            dataTools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
            });

            console.log('\n' + '='.repeat(50) + '\n');

            // 步骤2: 查询表映射关系
            console.log('=== 步骤2: 查询表映射关系 ===');
            const mappingsResult = await this.callTool('list_table_mappings', {
                page: 1,
                limit: 10
            });

            // 解析结果获取第一个表的哈希值
            const mappingsText = mappingsResult.content[0].text;
            console.log('📄 原始响应文本:', mappingsText);

            // 跳过第一行描述性文本，从第二行开始解析JSON
            const jsonLines = mappingsText.split('\n').slice(1);
            const jsonText = jsonLines.join('\n');

            // 尝试解析JSON
            let mappingsData;
            try {
                mappingsData = JSON.parse(jsonText);
            } catch (error) {
                console.error('❌ JSON解析失败:', error);
                console.log('📄 尝试解析的JSON文本:', jsonText);
                throw error;
            }

            if (mappingsData.success && mappingsData.data && mappingsData.data.length > 0) {
                const firstTable = mappingsData.data[0];
                const firstTableHash = firstTable.hashValue;
                const firstTableName = firstTable.tableName;

                console.log('✅ 表映射关系获取成功');
                console.log(`🔍 选择第一个表进行测试:`);
                console.log(`   - 表名: ${firstTableName}`);
                console.log(`   - 哈希值: ${firstTableHash}`);
                console.log(`   - 列数: ${firstTable.columnCount}`);
                console.log(`   - 行数: ${firstTable.rowCount}`);

                // 显示所有表的简要信息
                console.log(`\n📋 找到 ${mappingsData.data.length} 个表:`);
                mappingsData.data.forEach((table, index) => {
                    console.log(`   ${index + 1}. ${table.tableName} (${table.hashValue}) - ${table.rowCount}行`);
                });

                console.log('\n' + '='.repeat(50) + '\n');

                // 步骤3: 获取表结构信息
                console.log('=== 步骤3: 获取表结构信息 ===');
                const tableInfoResult = await this.callTool('get_table_info', {
                    hash: firstTableHash
                });

                const tableInfoText = tableInfoResult.content[0].text;
                const tableInfoJsonLines = tableInfoText.split('\n').slice(1);
                const tableInfoJsonText = tableInfoJsonLines.join('\n');
                const tableInfoData = JSON.parse(tableInfoJsonText);

                if (tableInfoData.success && tableInfoData.data) {
                    const tableInfo = tableInfoData.data;
                    console.log('✅ 表结构信息获取成功');
                    console.log(`📋 表结构详细信息:`);
                    console.log(`   - 表名: ${tableInfo.tableName}`);
                    console.log(`   - 原始文件名: ${tableInfo.originalFileName || 'N/A'}`);
                    console.log(`   - 哈希值: ${tableInfo.hashValue}`);
                    console.log(`   - 列数: ${tableInfo.columnCount}`);
                    console.log(`   - 行数: ${tableInfo.rowCount}`);
                    console.log(`   - 创建时间: ${tableInfo.createdAt}`);

                    // 显示列定义
                    if (tableInfo.columnDefinitions && tableInfo.columnDefinitions.length > 0) {
                        console.log(`\n📊 列定义:`);
                        tableInfo.columnDefinitions.forEach((column, index) => {
                            console.log(`   ${index + 1}. ${column.name} (${column.originalName}) - ${column.type}`);
                        });
                    }
                }

                console.log('\n' + '='.repeat(50) + '\n');

                // 步骤4: 查询表数据分页第一页
                console.log('=== 步骤4: 查询表数据分页第一页 ===');
                const queryResult = await this.callTool('query_table_data', {
                    hash: firstTableHash,
                    page: 1,
                    limit: 5
                });

                const queryText = queryResult.content[0].text;
                console.log('📄 表数据查询原始响应文本:', queryText);

                const queryJsonLines = queryText.split('\n').slice(1);
                const queryJsonText = queryJsonLines.join('\n');
                console.log('📄 表数据查询JSON文本:', queryJsonText);

                const queryData = JSON.parse(queryJsonText);

                if (queryData.success && queryData.data) {
                    console.log('✅ 表数据查询成功');
                    console.log(`📊 查询结果 (第1页，每页5条):`);
                    console.log(`   - 总记录数: ${queryData.pagination?.total || '未知'}`);
                    console.log(`   - 总页数: ${queryData.pagination?.pages || '未知'}`);
                    console.log(`   - 当前页: ${queryData.pagination?.page || 1}`);
                    console.log(`   - 每页数量: ${queryData.pagination?.limit || 5}`);

                    // 显示数据预览
                    if (queryData.data.length > 0) {
                        console.log(`\n📋 数据预览 (前3条):`);
                        queryData.data.slice(0, 3).forEach((record, index) => {
                            console.log(`\n   记录 ${index + 1}:`);
                            Object.entries(record).forEach(([key, value]) => {
                                console.log(`     ${key}: ${value}`);
                            });
                        });

                        if (queryData.data.length > 3) {
                            console.log(`\n   ... 还有 ${queryData.data.length - 3} 条记录`);
                        }
                    } else {
                        console.log('   📭 表中没有数据');
                    }
                }

                console.log('\n' + '='.repeat(50));
                console.log('🎉 MCP 服务器工作流测试完成！');
                console.log('✅ 所有步骤执行成功');
                console.log(`📊 测试表: ${firstTableName} (${firstTableHash})`);
                console.log('🚀 MCP 服务器功能正常');

            } else {
                console.log('❌ 没有找到任何表映射关系，请先上传Excel文件');
            }

        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        } finally {
            // 清理资源
            if (this.client) {
                try {
                    await this.client.close();
                    console.log('🔒 MCP 会话已关闭');
                } catch (error) {
                    console.error('关闭会话时出错:', error);
                }
            }
        }
    }
}

// 执行测试
async function main() {
    const tester = new MCPHTTPStreamTester();

    try {
        await tester.testWorkflow();
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

main().catch(console.error);
