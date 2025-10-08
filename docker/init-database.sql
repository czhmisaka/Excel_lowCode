-- Excel_lowCode - 数据库初始化脚本
-- 此脚本在MySQL容器首次启动时自动执行

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS annual_leave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE annual_leave;

-- 创建应用用户并授权（如果不存在）
CREATE USER IF NOT EXISTS 'annual_user'@'%' IDENTIFIED BY 'annual_password';
GRANT ALL PRIVILEGES ON annual_leave.* TO 'annual_user'@'%';
FLUSH PRIVILEGES;

-- 创建表映射表（如果不存在）
CREATE TABLE IF NOT EXISTS table_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建员工信息表（如果不存在）
CREATE TABLE IF NOT EXISTS employee_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建年假记录表（如果不存在）
CREATE TABLE IF NOT EXISTS annual_leave_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    total_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    remaining_days DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_info(employee_id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_year (employee_id, year),
    INDEX idx_employee_year (employee_id, year),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建请假记录表（如果不存在）
CREATE TABLE IF NOT EXISTS leave_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_info(employee_id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_date_range (start_date, end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例表映射数据
INSERT IGNORE INTO table_mappings (table_name, display_name, description) VALUES
('employee_info', '员工信息表', '存储员工基本信息'),
('annual_leave_records', '年假记录表', '存储员工年假信息'),
('leave_records', '请假记录表', '存储员工请假记录');

-- 插入示例员工数据
INSERT IGNORE INTO employee_info (employee_id, name, department, position, hire_date) VALUES
('EMP001', '张三', '技术部', '软件工程师', '2020-03-15'),
('EMP002', '李四', '人事部', '人事专员', '2019-07-01'),
('EMP003', '王五', '财务部', '会计', '2021-01-10'),
('EMP004', '赵六', '技术部', '前端工程师', '2022-05-20');

-- 插入示例年假数据
INSERT IGNORE INTO annual_leave_records (employee_id, year, total_days, used_days, remaining_days) VALUES
('EMP001', 2025, 15.0, 5.0, 10.0),
('EMP002', 2025, 18.0, 3.0, 15.0),
('EMP003', 2025, 12.0, 0.0, 12.0),
('EMP004', 2025, 10.0, 2.0, 8.0);

-- 插入示例请假记录
INSERT IGNORE INTO leave_records (employee_id, leave_type, start_date, end_date, total_days, reason, status) VALUES
('EMP001', '年假', '2025-01-15', '2025-01-17', 3.0, '家庭事务', 'approved'),
('EMP001', '病假', '2025-02-10', '2025-02-10', 1.0, '感冒发烧', 'approved'),
('EMP002', '年假', '2025-03-01', '2025-03-03', 3.0, '旅游度假', 'approved');

-- 显示创建的表信息
SHOW TABLES;

-- 显示各表记录数
SELECT 
    TABLE_NAME, 
    TABLE_ROWS 
FROM 
    INFORMATION_SCHEMA.TABLES 
WHERE 
    TABLE_SCHEMA = 'annual_leave';
