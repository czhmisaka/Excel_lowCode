/*
 * @Date: 2025-11-20 10:29:38
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-20 10:29:58
 * @FilePath: /lowCode_excel/backend/testTableController.js
 */
const tableController = require('./controllers/tableController');

// 测试 checkTableExists 方法
async function testCheckTableExists() {
    try {
        console.log('测试 checkTableExists 方法...');
        const result = await tableController.checkTableExists('test_table');
        console.log('结果:', result);
    } catch (error) {
        console.error('错误:', error.message);
        console.error('堆栈:', error.stack);
    }
}

// 测试 executeCreateTable 方法
async function testExecuteCreateTable() {
    try {
        console.log('测试 executeCreateTable 方法...');
        const columns = [
            { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
            { name: 'name', type: 'VARCHAR(255)', allowNull: false }
        ];
        const result = await tableController.executeCreateTable('test_table', columns);
        console.log('结果:', result);
    } catch (error) {
        console.error('错误:', error.message);
        console.error('堆栈:', error.stack);
    }
}

// 运行测试
async function runTests() {
    console.log('开始测试数据表控制器...');
    await testCheckTableExists();
    await testExecuteCreateTable();
    console.log('测试完成');
}

runTests();
