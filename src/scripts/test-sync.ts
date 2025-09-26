#!/usr/bin/env ts-node

/**
 * 测试同步功能
 * 验证微信读书API和飞书多维表格连接
 */

import { WeReadAPI } from '../api/weread/WeReadAPI';
import { FeishuAPI } from '../api/feishu/FeishuAPI';
import { loadConfig } from '../config/types';

async function testSync() {
  try {
    console.log('🔍 开始测试同步功能...');
    
    // 加载配置
    const config = loadConfig();
    console.log('✅ 配置加载成功');
    
    // 测试微信读书连接
    console.log('\n📚 测试微信读书连接...');
    const wereadAPI = new WeReadAPI(config.weread.cookie);
    const userInfo = await wereadAPI.getUserInfo();
    console.log(`✅ 微信读书连接成功，用户: ${userInfo.name || '未知用户'}`);
    
    // 测试飞书连接
    console.log('\n📊 测试飞书多维表格连接...');
    const feishuAPI = new FeishuAPI({
      personalBaseToken: config.feishu.personalBaseToken,
      bitableUrl: config.feishu.bitableUrl
    });
    
    const tableInfo = await feishuAPI.getTableInfo();
    console.log(`✅ 飞书多维表格连接成功，表格: ${tableInfo.name || '未知表格'}`);
    
    // 测试获取书籍列表
    console.log('\n📖 测试获取书籍列表...');
    const books = await wereadAPI.getShelfBooks();
    console.log(`✅ 成功获取 ${books.length} 本书籍`);
    
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`📚 示例书籍: ${firstBook.title} - ${firstBook.author}`);
    }
    
    console.log('\n🎉 所有测试通过！同步功能准备就绪。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testSync();
}

export { testSync };