"use strict";
/**
 * 飞书多维表格同步核心模块
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncBookContentToFeishu = syncBookContentToFeishu;
exports.syncSingleBookToFeishu = syncSingleBookToFeishu;
exports.batchSyncBooksToFeishu = batchSyncBooksToFeishu;
exports.testFeishuConnection = testFeishuConnection;
const file_1 = require("../../utils/file");
const formatter_1 = require("../formatter");
const services_1 = require("../../api/weread/services");
const services_2 = require("../../api/feishu/services");
const models_1 = require("../../api/feishu/models");
/**
 * 同步书籍内容（划线和想法）到飞书多维表格
 */
function syncBookContentToFeishu(feishuConfig_1, cookie_1, bookId_1, bookInfo_1) {
    return __awaiter(this, arguments, void 0, function* (feishuConfig, cookie, bookId, bookInfo, useIncremental = true) {
        console.log(`\n=== 同步书籍内容到飞书多维表格 ===`);
        console.log(`书籍: ${bookInfo.title}`);
        console.log(`同步模式: ${useIncremental ? "增量" : "全量"}`);
        try {
            // 获取书籍划线数据
            const { highlights, synckey: highlightsSynckey, hasUpdate: hasHighlightUpdate, } = yield (0, formatter_1.getBookHighlightsFormatted)(cookie, bookId, useIncremental);
            // 获取书籍想法数据
            const { thoughts, synckey: thoughtsSynckey, hasUpdate: hasThoughtUpdate, } = yield (0, formatter_1.getBookThoughtsFormatted)(cookie, bookId, useIncremental);
            // 判断是否有更新
            const hasUpdates = hasHighlightUpdate || hasThoughtUpdate || !useIncremental;
            console.log(`《${bookInfo.title}》检测结果: 划线更新=${hasHighlightUpdate}, 想法更新=${hasThoughtUpdate}, 全量模式=${!useIncremental}`);
            // 格式化划线和想法内容
            let formattedHighlights = '';
            let formattedThoughts = '';
            if (hasHighlightUpdate && highlights.length > 0) {
                // 将章节化的划线数据转换为平铺数组
                const flatHighlights = highlights.reduce((acc, chapter) => {
                    return acc.concat(chapter.highlights.map((h) => (Object.assign(Object.assign({}, h), { chapterTitle: chapter.chapterTitle }))));
                }, []);
                formattedHighlights = (0, models_1.formatHighlightsForFeishu)(flatHighlights);
                console.log(`处理划线数据（共 ${flatHighlights.length} 条）`);
            }
            else {
                console.log('没有新的划线数据需要处理');
            }
            if (hasThoughtUpdate && thoughts.length > 0) {
                formattedThoughts = (0, models_1.formatThoughtsForFeishu)(thoughts);
                console.log(`处理想法数据（共 ${thoughts.length} 条）`);
            }
            else {
                console.log('没有新的想法数据需要处理');
            }
            // 创建飞书同步服务
            const feishuService = (0, services_2.createFeishuSyncService)(feishuConfig);
            // 同步到飞书多维表格 - 无论是否有新的划线和想法，都要同步书籍基本信息
            console.log(`开始同步书籍《${bookInfo.title}》到飞书多维表格...`);
            const syncResult = yield feishuService.writeBookToFeishu(bookInfo, formattedHighlights, formattedThoughts);
            if (syncResult.success) {
                console.log(`成功同步书籍《${bookInfo.title}》到飞书多维表格`);
                if (syncResult.updated) {
                    console.log('更新了现有记录');
                }
                else {
                    console.log('创建了新记录');
                }
                // 如果没有新的内容更新，但书籍信息同步成功，也算作成功
                if (!hasUpdates) {
                    console.log('虽然没有新的划线和想法，但书籍基本信息已成功同步');
                }
            }
            else {
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
        }
        catch (error) {
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
    });
}
/**
 * 同步单本书到飞书多维表格
 */
function syncSingleBookToFeishu(feishuConfig_1, cookie_1, bookId_1) {
    return __awaiter(this, arguments, void 0, function* (feishuConfig, cookie, bookId, useIncremental = true) {
        console.log(`\n=== 开始${useIncremental ? "增量" : "全量"}同步书籍到飞书多维表格(ID: ${bookId}) ===`);
        try {
            // 获取书籍详细信息
            const bookInfo = yield (0, services_1.getBookInfo)(cookie, bookId);
            if (!bookInfo) {
                const errorMsg = `获取书籍信息失败: Request failed with status code 499`;
                console.error(`未能获取到书籍 ${bookId} 的信息`);
                // 对于获取书籍信息失败的情况，我们仍然记录错误但不中断整个批量同步
                // 这样可以确保其他书籍的同步不受影响
                return { success: false, errorMessage: errorMsg };
            }
            console.log(`书籍信息: ${bookInfo.title} - ${bookInfo.author}`);
            // 获取书籍阅读进度数据
            console.log(`获取书籍阅读进度数据...`);
            try {
                const { getBookProgress } = yield Promise.resolve().then(() => __importStar(require('../../api/weread/book-progress')));
                console.log('成功导入 getBookProgress 函数');
                const progressData = yield getBookProgress(cookie, bookId);
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
                }
                else {
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
            }
            catch (progressError) {
                console.error('获取阅读进度数据时出错:', progressError.message);
                console.error('错误堆栈:', progressError.stack);
            }
            // 同步书籍内容到飞书多维表格
            const syncContentResult = yield syncBookContentToFeishu(feishuConfig, cookie, bookId, bookInfo, useIncremental);
            // 保存同步状态
            if (useIncremental && syncContentResult.success) {
                const syncState = {
                    bookId,
                    lastSyncTime: Date.now(),
                    highlightsSynckey: syncContentResult.highlightsSynckey,
                    thoughtsSynckey: syncContentResult.thoughtsSynckey,
                };
                (0, file_1.saveSyncState)(syncState);
                console.log(`已保存同步状态，highlightsSynckey: ${syncContentResult.highlightsSynckey}, thoughtsSynckey: ${syncContentResult.thoughtsSynckey}`);
            }
            if (syncContentResult.success) {
                console.log(`书籍 ${bookId} 同步到飞书多维表格完成`);
            }
            else {
                const errorMsg = syncContentResult.errorMessage || '未知错误';
                console.error(`书籍 ${bookId} 同步到飞书多维表格失败: ${errorMsg}`);
            }
            return { success: syncContentResult.success, errorMessage: syncContentResult.errorMessage };
        }
        catch (error) {
            const errorMsg = error.message || String(error);
            console.error(`同步书籍 ${bookId} 到飞书多维表格失败:`, errorMsg);
            return { success: false, errorMessage: errorMsg };
        }
    });
}
/**
 * 批量同步书籍到飞书多维表格
 */
function batchSyncBooksToFeishu(feishuConfig_1, cookie_1, bookIds_1) {
    return __awaiter(this, arguments, void 0, function* (feishuConfig, cookie, bookIds, useIncremental = true) {
        console.log(`\n=== 开始批量${useIncremental ? "增量" : "全量"}同步 ${bookIds.length} 本书籍到飞书多维表格 ===`);
        const results = [];
        let successCount = 0;
        let failedCount = 0;
        const maxRetries = 3;
        const baseDelay = 1000; // 基础延迟1秒
        // 创建飞书同步服务
        const feishuService = (0, services_2.createFeishuSyncService)(feishuConfig);
        // 测试连接
        const connectionTest = yield feishuService.testConnection();
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
        const fieldsCheck = yield feishuService.ensureRequiredFields();
        if (!fieldsCheck) {
            console.warn('表格字段检查未通过，但继续执行同步');
        }
        for (let i = 0; i < bookIds.length; i++) {
            const bookId = bookIds[i];
            console.log(`\n[${i + 1}/${bookIds.length}] 同步书籍 ${bookId}`);
            let success = false;
            let lastError = null;
            // 重试机制
            for (let retry = 0; retry < maxRetries; retry++) {
                try {
                    if (retry > 0) {
                        console.log(`第 ${retry + 1} 次重试同步书籍 ${bookId}`);
                        // 重试时增加延迟
                        yield new Promise(resolve => setTimeout(resolve, baseDelay * retry));
                    }
                    const syncResult = yield syncSingleBookToFeishu(feishuConfig, cookie, bookId, useIncremental);
                    success = syncResult.success;
                    if (success) {
                        console.log(`书籍 ${bookId} 同步成功`);
                        break; // 成功则跳出重试循环
                    }
                    else {
                        const errorMsg = syncResult.errorMessage || '同步返回失败状态';
                        console.warn(`书籍 ${bookId} 同步失败: ${errorMsg}`);
                        lastError = { message: errorMsg, isFromSyncResult: true };
                        // 对于某些特定错误，不进行重试
                        if (errorMsg.includes('499') || errorMsg.includes('获取书籍信息失败')) {
                            console.log(`书籍 ${bookId} 遇到网络错误(499)，跳过重试直接处理下一本书籍`);
                            break; // 跳出重试循环，直接处理下一本书
                        }
                        // 对于其他错误，根据错误类型决定是否重试
                        if (errorMsg.includes('Invalid URL') || errorMsg.includes('解析多维表格链接失败')) {
                            console.log(`书籍 ${bookId} 遇到配置错误，跳过重试`);
                            break;
                        }
                        if (retry < maxRetries - 1) {
                            console.log(`准备第 ${retry + 2} 次重试`);
                        }
                    }
                }
                catch (error) {
                    console.error(`同步书籍 ${bookId} 时出错 (第${retry + 1}次尝试):`, error.message);
                    lastError = error;
                    // 如果是API限流错误，增加更长的延迟
                    if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
                        const rateLimitDelay = Math.min(baseDelay * Math.pow(2, retry) * 5, 30000); // 最多等待30秒
                        console.log(`检测到API限流，等待 ${rateLimitDelay}ms 后重试`);
                        yield new Promise(resolve => setTimeout(resolve, rateLimitDelay));
                    }
                    // 对于网络连接错误，使用更长的延迟
                    if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('timeout') || error.message.includes('网络'))) {
                        const networkDelay = Math.min(baseDelay * Math.pow(2, retry) * 3, 20000); // 最多等待20秒
                        console.log(`检测到网络错误，等待 ${networkDelay}ms 后重试`);
                        yield new Promise(resolve => setTimeout(resolve, networkDelay));
                    }
                }
            }
            // 记录最终结果
            if (success) {
                successCount++;
                console.log(`✅ [${i + 1}/${bookIds.length}] 书籍 ${bookId} 同步成功`);
                results.push({
                    success: true,
                    message: '同步成功',
                    updated: true
                });
            }
            else {
                failedCount++;
                let errorMessage = '未知错误';
                let isConnectionError = false;
                let errorType = 'unknown';
                if (lastError) {
                    errorMessage = lastError.message || '未知错误';
                    // 检查错误类型
                    if (errorMessage.includes('499') || errorMessage.includes('获取书籍信息失败')) {
                        errorType = 'book_info_failed';
                        isConnectionError = true;
                    }
                    else if (errorMessage.includes('连接') || errorMessage.includes('网络') ||
                        errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED') ||
                        errorMessage.includes('HTTP错误')) {
                        errorType = 'connection_error';
                        isConnectionError = true;
                    }
                    else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                        errorType = 'rate_limit';
                    }
                }
                // 根据错误类型输出不同的日志
                if (errorType === 'book_info_failed') {
                    console.log(`⚠️  [${i + 1}/${bookIds.length}] 书籍 ${bookId} 获取信息失败，跳过同步: ${errorMessage}`);
                }
                else {
                    console.error(`❌ [${i + 1}/${bookIds.length}] 书籍 ${bookId} 经过 ${maxRetries} 次重试后仍然失败: ${errorMessage}`);
                }
                // 根据错误类型设置不同的错误信息
                const finalMessage = isConnectionError ?
                    (errorType === 'book_info_failed' ? '获取书籍信息失败' : '飞书多维表格连接失败') :
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
                yield new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        console.log(`\n=== 批量同步完成 ===`);
        console.log(`成功: ${successCount}/${bookIds.length}`);
        console.log(`失败: ${failedCount}/${bookIds.length}`);
        // 输出失败的书籍ID以便调试
        if (failedCount > 0) {
            const failedBooks = bookIds.filter((_, index) => { var _a; return !((_a = results[index]) === null || _a === void 0 ? void 0 : _a.success); });
            console.log(`失败的书籍ID: ${failedBooks.join(', ')}`);
        }
        return {
            success: successCount,
            failed: failedCount,
            results
        };
    });
}
/**
 * 测试飞书多维表格连接
 */
function testFeishuConnection(feishuConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('测试飞书多维表格连接...');
            const feishuService = (0, services_2.createFeishuSyncService)(feishuConfig);
            const result = yield feishuService.testConnection();
            if (result) {
                console.log('飞书多维表格连接测试成功');
                // 检查表格字段
                const fieldsCheck = yield feishuService.ensureRequiredFields();
                if (fieldsCheck) {
                    console.log('表格字段检查通过');
                }
                else {
                    console.warn('表格字段检查未通过，请确保表格包含所需字段');
                }
            }
            else {
                console.error('飞书多维表格连接测试失败');
            }
            return result;
        }
        catch (error) {
            console.error('测试飞书多维表格连接时出错:', error.message);
            return false;
        }
    });
}
