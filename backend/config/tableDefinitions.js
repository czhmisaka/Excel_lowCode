/*
 * @Date: 2025-12-02
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-02 16:19:18
 * @FilePath: /打卡/backend/config/tableDefinitions.js
 * @Description: 自动生成的表结构定义 - 请勿手动修改
 */

/**
 * 系统必需的表结构定义
 * 由 TableDefinitionGenerator 自动从模型生成
 */
const tableDefinitions = {
  "table_mappings": {
    "name": "table_mappings",
    "description": "TableMapping 表",
    "columns": [
      {
        "name": "id",
        "type": "INTEGER",
        "primaryKey": true,
        "autoIncrement": true,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "table_name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": "原始表名"
      },
      {
        "name": "hash_value",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": true,
        "defaultValue": null,
        "comment": "哈希值(SHA256)"
      },
      {
        "name": "original_file_name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "原始文件名"
      },
      {
        "name": "column_count",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": 0,
        "comment": "列数"
      },
      {
        "name": "row_count",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": 0,
        "comment": "行数"
      },
      {
        "name": "header_row",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": 0,
        "comment": "表头行号（从0开始）"
      },
      {
        "name": "column_definitions",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "列定义信息"
      },
      {
        "name": "form_config",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "表单配置信息（JSON Schema格式）"
      },
      {
        "name": "created_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": {},
        "comment": null
      },
      {
        "name": "updated_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": {},
        "comment": null
      }
    ],
    "indexes": [
      {
        "name": "idx_table_mappings_hash_value_unique",
        "columns": [
          "hash_value"
        ],
        "unique": true
      },
      {
        "name": "table_mappings_hash_value",
        "columns": [
          "hash_value"
        ],
        "unique": true
      },
      {
        "name": "table_mappings_table_name",
        "columns": [
          "table_name"
        ],
        "unique": false
      },
      {
        "name": "table_mappings_created_at",
        "columns": [
          "created_at"
        ],
        "unique": false
      }
    ]
  },
  "users": {
    "name": "users",
    "description": "User 表",
    "columns": [
      {
        "name": "id",
        "type": "INTEGER",
        "primaryKey": true,
        "autoIncrement": true,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "username",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": true,
        "defaultValue": null,
        "comment": "用户名"
      },
      {
        "name": "email",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": true,
        "defaultValue": null,
        "comment": "邮箱"
      },
      {
        "name": "password_hash",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": "密码哈希"
      },
      {
        "name": "display_name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "显示名称"
      },
      {
        "name": "real_name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "真实姓名"
      },
      {
        "name": "phone",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "手机号"
      },
      {
        "name": "id_card",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "身份证号"
      },
      {
        "name": "company_id",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "所属公司ID"
      },
      {
        "name": "role",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": "user",
        "comment": "用户角色"
      },
      {
        "name": "is_active",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": true,
        "comment": "是否激活"
      },
      {
        "name": "last_login",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "最后登录时间"
      },
      {
        "name": "created_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": {},
        "comment": null
      },
      {
        "name": "updated_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": {},
        "comment": null
      }
    ],
    "indexes": [
      {
        "name": "idx_users_username_unique",
        "columns": [
          "username"
        ],
        "unique": true
      },
      {
        "name": "idx_users_email_unique",
        "columns": [
          "email"
        ],
        "unique": true
      },
      {
        "name": "users_username",
        "columns": [
          "username"
        ],
        "unique": true
      },
      {
        "name": "users_email",
        "columns": [
          "email"
        ],
        "unique": true
      },
      {
        "name": "users_role",
        "columns": [
          "role"
        ],
        "unique": false
      },
      {
        "name": "users_created_at",
        "columns": [
          "created_at"
        ],
        "unique": false
      },
      {
        "name": "users_phone",
        "columns": [
          "phone"
        ],
        "unique": false
      },
      {
        "name": "users_id_card",
        "columns": [
          "id_card"
        ],
        "unique": false
      },
      {
        "name": "users_company_id",
        "columns": [
          "company_id"
        ],
        "unique": false
      }
    ]
  },
  "table_logs": {
    "name": "table_logs",
    "description": "TableLog 表",
    "columns": [
      {
        "name": "id",
        "type": "INTEGER",
        "primaryKey": true,
        "autoIncrement": true,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "operation_type",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "table_name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "table_hash",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "record_id",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "old_data",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "new_data",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "description",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "user_id",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "username",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "operation_time",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": {},
        "comment": null
      },
      {
        "name": "is_rolled_back",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": false,
        "comment": null
      },
      {
        "name": "rollback_time",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "rollback_user_id",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "rollback_username",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "rollback_description",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "ip_address",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "user_agent",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "created_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "updated_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      }
    ],
    "indexes": [
      {
        "name": "table_logs_operation_type",
        "columns": [
          "operation_type"
        ],
        "unique": false
      },
      {
        "name": "table_logs_table_name",
        "columns": [
          "table_name"
        ],
        "unique": false
      },
      {
        "name": "table_logs_table_hash",
        "columns": [
          "table_hash"
        ],
        "unique": false
      },
      {
        "name": "table_logs_record_id",
        "columns": [
          "record_id"
        ],
        "unique": false
      },
      {
        "name": "table_logs_user_id",
        "columns": [
          "user_id"
        ],
        "unique": false
      },
      {
        "name": "table_logs_operation_time",
        "columns": [
          "operation_time"
        ],
        "unique": false
      },
      {
        "name": "table_logs_is_rolled_back",
        "columns": [
          "is_rolled_back"
        ],
        "unique": false
      }
    ]
  },
  "checkin_records": {
    "name": "checkin_records",
    "description": "CheckinRecord 表",
    "columns": [
      {
        "name": "id",
        "type": "INTEGER",
        "primaryKey": true,
        "autoIncrement": true,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "real_name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": "用户真实姓名"
      },
      {
        "name": "phone",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": "用户手机号"
      },
      {
        "name": "company_id",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "checkin_type",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "checkin_time",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "location",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "device_info",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "work_duration",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "工作时长（分钟）"
      },
      {
        "name": "labor_source",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "劳务来源"
      },
      {
        "name": "remark",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": "备注信息"
      },
      {
        "name": "is_active",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": true,
        "comment": "是否有效记录"
      },
      {
        "name": "created_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": {},
        "comment": null
      },
      {
        "name": "updated_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": {},
        "comment": null
      }
    ],
    "indexes": [
      {
        "name": "checkin_records_phone_company_id_checkin_time",
        "columns": [
          "phone",
          "company_id",
          "checkin_time"
        ],
        "unique": false
      },
      {
        "name": "checkin_records_company_id_checkin_type_checkin_time",
        "columns": [
          "company_id",
          "checkin_type",
          "checkin_time"
        ],
        "unique": false
      }
    ]
  },
  "companies": {
    "name": "companies",
    "description": "Company 表",
    "columns": [
      {
        "name": "id",
        "type": "INTEGER",
        "primaryKey": true,
        "autoIncrement": true,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "name",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "code",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": false,
        "unique": true,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "description",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "checkin_url",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "checkout_url",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": null,
        "comment": null
      },
      {
        "name": "status",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": "active",
        "comment": null
      },
      {
        "name": "is_active",
        "type": "INTEGER",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": true,
        "comment": null
      },
      {
        "name": "created_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": {},
        "comment": null
      },
      {
        "name": "updated_at",
        "type": "TEXT",
        "primaryKey": false,
        "autoIncrement": false,
        "allowNull": true,
        "unique": false,
        "defaultValue": {},
        "comment": null
      }
    ],
    "indexes": [
      {
        "name": "idx_companies_code_unique",
        "columns": [
          "code"
        ],
        "unique": true
      },
      {
        "name": "companies_code",
        "columns": [
          "code"
        ],
        "unique": false
      },
      {
        "name": "companies_status",
        "columns": [
          "status"
        ],
        "unique": false
      }
    ]
  }
};

module.exports = {
  tableDefinitions
};
