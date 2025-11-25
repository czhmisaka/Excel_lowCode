/*
 * @Date: 2025-11-23 15:46:35
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-23 15:47:16
 * @FilePath: /lowCode_excel/backend/memory_debug.js
 */
const { performance, PerformanceObserver } = require('perf_hooks');
const { heapUsed, heapTotal } = process.memoryUsage();

console.log('=== 内存调试脚本启动 ===');
console.log('初始内存使用:');
console.log(`- Heap Used: ${Math.round(heapUsed / 1024 / 1024)} MB`);
console.log(`- Heap Total: ${Math.round(heapTotal / 1024 / 1024)} MB`);

// 设置性能监控
const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
    });
});
obs.observe({ entryTypes: ['measure'] });

// 模拟服务器启动过程
async function simulateServerStart() {
    console.log('\n=== 模拟服务器启动过程 ===');
    
    // 1. 数据库连接
    performance.mark('db-connect-start');
    console.log('1. 数据库连接...');
    await new Promise(resolve => setTimeout(resolve, 100));
    performance.mark('db-connect-end');
    performance.measure('数据库连接', 'db-connect-start', 'db-connect-end');
    
    // 2. 自动建表
    performance.mark('auto-table-start');
    console.log('2. 自动建表...');
    await new Promise(resolve => setTimeout(resolve, 200));
    performance.mark('auto-table-end');
    performance.measure('自动建表', 'auto-table-start', 'auto-table-end');
    
    // 3. 初始化模型
    performance.mark('models-init-start');
    console.log('3. 初始化模型...');
    await new Promise(resolve => setTimeout(resolve, 150));
    performance.mark('models-init-end');
    performance.measure('模型初始化', 'models-init-start', 'models-init-end');
    
    // 4. 服务账户初始化
    performance.mark('service-accounts-start');
    console.log('4. 服务账户初始化...');
    await new Promise(resolve => setTimeout(resolve, 100));
    performance.mark('service-accounts-end');
    performance.measure('服务账户初始化', 'service-accounts-start', 'service-accounts-end');
    
    console.log('\n=== 服务器启动完成 ===');
    const finalMemory = process.memoryUsage();
    console.log('最终内存使用:');
    console.log(`- Heap Used: ${Math.round(finalMemory.heapUsed / 1024 / 1024)} MB`);
    console.log(`- Heap Total: ${Math.round(finalMemory.heapTotal / 1024 / 1024)} MB`);
    console.log(`- RSS: ${Math.round(finalMemory.rss / 1024 / 1024)} MB`);
    
    // 模拟服务器运行一段时间
    console.log('\n=== 模拟服务器运行 ===');
    for (let i = 1; i <= 10; i++) {
        console.log(`运行 ${i} 分钟...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mem = process.memoryUsage();
        console.log(`- 内存: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);
        
        // 模拟内存泄漏
        if (i === 5) {
            console.log('⚠️ 模拟内存泄漏...');
            global.leakArray = [];
            for (let j = 0; j < 100000; j++) {
                global.leakArray.push(new Array(1000).fill('memory leak data'));
            }
            console.log(`- 泄漏后内存: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
        }
    }
    
    console.log('\n=== 内存调试完成 ===');
    const finalMem = process.memoryUsage();
    console.log('最终内存统计:');
    console.log(`- Heap Used: ${Math.round(finalMem.heapUsed / 1024 / 1024)} MB`);
    console.log(`- Heap Total: ${Math.round(finalMem.heapTotal / 1024 / 1024)} MB`);
    console.log(`- RSS: ${Math.round(finalMem.rss / 1024 / 1024)} MB`);
    console.log(`- External: ${Math.round(finalMem.external / 1024 / 1024)} MB`);
}

// 运行模拟
simulateServerStart().catch(console.error);
