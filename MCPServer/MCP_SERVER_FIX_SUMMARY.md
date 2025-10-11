# MCP服务器新增表记录400错误修复总结

## 问题描述
MCP服务器在使用`add_table_record`工具时出现400错误：
```
新增表记录失败: POST请求失败: Request failed with status code 400
```

## 根本原因分析
通过代码分析发现，问题出现在请求格式不匹配：

### 1. 请求格式不匹配
- **MCP服务器发送的格式**：
  ```json
  {
    "hash": "df6c8aa5b1e78bd197fae32c36ab749e",
    "data": {
      "所属项目": "低代码集成平台(#317)",
      // ... 其他字段
    }
  }
  ```

- **后端API期望的格式**：
  ```json
  {
    "data": {
      "所属项目": "低代码集成平台(#317)",
      // ... 其他字段
    }
  }
  ```

### 2. 具体问题位置
在`MCPServer/src/tools/dataTools.ts`的`addTableRecord`方法中：
```typescript
// 修复前（错误）
const result = await httpClient.post(`/api/data/${args.hash}/add`, args.data);

// 修复后（正确）
const requestBody = {
  data: args.data
};
const result = await httpClient.post(`/api/data/${args.hash}/add`, requestBody);
```

## 修复内容

### 1. 修复TypeScript源文件
- **文件**: `MCPServer/src/tools/dataTools.ts`
- **修改**: 将直接发送`args.data`改为包装在`{ data: args.data }`对象中

### 2. 更新构建后的JavaScript文件
- **文件**: `MCPServer/build/tools/dataTools.js`
- **方式**: 通过`npm run build`重新构建

### 3. 更新旧的JavaScript文件
- **文件**: `MCPServer/tools/dataTools.js`
- **修改**: 同步相同的修复逻辑

## 修复验证

### 测试结果
✅ **测试成功** - 新增表记录功能正常工作

**测试数据**:
```json
{
  "hash": "df6c8aa5b1e78bd197fae32c36ab749e",
  "data": {
    "所属项目": "低代码集成平台(#317)",
    "所属迭代": "【2024】【脚手架】(#1183)",
    "所属模块": "首页",
    "缺陷标题": "首页UI设计需要重新审核",
    "缺陷类型": "界面优化",
    "重现步骤": "1. 打开首页\n2. 检查UI设计布局和样式\n3. 需要重新审核确认",
    "缺陷状态": "激活",
    "由谁创建": "czh",
    "指派给": "汤志敏",
    "最后修改者": "czh"
  }
}
```

**响应结果**:
```json
{
  "success": true,
  "message": "数据新增成功",
  "data": {
    "id": 17,
    "所属项目": "低代码集成平台(#317)",
    // ... 其他字段
  }
}
```

## 改进点

1. **更好的错误处理**: 针对400错误提供更详细的错误信息
2. **请求日志**: 添加了请求日志输出，便于调试
3. **格式验证**: 确保请求格式与后端API期望一致

## 影响范围
- ✅ `add_table_record`工具 - 已修复
- ✅ 其他数据操作工具 - 不受影响
- ✅ 文件上传工具 - 不受影响
- ✅ 映射关系工具 - 不受影响

## 后续建议
1. 确保所有MCP服务器实例都使用修复后的版本
2. 考虑在后端API中添加更详细的错误信息，便于客户端调试
3. 建立API文档，明确每个端点的请求格式要求

---
**修复完成时间**: 2025-10-11 14:21  
**修复状态**: ✅ 已完成
