#!/usr/bin/env node

/**
 * 修复签到表结构脚本
 * 重新创建所有签到表，包含id主键列
 */

const { sequelize } = require('../../backend/config/database');

// 签到表定义
const signTables = [
    {
        name: 'huibo_qr_sign_records',
        description: '汇博劳务公司签到记录'
    },
    {
        name: 'hengxin_qr_sign_records', 
        description: '恒信劳务公司签到记录'
    },
    {
        name: 'temporary_qr_sign_records',
        description: '临时工签到记录'
    }
];

// 签到表字段定义
const signTableColumns = [
    {
        name: 'id',
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true
    },
    {
        name: 'name',
        type: 'string',
        nullable: false
    },
    {
        name: 'phone',
        type: 'string', 
        nullable: false
    },
    {
        name: 'company',
        type: 'string',
        nullable: false
    },
    {
        name: 'sign_in_time',
        type: 'datetime',
        nullable: true
    },
    {
        name: 'sign_out_time',
        type: 'datetime',
        nullable: true
    },
    {
        name: 'work_hours',
        type: 'number',
        nullable: true
    },
    {
        name: 'ip_address',
        type: 'string',
        nullable: true
    },
    {
        name: 'user_agent',
        type: 'string',
        nullable: true
    },
    {
        name: 'submit_time',
        type: 'datetime',
        nullable: true
    },
    {
        name: 'created_at',
        type: 'DATETIME',
        defaultValue: 'CURRENT_TIMESTAMP'
    },
    {
        name: 'updated_at',
        type: 'DATETIME',
        defaultValue: 'CURRENT_TIMESTAMP'
    }
];

async function checkTableExists(tableName) {
    try {
        const [results] = await sequelize.query(
            `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
            {
                replacements: [tableName],
                type: sequelize.QueryTypes.SELECT
            }
        );
        return !!results;
    } catch (error) {
        console.error(`检查表 ${tableName} 是否存在时出错:`, error);
        return false;
    }
}

async function getTableData(tableName) {
    try {
        const [data] = await sequelize.query(`SELECT * FROM "${tableName}"`);
        return data;
    } catch (error) {
        console.error(`获取表 ${tableName} 数据失败:`, error);
        return [];
    }
}

async function dropTable(tableName) {
    try {
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
        console.log(`✅ 表 ${tableName} 删除成功`);
        return true;
    } catch (error) {
        console.error(`删除表 ${tableName} 失败:`, error);
        return false;
    }
}

async function createTable(tableName, columns) {
    try {
        const dialect = sequelize.getDialect();
        
        // 构建字段定义SQL
        const columnDefinitions = columns.map(col => {
            let columnDef = dialect === 'sqlite' ? `"${col.name}" ${col.type}` : `\`${col.name}\` ${col.type}`;
            
            if (col.primaryKey) {
                columnDef += ' PRIMARY KEY';
                if (col.autoIncrement) {
                    columnDef += dialect === 'sqlite' ? ' AUTOINCREMENT' : ' AUTO_INCREMENT';
                }
            }
            
            if (col.unique) {
                columnDef += ' UNIQUE';
            }
            
            if (!col.allowNull) {
                columnDef += ' NOT NULL';
            }
            
            if (col.defaultValue !== undefined && col.defaultValue !== null) {
                if (typeof col.defaultValue === 'string' && col.defaultValue !== 'CURRENT_TIMESTAMP') {
                    columnDef += ` DEFAULT '${col.defaultValue}'`;
                } else {
                    columnDef += ` DEFAULT ${col.defaultValue}`;
                }
            }
            
            return columnDef;
        }).join(',\n  ');
        
        // 执行建表SQL
        const createSQL = dialect === 'sqlite' 
            ? `CREATE TABLE "${tableName}" (\n  ${columnDefinitions}\n)`
            : `CREATE TABLE \`${tableName}\` (\n  ${columnDefinitions}\n)`;
        
        await sequelize.query(createSQL);
        console.log(`✅ 表 ${tableName} 创建成功`);
        return true;
    } catch (error) {
        console.error(`创建表 ${tableName} 失败:`, error);
        return false;
    }
}

async function insertData(tableName, data) {
    try {
        if (data.length === 0) {
            console.log(`表 ${tableName} 没有数据需要插入`);
            return true;
        }
        
        for (const row of data) {
            // 移除id字段，让数据库自动生成
            const { id, ...rowData } = row;
            
            const columns = Object.keys(rowData).map(col => `"${col}"`).join(', ');
            const placeholders = Object.keys(rowData).map(() => '?').join(', ');
            const values = Object.values(rowData);
            
            const insertSQL = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`;
            await sequelize.query(insertSQL, { replacements: values });
        }
        
        console.log(`✅ 表 ${tableName} 数据插入成功，共 ${data.length} 条记录`);
        return true;
    } catch (error) {
        console.error(`插入表 ${tableName} 数据失败:`, error);
        return false;
    }
}

async function fixTableStructure() {
    console.log('开始修复签到表结构...');
    
    for (const table of signTables) {
        console.log(`\n处理表: ${table.name}`);
        
        // 检查表是否存在
        const tableExists = await checkTableExists(table.name);
        
        if (tableExists) {
            console.log(`📋 表 ${table.name} 已存在，准备重新创建`);
            
            // 备份数据
            const oldData = await getTableData(table.name);
            console.log(`📊 备份了 ${oldData.length} 条记录`);
            
            // 删除旧表
            await dropTable(table.name);
            
            // 创建新表
            await createTable(table.name, signTableColumns);
            
            // 恢复数据
            await insertData(table.name, oldData);
            
        } else {
            console.log(`📋 表 ${table.name} 不存在，直接创建`);
            await createTable(table.name, signTableColumns);
        }
    }
    
    console.log('\n✅ 所有签到表结构修复完成');
}

// 执行修复
fixTableStructure()
    .then(() => {
        console.log('🎉 签到表结构修复脚本执行完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 签到表结构修复脚本执行失败:', error);
        process.exit(1);
    });
