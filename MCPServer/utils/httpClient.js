import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根据环境加载对应的 .env 文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, '..', envFile);

dotenv.config({ path: envPath });

/**
 * HTTP客户端，用于与Excel数据管理系统API通信
 */
class HttpClient {
    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
        this.timeout = parseInt(process.env.API_TIMEOUT) || 30000;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 请求拦截器 - 添加特殊认证头
        this.client.interceptors.request.use(
            async (config) => {
                console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`);
                config.headers['X-Special-Auth'] = 'czhmisakaLogin:aGithubUserFuckEverything';
                console.log('[HTTP Request Headers]', config.headers);
                return config;
            },
            (error) => {
                console.error('[HTTP Request Error]', error);
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.client.interceptors.response.use(
            (response) => {
                console.log(`[HTTP Response] ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('[HTTP Response Error]', error.message);
                if (error.response) {
                    console.error(`[HTTP Error Details] Status: ${error.response.status}, Data:`, error.response.data);
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * 发送GET请求
     * @param {string} url - 请求URL
     * @param {object} params - 查询参数
     * @returns {Promise<object>} 响应数据
     */
    async get(url, params = {}) {
        try {
            const response = await this.client.get(url, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'GET', url);
        }
    }

    /**
     * 发送POST请求
     * @param {string} url - 请求URL
     * @param {object} data - 请求数据
     * @returns {Promise<object>} 响应数据
     */
    async post(url, data = {}) {
        try {
            const response = await this.client.post(url, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'POST', url);
        }
    }

    /**
     * 发送PUT请求
     * @param {string} url - 请求URL
     * @param {object} data - 请求数据
     * @returns {Promise<object>} 响应数据
     */
    async put(url, data = {}) {
        try {
            const response = await this.client.put(url, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'PUT', url);
        }
    }

    /**
     * 发送DELETE请求
     * @param {string} url - 请求URL
     * @param {object} data - 请求数据
     * @returns {Promise<object>} 响应数据
     */
    async delete(url, data = {}) {
        try {
            const response = await this.client.delete(url, { data });
            return response.data;
        } catch (error) {
            throw this.handleError(error, 'DELETE', url);
        }
    }

    /**
     * 发送GET请求获取二进制数据
     * @param {string} url - 请求URL
     * @param {object} params - 查询参数
     * @returns {Promise<Buffer>} 二进制数据
     */
    async getBinary(url, params = {}) {
        try {
            const response = await this.client.get(url, {
                params,
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data);
        } catch (error) {
            throw this.handleError(error, 'GET', url);
        }
    }

    /**
     * 处理错误
     * @param {Error} error - 错误对象
     * @param {string} method - HTTP方法
     * @param {string} url - 请求URL
     * @returns {Error} 处理后的错误
     */
    handleError(error, method, url) {
        if (error.response) {
            // 服务器返回了错误状态码
            const status = error.response.status;
            const message = error.response.data?.message || error.response.statusText;

            return new Error(`HTTP ${status}: ${message} (${method} ${url})`);
        } else if (error.request) {
            // 请求已发送但没有收到响应
            return new Error(`无法连接到服务器: ${this.baseURL} (${method} ${url})`);
        } else {
            // 请求配置错误
            return new Error(`请求配置错误: ${error.message} (${method} ${url})`);
        }
    }

    /**
     * 检查API连接状态
     * @returns {Promise<boolean>} 连接是否正常
     */
    async checkConnection() {
        try {
            const response = await this.get('/health');
            return response.status === 'ok';
        } catch (error) {
            console.error('API连接检查失败:', error.message);
            return false;
        }
    }
}

// 创建单例实例
const httpClient = new HttpClient();

export default httpClient;
