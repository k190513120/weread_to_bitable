import { refreshSession, getNotebookBooks, getBookshelfBooks } from './src/api/weread/services';

/**
 * 解析命令行参数
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const params: { [key: string]: string } = {};
  
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
  
  return params;
}

async function testWereadConnection() {
  try {
    console.log('测试微信读书连接...');
    
    // 从命令行参数获取配置
    const args = parseCommandLineArgs();
    const cookie = args.weread_cookie;
    
    console.log('配置来源: 命令行参数');
    
    if (!cookie) {
      throw new Error('缺少必要参数 weread_cookie\n\n使用方法:\nts-node test-weread.ts --weread_cookie=your_cookie');
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