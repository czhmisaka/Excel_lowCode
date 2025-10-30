/*
 * 表单定制相关类型定义
 * @Date: 2025-10-30
 */

// 字段条件配置
export interface FieldCondition {
    field: string;        // 依赖字段
    operator: 'eq' | 'ne' | 'contains'; // 操作符
    value: any;           // 比较值
}

// 字段验证规则
export interface FieldValidation {
    min?: number;         // 最小值（数字类型）
    max?: number;         // 最大值（数字类型）
    pattern?: string;     // 正则表达式（文本类型）
    message?: string;     // 验证失败提示信息
}

// 表结构字段配置
export interface FieldConfig {
    name: string;           // 字段名称（唯一标识）
    originalName: string;   // 原始字段名称
    displayName: string;    // 显示名称
    type: 'string' | 'number' | 'date' | 'boolean' | 'select'; // 字段类型
    required: boolean;      // 是否必填
    visible: boolean;       // 是否显示
    order: number;          // 显示顺序
    validation: FieldValidation; // 验证规则
    options?: string[];     // 选项列表（用于select类型）
    condition?: FieldCondition; // 显示条件
}

// 表结构配置
export interface TableStructureConfig {
    fields: FieldConfig[];  // 字段配置列表
}
