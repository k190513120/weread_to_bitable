#!/usr/bin/env ts-node

/**
 * 测试同步功能
 * 验证微信读书API和飞书多维表格连接
 */

import { WeReadClient } from '../api/weread/client';
import { FeishuClient } from '../api/feishu/client';

async function testSync() {
  try {
    console.log('🔍 开始测试同步功能...');
    
    // 从环境变量获取配置
    const wereadCookie = process.env.WEREAD_COOKIE;
    const personalBaseToken = process.env.PERSONAL_BASE_TOKEN;
    const bitableUrl = process.env.BITABLE_URL;
    
    if (!wereadCookie || !personalBaseToken || !bitableUrl) {
      throw new Error('缺少必要的环境变量');
    }
    
    console.log('✅ 配置加载成功');
    
    // 测试微信读书连接
    console.log('\n📚 测试微信读书连接...');
    const wereadApi = new WeReadClient(wereadCookie);
    const books = await wereadApi.getBookshelf();
    console.log(`✅ 微信读书连接成功，获取到 ${books.length} 本书籍`);
    
    // 测试飞书连接
    console.log('\n📊 测试飞书多维表格连接...');
    const { parseBitableUrl } = await import('../api/feishu/client');
    const { appToken, tableId } = parseBitableUrl(bitableUrl);
    
    const feishuApi = new FeishuClient({
      appToken,
      tableId,
      personalBaseToken
    });
    
    const connectionTest = await feishuApi.testConnection();
    if (connectionTest) {
      console.log('✅ 飞书多维表格连接成功');
    } else {
      throw new Error('飞书多维表格连接失败');
    }
    
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`📚 示例书籍: ${firstBook.title || firstBook.bookId}`);
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