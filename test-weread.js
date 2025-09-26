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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const services_1 = require("./src/api/weread/services");
dotenv_1.default.config();
function testWereadConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('测试微信读书连接...');
            const cookie = process.env.WEREAD_COOKIE || '';
            if (!cookie) {
                throw new Error('WEREAD_COOKIE 环境变量未设置');
            }
            // 刷新会话
            const newCookie = yield (0, services_1.refreshSession)(cookie);
            console.log('会话刷新成功');
            // 获取笔记本书籍
            const notebookBooks = yield (0, services_1.getNotebookBooks)(newCookie);
            console.log(`笔记本书籍数量: ${notebookBooks.length}`);
            // 获取书架书籍
            const bookshelfBooks = yield (0, services_1.getBookshelfBooks)(newCookie);
            console.log(`书架书籍数量: ${bookshelfBooks.length}`);
            console.log('微信读书连接测试成功');
            if (notebookBooks.length > 0) {
                console.log('\n前3本笔记本书籍:');
                notebookBooks.slice(0, 3).forEach((book, index) => {
                    console.log(`${index + 1}. ${book.title} - ${book.author}`);
                });
            }
            if (bookshelfBooks.length > 0) {
                console.log('\n前3本书架书籍:');
                bookshelfBooks.slice(0, 3).forEach((book, index) => {
                    console.log(`${index + 1}. ${book.title} - ${book.author}`);
                });
            }
        }
        catch (error) {
            console.error('微信读书连接测试失败:', (error === null || error === void 0 ? void 0 : error.message) || error);
            if (error === null || error === void 0 ? void 0 : error.response) {
                console.error('响应状态:', error.response.status);
                console.error('响应数据:', error.response.data);
            }
        }
    });
}
testWereadConnection();
