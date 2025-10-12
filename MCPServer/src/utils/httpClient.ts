/*
 * @Date: 2025-10-11 11:32:26
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-11 15:26:03
 * @FilePath: /lowCode_excel/MCPServer/src/utils/httpClient.ts
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * HTTP客户端工具类，用于与Excel数据管理系统API通信
 */
class HttpClient {
    private baseURL: string;
    private timeout: number;

    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
        this.timeout = parseInt(process.env.API_TIMEOUT || '30000');
    }

    /**
     * 检查API连接状态
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: this.timeout
            });
            return response.status === 200;
        } catch (error) {
            console.error('API连接检查失败:', error);
            return false;
        }
    }

    /**
     * 发送GET请求
     */
    async get(endpoint: string, params?: any): Promise<any> {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                params,
                timeout: this.timeout
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`GET请求失败: ${error.message}`);
        }
    }

    /**
     * 发送POST请求
     */
    async post(endpoint: string, data?: any): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`POST请求失败: ${error.message}`);
        }
    }

    /**
     * 发送PUT请求
     */
    async put(endpoint: string, data?: any): Promise<any> {
        try {
            const response = await axios.put(`${this.baseURL}${endpoint}`, data, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`PUT请求失败: ${error.message}`);
        }
    }

    /**
     * 发送DELETE请求
     */
    async delete(endpoint: string, data?: any): Promise<any> {
        try {
            const response = await axios.delete(`${this.baseURL}${endpoint}`, {
                data,
                timeout: this.timeout
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`DELETE请求失败: ${error.message}`);
        }
    }

    /**
     * 发送GET请求获取二进制数据
     */
    async getBinary(endpoint: string, params?: any): Promise<Buffer> {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                params,
                timeout: this.timeout,
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data);
        } catch (error: any) {
            throw new Error(`GET二进制请求失败: ${error.message}`);
        }
    }
}

// 创建单例实例
const httpClient = new HttpClient();

export default httpClient;
