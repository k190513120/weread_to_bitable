#!/usr/bin/env ts-node
"use strict";
/**
 * 测试同步功能
 * 验证微信读书API和飞书多维表格连接
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
exports.testSync = testSync;
const client_1 = require("../api/weread/client");
const client_2 = require("../api/feishu/client");
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
function testSync() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 开始测试同步功能...');
            // 从命令行参数获取配置
            const cmdArgs = parseCommandLineArgs();
            const wereadCookie = cmdArgs.weread_cookie;
            const personalBaseToken = cmdArgs.personal_base_token;
            const bitableUrl = cmdArgs.bitable_url;
            
            console.log('配置来源: 命令行参数');
            console.log(`飞书多维表格URL: ${bitableUrl ? '已提供' : '未提供'}`);
            console.log(`个人基础令牌: ${personalBaseToken ? '已提供' : '未提供'}`);
            console.log(`微信读书Cookie: ${wereadCookie ? '已提供' : '未提供'}`);
            
            if (!wereadCookie || !personalBaseToken || !bitableUrl) {
                console.error('❌ 缺少必要的参数:');
                console.error('- weread_cookie:', !!wereadCookie);
                console.error('- personal_base_token:', !!personalBaseToken);
                console.error('- bitable_url:', !!bitableUrl);
                console.error('\n请使用以下格式提供参数:');
                console.error('node src/scripts/test-sync.js --bitable_url <URL> --personal_base_token <TOKEN> --weread_cookie <COOKIE>');
                throw new Error('缺少必要的参数');
            }
            console.log('✅ 配置加载成功');
            // 测试微信读书连接
            console.log('\n📚 测试微信读书连接...');
            const wereadApi = new client_1.WeReadClient(wereadCookie);
            const books = yield wereadApi.getBookshelf();
            console.log(`✅ 微信读书连接成功，获取到 ${books.length} 本书籍`);
            // 测试飞书连接
            console.log('\n📊 测试飞书多维表格连接...');
            const { parseBitableUrl } = yield Promise.resolve().then(() => __importStar(require('../api/feishu/client')));
            const { appToken, tableId } = parseBitableUrl(bitableUrl);
            const feishuApi = new client_2.FeishuClient({
                appToken,
                tableId,
                personalBaseToken
            });
            const connectionTest = yield feishuApi.testConnection();
            if (connectionTest) {
                console.log('✅ 飞书多维表格连接成功');
            }
            else {
                throw new Error('飞书多维表格连接失败');
            }
            if (books.length > 0) {
                const firstBook = books[0];
                console.log(`📚 示例书籍: ${firstBook.title || firstBook.bookId}`);
            }
            console.log('\n🎉 所有测试通过！同步功能准备就绪。');
        }
        catch (error) {
            console.error('❌ 测试失败:', error);
            process.exit(1);
        }
    });
}
// 如果直接运行此脚本
if (require.main === module) {
    testSync();
}
