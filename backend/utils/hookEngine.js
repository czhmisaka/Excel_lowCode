// Hook执行引擎
const { VM } = require('vm2');
const axios = require('axios');
const { FormHook, FormSubmission } = require('../models');
const { getDynamicModel } = require('../models');

class HookEngine {
  constructor() {
    this.vm = new VM({
      timeout: 5000, // 5秒超时
      sandbox: {
        console: console,
        Date: Date,
        Math: Math,
        JSON: JSON,
        // 限制可用的全局对象
      },
      eval: false,
      wasm: false,
    });
  }

  /**
   * 执行表单提交的Hook处理
   * @param {string} formId 表单ID
   * @param {object} submissionData 提交数据
   * @param {string} triggerType 触发时机
   * @returns {Promise<object>} 处理后的数据
   */
  async executeHooks(formId, submissionData, triggerType = 'beforeSubmit') {
    try {
      console.log(`执行Hook: formId=${formId}, triggerType=${triggerType}`);
      
      // 获取启用的Hook配置
      const hooks = await FormHook.findAll({
        where: {
          formId,
          triggerType,
          enabled: true
        },
        order: [['created_at', 'ASC']]
      });

      if (hooks.length === 0) {
        console.log(`未找到${triggerType}类型的Hook`);
        return submissionData;
      }

      let processedData = { ...submissionData };

      // 按顺序执行所有Hook
      for (const hook of hooks) {
        console.log(`执行Hook: ${hook.type} - ${hook.id}`);
        processedData = await this.executeSingleHook(hook, processedData);
      }

      return processedData;

    } catch (error) {
      console.error(`Hook执行失败:`, error);
      throw new Error(`Hook执行失败: ${error.message}`);
    }
  }

  /**
   * 执行单个Hook
   * @param {object} hook Hook配置
   * @param {object} data 输入数据
   * @returns {Promise<object>} 处理后的数据
   */
  async executeSingleHook(hook, data) {
    try {
      switch (hook.type) {
        case 'javascript':
          return await this.executeJavaScriptHook(hook, data);
        case 'http':
          return await this.executeHttpHook(hook, data);
        case 'database':
          return await this.executeDatabaseHook(hook, data);
        case 'conditional':
          return await this.executeConditionalHook(hook, data);
        default:
          throw new Error(`不支持的Hook类型: ${hook.type}`);
      }
    } catch (error) {
      console.error(`Hook执行失败 (${hook.type}):`, error);
      throw error;
    }
  }

  /**
   * 执行JavaScript Hook
   * @param {object} hook Hook配置
   * @param {object} data 输入数据
   * @returns {Promise<object>} 处理后的数据
   */
  async executeJavaScriptHook(hook, data) {
    try {
      const { code } = hook.config;
      
      if (!code) {
        throw new Error('JavaScript Hook缺少代码配置');
      }

      // 创建安全的执行环境
      const sandbox = {
        data: JSON.parse(JSON.stringify(data)), // 深拷贝数据
        formData: JSON.parse(JSON.stringify(data)), // 兼容旧代码，使用formData变量
        console: {
          log: (...args) => console.log(`[Hook ${hook.id}]`, ...args),
          error: (...args) => console.error(`[Hook ${hook.id}]`, ...args)
        },
        // 限制可用的全局对象
        Date: Date,
        Math: Math,
        JSON: JSON,
        setTimeout: undefined,
        setInterval: undefined,
        fetch: undefined,
        require: undefined,
        process: undefined,
        global: undefined
      };

      // 执行JavaScript代码
      const fullCode = `
        try {
          ${code}
          // 确保execute函数被调用
          if (typeof execute === 'function') {
            execute(data);
          }
        } catch (error) {
          throw new Error('JavaScript执行错误: ' + error.message);
        }
      `;

      // 使用正确的VM2 API
      const vm = new VM({
        timeout: 5000,
        sandbox: sandbox,
        eval: false,
        wasm: false
      });

      vm.run(fullCode);

      return sandbox.data;

    } catch (error) {
      throw new Error(`JavaScript Hook执行失败: ${error.message}`);
    }
  }

  /**
   * 执行HTTP Hook
   * @param {object} hook Hook配置
   * @param {object} data 输入数据
   * @returns {Promise<object>} 处理后的数据
   */
  async executeHttpHook(hook, data) {
    try {
      const { url, method = 'POST', headers = {}, bodyTemplate } = hook.config;
      
      if (!url) {
        throw new Error('HTTP Hook缺少URL配置');
      }

      // 构建请求体
      let requestBody = data;
      if (bodyTemplate) {
        // 简单的模板替换
        requestBody = this.processTemplate(bodyTemplate, data);
      }

      // 发送HTTP请求
      const response = await axios({
        method: method.toUpperCase(),
        url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        data: requestBody,
        timeout: 10000 // 10秒超时
      });

      console.log(`HTTP Hook响应: ${response.status}`, response.data);

      // 如果响应包含数据，则合并到原始数据中
      if (response.data && typeof response.data === 'object') {
        return { ...data, ...response.data };
      }

      return data;

    } catch (error) {
      throw new Error(`HTTP Hook执行失败: ${error.message}`);
    }
  }

  /**
   * 执行数据库Hook
   * @param {object} hook Hook配置
   * @param {object} data 输入数据
   * @returns {Promise<object>} 处理后的数据
   */
  async executeDatabaseHook(hook, data) {
    try {
      const { operation, table, conditions, data: operationData } = hook.config;
      
      if (!operation || !table) {
        throw new Error('数据库Hook缺少操作类型或表名配置');
      }

      // 获取动态表模型
      const DynamicModel = getDynamicModel(table);

      switch (operation.toLowerCase()) {
        case 'create':
          const createData = operationData || data;
          await DynamicModel.create(createData);
          break;

        case 'update':
          if (!conditions) {
            throw new Error('更新操作需要条件配置');
          }
          await DynamicModel.update(operationData || data, { where: conditions });
          break;

        case 'delete':
          if (!conditions) {
            throw new Error('删除操作需要条件配置');
          }
          await DynamicModel.destroy({ where: conditions });
          break;

        case 'query':
          const queryResult = await DynamicModel.findAll({ where: conditions });
          // 将查询结果合并到数据中
          return { ...data, queryResult: queryResult.map(item => item.toJSON()) };

        default:
          throw new Error(`不支持的数据库操作: ${operation}`);
      }

      return data;

    } catch (error) {
      throw new Error(`数据库Hook执行失败: ${error.message}`);
    }
  }

  /**
   * 执行条件Hook
   * @param {object} hook Hook配置
   * @param {object} data 输入数据
   * @returns {Promise<object>} 处理后的数据
   */
  async executeConditionalHook(hook, data) {
    try {
      const { condition, thenHook, elseHook } = hook.config;
      
      if (!condition) {
        throw new Error('条件Hook缺少条件配置');
      }

      // 简单的条件表达式求值
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (conditionResult) {
        console.log(`条件Hook条件为真，执行thenHook`);
        if (thenHook) {
          return await this.executeSingleHook(thenHook, data);
        }
      } else {
        console.log(`条件Hook条件为假，执行elseHook`);
        if (elseHook) {
          return await this.executeSingleHook(elseHook, data);
        }
      }

      return data;

    } catch (error) {
      throw new Error(`条件Hook执行失败: ${error.message}`);
    }
  }

  /**
   * 处理模板字符串
   * @param {string} template 模板字符串
   * @param {object} data 数据对象
   * @returns {object} 处理后的数据
   */
  processTemplate(template, data) {
    try {
      // 简单的模板替换：{{fieldName}}
      const processed = JSON.stringify(template).replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
        return data[fieldName] !== undefined ? JSON.stringify(data[fieldName]) : 'null';
      });
      
      return JSON.parse(processed);
    } catch (error) {
      console.warn('模板处理失败，使用原始数据:', error);
      return data;
    }
  }

  /**
   * 求值条件表达式
   * @param {string} condition 条件表达式
   * @param {object} data 数据对象
   * @returns {boolean} 条件结果
   */
  evaluateCondition(condition, data) {
    try {
      // 简单的条件表达式求值
      // 支持：data.field === value, data.field > value 等
      const expression = condition.replace(/data\.(\w+)/g, (match, fieldName) => {
        return JSON.stringify(data[fieldName]);
      });

      // 使用安全的求值方式
      return this.vm.run(`!!(${expression})`);
    } catch (error) {
      console.error('条件表达式求值失败:', error);
      return false;
    }
  }

  /**
   * 记录表单提交
   * @param {string} formId 表单ID
   * @param {object} submissionData 提交数据
   * @param {object} processedData 处理后的数据
   * @param {string} status 状态
   * @param {string} errorMessage 错误信息
   */
  async recordSubmission(formId, submissionData, processedData = null, status = 'success', errorMessage = null) {
    try {
      await FormSubmission.create({
        formId,
        submissionData,
        processedData,
        status,
        errorMessage
      });
    } catch (error) {
      console.error('记录表单提交失败:', error);
    }
  }
}

module.exports = new HookEngine();
