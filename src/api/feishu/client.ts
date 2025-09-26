import { BaseClient } from '@lark-base-open/node-sdk';
import { FeishuConfig, BitableUrlParts } from '../../config/types';

/**
 * 飞书多维表格客户端类
 */
export class FeishuClient {
  private client: BaseClient;
  private tableId: string;

  constructor(config: FeishuConfig) {
    this.client = new BaseClient({
      appToken: config.appToken,
      personalBaseToken: config.personalBaseToken,
      baseURL: 'https://base-api.feishu.cn'
    });
    this.tableId = config.tableId;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.base.appTableRecord.list({
        path: { table_id: this.tableId },
        params: { page_size: 1 }
      });
      return true;
    } catch (error) {
      console.error('飞书连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取表格字段
   */
  async getTableFields(): Promise<any[]> {
    try {
      const response = await this.client.base.appTableField.list({
        path: { table_id: this.tableId }
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('获取表格字段失败:', error);
      throw error;
    }
  }

  /**
   * 创建字段
   */
  async createField(fieldConfig: any): Promise<any> {
    try {
      const response = await this.client.base.appTableField.create({
        path: { table_id: this.tableId },
        data: fieldConfig
      });
      return response.data;
    } catch (error) {
      console.error('创建字段失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加记录
   */
  async batchCreateRecords(records: any[]): Promise<any> {
    try {
      const response = await this.client.base.appTableRecord.batchCreate({
        path: { table_id: this.tableId },
        data: { records }
      });
      return response.data;
    } catch (error) {
      console.error('批量创建记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取记录列表
   */
  async getRecords(pageSize: number = 100): Promise<any[]> {
    try {
      const response = await this.client.base.appTableRecord.list({
        path: { table_id: this.tableId },
        params: { page_size: pageSize }
      });
      return response.data?.items || [];
    } catch (error) {
      console.error('获取记录列表失败:', error);
      throw error;
    }
  }
}

/**
 * 解析飞书多维表格链接，提取appToken和tableId
 * @param url 飞书多维表格链接
 * @returns {BitableUrlParts} 包含appToken和tableId的对象
 */
export function parseBitableUrl(url: string): BitableUrlParts {
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
  } catch (error) {
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
export function validateSyncParams(params: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
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
export function createFeishuClient(config: FeishuConfig): BaseClient {
  try {
    const client = new BaseClient({
      appToken: config.appToken,
      personalBaseToken: config.personalBaseToken,
      baseURL: 'https://base-api.feishu.cn'
    });
    
    return client;
  } catch (error) {
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
export async function testFeishuConnection(client: BaseClient, tableId: string): Promise<{
  success: boolean;
  tableInfo: { tableId: string } | null;
  error: string | null;
}> {
  try {
    // 尝试获取表格信息来测试连接
    await client.base.appTableRecord.list({
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
  } catch (error) {
    console.error('飞书连接测试失败:', error);
    return {
      success: false,
      tableInfo: null,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}