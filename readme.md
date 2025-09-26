# 将微信读书划线/想法等信息同步到飞书多维表格

## 项目说明

- 支持将微信读书划线/想法同步到飞书多维表格
- 通过 GitHub Actions 每天定时同步
- 同步微信读书书籍信息、阅读进度、划线内容、想法等数据

## 功能特性

- 📚 自动同步微信读书书籍信息
- 📝 同步划线内容和个人想法
- 📊 记录阅读进度和时长
- 🔄 支持增量同步，避免重复数据
- ⏰ 支持定时自动同步
- 🎯 字段优化，避免重复数据

## 使用教程

### 1. 环境配置

在项目根目录创建 `.env` 文件，配置以下信息：

```env
# 飞书多维表格配置
BITABLE_URL=你的飞书多维表格链接
PERSONAL_BASE_TOKEN=你的飞书个人访问令牌

# 微信读书配置
WEREAD_COOKIE=你的微信读书Cookie
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行同步

```bash
# 测试连接
npm run test:feishu-connection

# 同步所有书籍
npx ts-node src/scripts/sync-all-books.ts

# 同步单本书籍
npx ts-node src/scripts/sync-single-book.ts
```

## 配置说明

### 获取飞书多维表格信息

1. 创建飞书多维表格
2. 获取多维表格链接
3. 申请个人访问令牌（Personal Base Token）

### 获取微信读书Cookie

1. 打开微信读书网页版
2. 登录账号
3. 打开浏览器开发者工具
4. 复制Cookie信息

## 欢迎关注我

> [!IMPORTANT]  
> 关注公众号获取教程，后续有更新会第一时间在公众号里发布。

![码道禅心](images/码道禅心.png)

## 捐赠

如果你觉得本项目帮助了你，请作者喝一杯咖啡，你的支持是作者最大的动力。

| 微信支付                                                              | 支付宝支付                                                              |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| <div align="center"><img src="images/微信收款.png" width="50%"></div> | <div align="center"><img src="images/支付宝收款.jpg" width="50%"></div> |

## 重要更新

- 增加使用 raycast 快速触发 actions 脚本
- 增加配置选项，支持按照作者、阅读状态进行同步

## TODO

- ~~筛选功能：仅同步已读和在读书籍~~
- ~~支持按章节组织划线/想法~~
- ~~支持自定义全量/增量同步~~
- ~~支持写入 isbn 和出版社信息~~

## 致谢

[obsidian-weread-plugin](https://github.com/zhaohongxuan/obsidian-weread-plugin)  
[weread2notion](https://github.com/malinkang/weread2notion)
