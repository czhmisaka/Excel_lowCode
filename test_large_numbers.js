/*
 * @Date: 2025-11-25 18:35:20
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 18:35:56
 * @FilePath: /lowCode_excel/test_large_numbers.js
 */
/**
 * JavaScript精度问题测试脚本
 * 用于验证大数字处理功能
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('./backend/node_modules/xlsx');

// 创建测试数据，包含大数字
const testData = [
    ['ID', '大数字1', '大数字2', '描述'],
    [1, 9007199254740991, 123456789012345, '安全整数边界'],
    [2, 9007199254740992, 987654321098765, '超出安全整数范围'],
    [3, 12345678901234567890, 11111111111111111111, '非常大的数字'],
    [4, '12345678901234567890', '22222222222222222222', '字符串形式的大数字'],
    [5, 123.456, 789.012, '普通小数'],
    [6, 999999999999999, 888888888888888, '接近边界的大数字']
];

// 创建工作簿和工作表
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(testData);
XLSX.utils.book_append_sheet(workbook, worksheet, '测试数据');

// 保存Excel文件
const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync('test_large_numbers.xlsx', excelBuffer);

console.log('测试Excel文件已创建: test_large_numbers.xlsx');
console.log('测试数据内容:');
console.table(testData);

// 测试JavaScript精度问题
console.log('\n=== JavaScript精度问题演示 ===');
const largeNumber1 = 9007199254740992;
const largeNumber2 = 12345678901234567890;
const largeNumber3 = '12345678901234567890';

console.log(`数字 ${largeNumber1} 是否为安全整数: ${Number.isSafeInteger(largeNumber1)}`);
console.log(`数字 ${largeNumber2} 是否为安全整数: ${Number.isSafeInteger(largeNumber2)}`);
console.log(`字符串 "${largeNumber3}" 转换为数字后是否为安全整数: ${Number.isSafeInteger(Number(largeNumber3))}`);

console.log('\n=== 精度丢失演示 ===');
console.log(`原始数字: ${largeNumber2}`);
console.log(`JavaScript表示: ${largeNumber2}`);
console.log(`精度是否丢失: ${largeNumber2 !== 12345678901234567890}`);

// 测试处理函数
function isSafeInteger(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    const num = Number(value);
    return Number.isSafeInteger(num);
}

function handleLargeNumber(value) {
    if (value === null || value === undefined || value === '') {
        return value;
    }
    
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
        return value.toString();
    }
    
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue === '') {
            return value;
        }
        const num = Number(trimmedValue);
        if (!isNaN(num) && !Number.isSafeInteger(num)) {
            return trimmedValue;
        }
    }
    
    return value;
}

console.log('\n=== 大数字处理函数测试 ===');
console.log(`处理前: ${largeNumber2} (类型: ${typeof largeNumber2})`);
console.log(`处理后: ${handleLargeNumber(largeNumber2)} (类型: ${typeof handleLargeNumber(largeNumber2)})`);
console.log(`处理前: "${largeNumber3}" (类型: ${typeof largeNumber3})`);
console.log(`处理后: ${handleLargeNumber(largeNumber3)} (类型: ${typeof handleLargeNumber(largeNumber3)})`);
