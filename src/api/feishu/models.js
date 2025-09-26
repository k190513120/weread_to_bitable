"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBookToFeishuRecord = convertBookToFeishuRecord;
exports.formatDateForFeishu = formatDateForFeishu;
exports.formatDateTimeForFeishu = formatDateTimeForFeishu;
exports.formatHighlightsForFeishu = formatHighlightsForFeishu;
exports.formatThoughtsForFeishu = formatThoughtsForFeishu;
exports.shouldUpdateRecord = shouldUpdateRecord;
/**
 * 将微信读书的书籍数据转换为飞书多维表格记录格式
 * @param book 微信读书书籍数据
 * @param highlights 划线内容
 * @param thoughts 想法内容
 * @returns 飞书多维表格记录
 */
function convertBookToFeishuRecord(book, highlights, thoughts) {
    const record = {
        fields: {
            '书名': book.title || '',
            '作者': book.author || '',
            '译者': book.translator || '',
            'ISBN': book.isbn || '',
            '分类': book.category || '',
            '阅读状态': book.readStatus || '未读',
            '阅读时长': book.readingTime || 0,
            '笔记数量': book.noteCount || 0,
            '划线内容': formatHighlightsForFeishu(highlights || []),
            '想法内容': formatThoughtsForFeishu(thoughts || []),
            '出版时间': formatDateForFeishu(book.publishTime),
            '最后同步时间': formatDateTimeForFeishu(new Date()),
            '封面链接': book.cover || '',
            '开始阅读时间': book.startReadingTime ? formatDateForFeishu(book.startReadingTime * 1000) : null,
            '完成阅读时间': book.finishTime ? formatDateForFeishu(book.finishTime * 1000) : null,
            '阅读总时长': book.readingTime || 0,
            '阅读进度': book.progress || 0
        }
    };
    return record;
}
/**
 * 格式化日期为飞书多维表格的日期格式
 * @param date 日期
 * @returns 格式化后的时间戳（毫秒）
 */
function formatDateForFeishu(date) {
    if (!date) {
        return null;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return null;
    }
    return d.getTime();
}
/**
 * 格式化日期时间为飞书多维表格的日期时间格式
 * @param date 日期时间
 * @returns 格式化后的时间戳（毫秒）
 */
function formatDateTimeForFeishu(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return Date.now();
    }
    return d.getTime();
}
/**
 * 格式化划线内容为飞书格式
 * @param highlights 划线内容数组
 * @returns 格式化后的字符串
 */
function formatHighlightsForFeishu(highlights) {
    if (!highlights) {
        return '';
    }
    if (typeof highlights === 'string') {
        return highlights;
    }
    if (highlights.length === 0) {
        return '';
    }
    return highlights
        .map((highlight, index) => {
        const content = highlight.markText || highlight.content || '';
        const chapterTitle = highlight.chapterTitle || '';
        const createTime = highlight.createTime ?
            new Date(highlight.createTime * 1000).toLocaleString('zh-CN') : '';
        return `${index + 1}. ${content}${chapterTitle ? ` (${chapterTitle})` : ''}${createTime ? ` - ${createTime}` : ''}`;
    })
        .join('\n\n');
}
/**
 * 格式化想法内容为飞书格式
 * @param thoughts 想法内容数组
 * @returns 格式化后的字符串
 */
function formatThoughtsForFeishu(thoughts) {
    if (!thoughts) {
        return '';
    }
    if (typeof thoughts === 'string') {
        return thoughts;
    }
    if (thoughts.length === 0) {
        return '';
    }
    return thoughts
        .map((thought, index) => {
        const content = thought.content || thought.abstract || '';
        const chapterTitle = thought.chapterTitle || '';
        const createTime = thought.createTime ?
            new Date(thought.createTime * 1000).toLocaleString('zh-CN') : '';
        return `${index + 1}. ${content}${chapterTitle ? ` (${chapterTitle})` : ''}${createTime ? ` - ${createTime}` : ''}`;
    })
        .join('\n\n');
}
/**
 * 检查两个记录是否需要更新
 * @param existingRecord 现有记录
 * @param newRecord 新记录
 * @returns 是否需要更新
 */
function shouldUpdateRecord(existingRecord, newRecord) {
    // 检查必填字段
    const requiredFields = ['书名', '作者'];
    for (const field of requiredFields) {
        if (!existingRecord.fields[field] || !newRecord.fields[field]) {
            return true; // 如果任一记录缺少必填字段，需要更新
        }
    }
    const fieldsToCompare = ['划线内容', '想法内容', '笔记数量', '阅读状态', '阅读时长', '开始阅读时间', '完成阅读时间', '阅读总时长', '阅读进度'];
    for (const field of fieldsToCompare) {
        const existingValue = existingRecord.fields[field];
        const newValue = newRecord.fields[field];
        if (existingValue !== newValue) {
            return true;
        }
    }
    // 特殊处理封面链接字段（对象格式）
    const existingCover = existingRecord.fields['封面链接'];
    const newCover = newRecord.fields['封面链接'];
    if (JSON.stringify(existingCover) !== JSON.stringify(newCover)) {
        return true;
    }
    return false;
}
