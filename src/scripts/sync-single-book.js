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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const sync_1 = require("../core/sync");
const client_1 = require("../api/feishu/client");
/**
 * 解析命令行参数
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--book-id=')) {
            result.bookId = arg.split('=')[1];
        }
        else if (arg === '--book-id' && i + 1 < args.length) {
            result.bookId = args[i + 1];
            i++;
        }
        else if (arg.startsWith('--bitable_url=')) {
            result.bitable_url = arg.split('=')[1];
        }
        else if (arg === '--bitable_url' && i + 1 < args.length) {
            result.bitable_url = args[i + 1];
            i++;
        }
        else if (arg.startsWith('--personal_base_token=')) {
            result.personal_base_token = arg.split('=')[1];
        }
        else if (arg === '--personal_base_token' && i + 1 < args.length) {
            result.personal_base_token = args[i + 1];
            i++;
        }
        else if (arg.startsWith('--weread_cookie=')) {
            result.weread_cookie = arg.split('=')[1];
        }
        else if (arg === '--weread_cookie' && i + 1 < args.length) {
            result.weread_cookie = args[i + 1];
            i++;
        }
        else if (arg === '--full-sync') {
            result.fullSync = true;
        }
    }
    return result;
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
            const cmdArgs = parseArgs();
            // 从命令行参数获取参数
            const syncParams = {
                bitable_url: cmdArgs.bitable_url || '',
                personal_base_token: cmdArgs.personal_base_token || '',
                weread_cookie: cmdArgs.weread_cookie || '',
                book_id: cmdArgs.bookId || ''
            };
            
            console.log('配置来源: 命令行参数');
            console.log(`飞书多维表格URL: ${syncParams.bitable_url ? '已提供' : '未提供'}`);
            console.log(`个人基础令牌: ${syncParams.personal_base_token ? '已提供' : '未提供'}`);
            console.log(`微信读书Cookie: ${syncParams.weread_cookie ? '已提供' : '未提供'}`);
            console.log(`书籍ID: ${syncParams.book_id ? '已提供' : '未提供'}`);
            console.log('验证同步参数...');
            // 验证参数
            const validation = (0, client_1.validateSyncParams)(syncParams);
            if (!validation.isValid) {
                console.error('参数验证失败:');
                validation.errors.forEach(error => console.error(`- ${error}`));
                console.error('\n请使用以下格式提供参数:');
                console.error('node src/scripts/sync-single-book.js --bitable_url <URL> --personal_base_token <TOKEN> --weread_cookie <COOKIE> --book-id <BOOK_ID>');
                process.exit(1);
            }
            console.log('参数验证通过');
            // 检查书籍ID
            if (!syncParams.book_id) {
                console.error('错误: 单本书籍同步需要提供书籍ID');
                console.error('使用方法: node src/scripts/sync-single-book.js --bitable_url <URL> --personal_base_token <TOKEN> --weread_cookie <COOKIE> --book-id <BOOK_ID>');
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
            const success = yield (0, sync_1.syncSingleBookToFeishu)(feishuConfig, syncParams.weread_cookie, syncParams.book_id, !cmdArgs.fullSync // 如果指定了--full-sync，则使用全量同步(false)，否则使用增量同步(true)
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
                bookId: parseArgs().bookId || '',
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
