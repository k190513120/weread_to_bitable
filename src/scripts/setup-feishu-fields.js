#!/usr/bin/env ts-node
"use strict";
/**
 * 自动创建飞书多维表格字段
 * 为微信读书同步创建必要的表格字段
 * 使用方法: npx ts-node src/scripts/setup-feishu-fields.ts --bitable_url=<URL> --personal_base_token=<TOKEN> --weread_cookie=<COOKIE>
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
        }
    }
    return {
        bitable_url: params.bitable_url || '',
        personal_base_token: params.personal_base_token || '',
        weread_cookie: params.weread_cookie || ''
    };
}
// 定义需要创建的字段
const REQUIRED_FIELDS = [
    {
        field_name: '书名',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '作者',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '译者',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: 'ISBN',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '分类',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '阅读状态',
        type: 3, // 单选
        property: {
            options: [
                { name: '未开始', color: 0 },
                { name: '阅读中', color: 1 },
                { name: '已完成', color: 2 }
            ]
        }
    },
    {
        field_name: '阅读时长',
        type: 2, // 数字
        property: {
            formatter: '0'
        }
    },
    {
        field_name: '笔记数量',
        type: 2, // 数字
        property: {
            formatter: '0'
        }
    },
    {
        field_name: '划线内容',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '想法内容',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '出版时间',
        type: 5, // 日期
        property: {
            date_formatter: 'yyyy/MM/dd',
            auto_fill: false
        }
    },
    {
        field_name: '最后同步时间',
        type: 5, // 日期
        property: {
            date_formatter: 'yyyy/MM/dd HH:mm',
            auto_fill: false
        }
    },
    {
        field_name: '封面链接',
        type: 1, // 多行文本
        property: {}
    },
    {
        field_name: '开始阅读时间',
        type: 5, // 日期
        property: {
            date_formatter: 'yyyy/MM/dd',
            auto_fill: false
        }
    },
    {
        field_name: '完成阅读时间',
        type: 5, // 日期
        property: {
            date_formatter: 'yyyy/MM/dd',
            auto_fill: false
        }
    },
    {
        field_name: '阅读进度',
        type: 2, // 数字
        property: {
            formatter: '0.00%'
        }
    }
];
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('=== 开始创建飞书多维表格字段 ===');
            console.log(`执行时间: ${new Date().toISOString()}`);
            // 从命令行参数获取参数
            const cmdArgs = parseCommandLineArgs();
            const syncParams = {
                bitable_url: cmdArgs.bitable_url,
                personal_base_token: cmdArgs.personal_base_token,
                weread_cookie: cmdArgs.weread_cookie
            };
            console.log('配置来源: 命令行参数');
            console.log(`飞书多维表格URL: ${syncParams.bitable_url ? '已提供' : '未提供'}`);
            console.log(`个人基础令牌: ${syncParams.personal_base_token ? '已提供' : '未提供'}`);
            console.log(`微信读书Cookie: ${syncParams.weread_cookie ? '已提供' : '未提供'}`);
            console.log('验证同步参数...');
            // 验证参数
            const validation = (0, client_1.validateSyncParams)(syncParams);
            if (!validation.isValid) {
                console.error('参数验证失败:');
                validation.errors.forEach(error => console.error(`- ${error}`));
                console.error('\n请使用以下格式提供参数:');
                console.error('npx ts-node src/scripts/setup-feishu-fields.ts --bitable_url=<URL> --personal_base_token=<TOKEN> --weread_cookie=<COOKIE>');
                process.exit(1);
            }
            console.log('参数验证通过');
            // 解析飞书多维表格URL
            console.log('解析飞书多维表格URL...');
            const urlParts = (0, client_1.parseBitableUrl)(syncParams.bitable_url);
            console.log(`App Token: ${urlParts.appToken}`);
            console.log(`Table ID: ${urlParts.tableId}`);
            // 创建飞书客户端
            const feishuClient = new client_1.FeishuClient({
                appToken: urlParts.appToken,
                tableId: urlParts.tableId,
                personalBaseToken: syncParams.personal_base_token
            });
            console.log('\n测试飞书多维表格连接...');
            const isConnected = yield feishuClient.testConnection();
            if (!isConnected) {
                throw new Error('飞书多维表格连接失败');
            }
            console.log('飞书多维表格连接成功');
            // 获取现有字段
            console.log('\n获取现有字段...');
            const existingFields = yield feishuClient.getTableFields();
            const existingFieldNames = existingFields.map(field => field.field_name);
            console.log(`现有字段: ${existingFieldNames.join(', ')}`);
            // 创建缺失的字段
            console.log('\n开始创建缺失的字段...');
            let createdCount = 0;
            let skippedCount = 0;
            for (const field of REQUIRED_FIELDS) {
                if (existingFieldNames.includes(field.field_name)) {
                    console.log(`跳过已存在的字段: ${field.field_name}`);
                    skippedCount++;
                    continue;
                }
                try {
                    console.log(`创建字段: ${field.field_name}`);
                    yield feishuClient.createField(field);
                    console.log(`✓ 字段 "${field.field_name}" 创建成功`);
                    createdCount++;
                    // 添加延迟，避免API限制
                    yield new Promise(resolve => setTimeout(resolve, 500));
                }
                catch (error) {
                    console.error(`✗ 字段 "${field.field_name}" 创建失败: ${error.message}`);
                }
            }
            console.log('\n=== 字段创建完成 ===');
            console.log(`新创建字段: ${createdCount}`);
            console.log(`跳过字段: ${skippedCount}`);
            console.log(`总计字段: ${REQUIRED_FIELDS.length}`);
            // 再次检查字段
            console.log('\n验证字段创建结果...');
            const updatedFields = yield feishuClient.getTableFields();
            const updatedFieldNames = updatedFields.map(field => field.field_name);
            const missingFields = REQUIRED_FIELDS
                .map(field => field.field_name)
                .filter(name => !updatedFieldNames.includes(name));
            if (missingFields.length === 0) {
                console.log('✓ 所有必需字段已创建完成');
            }
            else {
                console.log(`⚠ 仍有 ${missingFields.length} 个字段未创建成功:`);
                missingFields.forEach(name => console.log(`  - ${name}`));
            }
            console.log('\n=== 字段设置任务完成 ===');
        }
        catch (error) {
            console.error('\n字段创建过程中发生错误:');
            console.error(error.message);
            if (error.stack) {
                console.error('\n错误堆栈:');
                console.error(error.stack);
            }
            process.exit(1);
        }
    });
}
// 执行主函数
if (require.main === module) {
    main();
}
