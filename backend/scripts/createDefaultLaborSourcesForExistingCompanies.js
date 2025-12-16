#!/usr/bin/env node

/**
 * 为现有公司创建默认劳务来源配置脚本
 * 此脚本扫描所有现有公司，并为没有劳务来源配置的公司创建默认配置
 */

const axios = require('axios');
const { Company, LaborSource } = require('../models');

// API配置
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoibWNwX3NlcnZpY2UiLCJyb2xlIjoiYWRtaW4iLCJkaXNwbGF5TmFtZSI6Ik1DUCBTZXJ2aWNlIEFjY291bnQiLCJpYXQiOjE3NjU4OTkyMTMsImV4cCI6MTc2NTk4NTYxM30.MxnIK2pGNhukH9eTK872rqa8cVW5po3WLP1cnq5mK6w';

// 默认劳务来源配置
const DEFAULT_LABOR_SOURCES = [
  { name: '汇博劳务公司', code: '汇博劳务公司', description: '默认劳务公司 - 汇博劳务公司', sortOrder: 1 },
  { name: '恒信劳务公司', code: '恒信劳务公司', description: '默认劳务公司 - 恒信劳务公司', sortOrder: 2 },
  { name: '其他类（临时工）', code: '其他类（临时工）', description: '默认劳务公司 - 其他类（临时工）', sortOrder: 3 }
];

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * 为指定公司创建默认劳务来源
 */
async function createDefaultLaborSourcesForCompany(companyId) {
  try {
    console.log(`正在为公司ID ${companyId} 创建默认劳务来源...`);
    
    const createdSources = [];
    
    for (const sourceData of DEFAULT_LABOR_SOURCES) {
      // 检查是否已存在相同代码的劳务来源
      const existingSource = await LaborSource.findOne({
        where: {
          companyId,
          code: sourceData.code
        }
      });

      if (!existingSource) {
        const laborSource = await LaborSource.create({
          ...sourceData,
          companyId,
          isActive: true
        });
        createdSources.push(laborSource);
        console.log(`  ✓ 创建劳务来源: ${sourceData.name} (${sourceData.code})`);
      } else {
        console.log(`  ⏭️ 劳务来源已存在: ${sourceData.name} (${sourceData.code})`);
      }
    }

    if (createdSources.length > 0) {
      console.log(`✅ 为公司ID ${companyId} 创建了 ${createdSources.length} 个默认劳务来源`);
    } else {
      console.log(`ℹ️  公司ID ${companyId} 已拥有所有默认劳务来源，无需创建`);
    }
    
    return createdSources;
  } catch (error) {
    console.error(`❌ 为公司ID ${companyId} 创建默认劳务来源失败:`, error.message);
    return [];
  }
}

/**
 * 获取所有公司
 */
async function getAllCompanies() {
  try {
    console.log('正在获取公司列表...');
    
    // 使用Sequelize直接查询数据库
    const companies = await Company.findAll({
      where: {
        isActive: true
      },
      order: [['id', 'ASC']]
    });
    
    console.log(`✅ 获取到 ${companies.length} 个公司`);
    return companies;
  } catch (error) {
    console.error('❌ 获取公司列表失败:', error.message);
    return [];
  }
}

/**
 * 检查公司是否有劳务来源
 */
async function checkCompanyHasLaborSources(companyId) {
  try {
    const laborSourceCount = await LaborSource.count({
      where: {
        companyId,
        isActive: true
      }
    });
    
    return laborSourceCount > 0;
  } catch (error) {
    console.error(`❌ 检查公司ID ${companyId} 劳务来源失败:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始为现有公司创建默认劳务来源配置');
  console.log('=' .repeat(60));
  
  try {
    // 获取所有公司
    const companies = await getAllCompanies();
    
    if (companies.length === 0) {
      console.log('ℹ️  没有找到任何公司');
      return;
    }
    
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    
    // 处理每个公司
    for (const company of companies) {
      console.log(`\n📋 处理公司: ${company.name} (ID: ${company.id}, 代码: ${company.code})`);
      
      // 检查公司是否已有劳务来源
      const hasLaborSources = await checkCompanyHasLaborSources(company.id);
      
      if (hasLaborSources) {
        console.log(`  ℹ️  公司已有劳务来源配置，跳过`);
        totalSkipped++;
      } else {
        // 创建默认劳务来源
        const createdSources = await createDefaultLaborSourcesForCompany(company.id);
        
        if (createdSources.length > 0) {
          totalCreated += createdSources.length;
        } else {
          totalFailed++;
        }
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 任务完成统计:');
    console.log(`  ✅ 成功创建劳务来源的公司: ${totalCreated / 3} 个`);
    console.log(`  📝 创建的劳务来源总数: ${totalCreated} 个`);
    console.log(`  ⏭️ 跳过的公司: ${totalSkipped} 个`);
    console.log(`  ❌ 失败的公司: ${totalFailed} 个`);
    console.log(`  📈 处理公司总数: ${companies.length} 个`);
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  // 初始化数据库连接
  const { sequelize } = require('../config/database');
  
  sequelize.authenticate()
    .then(() => {
      console.log('🔗 数据库连接成功');
      return main();
    })
    .then(() => {
      console.log('\n🎉 脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 数据库连接失败:', error);
      process.exit(1);
    });
}

module.exports = {
  createDefaultLaborSourcesForCompany,
  getAllCompanies,
  checkCompanyHasLaborSources
};
