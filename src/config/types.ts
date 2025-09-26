/**
 * 全局类型定义
 */

/**
 * 读书状态枚举
 */
export enum ReadStatus {
  NO = "未读完",
  YES = "已读完",
}

/**
 * 书籍基础信息接口
 */
export interface Book {
  bookId: string;
  title: string;
  author: string;
  cover?: string;
  category?: string;
  isbn?: string;
  translator?: string;
  publishTime?: string | Date | number;
  finishReading?: boolean;
  readingTime?: number; // 秒
  noteCount?: number;
  [key: string]: any;
}

/**
 * 同步状态接口
 */
export interface SyncState {
  bookId: string;
  lastSyncTime: number;
  highlightsSynckey: string;
  thoughtsSynckey: string;
}

/**
 * 划线数据格式化后返回类型
 */
export interface HighlightsResponse {
  highlights: any[];
  bookInfo: any;
  synckey: string;
  hasUpdate: boolean;
}

/**
 * 想法数据格式化后返回类型
 */
export interface ThoughtsResponse {
  thoughts: any[];
  synckey: string;
  hasUpdate: boolean;
}

/**
 * 书籍内容同步结果类型
 */
export interface BookContentSyncResult {
  success: boolean;
  highlightsSynckey: string;
  thoughtsSynckey: string;
  hasUpdate: boolean;
  highlights: any[];
  thoughts: any[];
  errorMessage?: string; // 新增：错误信息
}

/**
 * Notion内容块类型
 */
export type NotionBlockType = "highlights" | "thoughts";

/**
 * 图书馆配置数据库相关类型
 */
export interface LibraryConfig {
  enabledReadingStatus: string[]; // 启用的阅读状态
  enabledAuthors: string[]; // 启用的作者列表
  syncMode?: "全量" | "增量"; // 新增：同步模式
  organizeByChapter?: "是" | "否"; // 新增：按章节划线
}

/**
 * 配置数据库查询结果
 */
export interface ConfigDatabaseResponse {
  object: string;
  results: ConfigDatabasePage[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * 配置数据库页面
 */
export interface ConfigDatabasePage {
  object: string;
  id: string;
  properties: {
    名称: {
      title: Array<{
        text: {
          content: string;
        };
      }>;
    };
    阅读状态: {
      multi_select: Array<{
        name: string;
      }>;
    };
    作者: {
      multi_select: Array<{
        name: string;
      }>;
    };
    "全量/增量"?: {
      select: { name: string };
    };
    按章节划线?: {
      select: { name: string };
    };
  };
}

/**
 * 飞书多维表格相关类型
 */

/**
 * 飞书多维表格配置
 */
export interface FeishuConfig {
  appToken: string;
  tableId: string;
  personalBaseToken: string;
}

/**
 * 同步参数
 */
export interface SyncParams {
  bitable_url: string;
  personal_base_token: string;
  weread_cookie: string;
  book_id?: string; // 可选，用于同步单本书籍
}

/**
 * 飞书多维表格URL解析结果
 */
export interface BitableUrlParts {
  appToken: string;
  tableId: string;
}

/**
 * 飞书多维表格书籍记录
 */
export interface FeishuBookRecord {
  record_id?: string;
  fields: {
    '书名': string;
    '作者': string;
    '译者'?: string;
    'ISBN'?: string;
    '分类'?: string;
    '阅读状态'?: string;
    '阅读时长'?: number; // 分钟
    '笔记数量'?: number;
    '划线内容'?: string;
    '想法内容'?: string;
    '出版时间'?: number | null; // 时间戳（毫秒）
    '最后同步时间': number; // 时间戳（毫秒）
    '封面链接'?: string; // URL字符串
    '开始阅读时间'?: number | null; // 时间戳（毫秒）
    '完成阅读时间'?: number | null; // 时间戳（毫秒）
    '阅读进度'?: number; // 百分比（0-100）
    [key: string]: any;
  };
}

/**
 * 飞书API响应基础类型
 */
export interface FeishuApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 创建记录响应
 */
export interface CreateRecordResponse {
  record: {
    record_id: string;
    fields: Record<string, any>;
  };
}

/**
 * 更新记录响应
 */
export interface UpdateRecordResponse {
  record: {
    record_id: string;
    fields: Record<string, any>;
  };
}

/**
 * 批量更新响应
 */
export interface BatchUpdateResponse {
  records: Array<{
    record_id: string;
    fields: Record<string, any>;
  }>;
}

/**
 * 查询记录响应
 */
export interface ListRecordsResponse {
  has_more: boolean;
  page_token?: string;
  total: number;
  items: Array<{
    record_id: string;
    fields: Record<string, any>;
  }>;
}

/**
 * GitHub Action触发参数
 */
export interface GitHubActionTriggerParams {
  event_type: string;
  client_payload: SyncParams;
}

/**
 * GitHub Action触发响应
 */
export interface GitHubActionResponse {
  success: boolean;
  message: string;
  run_id?: number;
}

/**
 * 飞书同步结果
 */
export interface FeishuSyncResult {
  success: boolean;
  message: string;
  recordId?: string;
  updated: boolean;
  errorMessage?: string; // 新增：详细错误信息
}
