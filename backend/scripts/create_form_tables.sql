-- 自定义表单系统数据库迁移脚本
-- 创建表单定义、Hook配置和提交记录表

-- 表单定义表
CREATE TABLE IF NOT EXISTS form_definitions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  table_mapping VARCHAR(64),
  definition JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hook配置表
CREATE TABLE IF NOT EXISTS form_hooks (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL,
  config JSON NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 表单提交记录表
CREATE TABLE IF NOT EXISTS form_submissions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(255) NOT NULL,
  submission_data JSON NOT NULL,
  processed_data JSON,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据（可选）
-- INSERT INTO form_definitions (id, form_id, name, description, table_mapping, definition) VALUES
-- (UUID(), 'labor_sign_in', '劳务人员签到系统', '智能签到签退表单', 'a7b672aabd61efd9f39668fc4fa179fc', '{"fields": [], "hooks": {}}');

-- 查看表结构（可选）
-- DESCRIBE form_definitions;
-- DESCRIBE form_hooks;
-- DESCRIBE form_submissions;
