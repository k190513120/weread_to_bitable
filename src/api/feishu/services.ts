import { BaseClient } from '@lark-base-open/node-sdk';
import { createFeishuClient } from './client';
import {
  FeishuConfig,
  FeishuBookRecord,
  FeishuSyncResult,
  CreateRecordResponse,
  UpdateRecordResponse,
  ListRecordsResponse,
  Book
} from '../../config/types';
import { convertBookToFeishuRecord, shouldUpdateRecord } from './models';

/**
 * 飞书多维表格同步服务类
 */
export class FeishuSyncService {
  private client: BaseClient;
  private config: FeishuConfig;
  private tableId: string;

  constructor(config: FeishuConfig) {
    this.config = config;
    this.client = createFeishuClient(config);
    this.tableId = config.tableId;
  }

  /**
   * 检查书籍是否已存在于飞书多维表格中
   * @param bookTitle 书名
   * @param author 作者
   * @returns 存在的记录ID，不存在返回null
   */
  async checkBookExistsInFeishu(
    bookTitle: string,
    author: string
  ): Promise<string | null> {
    try {
      console.log(`检查书籍是否存在: ${bookTitle} - ${author}`);
      
      // 查询记录
      const response = await this.client.base.appTableRecord.list({
        path: { table_id: this.tableId },
        params: {
          filter: `AND(FIND("${bookTitle}", {书名}) > 0, FIND("${author}", {作者}) > 0)`,
          page_size: 10
        }
      });
      
      const records = response.data?.items || [];

      if (records && records.length > 0) {
        console.log(`找到已存在的书籍记录: ${records[0].record_id}`);
        return records[0].record_id || null;
      }

      console.log('书籍不存在，需要创建新记录');
      return null;
    } catch (error) {
      console.error('检查书籍存在性时出错:', error);
      throw error;
    }
  }

  /**
   * 将书籍数据写入飞书多维表格
   * @param book 书籍数据
   * @param highlights 划线内容
   * @param thoughts 想法内容
   * @returns 同步结果
   */
  async writeBookToFeishu(
    book: Book,
    highlights?: string,
    thoughts?: string
  ): Promise<FeishuSyncResult> {
    try {
      console.log(`开始同步书籍到飞书: ${book.title}`);
      
      // 转换为飞书记录格式
      const feishuRecord = convertBookToFeishuRecord(book, highlights, thoughts);
      
      // 检查书籍是否已存在
      const existingRecordId = await this.checkBookExistsInFeishu(
        book.title || '',
        book.author || ''
      );

      if (existingRecordId) {
        // 更新现有记录
        return await this.updateBookRecord(existingRecordId, feishuRecord);
      } else {
        // 创建新记录
        return await this.createBookRecord(feishuRecord);
      }
    } catch (error) {
      console.error('写入书籍到飞书时出错:', error);
      return {
        success: false,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
        updated: false
      };
    }
  }

  /**
   * 创建新的书籍记录
   * @param record 书籍记录
   * @returns 同步结果
   */
  private async createBookRecord(record: FeishuBookRecord): Promise<FeishuSyncResult> {
    try {
      console.log('创建新的书籍记录');
      console.log('记录字段:', JSON.stringify(record.fields, null, 2));
      
      const response = await this.client.base.appTableRecord.create({
        path: { table_id: this.tableId },
        data: {
          fields: record.fields
        }
      });
      
      console.log('API响应:', JSON.stringify(response, null, 2));
      
      // 检查不同的响应结构
      let recordId = null;
      if (response.data?.record?.record_id) {
        recordId = response.data.record.record_id;
      }
      
      if (!recordId) {
        console.error('未找到记录ID，响应结构:', response);
        throw new Error('创建记录失败：未返回记录ID');
      }
      
      console.log(`成功创建书籍记录: ${recordId}`);
      return {
        success: true,
        message: '成功创建新书籍记录',
        recordId: recordId,
        updated: false
      };
    } catch (error) {
      console.error('创建书籍记录时出错:', error);
      throw error;
    }
  }

  /**
   * 更新现有的书籍记录
   * @param recordId 记录ID
   * @param newRecord 新的记录数据
   * @returns 同步结果
   */
  private async updateBookRecord(
    recordId: string,
    newRecord: FeishuBookRecord
  ): Promise<FeishuSyncResult> {
    try {
      console.log(`更新书籍记录: ${recordId}`);
      
      // 获取现有记录
      const response = await this.client.base.appTableRecord.get({
        path: { 
          table_id: this.tableId,
          record_id: recordId
        }
      });
      
      const existingRecord = response.data?.record;
      if (!existingRecord) {
        throw new Error('找不到要更新的记录');
      }

      // 检查是否需要更新
      const existingFeishuRecord: FeishuBookRecord = {
        record_id: recordId,
        fields: existingRecord.fields as any
      };

      if (!shouldUpdateRecord(existingFeishuRecord, newRecord)) {
        console.log('记录无需更新');
        return {
          success: true,
          message: '记录无需更新',
          recordId: recordId,
          updated: false
        };
      }

      // 执行更新
      await this.client.base.appTableRecord.update({
        path: {
          table_id: this.tableId,
          record_id: recordId
        },
        data: {
          fields: newRecord.fields
        }
      });
      
      console.log(`成功更新书籍记录: ${recordId}`);
      return {
        success: true,
        message: '成功更新书籍记录',
        recordId: recordId,
        updated: true
      };
    } catch (error) {
      console.error('更新书籍记录时出错:', error);
      throw error;
    }
  }

  /**
   * 批量同步书籍数据
   * @param books 书籍数据数组
   * @param highlightsMap 划线内容映射
   * @param thoughtsMap 想法内容映射
   * @returns 同步结果数组
   */
  async batchSyncBooks(
    books: Book[],
    highlightsMap: Map<string, string> = new Map(),
    thoughtsMap: Map<string, string> = new Map()
  ): Promise<FeishuSyncResult[]> {
    const results: FeishuSyncResult[] = [];
    
    console.log(`开始批量同步 ${books.length} 本书籍`);
    
    for (const book of books) {
      try {
        const bookId = book.bookId || book.id || '';
        const highlights = highlightsMap.get(bookId);
        const thoughts = thoughtsMap.get(bookId);
        
        const result = await this.writeBookToFeishu(book, highlights, thoughts);
        results.push(result);
        
        // 添加延迟以避免API限流
        await this.delay(100);
      } catch (error) {
        console.error(`同步书籍 ${book.title} 时出错:`, error);
        results.push({
          success: false,
          message: `同步 ${book.title} 失败: ${error instanceof Error ? error.message : '未知错误'}`,
          updated: false
        });
      }
    }
    
    console.log(`批量同步完成，成功: ${results.filter(r => r.success).length}/${results.length}`);
    return results;
  }

  /**
   * 获取表格的所有记录
   * @returns 记录列表
   */
  async getAllRecords(): Promise<any[]> {
    try {
      const response = await this.client.base.appTableRecord.list({
        path: { table_id: this.tableId },
        params: {
          page_size: 500
        }
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('获取所有记录时出错:', error);
      throw error;
    }
  }

  /**
   * 测试飞书连接
   * @returns 连接是否成功
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('测试飞书多维表格连接...');
      
      // 尝试获取表格信息
      await this.client.base.appTableRecord.list({
        path: { table_id: this.tableId },
        params: {
          page_size: 1
        }
      });
      
      console.log('飞书多维表格连接成功');
      return true;
    } catch (error) {
      console.error('飞书多维表格连接失败:', error);
      return false;
    }
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取表格字段信息
   * @returns 字段信息
   */
  async getTableFields(): Promise<any[]> {
    try {
      const response = await this.client.base.appTableField.list({
        path: { table_id: this.tableId }
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('获取表格字段信息时出错:', error);
      throw error;
    }
  }

  /**
   * 确保表格具有必要的字段
   * @returns 是否成功
   */
  async ensureRequiredFields(): Promise<boolean> {
    try {
      console.log('检查表格字段...');
      
      const fields = await this.getTableFields();
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
    } catch (error) {
      console.error('检查表格字段时出错:', error);
      return false;
    }
  }
}

/**
 * 创建飞书同步服务实例
 * @param config 飞书配置
 * @returns 飞书同步服务实例
 */
export function createFeishuSyncService(config: FeishuConfig): FeishuSyncService {
  return new FeishuSyncService(config);
}