/*
 * @Date: 2025-11-20 15:47:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-20 15:48:12
 * @FilePath: /lowCode_excel/backend/scripts/fixAllMissingTables.js
 * @Description: 修复所有缺失的数据表
 */

const { sequelize } = require('../config/database');
const { TableMapping, getDynamicModel } = require('../models');

/**
 * 修复所有缺失的数据表
 */
async function fixAllMissingTables() {
    try {
        console.log('开始检查并修复所有缺失的数据表...');
        
        // 获取所有表映射记录
        const allMappings = await TableMapping.findAll();
        console.log(`找到 ${allMappings.length} 个表映射记录`);
        
        let fixedCount = 0;
        let errorCount = 0;
        
        for (const mapping of allMappings) {
            const hashValue = mapping.hashValue;
            const actualTableName = `data_${hashValue}`;
            
            // 检查对应的数据表是否存在
            const [tableExists] = await sequelize.query(
                'SELECT name FROM sqlite_master WHERE type=\'table\' AND name = ?',
                { replacements: [actualTableName] }
            );
            
            if (tableExists.length > 0) {
                console.log(`✅ 数据表 ${actualTableName} 已存在`);
                continue;
            }
            
            console.log(`❌ 数据表 ${actualTableName} 不存在，开始修复...`);
            
            try {
                // 确保columnDefinitions是数组格式
                let columnDefinitions = mapping.columnDefinitions;
                if (typeof columnDefinitions === 'string') {
                    try {
                        columnDefinitions = JSON.parse(columnDefinitions);
                    } catch (error) {
                        console.error(`解析columnDefinitions失败:`, error);
                        errorCount++;
                        continue;
                    }
                }
                
                // 创建动态表模型
                const DynamicModel = getDynamicModel(hashValue, columnDefinitions, actualTableName);
                
                // 同步动态表到数据库
                await DynamicModel.sync();
                
                console.log(`✅ 数据表 ${actualTableName} 创建成功`);
                fixedCount++;
                
            } catch (error) {
                console.error(`修复数据表 ${actualTableName} 失败:`, error);
                errorCount++;
            }
        }
        
        console.log('\n=== 修复完成 ===');
        console.log(`✅ 成功修复: ${fixedCount} 个数据表`);
        console.log(`❌ 修复失败: ${errorCount} 个数据表`);
        console.log(`📊 总计检查: ${allMappings.length} 个表映射记录`);
        
        return { fixedCount, errorCount, total: allMappings.length };
        
    } catch (error) {
        console.error('修复数据表失败:', error);
        return { fixedCount: 0, errorCount: 1, total: 0 };
    }
}

// 执行修复
if (require.main === module) {
    fixAllMissingTables()
        .then(result => {
            if (result.errorCount === 0) {
                console.log('✅ 所有数据表修复完成');
                process.exit(0);
            } else {
                console.log('⚠️ 部分数据表修复失败');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('修复过程发生错误:', error);
            process.exit(1);
        });
}

module.exports = { fixAllMissingTables };
