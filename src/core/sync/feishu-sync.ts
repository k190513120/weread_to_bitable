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

    console.log(`《${bookInfo.title}》检测结果: 划线更新=${hasHighlightUpdate}, 想法更新=${hasThoughtUpdate}, 全量模式=${!useIncremental}`);

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
    } else {
      console.log('没有新的划线数据需要处理');
    }

    if (hasThoughtUpdate && thoughts.length > 0) {
      formattedThoughts = formatThoughtsForFeishu(thoughts);
      console.log(`处理想法数据（共 ${thoughts.length} 条）`);
    } else {
      console.log('没有新的想法数据需要处理');
    }

    // 创建飞书同步服务
    const feishuService = createFeishuSyncService(feishuConfig);

    // 同步到飞书多维表格 - 无论是否有新的划线和想法，都要同步书籍基本信息
    console.log(`开始同步书籍《${bookInfo.title}》到飞书多维表格...`);
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
      
      // 如果没有新的内容更新，但书籍信息同步成功，也算作成功
      if (!hasUpdates) {
        console.log('虽然没有新的划线和想法，但书籍基本信息已成功同步');
      }
    } else {
      console.error(`同步书籍《${bookInfo.title}》到飞书多维表格失败: ${syncResult.message}`);
    }

    return {
      success: syncResult.success,
      highlightsSynckey,
      thoughtsSynckey,
      hasUpdate: hasUpdates, // 反映实际的内容更新情况
      highlights,
      thoughts,
      errorMessage: syncResult.success ? undefined : syncResult.errorMessage || syncResult.message,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`同步书籍内容到飞书多维表格失败:`, error.message);
    return {
      success: false,
      highlightsSynckey: "",
      thoughtsSynckey: "",
      hasUpdate: false,
      highlights: [],
      thoughts: [],
      errorMessage,
    };
  }
}

/**
 * 单本书同步结果
 */
interface SingleBookSyncResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * 同步单本书到飞书多维表格
 */
export async function syncSingleBookToFeishu(
  feishuConfig: FeishuConfig,
  cookie: string,
  bookId: string,
  useIncremental: boolean = true
): Promise<SingleBookSyncResult> {
  console.log(
    `\n=== 开始${useIncremental ? "增量" : "全量"}同步书籍到飞书多维表格(ID: ${bookId}) ===`
  );

  try {
    // 获取书籍详细信息
    const bookInfo = await getBookInfo(cookie, bookId);
    if (!bookInfo) {
      const errorMsg = `未能获取到书籍 ${bookId} 的信息`;
      console.error(errorMsg);
      return { success: false, errorMessage: errorMsg };
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
      const errorMsg = syncContentResult.errorMessage || '未知错误';
      console.error(`书籍 ${bookId} 同步到飞书多维表格失败: ${errorMsg}`);
    }

    return { success: syncContentResult.success, errorMessage: syncContentResult.errorMessage };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`同步书籍 ${bookId} 到飞书多维表格失败:`, errorMsg);
    return { success: false, errorMessage: errorMsg };
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
  const maxRetries = 3;
  const baseDelay = 1000; // 基础延迟1秒

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

    let success = false;
    let lastError: any = null;
    
    // 重试机制
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        if (retry > 0) {
          console.log(`第 ${retry + 1} 次重试同步书籍 ${bookId}`);
          // 重试时增加延迟
          await new Promise(resolve => setTimeout(resolve, baseDelay * retry));
        }

        const syncResult = await syncSingleBookToFeishu(
          feishuConfig,
          cookie,
          bookId,
          useIncremental
        );

        success = syncResult.success;
        if (success) {
          console.log(`书籍 ${bookId} 同步成功`);
          break; // 成功则跳出重试循环
        } else {
          const errorMsg = syncResult.errorMessage || '同步返回失败状态';
          console.warn(`书籍 ${bookId} 同步失败: ${errorMsg}，准备重试`);
          lastError = { message: errorMsg, isFromSyncResult: true };
        }
      } catch (error: any) {
        console.error(`同步书籍 ${bookId} 时出错 (第${retry + 1}次尝试):`, error.message);
        lastError = error;
        
        // 如果是API限流错误，增加更长的延迟
        if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
          console.log('检测到API限流，增加延迟时间');
          await new Promise(resolve => setTimeout(resolve, baseDelay * 3));
        }
      }
    }

    // 记录最终结果
    if (success) {
      successCount++;
      results.push({
        success: true,
        message: '同步成功',
        updated: true
      });
    } else {
      failedCount++;
      let errorMessage = '未知错误';
      let isConnectionError = false;
      
      if (lastError) {
        errorMessage = lastError.message || '未知错误';
        // 检查是否是连接相关的错误
        if (errorMessage.includes('连接') || errorMessage.includes('网络') || 
            errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('HTTP错误')) {
          isConnectionError = true;
        }
      }
      
      console.error(`书籍 ${bookId} 经过 ${maxRetries} 次重试后仍然失败: ${errorMessage}`);
      
      // 根据错误类型设置不同的错误信息
      const finalMessage = isConnectionError ? 
        '飞书多维表格连接失败' : 
        `同步失败: ${errorMessage}`;
      
      results.push({
        success: false,
        message: finalMessage,
        updated: false,
        errorMessage: errorMessage
      });
    }

    // 添加延迟以避免API限流，成功后延迟较短，失败后延迟较长
    if (i < bookIds.length - 1) {
      const delay = success ? baseDelay : baseDelay * 2;
      console.log(`等待 ${delay}ms 后继续下一本书籍...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log(`\n=== 批量同步完成 ===`);
  console.log(`成功: ${successCount}/${bookIds.length}`);
  console.log(`失败: ${failedCount}/${bookIds.length}`);
  
  // 输出失败的书籍ID以便调试
  if (failedCount > 0) {
    const failedBooks = bookIds.filter((_, index) => !results[index]?.success);
    console.log(`失败的书籍ID: ${failedBooks.join(', ')}`);
  }

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