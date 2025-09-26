# GitHub Actions 自动同步配置指南

本指南将帮助您配置 GitHub Actions，实现微信读书数据自动同步到飞书多维表格。

## 前置准备

### 1. 获取飞书多维表格信息

1. **创建飞书多维表格**
   - 登录飞书，创建一个新的多维表格
   - 复制多维表格的完整URL链接

2. **获取个人访问令牌**
   - 访问飞书开放平台
   - 申请个人访问令牌（Personal Base Token）
   - 确保令牌有多维表格的读写权限

### 2. 获取微信读书Cookie

1. 打开微信读书网页版：https://weread.qq.com/
2. 登录您的微信读书账号
3. 打开浏览器开发者工具（F12）
4. 切换到 Network 标签页
5. 刷新页面，找到任意一个请求
6. 在请求头中找到 Cookie 字段，复制完整的 Cookie 值

## GitHub Actions 配置步骤

### 1. Fork 项目到您的 GitHub 账号

点击项目页面右上角的 "Fork" 按钮，将项目复制到您的 GitHub 账号下。

### 2. 获取 GitHub Personal Access Token（用于HTTP触发）

如果您需要通过HTTP请求触发同步，需要创建GitHub个人访问令牌：

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 设置令牌名称和过期时间
4. 选择权限范围：
   - `repo` - 完整的仓库访问权限
   - `workflow` - 工作流权限
5. 点击 "Generate token" 并保存生成的令牌

### 3. 配置 GitHub Secrets（可选）

如果您需要使用定时同步或手动触发（不通过HTTP），在您 Fork 的项目中：

1. 点击 "Settings" 标签页
2. 在左侧菜单中选择 "Secrets and variables" → "Actions"
3. 点击 "New repository secret" 添加以下三个密钥：

| 密钥名称 | 说明 | 示例值 |
|---------|------|--------|
| `BITABLE_URL` | 飞书多维表格完整链接 | `https://larkcommunity.feishu.cn/base/xxx?table=xxx&view=xxx` |
| `PERSONAL_BASE_TOKEN` | 飞书个人访问令牌 | `pt-xxxxxxxxxxxxxxxxx` |
| `WEREAD_COOKIE` | 微信读书完整Cookie | `RK=xxx; ptcz=xxx; ...` |

### 4. 启用 GitHub Actions

1. 在项目页面点击 "Actions" 标签页
2. 如果看到提示，点击 "I understand my workflows, go ahead and enable them"
3. 找到 "微信读书同步到飞书多维表格" 工作流

### 5. 同步方式选择

本项目支持三种同步触发方式：

## 方式一：HTTP API 触发（推荐）

通过HTTP请求直接触发同步，无需预先配置Secrets，参数通过请求传递。

### HTTP API 调用方法

**请求URL：**
```
POST https://api.github.com/repos/{owner}/{repo}/dispatches
```

**请求头：**
```
Authorization: Bearer {your_github_token}
Content-Type: application/json
Accept: application/vnd.github.v3+json
```

**请求体：**
```json
{
  "event_type": "sync-all-books",
  "client_payload": {
    "bitable_url": "https://larkcommunity.feishu.cn/base/xxx?table=xxx&view=xxx",
    "personal_base_token": "pt-xxxxxxxxxxxxxxxxx",
    "weread_cookie": "RK=xxx; ptcz=xxx; ..."
  }
}
```

**支持的事件类型：**
- `sync-all-books` - 同步所有书籍
- `sync-single-book` - 同步单本书籍（需要额外传递 `book_id` 参数）
- `test-connection` - 测试连接

**完整示例（使用curl）：**
```bash
curl -X POST \
  -H "Authorization: Bearer ghp_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{
    "event_type": "sync-all-books",
    "client_payload": {
      "bitable_url": "https://larkcommunity.feishu.cn/base/xxx?table=xxx&view=xxx",
      "personal_base_token": "pt-xxxxxxxxxxxxxxxxx",
      "weread_cookie": "RK=xxx; ptcz=xxx; ..."
    }
  }' \
  https://api.github.com/repos/yourusername/weread_to_bitable/dispatches
```

**JavaScript示例：**
```javascript
const response = await fetch('https://api.github.com/repos/yourusername/weread_to_bitable/dispatches', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ghp_xxxxxxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json'
  },
  body: JSON.stringify({
    event_type: 'sync-all-books',
    client_payload: {
      bitable_url: 'https://larkcommunity.feishu.cn/base/xxx?table=xxx&view=xxx',
      personal_base_token: 'pt-xxxxxxxxxxxxxxxxx',
      weread_cookie: 'RK=xxx; ptcz=xxx; ...'
    }
  })
});
```

## 方式二：手动触发同步

1. 在 Actions 页面，点击 "微信读书同步飞书多维表格" 工作流
2. 点击右侧的 "Run workflow" 按钮
3. 填入必要参数：
   - 飞书多维表格链接
   - 飞书多维表格授权码
   - 微信读书Cookie
4. 选择同步模式，点击 "Run workflow"
5. 等待执行完成，查看运行日志

## 方式三：自动定时同步

工作流支持定时自动执行（需要预先配置Secrets）。您可以修改 `.github/workflows/sync-weread.yml` 文件添加定时触发：

```yaml
on:
  schedule:
    # 每天北京时间早上8点执行（UTC时间0点）
    - cron: '0 0 * * *'
```

## 常见问题排查

### 1. 同步失败

**检查步骤：**
- 确认所有 Secrets 配置正确
- 检查飞书多维表格链接是否有效
- 验证个人访问令牌权限
- 确认微信读书 Cookie 未过期

### 2. 部分数据同步失败

**可能原因：**
- 飞书多维表格字段配置不完整
- 网络连接问题
- API 调用频率限制

**解决方案：**
- 查看 Actions 运行日志中的详细错误信息
- 手动运行字段设置脚本：`npx ts-node src/scripts/setup-feishu-fields.ts`

### 3. Cookie 过期

微信读书 Cookie 会定期过期，需要重新获取并更新 GitHub Secrets 中的 `WEREAD_COOKIE` 值。

## 高级配置

### 修改同步频率

编辑 `.github/workflows/sync.yml` 文件中的 cron 表达式：

```yaml
# 每12小时执行一次
- cron: '0 */12 * * *'

# 每周一执行
- cron: '0 0 * * 1'

# 每月1号执行
- cron: '0 0 1 * *'
```

### 添加通知

您可以在工作流中添加通知步骤，在同步完成后发送邮件或消息通知。

## 注意事项

1. **隐私安全**：请确保不要在公开的代码中暴露您的 Cookie 和令牌信息
2. **使用限制**：遵守微信读书和飞书的使用条款，避免过于频繁的请求
3. **数据备份**：建议定期备份您的飞书多维表格数据
4. **更新维护**：定期检查项目更新，及时同步最新功能

## 支持

如果在配置过程中遇到问题，请：

1. 查看 GitHub Actions 的运行日志
2. 检查项目的 Issues 页面
3. 提交新的 Issue 描述您的问题

---

配置完成后，您的微信读书数据将自动同步到飞书多维表格，享受自动化的阅读记录管理！