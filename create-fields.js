#!/usr/bin/env node
/**
 * 自动创建飞书多维表格字段
 * 为微信读书同步创建必要的表格字段
 */

const { BaseClient } = require('@lark-base-open/node-sdk');
require('dotenv').config();

// 定义需要创建的字段
const REQUIRED_FIELDS = [
  {
    field_name: '书名',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: '作者',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: '译者',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: 'ISBN',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: '分类',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: '阅读状态',
    type: 3, // 单选
    property: {
      options: [
        { name: '未开始', color: 0 },
        { name: '阅读中', color: 1 },
        { name: '已完成', color: 2 }
      ]
    }
  },
  {
    field_name: '阅读时长',
    type: 2, // 数字
    property: {
      formatter: '0'
    }
  },
  {
    field_name: '笔记数量',
    type: 2, // 数字
    property: {
      formatter: '0'
    }
  },
  {
    field_name: '划线内容',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: '想法内容',
    type: 1, // 多行文本
    property: {}
  },
  {
    field_name: '出版时间',
    type: 5, // 日期
    property: {
      date_formatter: 'yyyy/MM/dd',
      auto_fill: false
    }
  },
  {
    field_name: '最后同步时间',
    type: 5, // 日期
    property: {
      date_formatter: 'yyyy/MM/dd HH:mm',
      auto_fill: false
    }
  }
];

/**
 * 解析飞书多维表格链接
 */
function parseBitableUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const baseIndex = pathParts.indexOf('base');
    
    if (baseIndex === -1 || baseIndex + 1 >= pathParts.length) {
      throw new Error('无效的多维表格链接：找不到base路径');
    }
    
    const appToken = pathParts[baseIndex + 1];
    const tableId = urlObj.searchParams.get('table');
    
    if (!appToken) {
      throw new Error('无效的多维表格链接：无法提取appToken');
    }
    
    if (!tableId) {
      throw new Error('无效的多维表格链接：无法提取tableId');
    }
    
    return { appToken, tableId };
  } catch (error) {
    throw new Error(`解析多维表格链接失败: ${error.message}`);
  }
}

/**
 * 验证同步参数
 */
function validateSyncParams(params) {
  const errors = [];
  const { bitable_url, personal_base_token, weread_cookie } = params;
  
  if (!bitable_url || typeof bitable_url !== 'string') {
    errors.push('缺少必要参数: bitable_url');
  }
  
  if (!personal_base_token || typeof personal_base_token !== 'string') {
    errors.push('缺少必要参数: personal_base_token');
  }
  
  if (!weread_cookie || typeof weread_cookie !== 'string') {
    errors.push('缺少必要参数: weread_cookie');
  }
  
  // 验证Cookie格式
  if (weread_cookie && (!weread_cookie.includes('wr_vid') || !weread_cookie.includes('wr_skey'))) {
    errors.push('微信读书Cookie格式不正确，必须包含wr_vid和wr_skey');
  }
  
  // 验证多维表格链接格式
  if (bitable_url && !bitable_url.includes('feishu.cn/base/') && !bitable_url.includes('larksuite.com/base/')) {
    errors.push('无效的飞书多维表格链接格式');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('=== 开始创建飞书多维表格字段 ===');
    console.log(`执行时间: ${new Date().toISOString()}`);

    // 从环境变量获取参数
    const syncParams = {
      bitable_url: process.env.BITABLE_URL || '',
      personal_base_token: process.env.PERSONAL_BASE_TOKEN || '',
      weread_cookie: process.env.WEREAD_COOKIE || ''
    };

    console.log('验证同步参数...');
    
    // 验证参数
    const validation = validateSyncParams(syncParams);
    if (!validation.isValid) {
      console.error('参数验证失败:');
      validation.errors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    }
    console.log('参数验证通过');

    // 解析飞书多维表格URL
    console.log('解析飞书多维表格URL...');
    const urlParts = parseBitableUrl(syncParams.bitable_url);
    console.log(`App Token: ${urlParts.appToken}`);
    console.log(`Table ID: ${urlParts.tableId}`);

    // 创建飞书客户端
    const client = new BaseClient({
      appToken: urlParts.appToken,
      personalBaseToken: syncParams.personal_base_token
    });

    console.log('\n测试飞书多维表格连接...');
    try {
      await client.base.appTableRecord.list({
        path: { table_id: urlParts.tableId },
        params: { page_size: 1 }
      });
      console.log('飞书多维表格连接成功');
    } catch (error) {
      throw new Error('飞书多维表格连接失败');
    }

    // 获取现有字段
    console.log('\n获取现有字段...');
    const fieldsResponse = await client.base.appTableField.list({
      path: { table_id: urlParts.tableId }
    });
    const existingFields = fieldsResponse.data?.items || [];
    const existingFieldNames = existingFields.map(field => field.field_name);
    console.log(`现有字段: ${existingFieldNames.join(', ')}`);

    // 创建缺失的字段
    console.log('\n开始创建缺失的字段...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const field of REQUIRED_FIELDS) {
      if (existingFieldNames.includes(field.field_name)) {
        console.log(`跳过已存在的字段: ${field.field_name}`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`创建字段: ${field.field_name}`);
        await client.base.appTableField.create({
          path: { table_id: urlParts.tableId },
          data: field
        });
        console.log(`✓ 字段 "${field.field_name}" 创建成功`);
        createdCount++;
        
        // 添加延迟，避免API限制
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`✗ 字段 "${field.field_name}" 创建失败: ${error.message}`);
      }
    }

    console.log('\n=== 字段创建完成 ===');
    console.log(`新创建字段: ${createdCount}`);
    console.log(`跳过字段: ${skippedCount}`);
    console.log(`总计字段: ${REQUIRED_FIELDS.length}`);

    // 再次检查字段
    console.log('\n验证字段创建结果...');
    const updatedFieldsResponse = await client.base.appTableField.list({
      path: { table_id: urlParts.tableId }
    });
    const updatedFields = updatedFieldsResponse.data?.items || [];
    const updatedFieldNames = updatedFields.map(field => field.field_name);
    
    const missingFields = REQUIRED_FIELDS
      .map(field => field.field_name)
      .filter(name => !updatedFieldNames.includes(name));
    
    if (missingFields.length === 0) {
      console.log('✓ 所有必需字段已创建完成');
    } else {
      console.log(`⚠ 仍有 ${missingFields.length} 个字段未创建成功:`);
      missingFields.forEach(name => console.log(`  - ${name}`));
    }

    console.log('\n=== 字段设置任务完成 ===');
    
  } catch (error) {
    console.error('\n字段创建过程中发生错误:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\n错误堆栈:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { main };