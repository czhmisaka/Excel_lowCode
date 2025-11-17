const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { initModels } = require('./models');

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API文档配置
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Excel数据管理服务器API',
            description: '基于Node.js的Excel文件上传、解析、数据存储和查询服务',
            version: '1.0.0',
            contact: {
                name: 'CZH',
                email: 'czh@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: '开发服务器'
            },
            {
                url: 'https://api.example.com',
                description: '生产服务器'
            }
        ],
        tags: [
            {
                name: '认证',
                description: '用户认证相关接口'
            },
            {
                name: '用户管理',
                description: '用户管理相关接口（管理员权限）'
            },
            {
                name: '文件上传',
                description: 'Excel文件上传相关接口'
            },
            {
                name: '映射关系',
                description: '表映射关系查询接口'
            },
            {
                name: '数据操作',
                description: '数据查询、新增、更新、删除接口'
            },
            {
                name: '系统状态',
                description: '系统健康检查接口'
            }
        ],
        components: {
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean'
                        },
                        message: {
                            type: 'string'
                        },
                        data: {
                            type: 'object'
                        },
                        error: {
                            type: 'string'
                        }
                    }
                },
                UploadResponse: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/ApiResponse'
                        },
                        {
                            type: 'object',
                            properties: {
                                data: {
                                    type: 'object',
                                    properties: {
                                        hash: {
                                            type: 'string'
                                        },
                                        tableName: {
                                            type: 'string'
                                        },
                                        recordCount: {
                                            type: 'integer'
                                        },
                                        createdAt: {
                                            type: 'string',
                                            format: 'date-time'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                MappingItem: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer'
                        },
                        tableName: {
                            type: 'string'
                        },
                        hashValue: {
                            type: 'string'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer'
                        },
                        limit: {
                            type: 'integer'
                        },
                        total: {
                            type: 'integer'
                        },
                        pages: {
                            type: 'integer'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js'], // 扫描所有路由文件中的Swagger注释
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 健康检查路由
app.get('/health', async (req, res) => {
    const dbStatus = await testConnection();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/mappings', require('./routes/mappings'));
app.use('/api/data', require('./routes/data'));
app.use('/api/system', require('./routes/system'));
app.use('/api/import', require('./routes/import'));
app.use('/api/rollback', require('./routes/rollback'));
app.use('/api/public/form', require('./routes/publicForm'));
app.use('/api/field-config', require('./routes/fieldConfig'));
app.use('/api/service-accounts', require('./routes/serviceAccounts'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/health', require('./routes/health'));

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 全局错误处理
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);

    // Multer错误处理
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: '文件大小超过限制'
        });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            success: false,
            message: '文件数量超过限制'
        });
    }

    // 其他错误
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    });
});

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('无法连接到数据库，尝试自动初始化数据库...');
            
            // 尝试自动初始化数据库
            try {
                const { execSync } = require('child_process');
                const fs = require('fs');
                const path = require('path');
                
                // 检查数据库目录是否存在
                const dbDir = path.dirname(process.env.SQLITE_DB_PATH || './data/annual_leave.db');
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                    console.log(`✅ 创建数据库目录: ${dbDir}`);
                }
                
                // 尝试执行数据库初始化脚本
                const initScriptPath = path.join(__dirname, 'scripts', 'initDatabase.js');
                if (fs.existsSync(initScriptPath)) {
                    console.log('执行数据库初始化脚本...');
                    execSync(`node ${initScriptPath}`, { stdio: 'inherit' });
                    console.log('✅ 数据库初始化完成');
                    
                    // 重新测试数据库连接
                    const dbConnectedAfterInit = await testConnection();
                    if (!dbConnectedAfterInit) {
                        console.error('数据库初始化后仍然无法连接，服务器启动失败');
                        process.exit(1);
                    }
                } else {
                    console.error('数据库初始化脚本不存在，服务器启动失败');
                    process.exit(1);
                }
            } catch (initError) {
                console.error('数据库自动初始化失败:', initError);
                console.error('服务器启动失败');
                process.exit(1);
            }
        }

        // 使用自动建表模块初始化数据库表结构
        console.log('开始自动建表流程...');
        const { initializeDatabase } = require('./config/database');
        const dbInitResult = await initializeDatabase();
        
        if (!dbInitResult.success) {
            console.error('❌ 数据库表结构初始化失败，服务器启动中止');
            console.error('错误详情:', dbInitResult.message);
            process.exit(1);
        }
        
        console.log('✅ 数据库表结构初始化成功');

        // 初始化数据模型
        await initModels();

        // 初始化服务账户
        const { initAllServiceUsers } = require('./scripts/initServiceUsers');
        const serviceUsersResult = await initAllServiceUsers();

        if (!serviceUsersResult.mcpService.success) {
            console.warn('MCP服务账户初始化失败，但服务器继续启动');
        }

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`服务器启动成功，端口: ${PORT}`);
            console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`健康检查: http://localhost:${PORT}/health`);
            console.log(`API文档: http://localhost:${PORT}/api-docs`);
        });

    } catch (error) {
        console.error('服务器启动失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
