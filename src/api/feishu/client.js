"use strict";
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
exports.FeishuClient = void 0;
exports.parseBitableUrl = parseBitableUrl;
exports.validateSyncParams = validateSyncParams;
exports.createFeishuClient = createFeishuClient;
exports.testFeishuConnection = testFeishuConnection;
const node_sdk_1 = require("@lark-base-open/node-sdk");
/**
 * 飞书多维表格客户端类
 */
class FeishuClient {
    constructor(config) {
        this.client = new node_sdk_1.BaseClient({
            appToken: config.appToken,
            personalBaseToken: config.personalBaseToken
        });
        this.tableId = config.tableId;
    }
    /**
     * 测试连接
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.base.appTableRecord.list({
                    path: { table_id: this.tableId },
                    params: { page_size: 1 }
                });
                return true;
            }
            catch (error) {
                console.error('飞书连接测试失败:', error);
                return false;
            }
        });
    }
    /**
     * 获取表格字段
     */
    getTableFields() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield this.client.base.appTableField.list({
                    path: { table_id: this.tableId }
                });
                return ((_a = response.data) === null || _a === void 0 ? void 0 : _a.items) || [];
            }
            catch (error) {
                console.error('获取表格字段失败:', error);
                throw error;
            }
        });
    }
    /**
     * 创建字段
     */
    createField(fieldConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.base.appTableField.create({
                    path: { table_id: this.tableId },
                    data: fieldConfig
                });
                return response.data;
            }
            catch (error) {
                console.error('创建字段失败:', error);
                throw error;
            }
        });
    }
    /**
     * 批量添加记录
     */
    batchCreateRecords(records) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.base.appTableRecord.batchCreate({
                    path: { table_id: this.tableId },
                    data: { records }
                });
                return response.data;
            }
            catch (error) {
                console.error('批量创建记录失败:', error);
                throw error;
            }
        });
    }
    /**
     * 获取记录列表
     */
    getRecords() {
        return __awaiter(this, arguments, void 0, function* (pageSize = 100) {
            var _a;
            try {
                const response = yield this.client.base.appTableRecord.list({
                    path: { table_id: this.tableId },
                    params: { page_size: pageSize }
                });
                return ((_a = response.data) === null || _a === void 0 ? void 0 : _a.items) || [];
            }
            catch (error) {
                console.error('获取记录列表失败:', error);
                throw error;
            }
        });
    }
}
exports.FeishuClient = FeishuClient;
/**
 * 解析飞书多维表格链接，提取appToken和tableId
 * @param url 飞书多维表格链接
 * @returns {BitableUrlParts} 包含appToken和tableId的对象
 */
function parseBitableUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const baseIndex = pathParts.indexOf('base');
        if (baseIndex === -1 || baseIndex + 1 >= pathParts.length) {
            throw new Error('无效的多维表格链接：找不到base路径');
        }
        const appToken = pathParts[baseIndex + 1];
        const tableId = urlObj.searchParams.get('table');
        if (!appToken) {
            throw new Error('无效的多维表格链接：无法提取appToken');
        }
        if (!tableId) {
            throw new Error('无效的多维表格链接：无法提取tableId');
        }
        return { appToken, tableId };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`解析多维表格链接失败: ${error.message}`);
        }
        throw new Error('解析多维表格链接失败: 未知错误');
    }
}
/**
 * 验证同步参数
 * @param params 同步参数
 * @returns 验证结果
 */
function validateSyncParams(params) {
    const errors = [];
    const { bitable_url, personal_base_token, weread_cookie } = params;
    if (!bitable_url || typeof bitable_url !== 'string') {
        errors.push('缺少必要参数: bitable_url');
    }
    if (!personal_base_token || typeof personal_base_token !== 'string') {
        errors.push('缺少必要参数: personal_base_token');
    }
    if (!weread_cookie || typeof weread_cookie !== 'string') {
        errors.push('缺少必要参数: weread_cookie');
    }
    // 验证Cookie格式
    if (weread_cookie && (!weread_cookie.includes('wr_vid') || !weread_cookie.includes('wr_skey'))) {
        errors.push('微信读书Cookie格式不正确，必须包含wr_vid和wr_skey');
    }
    // 验证多维表格链接格式
    if (bitable_url && !bitable_url.includes('feishu.cn/base/') && !bitable_url.includes('larksuite.com/base/')) {
        errors.push('无效的飞书多维表格链接格式');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * 创建飞书多维表格客户端
 * @param config 飞书配置
 * @returns BaseClient实例
 */
function createFeishuClient(config) {
    try {
        const client = new node_sdk_1.BaseClient({
            appToken: config.appToken,
            personalBaseToken: config.personalBaseToken
        });
        return client;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`创建飞书客户端失败: ${error.message}`);
        }
        throw new Error('创建飞书客户端失败: 未知错误');
    }
}
/**
 * 测试飞书客户端连接
 * @param client 飞书客户端
 * @param tableId 表格ID
 */
function testFeishuConnection(client, tableId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 尝试获取表格信息来测试连接
            yield client.base.appTableRecord.list({
                path: { table_id: tableId },
                params: {
                    page_size: 1
                }
            });
            return {
                success: true,
                tableInfo: { tableId },
                error: null
            };
        }
        catch (error) {
            console.error('飞书连接测试失败:', error);
            return {
                success: false,
                tableInfo: null,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    });
}
