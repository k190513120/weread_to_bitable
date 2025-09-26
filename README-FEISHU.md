# 微信读书同步飞书多维表格

将微信读书的书籍、划线和想法同步到飞书多维表格的自动化工具。

## 🚀 功能特性

- ✅ 同步微信读书书籍元数据（标题、作者、封面等）
- ✅ 同步书籍划线和笔记
- ✅ 同步书籍想法和评论
- ✅ 支持增量同步，避免重复数据
- ✅ 通过HTTP接口触发GitHub Action执行同步
- ✅ 支持单本书籍和批量同步
- ✅ 完整的错误处理和日志记录
- ✅ 支持Vercel一键部署

## 📋 前置要求

### 1. 飞书多维表格配置

1. 创建飞书多维表格
2. 获取多维表格链接（格式：`https://bytedance.larkoffice.com/base/bascnxxx?table=tblxxx&view=vewxxx`）
3. 获取个人授权码：
   - 打开飞书多维表格
   - 点击右上角「扩展」→「脚本」
   - 在脚本编辑器中获取「个人授权码」

### 2. 微信读书Cookie

1. 浏览器打开 [微信读书网页版](https://weread.qq.com/)
2. 登录账号
3. 按F12打开开发者工具
4. 切换到Network标签
5. 刷新页面，找到任意请求
6. 复制请求头中的完整Cookie值

### 3. GitHub配置

1. Fork本项目到你的GitHub账号
2. 创建GitHub Personal Access Token（需要repo权限）
3. 在仓库Settings → Secrets中配置环境变量

## ⚙️ 环境变量配置

### GitHub Secrets配置

在你的GitHub仓库中，进入 `Settings` → `Secrets and variables` → `Actions`，添加以下secrets：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `BITABLE_URL` | 飞书多维表格链接 | `https://bytedance.larkoffice.com/base/bascnxxx?table=tblxxx` |
| `PERSONAL_BASE_TOKEN` | 飞书个人授权码 | `bascnxxxxxxxxx` |
| `WEREAD_COOKIE` | 微信读书Cookie | `wr_name=xxx; wr_skey=xxx; ...` |
| `GITHUB_TOKEN` | GitHub访问令牌（可选，用于HTTP触发） | `ghp_xxxxxxxxx` |

### 本地开发环境变量

复制 `.env.example` 为 `.env` 并填写相应值：

```bash
cp .env.example .env
```

## 🚀 部署方式

### 方式一：Vercel部署（推荐）

1. 点击下方按钮一键部署到Vercel：

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/weread-to-bitable)

2. 在Vercel项目设置中配置环境变量
3. 部署完成后获得HTTP接口地址

### 方式二：本地运行

```bash
# 安装依赖
npm install

# 启动HTTP服务
npm run server

# 或开发模式（自动重启）
npm run server:dev
```

## 📖 使用方法

### 1. 通过HTTP接口触发同步

#### 同步所有书籍

```bash
curl -X POST https://your-vercel-app.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "bitable_url": "https://bytedance.larkoffice.com/base/bascnxxx?table=tblxxx",
    "personal_base_token": "bascnxxxxxxxxx",
    "weread_cookie": "wr_name=xxx; wr_skey=xxx; ..."
  }'
```

#### 同步单本书籍

```bash
curl -X POST https://your-vercel-app.vercel.app/api/sync/single \
  -H "Content-Type: application/json" \
  -d '{
    "bitable_url": "https://bytedance.larkoffice.com/base/bascnxxx?table=tblxxx",
    "personal_base_token": "bascnxxxxxxxxx",
    "weread_cookie": "wr_name=xxx; wr_skey=xxx; ...",
    "book_id": "123456"
  }'
```

### 2. 手动触发GitHub Action

1. 进入你的GitHub仓库
2. 点击 `Actions` 标签
3. 选择 `微信读书同步飞书多维表格` 工作流
4. 点击 `Run workflow`
5. 填写必要参数并运行

### 3. 本地脚本运行

```bash
# 测试飞书连接
npm run test:feishu-connection

# 同步所有书籍
npm run sync:all

# 同步单本书籍
npm run sync:single -- --book-id=123456

# 验证多维表格URL
npm run validate:url
```

## 📊 飞书多维表格字段说明

系统会自动在你的飞书多维表格中创建以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 书名 | 单行文本 | 书籍标题 |
| 作者 | 单行文本 | 书籍作者 |
| 封面 | 附件 | 书籍封面图片 |
| 简介 | 多行文本 | 书籍简介 |
| 出版社 | 单行文本 | 出版社名称 |
| 出版时间 | 日期 | 出版日期 |
| ISBN | 单行文本 | 书籍ISBN |
| 分类 | 单行文本 | 书籍分类 |
| 评分 | 数字 | 书籍评分 |
| 页数 | 数字 | 书籍页数 |
| 阅读状态 | 单选 | 阅读进度状态 |
| 阅读进度 | 进度 | 阅读百分比 |
| 划线数量 | 数字 | 划线笔记数量 |
| 想法数量 | 数字 | 想法评论数量 |
| 划线内容 | 多行文本 | 所有划线内容 |
| 想法内容 | 多行文本 | 所有想法内容 |
| 最后同步时间 | 日期时间 | 最后同步的时间 |
| 微信读书链接 | URL | 书籍在微信读书的链接 |
| 书籍ID | 单行文本 | 微信读书书籍ID |

## 🔧 故障排除

### 常见问题

1. **权限错误**
   ```
   permission denied for table xxx
   ```
   - 检查飞书多维表格的个人授权码是否正确
   - 确保授权码有读写权限

2. **Cookie失效**
   ```
   微信读书登录失效
   ```
   - 重新获取微信读书Cookie
   - 确保Cookie格式完整

3. **URL解析失败**
   ```
   飞书多维表格URL解析失败
   ```
   - 检查URL格式是否正确
   - 确保包含appToken和tableId

4. **GitHub Action触发失败**
   ```
   GitHub Token未配置
   ```
   - 检查GITHUB_TOKEN是否正确配置
   - 确保Token有repo权限

### 调试方法

1. **查看同步日志**
   - GitHub Actions页面查看运行日志
   - 下载同步报告文件

2. **测试连接**
   ```bash
   npm run test:feishu-connection
   ```

3. **验证URL**
   ```bash
   curl -X POST https://your-app.vercel.app/api/validate-url \
     -H "Content-Type: application/json" \
     -d '{"bitable_url": "your-url"}'
   ```

## 📝 更新日志

### v2.0.0
- ✅ 支持飞书多维表格同步
- ✅ 新增HTTP触发接口
- ✅ 支持GitHub Action自动化
- ✅ 支持Vercel一键部署
- ✅ 完善的错误处理和日志

### v1.x.x
- ✅ 支持Notion同步（原版本）

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本工具仅供学习和个人使用，请遵守微信读书的使用条款。使用本工具产生的任何问题，作者不承担责任。