#!/usr/bin/env ts-node

/**
 * 测试同步功能
 * 验证微信读书API和飞书多维表格连接
 */

import { WeReadClient } from '../api/weread/client';
import { FeishuClient } from '../api/feishu/client';

/**
 * 解析命令行参数
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const params: { [key: string]: string } = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2).replace(/-/g, '_');
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        params[key] = value;
        i++; // 跳过下一个参数，因为它是当前参数的值
      }
    }
  }
  
  return params;
}

async function testSync() {
  try {
    console.log('🔍 开始测试同步功能...');
    
    // 从命令行参数获取配置
    const args = parseCommandLineArgs();
    const wereadCookie = args.weread_cookie;
    const personalBaseToken = args.personal_base_token;
    const bitableUrl = args.bitable_url;
    
    console.log('配置来源: 命令行参数');
    
    if (!wereadCookie || !personalBaseToken || !bitableUrl) {
      throw new Error('缺少必要参数\n\n使用方法:\nts-node src/scripts/test-sync.ts --weread_cookie=your_cookie --personal_base_token=your_token --bitable_url=your_url');
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