// 飞书多维表格相关类型定义

export interface FeishuConfig {
  appToken: string;
  tableId: string;
  personalBaseToken: string;
}

export interface SyncParams {
  bitable_url: string;
  personal_base_token: string;
  weread_cookie: string;
  sync_mode?: 'full' | 'incremental';
  book_ids?: string[];
}

export interface BitableUrlParts {
  appToken: string;
  tableId: string;
}

export interface FeishuBookRecord {
  record_id?: string;
  fields: {
    '书名': string;
    '作者': string;
    '译者'?: string;
    'ISBN'?: string;
    '分类'?: string;
    '阅读状态'?: string;
    '阅读时长'?: number;
    '笔记数量'?: number;
    '划线内容'?: string;
    '想法内容'?: string;
    '封面'?: any;
    '出版时间'?: string;
    '最后同步时间'?: string;
  };
}

export interface FeishuApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface CreateRecordResponse {
  record: {
    record_id: string;
    fields: Record<string, any>;
  };
}

export interface UpdateRecordResponse {
  record: {
    record_id: string;
    fields: Record<string, any>;
  };
}

export interface BatchUpdateResponse {
  records: Array<{
    record_id: string;
    fields: Record<string, any>;
  }>;
}

export interface ListRecordsResponse {
  has_more: boolean;
  page_token?: string;
  total: number;
  items: Array<{
    record_id: string;
    fields: Record<string, any>;
    created_by: {
      id: string;
      name: string;
    };
    created_time: number;
    last_modified_by: {
      id: string;
      name: string;
    };
    last_modified_time: number;
  }>;
}

export interface GitHubActionTriggerParams {
  bitable_url: string;
  personal_base_token: string;
  weread_cookie: string;
  sync_mode?: string;
  book_ids?: string[];
}

export interface GitHubActionResponse {
  run_id?: string;
  success: boolean;
  message: string;
}