// SQLite表单系统数据库迁移脚本
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

async function createFormTables() {
  try {
    console.log('开始创建表单系统表...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 定义表单定义模型
    const FormDefinition = sequelize.define('FormDefinition', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      formId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'form_id'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tableMapping: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'table_mapping'
      },
      definition: {
        type: DataTypes.JSON,
        allowNull: false
      }
    }, {
      tableName: 'form_definitions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    
    // 定义Hook配置模型
    const FormHook = sequelize.define('FormHook', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      formId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'form_id'
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      triggerType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'trigger_type'
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'form_hooks',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    
    // 定义表单提交记录模型
    const FormSubmission = sequelize.define('FormSubmission', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      formId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'form_id'
      },
      submissionData: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'submission_data'
      },
      processedData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'processed_data'
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending'
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
      }
    }, {
      tableName: 'form_submissions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    });
    
    // 同步表结构到数据库
    console.log('\n同步表结构到数据库...');
    
    await FormDefinition.sync({ force: false });
    console.log('✅ form_definitions 表同步成功');
    
    await FormHook.sync({ force: false });
    console.log('✅ form_hooks 表同步成功');
    
    await FormSubmission.sync({ force: false });
    console.log('✅ form_submissions 表同步成功');
    
    // 验证表是否创建成功
    console.log('\n验证表结构...');
    
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('现有表:', tables);
    
    if (tables.includes('form_definitions')) {
      console.log('✅ form_definitions表验证成功');
    } else {
      console.log('❌ form_definitions表验证失败');
    }
    
    if (tables.includes('form_hooks')) {
      console.log('✅ form_hooks表验证成功');
    } else {
      console.log('❌ form_hooks表验证失败');
    }
    
    if (tables.includes('form_submissions')) {
      console.log('✅ form_submissions表验证成功');
    } else {
      console.log('❌ form_submissions表验证失败');
    }
    
    console.log('\n🎉 SQLite数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行迁移
createFormTables();
