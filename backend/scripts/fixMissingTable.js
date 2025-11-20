/*
 * @Date: 2025-11-20 15:36:00
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-20 15:36:54
 * @FilePath: /lowCode_excel/backend/scripts/fixMissingTable.js
 * @Description: 修复缺失的数据表
 */

const { sequelize } = require('../config/database');
const { TableMapping, getDynamicModel } = require('../models');

/**
 * 修复缺失的数据表
 */
async function fixMissingTable() {
    try {
        console.log('开始修复缺失的数据表...');
        
        // 需要修复的哈希值
        const hashToFix = '61d941ec9fc621e8b04533b5afbddf5d302e37bb5a04a41aa4871f7bf5998598';
        
        console.log(`检查哈希值: ${hashToFix}`);
        
        // 检查表映射是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hashToFix }
        });
        
        if (!mapping) {
            console.error('❌ 表映射记录不存在，无法修复');
            return false;
        }
        
        console.log('找到表映射记录:', {
            tableName: mapping.tableName,
            hashValue: mapping.hashValue,
            columnCount: mapping.columnCount
        });
        
        // 检查对应的数据表是否存在
        const actualTableName = `data_${hashToFix}`;
        const [tableExists] = await sequelize.query(
            'SELECT name FROM sqlite_master WHERE type=\'table\' AND name = ?',
            { replacements: [actualTableName] }
        );
        
        if (tableExists.length > 0) {
            console.log(`✅ 数据表 ${actualTableName} 已存在，无需修复`);
            return true;
        }
        
        console.log(`❌ 数据表 ${actualTableName} 不存在，开始修复...`);
        
        // 确保columnDefinitions是数组格式
        let columnDefinitions = mapping.columnDefinitions;
        if (typeof columnDefinitions === 'string') {
            try {
                columnDefinitions = JSON.parse(columnDefinitions);
            } catch (error) {
                console.error('解析columnDefinitions失败:', error);
                return false;
            }
        }
        
        console.log('列定义:', JSON.stringify(columnDefinitions, null, 2));
        
        // 创建动态表模型
        const DynamicModel = getDynamicModel(hashToFix, columnDefinitions, actualTableName);
        
        // 同步动态表到数据库
        await DynamicModel.sync();
        
        console.log(`✅ 数据表 ${actualTableName} 创建成功`);
        
        // 验证表是否创建成功
        const [tableExistsAfter] = await sequelize.query(
            'SELECT name FROM sqlite_master WHERE type=\'table\' AND name = ?',
            { replacements: [actualTableName] }
        );
        
        if (tableExistsAfter.length > 0) {
            console.log(`✅ 数据表 ${actualTableName} 验证成功`);
            return true;
        } else {
            console.error(`❌ 数据表 ${actualTableName} 创建失败`);
            return false;
        }
        
    } catch (error) {
        console.error('修复数据表失败:', error);
        return false;
    }
}

// 执行修复
if (require.main === module) {
    fixMissingTable()
        .then(success => {
            if (success) {
                console.log('✅ 数据表修复完成');
                process.exit(0);
            } else {
                console.error('❌ 数据表修复失败');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('修复过程发生错误:', error);
            process.exit(1);
        });
}

module.exports = { fixMissingTable };
