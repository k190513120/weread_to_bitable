import dotenv from 'dotenv';
import { refreshSession, getNotebookBooks, getBookshelfBooks } from './src/api/weread/services';

dotenv.config();

async function testWereadConnection() {
  try {
    console.log('测试微信读书连接...');
    const cookie = process.env.WEREAD_COOKIE || '';
    
    if (!cookie) {
      throw new Error('WEREAD_COOKIE 环境变量未设置');
    }
    
    // 刷新会话
    const newCookie = await refreshSession(cookie);
    console.log('会话刷新成功');
    
    // 获取笔记本书籍
    const notebookBooks: any[] = await getNotebookBooks(newCookie);
    console.log(`笔记本书籍数量: ${notebookBooks.length}`);
    
    // 获取书架书籍
    const bookshelfBooks: any[] = await getBookshelfBooks(newCookie);
    console.log(`书架书籍数量: ${bookshelfBooks.length}`);
    
    console.log('微信读书连接测试成功');
    
    if (notebookBooks.length > 0) {
      console.log('\n前3本笔记本书籍:');
      notebookBooks.slice(0, 3).forEach((book: any, index: number) => {
        console.log(`${index + 1}. ${book.title} - ${book.author}`);
      });
    }
    
    if (bookshelfBooks.length > 0) {
      console.log('\n前3本书架书籍:');
      bookshelfBooks.slice(0, 3).forEach((book: any, index: number) => {
        console.log(`${index + 1}. ${book.title} - ${book.author}`);
      });
    }
    
  } catch (error: any) {
    console.error('微信读书连接测试失败:', error?.message || error);
    if (error?.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testWereadConnection();