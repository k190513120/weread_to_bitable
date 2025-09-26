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
exports.FeishuSyncService = void 0;
exports.createFeishuSyncService = createFeishuSyncService;
const client_1 = require("./client");
const models_1 = require("./models");
/**
 * 飞书多维表格同步服务类
 */
class FeishuSyncService {
    constructor(config) {
        this.config = config;
        this.client = (0, client_1.createFeishuClient)(config);
        this.tableId = config.tableId;
    }
    /**
     * 检查书籍是否已存在于飞书多维表格中
     * @param bookTitle 书名
     * @param author 作者
     * @returns 存在的记录ID，不存在返回null
     */
    checkBookExistsInFeishu(bookTitle, author) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log(`检查书籍是否存在: ${bookTitle} - ${author}`);
                // 查询记录
                const response = yield this.client.base.appTableRecord.list({
                    path: { table_id: this.tableId },
                    params: {
                        filter: `AND(FIND("${bookTitle}", {书名}) > 0, FIND("${author}", {作者}) > 0)`,
                        page_size: 10
                    }
                });
                const records = ((_a = response.data) === null || _a === void 0 ? void 0 : _a.items) || [];
                if (records && records.length > 0) {
                    console.log(`找到已存在的书籍记录: ${records[0].record_id}`);
                    return records[0].record_id || null;
                }
                console.log('书籍不存在，需要创建新记录');
                return null;
            }
            catch (error) {
                console.error('检查书籍存在性时出错:', error);
                throw error;
            }
        });
    }
    /**
     * 将书籍数据写入飞书多维表格
     * @param book 书籍数据
     * @param highlights 划线内容
     * @param thoughts 想法内容
     * @returns 同步结果
     */
    writeBookToFeishu(book, highlights, thoughts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`开始同步书籍到飞书: ${book.title}`);
                console.log(`书籍详情: 作者=${book.author}, ISBN=${book.isbn}, 分类=${book.category}`);
                // 验证必要字段
                if (!book.title) {
                    throw new Error('书籍标题不能为空');
                }
                // 转换为飞书记录格式
                const feishuRecord = (0, models_1.convertBookToFeishuRecord)(book, highlights, thoughts);
                console.log(`构建的记录数据字段数量: ${Object.keys(feishuRecord.fields).length}`);
                console.log(`划线内容长度: ${highlights ? highlights.length : 0}, 想法内容长度: ${thoughts ? thoughts.length : 0}`);
                // 检查书籍是否已存在
                console.log('检查书籍是否已存在...');
                const existingRecordId = yield this.checkBookExistsInFeishu(book.title || '', book.author || '');
                if (existingRecordId) {
                    console.log(`找到现有记录，ID: ${existingRecordId}，准备更新`);
                    // 更新现有记录
                    return yield this.updateBookRecord(existingRecordId, feishuRecord);
                }
                else {
                    console.log('未找到现有记录，准备创建新记录');
                    // 创建新记录
                    return yield this.createBookRecord(feishuRecord);
                }
            }
            catch (error) {
                console.error('写入书籍到飞书时出错:', error);
                console.error('错误详情:', {
                    message: error.message,
                    code: error.code,
                    status: error.status,
                    stack: error.stack
                });
                let errorMessage = '未知错误';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                return {
                    success: false,
                    message: `同步失败: ${errorMessage}`,
                    updated: false,
                    errorMessage: errorMessage
                };
            }
        });
    }
    /**
     * 创建新的书籍记录
     * @param record 书籍记录
     * @returns 同步结果
     */
    createBookRecord(record) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('正在调用飞书API创建新记录...');
                console.log('请求参数:', {
                    table_id: this.tableId ? `${this.tableId.substring(0, 10)}...` : 'null',
                    fields_count: Object.keys(record.fields).length
                });
                console.log('记录字段:', JSON.stringify(record.fields, null, 2));
                const response = yield this.client.base.appTableRecord.create({
                    path: { table_id: this.tableId },
                    data: {
                        fields: record.fields
                    }
                });
                console.log('飞书API响应:', {
                    success: response.code === 0,
                    code: response.code,
                    msg: response.msg,
                    data: response.data ? 'exists' : 'null'
                });
                console.log('完整API响应:', JSON.stringify(response, null, 2));
                // 检查不同的响应结构
                let recordId = null;
                if ((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.record) === null || _b === void 0 ? void 0 : _b.record_id) {
                    recordId = response.data.record.record_id;
                }
                if (!recordId) {
                    console.error('未找到记录ID，响应结构:', response);
                    const errorMsg = `创建记录失败：未返回记录ID (code: ${response.code}, msg: ${response.msg})`;
                    return {
                        success: false,
                        message: errorMsg,
                        updated: false,
                        errorMessage: errorMsg
                    };
                }
                console.log(`成功创建书籍记录: ${recordId}`);
                return {
                    success: true,
                    message: '成功创建新书籍记录',
                    recordId: recordId,
                    updated: false
                };
            }
            catch (error) {
                console.error('创建书籍记录时出错:', error);
                console.error('错误类型:', typeof error);
                let errorMessage = '创建记录时发生未知错误';
                if (error.response) {
                    console.error('HTTP响应错误:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                    errorMessage = `HTTP错误 ${error.response.status}: ${error.response.statusText}`;
                }
                else if (error instanceof Error) {
                    errorMessage = error.message;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                return {
                    success: false,
                    message: `创建记录失败: ${errorMessage}`,
                    updated: false,
                    errorMessage: errorMessage
                };
            }
        });
    }
    /**
     * 更新现有的书籍记录
     * @param recordId 记录ID
     * @param newRecord 新的记录数据
     * @returns 同步结果
     */
    updateBookRecord(recordId, newRecord) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log(`更新书籍记录: ${recordId}`);
                // 获取现有记录
                const response = yield this.client.base.appTableRecord.get({
                    path: {
                        table_id: this.tableId,
                        record_id: recordId
                    }
                });
                const existingRecord = (_a = response.data) === null || _a === void 0 ? void 0 : _a.record;
                if (!existingRecord) {
                    const errorMsg = '找不到要更新的记录';
                    return {
                        success: false,
                        message: errorMsg,
                        updated: false,
                        errorMessage: errorMsg
                    };
                }
                // 检查是否需要更新
                const existingFeishuRecord = {
                    record_id: recordId,
                    fields: existingRecord.fields
                };
                if (!(0, models_1.shouldUpdateRecord)(existingFeishuRecord, newRecord)) {
                    console.log('记录无需更新');
                    return {
                        success: true,
                        message: '记录无需更新',
                        recordId: recordId,
                        updated: false
                    };
                }
                console.log('正在调用飞书API更新记录...');
                console.log('更新参数:', {
                    record_id: recordId ? `${recordId.substring(0, 10)}...` : 'null',
                    table_id: this.tableId ? `${this.tableId.substring(0, 10)}...` : 'null',
                    fields_count: Object.keys(newRecord.fields).length
                });
                // 执行更新
                const updateResponse = yield this.client.base.appTableRecord.update({
                    path: {
                        table_id: this.tableId,
                        record_id: recordId
                    },
                    data: {
                        fields: newRecord.fields
                    }
                });
                console.log('飞书API更新响应:', {
                    success: updateResponse.code === 0,
                    code: updateResponse.code,
                    msg: updateResponse.msg,
                    data: updateResponse.data ? 'exists' : 'null'
                });
                console.log(`成功更新书籍记录: ${recordId}`);
                return {
                    success: true,
                    message: '成功更新书籍记录',
                    recordId: recordId,
                    updated: true
                };
            }
            catch (error) {
                console.error('更新书籍记录时出错:', error);
                console.error('错误类型:', typeof error);
                let errorMessage = '更新记录时发生未知错误';
                if (error.response) {
                    console.error('HTTP响应错误:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                    errorMessage = `HTTP错误 ${error.response.status}: ${error.response.statusText}`;
                }
                else if (error instanceof Error) {
                    errorMessage = error.message;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                return {
                    success: false,
                    message: `更新记录失败: ${errorMessage}`,
                    updated: false,
                    errorMessage: errorMessage
                };
            }
        });
    }
    /**
     * 批量同步书籍数据
     * @param books 书籍数据数组
     * @param highlightsMap 划线内容映射
     * @param thoughtsMap 想法内容映射
     * @returns 同步结果数组
     */
    batchSyncBooks(books_1) {
        return __awaiter(this, arguments, void 0, function* (books, highlightsMap = new Map(), thoughtsMap = new Map()) {
            const results = [];
            const maxRetries = 3;
            const baseDelay = 500;
            console.log(`开始批量同步 ${books.length} 本书籍`);
            for (let i = 0; i < books.length; i++) {
                const book = books[i];
                let success = false;
                let lastError = null;
                console.log(`[${i + 1}/${books.length}] 处理书籍: ${book.title}`);
                // 重试机制
                for (let retry = 0; retry < maxRetries; retry++) {
                    try {
                        if (retry > 0) {
                            console.log(`第 ${retry + 1} 次重试同步书籍: ${book.title}`);
                            yield this.delay(baseDelay * retry);
                        }
                        const bookId = book.bookId || book.id || '';
                        const highlights = highlightsMap.get(bookId);
                        const thoughts = thoughtsMap.get(bookId);
                        const result = yield this.writeBookToFeishu(book, highlights, thoughts);
                        results.push(result);
                        if (result.success) {
                            success = true;
                            console.log(`书籍 ${book.title} 同步成功`);
                            break;
                        }
                        else {
                            lastError = new Error(result.message || '同步失败');
                            console.warn(`书籍 ${book.title} 同步失败: ${result.message}`);
                        }
                    }
                    catch (error) {
                        console.error(`同步书籍 ${book.title} 时出错 (第${retry + 1}次尝试):`, error.message);
                        lastError = error;
                        // 检查是否是API限流错误
                        if (this.isRateLimitError(error)) {
                            console.log('检测到API限流，增加延迟时间');
                            yield this.delay(baseDelay * 3);
                        }
                    }
                }
                // 如果所有重试都失败了，添加失败结果
                if (!success) {
                    const errorMessage = lastError ? lastError.message : '未知错误';
                    console.error(`书籍 ${book.title} 经过 ${maxRetries} 次重试后仍然失败: ${errorMessage}`);
                    results.push({
                        success: false,
                        message: `同步 ${book.title} 失败 (${maxRetries}次重试): ${errorMessage}`,
                        updated: false
                    });
                }
                // 添加延迟以避免API限流
                if (i < books.length - 1) {
                    const delay = success ? baseDelay : baseDelay * 2;
                    yield this.delay(delay);
                }
            }
            const successCount = results.filter(r => r.success).length;
            console.log(`批量同步完成，成功: ${successCount}/${results.length}`);
            if (successCount < results.length) {
                const failedBooks = books.filter((_, index) => { var _a; return !((_a = results[index]) === null || _a === void 0 ? void 0 : _a.success); }).map(b => b.title);
                console.log(`失败的书籍: ${failedBooks.join(', ')}`);
            }
            return results;
        });
    }
    /**
     * 获取表格的所有记录
     * @returns 记录列表
     */
    getAllRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield this.client.base.appTableRecord.list({
                    path: { table_id: this.tableId },
                    params: {
                        page_size: 500
                    }
                });
                return ((_a = response.data) === null || _a === void 0 ? void 0 : _a.items) || [];
            }
            catch (error) {
                console.error('获取所有记录时出错:', error);
                throw error;
            }
        });
    }
    /**
     * 测试飞书连接
     * @returns 连接是否成功
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('测试飞书多维表格连接...');
                // 尝试获取表格信息
                yield this.client.base.appTableRecord.list({
                    path: { table_id: this.tableId },
                    params: {
                        page_size: 1
                    }
                });
                console.log('飞书多维表格连接成功');
                return true;
            }
            catch (error) {
                console.error('飞书多维表格连接失败:', error);
                return false;
            }
        });
    }
    /**
     * 延迟函数
     * @param ms 延迟毫秒数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 检查是否是API限流错误
     * @param error 错误对象
     * @returns 是否是限流错误
     */
    isRateLimitError(error) {
        if (!error)
            return false;
        const message = error.message || '';
        const code = error.code || error.status || 0;
        return (code === 429 ||
            message.includes('rate limit') ||
            message.includes('too many requests') ||
            message.includes('频率限制') ||
            message.includes('请求过于频繁'));
    }
    /**
     * 获取表格字段信息
     * @returns 字段信息
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
                console.error('获取表格字段信息时出错:', error);
                throw error;
            }
        });
    }
    /**
     * 确保表格具有必要的字段
     * @returns 是否成功
     */
    ensureRequiredFields() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('检查表格字段...');
                const fields = yield this.getTableFields();
                const fieldNames = fields.map(f => f.field_name);
                const requiredFields = [
                    { name: '书名', type: 'text' },
                    { name: '作者', type: 'text' },
                    { name: '译者', type: 'text' },
                    { name: 'ISBN', type: 'text' },
                    { name: '分类', type: 'text' },
                    { name: '阅读状态', type: 'single_select' },
                    { name: '阅读时长', type: 'number' },
                    { name: '笔记数量', type: 'number' },
                    { name: '划线内容', type: 'text' },
                    { name: '想法内容', type: 'text' },
                    { name: '出版时间', type: 'datetime' },
                    { name: '最后同步时间', type: 'datetime' }
                ];
                const missingFields = requiredFields.filter(rf => !fieldNames.includes(rf.name));
                if (missingFields.length > 0) {
                    console.log(`缺少字段: ${missingFields.map(f => f.name).join(', ')}`);
                    console.log('请手动在飞书多维表格中添加这些字段');
                    return false;
                }
                console.log('表格字段检查通过');
                return true;
            }
            catch (error) {
                console.error('检查表格字段时出错:', error);
                return false;
            }
        });
    }
}
exports.FeishuSyncService = FeishuSyncService;
/**
 * 创建飞书同步服务实例
 * @param config 飞书配置
 * @returns 飞书同步服务实例
 */
function createFeishuSyncService(config) {
    return new FeishuSyncService(config);
}
