import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import * as express from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import httpClient from "./utils/httpClient.js";
import { excelTools, ExcelToolsHandler } from "./tools/excelTools.js";
import { dataTools, DataToolsHandler } from "./tools/dataTools.js";
import { mappingTools, MappingToolsHandler } from "./tools/mappingTools.js";

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith("--mode="));
if (modeArg) {
    process.env.MODE = modeArg.split("=")[1];
}

/**
 * Excel数据管理系统的MCP服务器
 */
export const mcpServer = new McpServer(
    {
        name: "excel-data-mcp-server",
        version: "1.0.0",
        description: "Excel数据管理系统的MCP服务器，提供Excel文件操作和数据管理功能",
        title: "Excel Data MCP Server",
    },
    {
        instructions: "这是一个Excel数据管理系统的MCP服务器，提供Excel文件上传、数据查询、映射关系管理等工具。",
    },
);

/**
 * 注册Excel文件操作工具
 */
mcpServer.registerTool(
    "upload_excel_file",
    {
        description: "上传Excel文件并创建对应的数据表",
        inputSchema: {
            file_path: z.string().describe("Excel文件的本地路径"),
            table_name: z.string().optional().describe("自定义表名（可选）")
        }
    },
    async (args: any) => {
        return await ExcelToolsHandler.uploadExcelFile(args);
    }
);

mcpServer.registerTool(
    "list_excel_files",
    {
        description: "列出所有已上传的Excel文件及其映射关系",
        inputSchema: {
            page: z.number().min(1).optional().describe("页码（可选，默认1）"),
            limit: z.number().min(1).max(100).optional().describe("每页数量（可选，默认10）")
        }
    },
    async (args: any) => {
        return await ExcelToolsHandler.listExcelFiles(args);
    }
);

mcpServer.registerTool(
    "get_excel_metadata",
    {
        description: "根据哈希值获取Excel文件的详细信息",
        inputSchema: {
            hash: z.string().describe("Excel文件的哈希值")
        }
    },
    async (args: any) => {
        return await ExcelToolsHandler.getExcelMetadata(args);
    }
);

/**
 * 注册数据操作工具
 */
mcpServer.registerTool(
    "query_table_data",
    {
        description: "根据哈希值查询对应表的数据（支持分页和条件查询）",
        inputSchema: {
            hash: z.string().describe("表的哈希值"),
            page: z.number().min(1).optional().describe("页码（可选，默认1）"),
            limit: z.number().min(1).max(100).optional().describe("每页数量（可选，默认10）"),
            conditions: z.record(z.any()).optional().describe("查询条件（可选）")
        }
    },
    async (args: any) => {
        return await DataToolsHandler.queryTableData(args);
    }
);

mcpServer.registerTool(
    "add_table_record",
    {
        description: "向指定表中新增数据记录",
        inputSchema: {
            hash: z.string().describe("表的哈希值"),
            data: z.record(z.any()).describe("要新增的数据记录")
        }
    },
    async (args: any) => {
        return await DataToolsHandler.addTableRecord(args);
    }
);

mcpServer.registerTool(
    "update_table_record",
    {
        description: "根据条件更新表中的数据记录",
        inputSchema: {
            hash: z.string().describe("表的哈希值"),
            conditions: z.record(z.any()).describe("更新条件"),
            updates: z.record(z.any()).describe("要更新的字段和值")
        }
    },
    async (args: any) => {
        return await DataToolsHandler.updateTableRecord(args);
    }
);

mcpServer.registerTool(
    "delete_table_record",
    {
        description: "根据条件删除表中的数据记录",
        inputSchema: {
            hash: z.string().describe("表的哈希值"),
            conditions: z.record(z.any()).describe("删除条件")
        }
    },
    async (args: any) => {
        return await DataToolsHandler.deleteTableRecord(args);
    }
);

mcpServer.registerTool(
    "export_table_to_excel",
    {
        description: "根据哈希值导出表的所有数据为Excel文件",
        inputSchema: {
            hash: z.string().describe("表的哈希值"),
            output_path: z.string().optional().describe("Excel文件保存路径（可选）")
        }
    },
    async (args: any) => {
        return await DataToolsHandler.exportTableToExcel(args);
    }
);

mcpServer.registerTool(
    "check_export_status",
    {
        description: "检查表是否存在以及是否支持导出",
        inputSchema: {
            hash: z.string().describe("表的哈希值")
        }
    },
    async (args: any) => {
        return await DataToolsHandler.checkExportStatus(args);
    }
);

/**
 * 注册映射关系操作工具
 */
mcpServer.registerTool(
    "list_table_mappings",
    {
        description: "列出所有Excel文件与动态表的映射关系",
        inputSchema: {
            page: z.number().min(1).optional().describe("页码（可选，默认1）"),
            limit: z.number().min(1).max(100).optional().describe("每页数量（可选，默认10）")
        }
    },
    async (args: any) => {
        return await MappingToolsHandler.listTableMappings(args);
    }
);

mcpServer.registerTool(
    "get_table_info",
    {
        description: "根据哈希值获取表的详细信息",
        inputSchema: {
            hash: z.string().describe("表的哈希值")
        }
    },
    async (args: any) => {
        return await MappingToolsHandler.getTableInfo(args);
    }
);

mcpServer.registerTool(
    "update_table_name",
    {
        description: "根据哈希值更新表映射关系的表名",
        inputSchema: {
            hash: z.string().describe("表的哈希值"),
            new_table_name: z.string().describe("新的表名")
        }
    },
    async (args: any) => {
        return await MappingToolsHandler.updateTableName(args);
    }
);

mcpServer.registerTool(
    "delete_table_mapping",
    {
        description: "根据哈希值删除表映射关系，并同步删除对应的数据表",
        inputSchema: {
            hash: z.string().describe("表的哈希值")
        }
    },
    async (args: any) => {
        return await MappingToolsHandler.deleteTableMapping(args);
    }
);

mcpServer.registerTool(
    "check_system_health",
    {
        description: "检查Excel数据管理系统的健康状态",
        inputSchema: {}
    },
    async (args: any) => {
        return await MappingToolsHandler.checkSystemHealth(args);
    }
);

/**
 * HTTP streams 传输工厂函数
 */
function httpStreamTransportFactory(mcpServer: McpServer) {
    const router = express.Router();
    const transportMap: { [sessionId: string]: StreamableHTTPServerTransport } = {};

    router.post("/mcp", async (req, res) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transportMap[sessionId]) {
            transport = transportMap[sessionId];
        } else {
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId) => {
                    transportMap[sessionId] = transport;
                },
            });

            transport.onclose = () => {
                if (transport.sessionId) {
                    delete transportMap[transport.sessionId];
                }
            };

            await mcpServer.connect(transport);
        }

        await transport.handleRequest(req, res, req.body);
    });

    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !transportMap[sessionId]) {
            res.status(400).send("Invalid or missing session ID");
            return;
        }

        const transport = transportMap[sessionId];
        await transport.handleRequest(req, res);
    };

    router.get("/mcp", handleSessionRequest);
    router.delete("/mcp", handleSessionRequest);

    return {
        httpStreamTransportMap: transportMap,
        httpStreamRouter: router,
    };
}

/**
 * SSE 传输工厂函数（暂时禁用）
 */
function sseTransportFactory(mcpServer: McpServer) {
    const router = express.Router();

    router.get("/sse", async (req, res) => {
        res.status(501).json({ error: "SSE transport is not yet implemented" });
    });

    router.post("/messages", async (req, res) => {
        res.status(501).json({ error: "SSE transport is not yet implemented" });
    });

    return {
        sseRouter: router,
    };
}

/**
 * 主函数
 */
async function main() {
    const modeResult = z
        .enum(["stdio", "sse", "http-streams"])
        .safeParse(process.env.MODE || "stdio");

    if (!modeResult.success) {
        console.error(
            "Invalid MODE environment variable. Expected 'stdio', 'sse', or 'http-streams'."
        );
        process.exit(1);
    }

    const mode = modeResult.data;

    if (mode === "stdio") {
        const transport = new StdioServerTransport();
        await mcpServer.connect(transport);
        console.log("MCP Server running in stdio mode");
    } else {
        const app = express.default();
        const port = process.env.MCP_SERVER_PORT
            ? Number.parseInt(process.env.MCP_SERVER_PORT)
            : 3001;

        // 健康检查端点
        app.get("/health", (_req, res) => {
            res.status(200).json({
                status: "ok",
                server: "excel-data-mcp-server",
                mode: mode,
                port: port,
                timestamp: new Date().toISOString()
            });
        });

        // 服务器信息端点
        app.get("/info", (_req, res) => {
            res.status(200).json({
                name: "Excel Data MCP Server",
                version: "1.0.0",
                protocol: "MCP",
                mode: mode,
                endpoints: {
                    health: "/health",
                    info: "/info",
                    ...(mode === "sse" && { sse: "/sse" }),
                    ...(mode === "http-streams" && { mcp: "/mcp" })
                }
            });
        });

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // API 密钥验证（可选）
        if (process.env.API_KEYS) {
            const allowed_api_keys = process.env.API_KEYS.split(",");
            app.use((req: any, res: any, next: any) => {
                const apiKey = (req.headers["x-api-key"] as string) || (req.query.apiKey as string);
                if (!apiKey || !allowed_api_keys.includes(apiKey)) {
                    return res
                        .status(403)
                        .json({ error: "Forbidden: Invalid or missing API key" });
                }
                next();
            });
        }

        // 请求日志
        app.use((req: any, _res: any, next: any) => {
            console.info(
                `[${new Date().toISOString()}] ${req.method} ${req.url}`
            );
            next();
        });

        // 静态文件服务 - 提供导出文件下载
        const exportsDir = path.join(process.cwd(), 'exports');
        app.use('/export', express.static(exportsDir));
        console.log(`Export files available at: http://localhost:${port}/export/`);

        if (mode === "sse") {
            const { sseRouter } = sseTransportFactory(mcpServer);
            app.use(sseRouter);
            console.log(`SSE Endpoint: http://localhost:${port}/sse`);
        }

        if (mode === "http-streams") {
            const { httpStreamRouter } = httpStreamTransportFactory(mcpServer);
            app.use(httpStreamRouter);
            console.log(`HTTP Stream Endpoint: http://localhost:${port}/mcp`);
        }

        app.use((_req, res) => {
            res.status(404).json({ error: "Not Found" });
        });

        app.listen(port, () => {
            console.log(`Excel Data MCP Server running on port ${port}`);
            console.log(`Mode: ${mode}`);
            console.log(`Health check: http://localhost:${port}/health`);
            console.log(`Server info: http://localhost:${port}/info`);
        });
    }
}

// 启动服务器
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
