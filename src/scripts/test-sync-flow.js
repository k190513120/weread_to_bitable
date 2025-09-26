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
const dotenv_1 = __importDefault(require("dotenv"));
const sync_1 = require("../core/sync");
const client_1 = require("../api/feishu/client");
// 加载环境变量
dotenv_1.default.config();
function testSyncFlow() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\n=== 测试完整同步流程 ===\n');
        // 从环境变量获取配置
        const bitable_url = process.env.BITABLE_URL;
        const personal_base_token = process.env.PERSONAL_BASE_TOKEN;
        const weread_cookie = process.env.WEREAD_COOKIE;
        if (!bitable_url || !personal_base_token || !weread_cookie) {
            console.error('❌ 缺少必要的环境变量:');
            console.error('- BITABLE_URL:', !!bitable_url);
            console.error('- PERSONAL_BASE_TOKEN:', !!personal_base_token);
            console.error('- WEREAD_COOKIE:', !!weread_cookie);
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
