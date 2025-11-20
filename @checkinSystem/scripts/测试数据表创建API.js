const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

/**
 * 测试数据表创建API
 */
async function testTableCreationAPI() {
  try {
    console.log('🧪 开始测试数据表创建API...');
    console.log('目标服务器:', API_BASE);
    
    // 测试服务器连接
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.error('❌ 服务器连接失败，请检查服务器状态');
      return;
    }
    
    // 测试数据表定义
    const testTables = [
      {
        name: 'test_qr_checkin_records',
        description: '测试二维码签到记录表',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'VARCHAR(255)', allowNull: false },
          { name: 'phone', type: 'VARCHAR(20)', allowNull: false },
          { name: 'company', type: 'VARCHAR(100)', allowNull: false },
          { name: 'sign_in_time', type: 'DATETIME', allowNull: false },
          { name: 'sign_out_time', type: 'DATETIME', allowNull: true },
          { name: 'work_hours', type: 'DECIMAL(5,2)', allowNull: true },
          { name: 'ip_address', type: 'VARCHAR(45)', allowNull: true },
          { name: 'user_agent', type: 'TEXT', allowNull: true }
        ]
      },
      {
        name: 'test_user_profiles',
        description: '测试用户档案表',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'VARCHAR(255)', allowNull: false, unique: true },
          { name: 'email', type: 'VARCHAR(255)', allowNull: true },
          { name: 'phone', type: 'VARCHAR(20)', allowNull: true },
          { name: 'department', type: 'VARCHAR(100)', allowNull: true },
          { name: 'position', type: 'VARCHAR(100)', allowNull: true },
          { name: 'is_active', type: 'BOOLEAN', allowNull: false, defaultValue: true },
          { name: 'created_at', type: 'DATETIME', allowNull: false, defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      }
    ];
    
    const results = [];
    
    // 测试创建数据表
    for (const tableDef of testTables) {
      console.log(`\n📊 测试创建数据表: ${tableDef.name}`);
      
      try {
        const response = await axios.post(`${API_BASE}/tables`, tableDef, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          console.log(`✅ 数据表 ${tableDef.name} 创建成功`);
          console.log(`   - 哈希值: ${response.data.data.hashValue}`);
          console.log(`   - 字段数: ${response.data.data.columnCount}`);
          console.log(`   - 映射ID: ${response.data.data.mappingId}`);
          
          results.push({
            tableName: tableDef.name,
            success: true,
            hashValue: response.data.data.hashValue
          });
        } else {
          console.log(`❌ 数据表 ${tableDef.name} 创建失败:`, response.data.message);
          results.push({
            tableName: tableDef.name,
            success: false,
            error: response.data.message
          });
        }
      } catch (error) {
        console.log(`❌ 数据表 ${tableDef.name} 创建错误:`, error.response?.data || error.message);
        results.push({
          tableName: tableDef.name,
          success: false,
          error: error.response?.data?.message || error.message
        });
      }
    }
    
    // 测试获取数据表列表
    console.log('\n📋 测试获取数据表列表...');
    try {
      const listResponse = await axios.get(`${API_BASE}/tables`);
      
      if (listResponse.data.success) {
        console.log(`✅ 获取数据表列表成功`);
        console.log(`   - 总表数: ${listResponse.data.pagination.total}`);
        console.log(`   - 当前页: ${listResponse.data.pagination.page}`);
        console.log(`   - 每页数量: ${listResponse.data.pagination.limit}`);
        
        console.log('\n📊 数据表列表:');
        listResponse.data.data.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table.tableName} (${table.columnCount}个字段)`);
        });
      } else {
        console.log(`❌ 获取数据表列表失败:`, listResponse.data.message);
      }
    } catch (error) {
      console.log(`❌ 获取数据表列表错误:`, error.response?.data || error.message);
    }
    
    // 测试获取数据表详情
    console.log('\n🔍 测试获取数据表详情...');
    for (const tableDef of testTables) {
      if (results.find(r => r.tableName === tableDef.name && r.success)) {
        try {
          const detailResponse = await axios.get(`${API_BASE}/tables/${tableDef.name}`);
          
          if (detailResponse.data.success) {
            console.log(`✅ 获取数据表 ${tableDef.name} 详情成功`);
            console.log(`   - 表映射信息:`, detailResponse.data.data.mapping.tableName);
            console.log(`   - 表结构字段数:`, detailResponse.data.data.structure?.columns?.length || 0);
          } else {
            console.log(`❌ 获取数据表 ${tableDef.name} 详情失败:`, detailResponse.data.message);
          }
        } catch (error) {
          console.log(`❌ 获取数据表 ${tableDef.name} 详情错误:`, error.response?.data || error.message);
        }
      }
    }
    
    // 测试删除数据表
    console.log('\n🗑️  测试删除数据表...');
    for (const tableDef of testTables) {
      if (results.find(r => r.tableName === tableDef.name && r.success)) {
        try {
          const deleteResponse = await axios.delete(`${API_BASE}/tables/${tableDef.name}`);
          
          if (deleteResponse.data.success) {
            console.log(`✅ 数据表 ${tableDef.name} 删除成功`);
          } else {
            console.log(`❌ 数据表 ${tableDef.name} 删除失败:`, deleteResponse.data.message);
          }
        } catch (error) {
          console.log(`❌ 数据表 ${tableDef.name} 删除错误:`, error.response?.data || error.message);
        }
      }
    }
    
    // 测试结果总结
    console.log('\n📊 数据表创建API测试结果:');
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`✅ 成功创建: ${successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！数据表创建API功能正常');
    } else {
      console.log('⚠️  部分测试失败，请检查API配置');
    }
    
    return {
      success: successCount === totalCount,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 数据表创建API测试失败:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行测试
testTableCreationAPI();
