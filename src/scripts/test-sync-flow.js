#!/usr/bin/env ts-node
"use strict";
/**
 * 测试完整的同步流程
 * 直接调用同步函数，不通过GitHub Action
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
exports.testSyncFlow = testSyncFlow;
const sync_1 = require("../core/sync");
const client_1 = require("../api/feishu/client");
/**
 * 解析命令行参数
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--bitable_url=')) {
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
    }
    return result;
}
function testSyncFlow() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\n=== 测试完整同步流程 ===\n');
        // 从命令行参数获取配置
        const cmdArgs = parseCommandLineArgs();
        const bitable_url = cmdArgs.bitable_url;
        const personal_base_token = cmdArgs.personal_base_token;
        const weread_cookie = cmdArgs.weread_cookie;
        
        console.log('配置来源: 命令行参数');
        console.log(`飞书多维表格URL: ${bitable_url ? '已提供' : '未提供'}`);
        console.log(`个人基础令牌: ${personal_base_token ? '已提供' : '未提供'}`);
        console.log(`微信读书Cookie: ${weread_cookie ? '已提供' : '未提供'}`);
        
        if (!bitable_url || !personal_base_token || !weread_cookie) {
            console.error('❌ 缺少必要的参数:');
            console.error('- bitable_url:', !!bitable_url);
            console.error('- personal_base_token:', !!personal_base_token);
            console.error('- weread_cookie:', !!weread_cookie);
            console.error('\n请使用以下格式提供参数:');
            console.error('node src/scripts/test-sync-flow.js --bitable_url <URL> --personal_base_token <TOKEN> --weread_cookie <COOKIE>');
            process.exit(1);
        }
        const syncParams = {
            bitable_url,
            personal_base_token,
            weread_cookie
        };
        try {
            // 1. 验证参数
            console.log('1. 验证同步参数...');
            const validation = (0, client_1.validateSyncParams)(syncParams);
            if (!validation.isValid) {
                console.error('❌ 参数验证失败:', validation.errors.join(', '));
                process.exit(1);
            }
            console.log('✅ 参数验证通过');
            // 2. 解析飞书多维表格URL
            console.log('\n2. 解析飞书多维表格URL...');
            const urlParts = (0, client_1.parseBitableUrl)(bitable_url);
            console.log(`✅ URL解析成功:`);
            console.log(`   App Token: ${urlParts.appToken}`);
            console.log(`   Table ID: ${urlParts.tableId}`);
            // 3. 构建飞书配置
            const feishuConfig = {
                appToken: urlParts.appToken,
                tableId: urlParts.tableId,
                personalBaseToken: personal_base_token
            };
            // 4. 测试获取书籍列表（模拟）
            console.log('\n3. 获取测试书籍列表...');
            // 使用一些测试书籍ID，实际应用中应该从微信读书API获取
            const testBookIds = ['3300028517', '3300028518', '3300028519']; // 示例书籍ID
            console.log(`找到 ${testBookIds.length} 本测试书籍`);
            // 5. 测试批量同步（限制数量）
            console.log('\n4. 测试批量同步...');
            const batchResult = yield (0, sync_1.batchSyncBooksToFeishu)(feishuConfig, weread_cookie, testBookIds.slice(0, 2), // 只测试前2本
            true // 增量同步
            );
            console.log('\n📊 批量同步结果:');
            console.log(`- 成功: ${batchResult.success}`);
            console.log(`- 失败: ${batchResult.failed}`);
            console.log(`- 总计: ${batchResult.results.length}`);
            batchResult.results.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.success ? '✅' : '❌'} ${result.message}`);
            });
            // 6. 测试单本书籍同步
            if (testBookIds.length > 0) {
                const testBookId = testBookIds[0];
                console.log(`\n5. 测试单本书籍同步 (书籍ID: ${testBookId})...`);
                const singleResult = yield (0, sync_1.syncSingleBookToFeishu)(feishuConfig, weread_cookie, testBookId, true // 增量同步
                );
                console.log('\n📖 单本书籍同步结果:');
                console.log(`- 成功: ${singleResult ? '✅' : '❌'}`);
                console.log(`- 书籍ID: ${testBookId}`);
            }
            console.log('\n✅ 同步流程测试完成!');
        }
        catch (error) {
            console.error('\n❌ 测试过程中发生错误:', error.message);
            if (error.stack) {
                console.error('错误堆栈:', error.stack);
            }
            process.exit(1);
        }
    });
}
// 运行测试
if (require.main === module) {
    testSyncFlow().catch(console.error);
}
