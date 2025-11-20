const { TableMapping, getDynamicModel, FormDefinition } = require('../models');
const { validateHash } = require('../utils/hashGenerator');
const OperationLogger = require('../utils/logger');
const hookEngine = require('../utils/hookEngine');

/**
 * 公开表单 - 新增数据（免认证）
 */
const addData = async (req, res) => {
    try {
        const { hash } = req.params;
        const { data } = req.body;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash }
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 验证请求参数
        if (!data || typeof data !== 'object') {
            return res.status(400).json({
                success: false,
                message: '必须提供有效的新增数据'
            });
        }

        // 获取动态表模型
        const DynamicModel = getDynamicModel(hash, mapping.columnDefinitions);

        // 执行新增操作
        const newRecord = await DynamicModel.create(data);

        // 记录操作日志（使用二维码填写用户信息）
        const clientInfo = OperationLogger.extractClientInfo(req);

        await OperationLogger.logCreate({
            tableName: mapping.tableName,
            tableHash: hash,
            recordId: newRecord.id,
            oldData: null,
            newData: newRecord.toJSON(),
            description: `公开表单新增记录 #${newRecord.id}`,
            user: {
                id: 0,  // 使用0作为二维码填写用户的ID
                username: 'qrcode_user',
                displayName: '二维码填写'
            },
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        });

        res.json({
            success: true,
            message: '数据提交成功',
            data: newRecord
        });

    } catch (error) {
        console.error('公开表单新增数据错误:', error);
        res.status(500).json({
            success: false,
            message: `数据提交失败: ${error.message}`
        });
    }
};

/**
 * 公开表单 - 获取表结构信息（免认证）
 */
const getTableStructure = async (req, res) => {
    try {
        const { hash } = req.params;

        // 验证哈希值
        if (!validateHash(hash)) {
            return res.status(400).json({
                success: false,
                message: '无效的哈希值格式'
            });
        }

        // 检查映射关系是否存在
        const mapping = await TableMapping.findOne({
            where: { hashValue: hash },
            attributes: ['id', 'tableName', 'hashValue', 'columnDefinitions']
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的数据表'
            });
        }

        // 解析columnDefinitions
        let columnDefinitions = [];
        if (mapping.columnDefinitions) {
            if (typeof mapping.columnDefinitions === 'string') {
                try {
                    columnDefinitions = JSON.parse(mapping.columnDefinitions);
                } catch (error) {
                    console.error('解析columnDefinitions失败:', error);
                    columnDefinitions = [];
                }
            } else {
                columnDefinitions = mapping.columnDefinitions;
            }
        }

        res.json({
            success: true,
            data: {
                columns: columnDefinitions,
                tableName: mapping.tableName
            }
        });

    } catch (error) {
        console.error('获取公开表单表结构失败:', error);
        res.status(500).json({
            success: false,
            message: '获取表结构失败',
            error: error.message
        });
    }
};

/**
 * 获取表单定义（免认证）
 */
const getFormDefinition = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await FormDefinition.findOne({
      where: { formId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    res.json({
      success: true,
      data: form
    });

  } catch (error) {
    console.error('获取表单定义失败:', error);
    res.status(500).json({
      success: false,
      message: '获取表单定义失败',
      error: error.message
    });
  }
};

/**
 * 提交表单数据（免认证，带Hook处理）
 */
const submitFormData = async (req, res) => {
  try {
    const { formId } = req.params;
    const { data } = req.body;

    // 验证请求参数
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: '必须提供有效的表单数据'
      });
    }

    // 获取表单定义
    const form = await FormDefinition.findOne({
      where: { formId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    let processedData = { ...data };
    let submissionStatus = 'success';
    let errorMessage = null;

    try {
      // 执行beforeSubmit Hook
      processedData = await hookEngine.executeHooks(formId, processedData, 'beforeSubmit');

        // 如果表单关联了数据表，则保存数据
        if (form.tableMapping) {
          const mapping = await TableMapping.findOne({
            where: { hashValue: form.tableMapping }
          });

          if (mapping) {
            // 获取动态表模型，传递实际表名
            const DynamicModel = getDynamicModel(form.tableMapping, mapping.columnDefinitions, mapping.tableName);

            // 执行新增操作
            const newRecord = await DynamicModel.create(processedData);

            // 记录操作日志
            const clientInfo = OperationLogger.extractClientInfo(req);
            await OperationLogger.logCreate({
              tableName: mapping.tableName,
              tableHash: form.tableMapping,
              recordId: newRecord.id,
              oldData: null,
              newData: newRecord.toJSON(),
              description: `表单提交新增记录 #${newRecord.id}`,
              user: {
                id: 0,
                username: 'form_user',
                displayName: '表单填写'
              },
              ipAddress: clientInfo.ipAddress,
              userAgent: clientInfo.userAgent
            });

            processedData = { ...processedData, recordId: newRecord.id };
          }
        }

      // 执行afterSubmit Hook
      await hookEngine.executeHooks(formId, processedData, 'afterSubmit');

    } catch (error) {
      console.error('表单提交处理失败:', error);
      submissionStatus = 'error';
      errorMessage = error.message;

      // 执行onError Hook
      try {
        await hookEngine.executeHooks(formId, processedData, 'onError');
      } catch (hookError) {
        console.error('onError Hook执行失败:', hookError);
      }
    }

    // 记录表单提交
    await hookEngine.recordSubmission(
      formId,
      data,
      processedData,
      submissionStatus,
      errorMessage
    );

    if (submissionStatus === 'error') {
      return res.status(500).json({
        success: false,
        message: `表单提交失败: ${errorMessage}`
      });
    }

    res.json({
      success: true,
      message: '表单提交成功',
      data: processedData
    });

  } catch (error) {
    console.error('表单提交失败:', error);
    res.status(500).json({
      success: false,
      message: `表单提交失败: ${error.message}`
    });
  }
};

module.exports = {
    addData,
    getTableStructure,
    getFormDefinition,
    submitFormData
};
