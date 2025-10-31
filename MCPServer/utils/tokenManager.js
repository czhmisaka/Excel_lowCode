/**
 * MCP Server 令牌管理器
 * 负责自动获取和更新服务账户令牌
 */

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

class TokenManager {
    constructor() {
        this.currentToken = null;
        this.tokenExpiry = null;
        this.isRefreshing = false;
        this.refreshQueue = [];

        // 在构造函数中自动设置环境变量中的令牌
        const envToken = process.env.MCP_SERVICE_TOKEN;
        if (envToken) {
            console.log('使用环境变量中的令牌初始化令牌管理器...');
            this.setToken(envToken);
        }
    }

    /**
     * 获取当前令牌
     * @returns {Promise<string>} 当前有效的令牌
     */
    async getToken() {
        // 如果令牌不存在或即将过期，刷新令牌
        if (!this.currentToken || this.isTokenExpired()) {
            await this.refreshToken();
        }

        return this.currentToken;
    }

    /**
     * 检查令牌是否过期
     * @returns {boolean} 是否过期
     */
    isTokenExpired() {
        if (!this.tokenExpiry) return true;

        // 在过期前5分钟就认为需要刷新
        const bufferTime = 5 * 60 * 1000; // 5分钟
        return Date.now() >= (this.tokenExpiry - bufferTime);
    }

    /**
     * 刷新令牌
     * @returns {Promise<void>}
     */
    async refreshToken() {
        // 如果已经在刷新中，等待刷新完成
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.refreshQueue.push(resolve);
            });
        }

        this.isRefreshing = true;

        try {
            console.log('正在刷新 MCP 服务令牌...');

            // 创建独立的 axios 实例用于令牌刷新，避免循环依赖
            const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
            const axiosInstance = axios.create({
                baseURL: baseURL,
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 优先使用环境变量中的令牌，如果没有则使用当前令牌
            const envToken = process.env.MCP_SERVICE_TOKEN;
            const tokenToUse = envToken || this.currentToken;

            if (tokenToUse) {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
            }

            const response = await axiosInstance.get('/api/service-accounts/mcp/token');

            if (response.data.success && response.data.token) {
                this.currentToken = response.data.token;

                // 解析令牌获取过期时间
                try {
                    const payload = JSON.parse(Buffer.from(response.data.token.split('.')[1], 'base64').toString());
                    this.tokenExpiry = payload.exp * 1000; // 转换为毫秒

                    console.log('令牌刷新成功，过期时间:', new Date(this.tokenExpiry).toLocaleString());
                } catch (parseError) {
                    console.warn('无法解析令牌过期时间，使用默认24小时');
                    this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24小时
                }

                // 通知所有等待的请求
                this.refreshQueue.forEach(resolve => resolve());
                this.refreshQueue = [];

            } else {
                throw new Error('获取令牌失败: ' + (response.data.message || '未知错误'));
            }

        } catch (error) {
            console.error('刷新令牌失败:', error.message);

            // 通知所有等待的请求
            this.refreshQueue.forEach(resolve => resolve());
            this.refreshQueue = [];

            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * 手动设置令牌（用于初始化）
     * @param {string} token - 令牌
     */
    setToken(token) {
        this.currentToken = token;

        // 尝试解析过期时间
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            this.tokenExpiry = payload.exp * 1000;
            console.log('令牌已设置，过期时间:', new Date(this.tokenExpiry).toLocaleString());
        } catch (error) {
            console.warn('无法解析令牌过期时间，使用默认24小时');
            this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        }
    }

    /**
     * 清除令牌
     */
    clearToken() {
        this.currentToken = null;
        this.tokenExpiry = null;
        this.refreshQueue = [];
    }

    /**
     * 获取令牌状态
     * @returns {object} 令牌状态信息
     */
    getTokenStatus() {
        return {
            hasToken: !!this.currentToken,
            isExpired: this.isTokenExpired(),
            expiryTime: this.tokenExpiry ? new Date(this.tokenExpiry).toLocaleString() : null,
            timeUntilExpiry: this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : null
        };
    }
}

// 创建单例实例
const tokenManager = new TokenManager();

export default tokenManager;
