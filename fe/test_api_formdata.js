/*
 * @Date: 2025-11-25 18:56:29
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 18:57:17
 * @FilePath: /lowCode_excel/fe/test_api_formdata.js
 */
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testAPIFormData() {
    try {
        console.log('正在测试API FormData构建...');
        
        // 创建FormData
        const formData = new FormData();
        
        // 添加测试Excel文件
        const __dirname = path.dirname(new URL(import.meta.url).pathname);
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

        console.log('FormData构建完成，检查内容...');
        console.log('FormData headers:', formData.getHeaders());
        
        // 检查FormData是否包含文件
        console.log('FormData构建完成，准备发送请求...');

        // 直接测试后端API（绕过前端代理）
        console.log('\n直接测试后端API...');
        const response = await axios.post('http://localhost:3000/api/upload/preview', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJkaXNwbGF5TmFtZSI6ImFkbWluIiwiaWF0IjoxNzY0MDY3MjM0LCJleHAiOjE3NjQxNTM2MzR9.47W3OVNyhN-BXYxoqfFcoxHKkSYprxbSW5LW8knDJ5s'
            },
            timeout: 30000
        });

        console.log('✅ 后端API直接测试成功');
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));

        return true;
        
    } catch (error) {
        console.error('❌ API FormData测试失败:');
        
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
            console.error('响应头:', error.response.headers);
        } else if (error.request) {
            console.error('请求错误:', error.message);
            console.error('请求配置:', error.config);
        } else {
            console.error('其他错误:', error.message);
        }
        
        return false;
    }
}

// 检查后端服务器是否运行
async function checkBackendServer() {
    try {
        const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
        console.log('✅ 后端服务器运行正常');
        return true;
    } catch (error) {
        console.error('❌ 后端服务器未运行');
        return false;
    }
}

async function main() {
    console.log('开始测试API FormData构建...');
    
    // 检查服务器
    const backendRunning = await checkBackendServer();
    
    if (!backendRunning) {
        console.log('请确保后端服务器在运行');
        process.exit(1);
    }
    
    // 测试FormData构建
    const success = await testAPIFormData();
    
    if (success) {
        console.log('\n🎉 API FormData构建测试通过！');
        process.exit(0);
    } else {
        console.log('\n💥 API FormData构建测试失败！');
        process.exit(1);
    }
}

main();
