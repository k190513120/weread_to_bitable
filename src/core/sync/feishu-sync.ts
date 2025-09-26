/**
 * 飞书多维表格同步核心模块
 */

import { BookContentSyncResult, FeishuConfig, FeishuSyncResult } from "../../config/types";
import { saveSyncState } from "../../utils/file";
import {
  getBookHighlightsFormatted,
  getBookThoughtsFormatted,
} from "../formatter";
import { getBookInfo } from "../../api/weread/services";
import { createFeishuSyncService } from "../../api/feishu/services";
import { formatHighlightsForFeishu, formatThoughtsForFeishu } from "../../api/feishu/models";

/**
 * 同步书籍内容（划线和想法）到飞书多维表格
 */
export async function syncBookContentToFeishu(
  feishuConfig: FeishuConfig,
  cookie: string,
  bookId: string,
  bookInfo: any,
  useIncremental: boolean = true
): Promise<BookContentSyncResult> {
  console.log(`\n=== 同步书籍内容到飞书多维表格 ===`);
  console.log(`书籍: ${bookInfo.title}`);
  console.log(`同步模式: ${useIncremental ? "增量" : "全量"}`);

  try {
    // 获取书籍划线数据
    const {
      highlights,
      synckey: highlightsSynckey,
      hasUpdate: hasHighlightUpdate,
    } = await getBookHighlightsFormatted(cookie, bookId, useIncremental);

    // 获取书籍想法数据
    const {
      thoughts,
      synckey: thoughtsSynckey,
      hasUpdate: hasThoughtUpdate,
    } = await getBookThoughtsFormatted(cookie, bookId, useIncremental);

    // 判断是否有更新
    const hasUpdates =
      hasHighlightUpdate || hasThoughtUpdate || !useIncremental;

    if (!hasUpdates) {
      console.log(`《${bookInfo.title}》没有检测到新内容，跳过内容同步`);
      return {
        success: true,
        highlightsSynckey,
        thoughtsSynckey,
        hasUpdate: false,
        highlights: [],
        thoughts: [],
      };
    }

    // 格式化划线和想法内容
    let formattedHighlights = '';
    let formattedThoughts = '';

    if (hasHighlightUpdate && highlights.length > 0) {
      // 将章节化的划线数据转换为平铺数组
      const flatHighlights = highlights.reduce((acc, chapter) => {
        return acc.concat(chapter.highlights.map((h: any) => ({
          ...h,
          chapterTitle: chapter.chapterTitle
        })));
      }, []);
      
      formattedHighlights = formatHighlightsForFeishu(flatHighlights);
      console.log(`处理划线数据（共 ${flatHighlights.length} 条）`);
    }

    if (hasThoughtUpdate && thoughts.length > 0) {
      formattedThoughts = formatThoughtsForFeishu(thoughts);
      console.log(`处理想法数据（共 ${thoughts.length} 条）`);
    }

    // 创建飞书同步服务
    const feishuService = createFeishuSyncService(feishuConfig);

    // 同步到飞书多维表格
    const syncResult = await feishuService.writeBookToFeishu(
      bookInfo,
      formattedHighlights,
      formattedThoughts
    );

    if (syncResult.success) {
      console.log(`成功同步书籍《${bookInfo.title}》到飞书多维表格`);
      if (syncResult.updated) {
        console.log('更新了现有记录');
      } else {
        console.log('创建了新记录');
      }
    } else {
      console.error(`同步书籍《${bookInfo.title}》到飞书多维表格失败: ${syncResult.message}`);
    }

    return {
      success: syncResult.success,
      highlightsSynckey,
      thoughtsSynckey,
      hasUpdate: true,
      highlights,
      thoughts,
    };
  } catch (error: any) {
    console.error(`同步书籍内容到飞书多维表格失败:`, error.message);
    return {
      success: false,
      highlightsSynckey: "",
      thoughtsSynckey: "",
      hasUpdate: false,
      highlights: [],
      thoughts: [],
    };
  }
}

/**
 * 同步单本书到飞书多维表格
 */
export async function syncSingleBookToFeishu(
  feishuConfig: FeishuConfig,
  cookie: string,
  bookId: string,
  useIncremental: boolean = true
): Promise<boolean> {
  console.log(
    `\n=== 开始${useIncremental ? "增量" : "全量"}同步书籍到飞书多维表格(ID: ${bookId}) ===`
  );

  try {
    // 获取书籍详细信息
    const bookInfo = await getBookInfo(cookie, bookId);
    if (!bookInfo) {
      console.error(`未能获取到书籍 ${bookId} 的信息`);
      return false;
    }

    console.log(`书籍信息: ${bookInfo.title} - ${bookInfo.author}`);

    // 获取书籍阅读进度数据
    console.log(`获取书籍阅读进度数据...`);
    try {
      const { getBookProgress } = await import('../../api/weread/book-progress');
      console.log('成功导入 getBookProgress 函数');
      const progressData = await getBookProgress(cookie, bookId);
      
      console.log('原始阅读进度数据:', JSON.stringify(progressData, null, 2));
      
      // 将阅读进度数据合并到书籍信息中
      if (progressData && progressData.book) {
        const book = progressData.book;
        bookInfo.progress = book.progress;
        bookInfo.startReadingTime = book.startReadingTime;
        bookInfo.finishTime = book.finishTime;
        bookInfo.readingTime = book.readingTime;
        bookInfo.isStartReading = book.isStartReading;
        console.log(`阅读进度: ${book.progress}%, 开始时间: ${book.startReadingTime ? new Date(book.startReadingTime * 1000).toLocaleDateString() : '未开始'}, 完成时间: ${book.finishTime ? new Date(book.finishTime * 1000).toLocaleDateString() : '未完成'}`);
      } else {
        console.log('未获取到阅读进度数据');
      }
      
      console.log('合并后的书籍信息:', JSON.stringify({
        title: bookInfo.title,
        author: bookInfo.author,
        cover: bookInfo.cover,
        progress: bookInfo.progress,
        startReadingTime: bookInfo.startReadingTime,
        finishTime: bookInfo.finishTime,
        readingTime: bookInfo.readingTime
      }, null, 2));
    } catch (progressError: any) {
      console.error('获取阅读进度数据时出错:', progressError.message);
      console.error('错误堆栈:', progressError.stack);
    }

    // 同步书籍内容到飞书多维表格
    const syncContentResult = await syncBookContentToFeishu(
      feishuConfig,
      cookie,
      bookId,
      bookInfo,
      useIncremental
    );

    // 保存同步状态
    if (useIncremental && syncContentResult.success) {
      const syncState = {
        bookId,
        lastSyncTime: Date.now(),
        highlightsSynckey: syncContentResult.highlightsSynckey,
        thoughtsSynckey: syncContentResult.thoughtsSynckey,
      };
      saveSyncState(syncState);
      console.log(
        `已保存同步状态，highlightsSynckey: ${syncContentResult.highlightsSynckey}, thoughtsSynckey: ${syncContentResult.thoughtsSynckey}`
      );
    }

    if (syncContentResult.success) {
      console.log(`书籍 ${bookId} 同步到飞书多维表格完成`);
    } else {
      console.error(`书籍 ${bookId} 同步到飞书多维表格失败`);
    }

    return syncContentResult.success;
  } catch (error: any) {
    console.error(`同步书籍 ${bookId} 到飞书多维表格失败:`, error.message);
    return false;
  }
}

/**
 * 批量同步书籍到飞书多维表格
 */
export async function batchSyncBooksToFeishu(
  feishuConfig: FeishuConfig,
  cookie: string,
  bookIds: string[],
  useIncremental: boolean = true
): Promise<{ success: number; failed: number; results: FeishuSyncResult[] }> {
  console.log(
    `\n=== 开始批量${useIncremental ? "增量" : "全量"}同步 ${bookIds.length} 本书籍到飞书多维表格 ===`
  );

  const results: FeishuSyncResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  // 创建飞书同步服务
  const feishuService = createFeishuSyncService(feishuConfig);

  // 测试连接
  const connectionTest = await feishuService.testConnection();
  if (!connectionTest) {
    console.error('飞书多维表格连接失败，终止批量同步');
    return {
      success: 0,
      failed: bookIds.length,
      results: bookIds.map(bookId => ({
        success: false,
        message: '飞书多维表格连接失败',
        updated: false
      }))
    };
  }

  // 检查表格字段
  const fieldsCheck = await feishuService.ensureRequiredFields();
  if (!fieldsCheck) {
    console.warn('表格字段检查未通过，但继续执行同步');
  }

  for (let i = 0; i < bookIds.length; i++) {
    const bookId = bookIds[i];
    console.log(`\n[${i + 1}/${bookIds.length}] 同步书籍 ${bookId}`);

    try {
      const success = await syncSingleBookToFeishu(
        feishuConfig,
        cookie,
        bookId,
        useIncremental
      );

      if (success) {
        successCount++;
        results.push({
          success: true,
          message: '同步成功',
          updated: true
        });
      } else {
        failedCount++;
        results.push({
          success: false,
          message: '同步失败',
          updated: false
        });
      }

      // 添加延迟以避免API限流
      if (i < bookIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error: any) {
      console.error(`同步书籍 ${bookId} 时出错:`, error.message);
      failedCount++;
      results.push({
        success: false,
        message: `同步出错: ${error.message}`,
        updated: false
      });
    }
  }

  console.log(`\n=== 批量同步完成 ===`);
  console.log(`成功: ${successCount}/${bookIds.length}`);
  console.log(`失败: ${failedCount}/${bookIds.length}`);

  return {
    success: successCount,
    failed: failedCount,
    results
  };
}

/**
 * 测试飞书多维表格连接
 */
export async function testFeishuConnection(feishuConfig: FeishuConfig): Promise<boolean> {
  try {
    console.log('测试飞书多维表格连接...');
    
    const feishuService = createFeishuSyncService(feishuConfig);
    const result = await feishuService.testConnection();
    
    if (result) {
      console.log('飞书多维表格连接测试成功');
      
      // 检查表格字段
      const fieldsCheck = await feishuService.ensureRequiredFields();
      if (fieldsCheck) {
        console.log('表格字段检查通过');
      } else {
        console.warn('表格字段检查未通过，请确保表格包含所需字段');
      }
    } else {
      console.error('飞书多维表格连接测试失败');
    }
    
    return result;
  } catch (error: any) {
    console.error('测试飞书多维表格连接时出错:', error.message);
    return false;
  }
}