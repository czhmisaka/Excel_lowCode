/*
 * @Date: 2025-11-25 18:46:39
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 18:47:20
 * @FilePath: /lowCode_excel/backend/test_upload_preview.js
 */
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testUploadPreview() {
    try {
        console.log('正在测试上传预览接口...');
        
        // 创建FormData
        const formData = new FormData();
        
        // 添加测试Excel文件
        const testFilePath = path.join(__dirname, '../test_large_numbers.xlsx');
        if (!fs.existsSync(testFilePath)) {
            console.error('❌ 测试文件不存在:', testFilePath);
            return false;
        }
        
        const fileBuffer = fs.readFileSync(testFilePath);
        formData.append('file', fileBuffer, {
            filename: 'test_large_numbers.xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // 发送请求
        const response = await axios.post('http://localhost:3000/api/upload/preview', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJkaXNwbGF5TmFtZSI6ImFkbWluIiwiaWF0IjoxNzY0MDY3MjM0LCJleHAiOjE3NjQxNTM2MzR9.47W3OVNyhN-BXYxoqfFcoxHKkSYprxbSW5LW8knDJ5s'
            },
            timeout: 30000
        });

        console.log('✅ 上传预览接口测试成功');
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
        return true;
        
    } catch (error) {
        console.error('❌ 上传预览接口测试失败:');
        
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('请求错误:', error.message);
        } else {
            console.error('其他错误:', error.message);
        }
        
        return false;
    }
}

// 检查服务器是否运行
async function checkServer() {
    try {
        const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
        console.log('✅ 服务器健康检查通过');
        return true;
    } catch (error) {
        console.error('❌ 服务器未运行或健康检查失败');
        return false;
    }
}

async function main() {
    console.log('开始测试上传预览接口...');
    
    // 检查服务器
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('请先启动服务器: cd backend && npm start');
        process.exit(1);
    }
    
    // 测试上传预览
    const success = await testUploadPreview();
    
    if (success) {
        console.log('\n🎉 上传预览接口测试通过！');
        process.exit(0);
    } else {
        console.log('\n💥 上传预览接口测试失败！');
        process.exit(1);
    }
}

main();
