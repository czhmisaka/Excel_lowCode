/*
 * @Date: 2025-11-11 00:10:19
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 00:10:40
 * @FilePath: /lowCode_excel/配置签到表字段.js
 */
// 配置签到表字段选项的脚本
// 使用表结构编辑器API来配置字段

const tableHash = '408ffc21063a32cf0a14a3babc986f6f';

// 字段配置数据
const fieldConfig = {
  "所在公司": {
    "type": "string",
    "options": ["汇博劳务公司", "恒信劳务公司", "临时工"],
    "validation": {
      "required": true
    }
  },
  "签到时间": {
    "type": "datetime",
    "validation": {
      "required": false
    }
  },
  "签退时间": {
    "type": "datetime", 
    "validation": {
      "required": false
    }
  },
  "实际工作时间": {
    "type": "string",
    "validation": {
      "required": false
    }
  },
  "姓名": {
    "type": "string",
    "validation": {
      "required": true
    }
  },
  "手机号": {
    "type": "string",
    "validation": {
      "required": true,
      "pattern": "^1[3-9]\\d{9}$"
    }
  }
};

console.log('签到表字段配置信息：');
console.log('表哈希:', tableHash);
console.log('字段配置:', JSON.stringify(fieldConfig, null, 2));

// 使用说明：
// 1. 访问表结构编辑器页面：http://localhost:5173/table-structure-editor?hash=408ffc21063a32cf0a14a3babc986f6f
// 2. 为"所在公司"字段配置下拉选项：汇博劳务公司、恒信劳务公司、临时工
// 3. 配置其他字段的验证规则
