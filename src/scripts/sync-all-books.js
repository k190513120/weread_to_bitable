#!/usr/bin/env ts-node
"use strict";
/**
 * 同步所有书籍到飞书多维表格
 * 用于GitHub Action中的批量同步任务
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const dotenv_1 = __importDefault(require("dotenv"));
const sync_1 = require("../core/sync");
const client_1 = require("../api/feishu/client");
const services_1 = require("../api/weread/services");
// 加载环境变量
dotenv_1.default.config();
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('=== 开始同步所有书籍到飞书多维表格 ===');
            console.log(`执行时间: ${new Date().toISOString()}`);
            // 从环境变量获取参数
            const syncParams = {
                bitable_url: process.env.BITABLE_URL || '',
                personal_base_token: process.env.PERSONAL_BASE_TOKEN || '',
                weread_cookie: process.env.WEREAD_COOKIE || ''
            };
            console.log('验证同步参数...');
            // 验证参数
            const validation = (0, client_1.validateSyncParams)(syncParams);
            if (!validation.isValid) {
                console.error('参数验证失败:');
                validation.errors.forEach(error => console.error(`- ${error}`));
                process.exit(1);
            }
            console.log('参数验证通过');
            // 解析飞书多维表格URL
            console.log('解析飞书多维表格URL...');
            const urlParts = (0, client_1.parseBitableUrl)(syncParams.bitable_url);
            console.log(`App Token: ${urlParts.appToken}`);
            console.log(`Table ID: ${urlParts.tableId}`);
            // 构建飞书配置
            const feishuConfig = {
                appToken: urlParts.appToken,
                tableId: urlParts.tableId,
                personalBaseToken: syncParams.personal_base_token
            };
            // 获取微信读书书籍列表
            console.log('\n获取微信读书书籍列表...');
            const refreshedCookie = yield (0, services_1.refreshSession)(syncParams.weread_cookie);
            // 获取笔记本书籍（有笔记的书籍优先同步）
            const notebookBooks = yield (0, services_1.getNotebookBooks)(refreshedCookie);
            console.log(`获取到 ${notebookBooks.length} 本笔记本书籍`);
            // 获取书架书籍
            const bookshelfBooks = yield (0, services_1.getBookshelfBooks)(refreshedCookie);
            console.log(`获取到 ${bookshelfBooks.length} 本书架书籍`);
            // 合并书籍列表，优先同步有笔记的书籍
            const allBooks = [...notebookBooks, ...bookshelfBooks];
            const uniqueBooks = allBooks.filter((book, index, self) => index === self.findIndex(b => b.bookId === book.bookId));
            console.log(`去重后共有 ${uniqueBooks.length} 本书籍待同步`);
            // 提取书籍ID列表
            const bookIds = uniqueBooks.map(book => book.bookId).filter(Boolean);
            console.log(`有效书籍ID数量: ${bookIds.length}`);
            // 执行批量同步
            console.log('\n开始执行批量同步...');
            const result = yield (0, sync_1.batchSyncBooksToFeishu)(feishuConfig, refreshedCookie, bookIds, true // 使用增量同步
            );
            // 输出同步结果
            console.log('\n=== 同步结果 ===');
            console.log(`成功同步: ${result.success}`);
            console.log(`失败数量: ${result.failed}`);
            console.log(`总计处理: ${result.success + result.failed}`);
            if (result.results && result.results.length > 0) {
                console.log('\n同步详情:');
                result.results.forEach((syncResult, index) => {
                    const status = syncResult.success ? '成功' : '失败';
                    console.log(`${index + 1}. ${status} - ${syncResult.message}`);
                });
            }
            // 生成同步报告
            const report = {
                timestamp: new Date().toISOString(),
                success: result.success > 0,
                totalBooks: result.success + result.failed,
                successCount: result.success,
                failureCount: result.failed,
                results: result.results
            };
            // 写入同步报告文件
            const fs = require('fs');
            fs.writeFileSync('sync-report.json', JSON.stringify(report, null, 2));
            console.log('\n同步报告已保存到 sync-report.json');
            console.log('\n=== 同步任务完成 ===');
            // 根据结果设置退出码
            process.exit(result.success > 0 ? 0 : 1);
        }
        catch (error) {
            console.error('\n同步过程中发生错误:');
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
            fs.writeFileSync('sync-report.json', JSON.stringify(errorReport, null, 2));
            process.exit(1);
        }
    });
}
// 执行主函数
if (require.main === module) {
    main();
}
