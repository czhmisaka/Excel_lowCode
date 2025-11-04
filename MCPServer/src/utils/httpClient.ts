/*
 * @Date: 2025-10-11 11:32:26
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-31 16:48:01
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
    private client: any;

    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
        this.timeout = parseInt(process.env.API_TIMEOUT || '30000');

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 请求拦截器 - 添加特殊认证头
        this.client.interceptors.request.use(
            (config: any) => {
                console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`);
                config.headers['X-Special-Auth'] = 'czhmisakaLogin:aGithubUserFuckEverything';
                console.log('[HTTP Request Headers]', config.headers);
                return config;
            },
            (error: any) => {
                console.error('[HTTP Request Error]', error);
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.client.interceptors.response.use(
            (response: any) => {
                console.log(`[HTTP Response] ${response.status} ${response.config.url}`);
                return response;
            },
            (error: any) => {
                console.error('[HTTP Response Error]', error.message);
                if (error.response) {
                    console.error(`[HTTP Error Details] Status: ${error.response.status}, Data:`, error.response.data);
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * 检查API连接状态
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
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
            const response = await this.client.get(endpoint, { params });
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
            const response = await this.client.post(endpoint, data);
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
            const response = await this.client.put(endpoint, data);
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
            const response = await this.client.delete(endpoint, { data });
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
            const response = await this.client.get(endpoint, {
                params,
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
