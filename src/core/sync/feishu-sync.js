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
                    return acc.concat(chapter.highlights.map((h) => (Object.assign(Object.assign({}, h), { chapterTitle: chapter.chapterTitle }))));
                }, []);
                formattedHighlights = (0, models_1.formatHighlightsForFeishu)(flatHighlights);
                console.log(`处理划线数据（共 ${flatHighlights.length} 条）`);
            }
            if (hasThoughtUpdate && thoughts.length > 0) {
                formattedThoughts = (0, models_1.formatThoughtsForFeishu)(thoughts);
                console.log(`处理想法数据（共 ${thoughts.length} 条）`);
            }
            // 创建飞书同步服务
            const feishuService = (0, services_2.createFeishuSyncService)(feishuConfig);
            // 同步到飞书多维表格
            const syncResult = yield feishuService.writeBookToFeishu(bookInfo, formattedHighlights, formattedThoughts);
            if (syncResult.success) {
                console.log(`成功同步书籍《${bookInfo.title}》到飞书多维表格`);
                if (syncResult.updated) {
                    console.log('更新了现有记录');
                }
                else {
                    console.log('创建了新记录');
                }
            }
            else {
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
        }
        catch (error) {
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
                console.error(`未能获取到书籍 ${bookId} 的信息`);
                return false;
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
                console.error(`书籍 ${bookId} 同步到飞书多维表格失败`);
            }
            return syncContentResult.success;
        }
        catch (error) {
            console.error(`同步书籍 ${bookId} 到飞书多维表格失败:`, error.message);
            return false;
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
            try {
                const success = yield syncSingleBookToFeishu(feishuConfig, cookie, bookId, useIncremental);
                if (success) {
                    successCount++;
                    results.push({
                        success: true,
                        message: '同步成功',
                        updated: true
                    });
                }
                else {
                    failedCount++;
                    results.push({
                        success: false,
                        message: '同步失败',
                        updated: false
                    });
                }
                // 添加延迟以避免API限流
                if (i < bookIds.length - 1) {
                    yield new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            catch (error) {
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
