#!/usr/bin/env ts-node
/**
 * 测试飞书多维表格连接
 * 用于GitHub Action中验证配置是否正确
 */

import dotenv from 'dotenv';
import { testFeishuConnection, parseBitableUrl, validateSyncParams, createFeishuClient } from '../api/feishu/client';
import { SyncParams } from '../config/types';

// 加载环境变量
dotenv.config();

/**
 * 主函数
 */
async function main() {
  try {
    console.log('=== 测试飞书多维表格连接 ===');
    console.log(`执行时间: ${new Date().toISOString()}`);

    // 从环境变量获取参数
    const syncParams: SyncParams = {
      bitable_url: process.env.BITABLE_URL || '',
      personal_base_token: process.env.PERSONAL_BASE_TOKEN || '',
      weread_cookie: process.env.WEREAD_COOKIE || ''
    };

    console.log('\n1. 验证同步参数...');
    
    // 验证参数
    const validation = validateSyncParams(syncParams);
    if (!validation.isValid) {
      console.error('❌ 参数验证失败:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    console.log('✅ 参数验证通过');

    console.log('\n2. 解析飞书多维表格URL...');
    let urlParts;
    try {
      urlParts = parseBitableUrl(syncParams.bitable_url);
      console.log(`✅ URL解析成功`);
      console.log(`   App Token: ${urlParts.appToken}`);
      console.log(`   Table ID: ${urlParts.tableId}`);
    } catch (error: any) {
      console.error(`❌ URL解析失败: ${error.message}`);
      process.exit(1);
    }

    console.log('\n3. 创建飞书客户端...');
    const client = createFeishuClient({
      appToken: urlParts.appToken,
      tableId: urlParts.tableId,
      personalBaseToken: syncParams.personal_base_token
    });
    console.log('✅ 飞书客户端创建成功');

    console.log('\n4. 测试飞书API连接...');
    const connectionResult = await testFeishuConnection(client, urlParts.tableId);
    
    const result = {
      success: connectionResult,
      tableInfo: connectionResult ? { tableId: urlParts.tableId } : null,
      error: connectionResult ? null : '连接测试失败'
    };

    console.log('\n=== 连接测试结果 ===');
    
    if (result.success) {
      console.log('✅ 飞书多维表格连接测试成功');
      
      if (result.tableInfo) {
        console.log('\n📋 表格信息:');
        console.log(`   表格ID: ${result.tableInfo.tableId}`);
      }
      
    } else {
      console.error('❌ 飞书多维表格连接测试失败');
      if (result.error) {
        console.error(`   错误信息: ${result.error}`);
      }
    }

    // 生成测试报告
    const report = {
      timestamp: new Date().toISOString(),
      success: result.success,
      tableInfo: result.tableInfo || null,
      error: result.error || null
    };

    // 写入测试报告文件
    const fs = require('fs');
    fs.writeFileSync('connection-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 测试报告已保存到 connection-test-report.json');

    console.log('\n=== 连接测试完成 ===');
    
    // 根据结果设置退出码
    process.exit(result.success ? 0 : 1);
    
  } catch (error: any) {
    console.error('\n❌ 连接测试过程中发生错误:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\n错误堆栈:');
      console.error(error.stack);
    }
    
    // 生成错误报告
    const errorReport = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      stack: error.stack
    };
    
    const fs = require('fs');
    fs.writeFileSync('connection-test-report.json', JSON.stringify(errorReport, null, 2));
    
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

export { main };