#!/usr/bin/env ts-node

/**
 * 同步微信读书数据到飞书多维表格
 * 支持全量同步和增量同步
 */

import { WeReadAPI } from '../api/weread/WeReadAPI';
import { FeishuAPI } from '../api/feishu/FeishuAPI';
import { loadConfig } from '../config/types';
import { BookSyncManager } from '../core/sync/BookSyncManager';

interface SyncOptions {
  bookId?: string;
  fullSync?: boolean;
  dryRun?: boolean;
}

async function syncToFeishu(options: SyncOptions = {}) {
  try {
    console.log('🚀 开始同步微信读书到飞书多维表格...');
    
    // 加载配置
    const config = loadConfig();
    console.log('✅ 配置加载成功');
    
    // 初始化API
    const wereadAPI = new WeReadAPI(config.weread.cookie);
    const feishuAPI = new FeishuAPI({
      personalBaseToken: config.feishu.personalBaseToken,
      bitableUrl: config.feishu.bitableUrl
    });
    
    // 初始化同步管理器
    const syncManager = new BookSyncManager(wereadAPI, feishuAPI);
    
    let syncResult;
    
    if (options.bookId) {
      // 同步单本书籍
      console.log(`📚 同步单本书籍: ${options.bookId}`);
      syncResult = await syncManager.syncSingleBook(options.bookId, {
        fullSync: options.fullSync,
        dryRun: options.dryRun
      });
    } else {
      // 同步所有书籍
      console.log('📚 同步所有书籍');
      syncResult = await syncManager.syncAllBooks({
        fullSync: options.fullSync,
        dryRun: options.dryRun
      });
    }
    
    // 输出同步结果
    console.log('\n📊 同步结果:');
    console.log(`✅ 成功同步: ${syncResult.success} 本`);
    console.log(`❌ 同步失败: ${syncResult.failed} 本`);
    console.log(`⏭️  跳过同步: ${syncResult.skipped} 本`);
    
    if (syncResult.errors.length > 0) {
      console.log('\n❌ 同步错误:');
      syncResult.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 生成同步报告
    const report = {
      timestamp: new Date().toISOString(),
      syncMode: options.bookId ? 'single' : 'all',
      bookId: options.bookId,
      fullSync: options.fullSync,
      dryRun: options.dryRun,
      result: syncResult
    };
    
    // 保存同步报告
    const fs = require('fs');
    fs.writeFileSync('sync-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 同步报告已保存到 sync-report.json');
    
    console.log('\n🎉 同步完成！');
    
  } catch (error) {
    console.error('❌ 同步失败:', error);
    
    // 生成错误报告
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    const fs = require('fs');
    fs.writeFileSync('sync-report.json', JSON.stringify(errorReport, null, 2));
    
    process.exit(1);
  }
}

// 解析命令行参数
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--book-id' && i + 1 < args.length) {
      options.bookId = args[i + 1];
      i++;
    } else if (arg === '--full-sync') {
      options.fullSync = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }
  
  return options;
}

// 如果直接运行此脚本
if (require.main === module) {
  const options = parseArgs();
  syncToFeishu(options);
}

export { syncToFeishu };