/*
 * @Date: 2025-11-25 18:50:37
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-25 18:52:00
 * @FilePath: /lowCode_excel/fe/test_frontend_upload.js
 */
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testFrontendUpload() {
    try {
        console.log('正在测试前端上传流程...');
        
        // 创建FormData，模拟前端上传
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

        // 模拟前端请求头
        const headers = {
            ...formData.getHeaders(),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJkaXNwbGF5TmFtZSI6ImFkbWluIiwiaWF0IjoxNzY0MDY3MjM0LCJleHAiOjE3NjQxNTM2MzR9.47W3OVNyhN-BXYxoqfFcoxHKkSYprxbSW5LW8knDJ5s',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Origin': 'http://localhost:5174',
            'Pragma': 'no-cache',
            'Referer': 'http://localhost:5174/files',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        };

        console.log('发送上传预览请求...');
        
        // 测试上传预览接口
        const previewResponse = await axios.post('http://localhost:5174/backend/api/upload/preview', formData, {
            headers,
            timeout: 30000
        });

        console.log('✅ 上传预览接口测试成功');
        console.log('响应状态:', previewResponse.status);
        console.log('响应数据:', JSON.stringify(previewResponse.data, null, 2));

        // 测试动态解析接口
        console.log('\n测试动态解析接口...');
        const dynamicFormData = new FormData();
        dynamicFormData.append('file', fileBuffer, {
            filename: 'test_large_numbers.xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        dynamicFormData.append('headerRow', '0');

        const dynamicHeaders = {
            ...dynamicFormData.getHeaders(),
            ...headers
        };

        const dynamicResponse = await axios.post('http://localhost:5174/backend/api/upload/dynamic-parse', dynamicFormData, {
            headers: dynamicHeaders,
            timeout: 30000
        });

        console.log('✅ 动态解析接口测试成功');
        console.log('响应状态:', dynamicResponse.status);
        console.log('响应数据:', JSON.stringify(dynamicResponse.data, null, 2));

        return true;
        
    } catch (error) {
        console.error('❌ 前端上传测试失败:');
        
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

// 检查前端服务器是否运行
async function checkFrontendServer() {
    try {
        const response = await axios.get('http://localhost:5174', { timeout: 5000 });
        console.log('✅ 前端服务器运行正常');
        return true;
    } catch (error) {
        console.error('❌ 前端服务器未运行');
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
    console.log('开始测试前端上传流程...');
    
    // 检查服务器
    const frontendRunning = await checkFrontendServer();
    const backendRunning = await checkBackendServer();
    
    if (!frontendRunning || !backendRunning) {
        console.log('请确保前后端服务器都在运行');
        process.exit(1);
    }
    
    // 测试上传流程
    const success = await testFrontendUpload();
    
    if (success) {
        console.log('\n🎉 前端上传流程测试通过！');
        process.exit(0);
    } else {
        console.log('\n💥 前端上传流程测试失败！');
        process.exit(1);
    }
}

main();
