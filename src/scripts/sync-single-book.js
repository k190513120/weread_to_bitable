#!/usr/bin/env ts-node
"use strict";
/**
 * 同步单本书籍到飞书多维表格
 * 用于GitHub Action中的单本书籍同步任务
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const sync_1 = require("../core/sync");
const client_1 = require("../api/feishu/client");
/**
 * 解析命令行参数
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const params = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.substring(2).replace(/-/g, '_');
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                params[key] = value;
                i++; // 跳过下一个参数，因为它是当前参数的值
            }
            else if (arg === '--full-sync') {
                params.full_sync = true;
            }
        }
    }
    return params;
}
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('=== 开始同步单本书籍到飞书多维表格 ===');
            console.log(`执行时间: ${new Date().toISOString()}`);
            // 解析命令行参数
            const cmdArgs = parseCommandLineArgs();
            // 强制要求所有参数都通过命令行传递
            const syncParams = {
                bitable_url: cmdArgs.bitable_url || '',
                personal_base_token: cmdArgs.personal_base_token || '',
                weread_cookie: cmdArgs.weread_cookie || '',
                book_id: cmdArgs.book_id || ''
            };
            console.log('配置来源: 全部通过API接口传递（命令行参数）');
            console.log('验证同步参数...');
            // 验证参数
            const validation = (0, client_1.validateSyncParams)(syncParams);
            if (!validation.isValid) {
                console.error('参数验证失败:');
                validation.errors.forEach(error => console.error(`- ${error}`));
                process.exit(1);
            }
            console.log('参数验证通过');
            // 检查书籍ID
            if (!syncParams.book_id) {
                console.error('错误: 单本书籍同步需要提供书籍ID');
                console.error('使用方法: npm run sync:single -- --book-id <BOOK_ID>');
                process.exit(1);
            }
            console.log(`目标书籍ID: ${syncParams.book_id}`);
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
            // 执行单本书籍同步
            console.log('\n开始执行单本书籍同步...');
            const success = yield (0, sync_1.syncSingleBookToFeishu)(feishuConfig, syncParams.weread_cookie, syncParams.book_id, !cmdArgs.full_sync // 如果指定了--full-sync，则使用全量同步(false)，否则使用增量同步(true)
            );
            // 输出同步结果
            console.log('\n=== 同步结果 ===');
            console.log(`同步状态: ${success ? '成功' : '失败'}`);
            console.log(`书籍ID: ${syncParams.book_id}`);
            // 生成同步报告
            const report = {
                timestamp: new Date().toISOString(),
                success: success,
                bookId: syncParams.book_id
            };
            // 写入同步报告文件
            const fs = require('fs');
            fs.writeFileSync('sync-report.json', JSON.stringify(report, null, 2));
            console.log('\n同步报告已保存到 sync-report.json');
            console.log('\n=== 单本书籍同步任务完成 ===');
            // 根据结果设置退出码
            process.exit(success ? 0 : 1);
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
                bookId: parseCommandLineArgs().book_id,
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
