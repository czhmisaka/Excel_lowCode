/*
 * @Date: 2025-12-02 14:28:20
 * @LastEditors: CZH
 * @LastEditTime: 2025-12-02 14:28:50
 * @FilePath: /打卡/test_checkin_simple.js
 */
/**
 * 简单测试签到功能修复
 * 使用Node.js内置http模块
 */

const http = require('http');

async function testCheckinSimple() {
  console.log('=== 简单测试签到功能修复 ===\n');
  
  const testData = {
    realName: '测试用户',
    phone: '13800138000',
    companyCode: 'TEST001',
    laborSource: '汇博劳务公司',
    location: '测试地点',
    remark: '测试签到'
  };

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3050,
    path: '/api/checkin/checkin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 5000
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('状态码:', res.statusCode);
          console.log('响应数据:', JSON.stringify(result, null, 2));
          
          if (res.statusCode === 200 && result.success) {
            console.log('\n✅ 签到成功！');
            console.log('劳务来源字段验证通过');
            resolve(true);
          } else {
            console.log('\n⚠️ 签到API返回失败');
            console.log('错误信息:', result.message || result.error);
            
            if (result.error && result.error.includes('labor_source')) {
              console.error('\n❌ 问题: labor_source字段相关错误');
              console.error('错误详情:', result.error);
            }
            resolve(false);
          }
        } catch (error) {
          console.error('❌ 解析响应数据失败:', error.message);
          console.error('原始响应:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message);
      console.error('可能原因:');
      console.error('1. 后端服务未启动');
      console.error('2. 网络连接问题');
      console.error('3. 服务器超时');
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('❌ 请求超时');
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// 运行测试
testCheckinSimple().then(success => {
  console.log('\n=== 测试完成 ===');
  console.log('结果:', success ? '✅ 通过' : '❌ 失败');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
