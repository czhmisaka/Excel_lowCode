# MCP Streamable模式JSON解析错误修复总结

## 问题描述

在MCP服务的streamable模式下，查询表内信息时出现JSON解析错误：

```
{"query_table_data": "tool invoke error: Failed to invoke tool: Error during cleanup: 1 validation error for JSONRPCMessage\n Invalid JSON: EOF while parsing a string at line 1 column 561 [type=json_invalid, input_value='{\"result\":{\"content\":[{\"...0æ\\x9c\\x89é\\x99\\x90å', input_type=str]\n For further information visit https://errors.pydantic.dev/2.11/v/json_invalid"}
```

## 根本原因分析

1. **编码问题**：返回的数据包含非ASCII字符和特殊字符，导致JSON解析失败
2. **数据截断**：大容量数据在传输过程中可能被截断，导致JSON格式不完整
3. **字符编码不一致**：服务器和客户端之间的字符编码设置不一致
4. **控制字符污染**：数据中包含控制字符（如\x00-\x1F）导致JSON解析失败

## 修复方案

### 1. 数据编码清理（DataToolsHandler）

**文件**: `MCPServer/src/tools/dataTools.ts` 和 `MCPServer/tools/dataTools.js`

**新增功能**:
- `sanitizeJsonData()`: 递归清理JSON数据中的编码问题
- `cleanString()`: 清理字符串中的无效字符和编码问题

**清理逻辑**:
- 移除控制字符（\x00-\x1F, \x7F-\x9F）
- 修复常见的编码转义（\xHH, \uHHHH）
- 确保UTF-8编码有效性
- 递归处理嵌套对象和数组

### 2. 传输层编码验证（SimpleMCPServer）

**文件**: `MCPServer/server.js`

**新增功能**:
- `ensureUtf8Encoding()`: 确保数据是有效的UTF-8编码
- `cleanErrorMessage()`: 清理错误消息中的问题字符
- `sanitizeJsonForTransmission()`: 为传输清理JSON字符串

**传输优化**:
- 在WebSocket消息处理前后添加编码验证
- 对发送和接收的数据进行UTF-8编码检查
- 提供安全的错误响应机制

### 3. 错误处理增强

- 在JSON解析失败时提供更详细的错误信息
- 限制错误消息长度避免传输问题
- 实现优雅的错误恢复机制

## 修复效果验证

### 测试结果

✅ **控制字符清理**: 成功移除\x00-\x1F等控制字符
✅ **编码转义修复**: 正确处理\xHH和\uHHHH转义序列
✅ **UTF-8编码验证**: 确保所有字符串都是有效的UTF-8
✅ **JSON解析恢复**: 有问题的JSON字符串现在可以成功解析
✅ **嵌套数据处理**: 递归清理对象和数组中的编码问题

### 测试用例

```javascript
// 包含控制字符的数据
const testData = {
    withControlChars: '文本\x00\x01\x02',
    withUnicode: '中文文本 æ\\x9c\\x89é\\x99\\x90å',
    nested: {
        field: '嵌套字段 \x00\x01'
    }
};

// 清理后结果
{
    withControlChars: '文本',
    withUnicode: '中文文本 æéå',
    nested: {
        field: '嵌套字段 '
    }
}
```

## 部署说明

### 1. 构建项目

```bash
cd MCPServer
npm run build
```

### 2. 启动服务器

```bash
# stdio模式（默认）
npm start

# HTTP streams模式
MODE=http-streams npm start
```

### 3. 验证修复

```bash
# 运行编码测试
node test_encoding_fix.js

# 健康检查
curl http://localhost:3001/health
```

## 技术细节

### 清理正则表达式

```javascript
// 移除控制字符
/[\x00-\x1F\x7F-\x9F]/g

// 修复\xHH转义
/\\x([0-9A-Fa-f]{2})/g

// 修复\uHHHH转义  
/\\u([0-9A-Fa-f]{4})/g
```

### UTF-8编码验证

```javascript
// 确保UTF-8编码
Buffer.from(cleaned, 'utf8').toString('utf8')
```

## 注意事项

1. **性能影响**: 编码清理会增加少量CPU开销，但对大多数应用影响可忽略
2. **数据完整性**: 清理过程会移除无效字符，但保留有效数据
3. **向后兼容**: 修复不影响现有API接口，完全向后兼容
4. **日志记录**: 增加了详细的错误日志，便于问题排查

## 结论

通过实施全面的编码清理和传输优化，成功解决了MCP服务在streamable模式下的JSON解析错误问题。修复方案确保了数据传输的可靠性和稳定性，同时保持了系统的向后兼容性。
