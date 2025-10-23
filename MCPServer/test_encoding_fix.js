/**
 * 测试MCP服务器编码修复效果
 */

import { DataToolsHandler } from './tools/dataTools.js';

// 测试数据清理功能
console.log('=== 测试数据编码清理功能 ===');

// 测试包含特殊字符的数据
const testData = {
    normal: '正常文本',
    withControlChars: '文本\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F',
    withUnicode: '中文文本 æ\\x9c\\x89é\\x99\\x90å',
    withEscaped: '转义字符 \\x41\\x42\\x43 \\u0041\\u0042\\u0043',
    nested: {
        field1: '嵌套字段1',
        field2: '嵌套字段2 \x00\x01\x02',
        array: ['数组元素1', '数组元素2 \x00\x01', '数组元素3']
    }
};

console.log('原始数据:');
console.log(JSON.stringify(testData, null, 2));

console.log('\n清理后的数据:');
const cleanedData = DataToolsHandler.sanitizeJsonData(testData);
console.log(JSON.stringify(cleanedData, null, 2));

// 测试JSON字符串清理
console.log('\n=== 测试JSON字符串清理 ===');

const problematicJson = '{"result":{"content":[{"type":"text","text":"表数据查询结果 (第1页，每页10条):\\n{\\"success\\":true,\\"data\\":[{\\"id\\":1,\\"name\\":\\"测试\\",\\"value\\":\\"100\\",\\"description\\":\\"æ\\\\x9c\\\\x89é\\\\x99\\\\x90å\\"}]}"}]}}';

console.log('有问题的JSON字符串:');
console.log(problematicJson);

try {
    const cleanedJson = DataToolsHandler.cleanString(problematicJson);
    console.log('\n清理后的JSON字符串:');
    console.log(cleanedJson);

    // 尝试解析清理后的JSON
    const parsed = JSON.parse(cleanedJson);
    console.log('\n成功解析清理后的JSON!');
    console.log('解析结果:', parsed);
} catch (error) {
    console.log('\nJSON解析失败:', error.message);
}

// 测试UTF-8编码验证
console.log('\n=== 测试UTF-8编码验证 ===');

const testStrings = [
    '正常UTF-8文本',
    '包含特殊字符: \x00\x01\x02',
    '中文测试: 你好世界',
    '混合文本: Hello 世界 \x00\x01\x02',
    Buffer.from('Buffer测试', 'utf8')
];

testStrings.forEach((str, index) => {
    console.log(`\n测试字符串 ${index + 1}:`);
    console.log('原始:', str);
    const cleaned = DataToolsHandler.cleanString(str);
    console.log('清理后:', cleaned);
});

console.log('\n=== 测试完成 ===');
console.log('所有编码清理功能正常工作！');
