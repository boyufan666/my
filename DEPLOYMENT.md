# 部署指南

## 项目概述

这是一个基于 React + Vite + Express 的 AI 康复平台，集成了：
- 实时语音对话（使用浏览器 Web Speech API）
- MMSE 认知评估（语音问答）
- 体感游戏控制（摄像头动作识别）
- 星火大模型 AI 助手

## 部署平台推荐

**推荐使用 Render.com**（免费层足够使用，支持 Node.js + WebSocket）

### 为什么选择 Render？

1. ✅ 支持 Node.js 后端（Express + WebSocket）
2. ✅ 自动 HTTPS
3. ✅ 免费层可用
4. ✅ 从 GitHub 自动部署
5. ✅ 环境变量管理方便

## 部署步骤

### 1. 准备代码仓库

```bash
# 在项目根目录
cd "/Users/fanboyu/Desktop/AI康复平台设计 (Copy)"

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: AI康复平台"

# 在 GitHub 创建新仓库，然后：
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 2. 在 Render 上创建服务

1. 访问 [Render.com](https://render.com) 并注册/登录
2. 点击 **New +** → **Web Service**
3. 选择 **Connect GitHub**，授权并选择你的仓库
4. 填写配置：
   - **Name**: `ai-rehab-platform`
   - **Region**: 选择离你最近的区域（如 `Singapore`）
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: 在环境变量中设置 `NODE_VERSION=20`（或你的版本）

### 3. 配置环境变量

在 Render 的 **Environment** 标签页添加：

```
SPARK_APPID=81bc3993
SPARK_API_SECRET=ZJ2yFzXGZYzjB30DE2QT0QNtADYViNI
SPARK_API_KEY=a8dcd4da1723840efe19d07982f71534
SPARK_URL=wss://spark-api-qpe.n.xf-yun.com/v2.1/chat
SPARK_DOMAIN=generalv1.5
NODE_ENV=production
PORT=5000
```

**重要**：不要将密钥提交到 Git！只在 Render 控制台设置。

**注意**：以上配置已针对 Spark X1.5 版本优化，WebSocket 地址已更新。

### 4. 部署

点击 **Create Web Service**，Render 会自动：
1. 安装依赖 (`npm install`)
2. 构建前端 (`npm run build`)
3. 启动服务 (`npm run start`)

部署完成后，你会得到一个类似 `https://ai-rehab-platform.onrender.com` 的地址。

### 5. 配置自定义域名（可选）

1. 在 Render 服务页面找到 **Custom Domains**
2. 点击 **Add**，输入你的域名
3. 按照提示在 DNS 提供商添加 CNAME 记录
4. 等待 DNS 生效（通常几分钟）

## 本地开发

### 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
SPARK_APPID=81bc3993
SPARK_API_SECRET=ZJ2yFzXGZYzjB30DE2QT0QNtADYViNI
SPARK_API_KEY=a8dcd4da1723840efe19d07982f71534
SPARK_URL=wss://spark-api-qpe.n.xf-yun.com/v2.1/chat
SPARK_DOMAIN=generalv1.5
```

**注意**：所有配置已填写好，可直接使用。

### 运行

```bash
# 安装依赖
npm install

# 开发模式（前端）
npm run dev

# 构建生产版本
npm run build

# 启动服务器（需要先构建）
npm run start
```

## 功能说明

### 语音对话
- 使用浏览器 Web Speech API（需要 HTTPS）
- 支持中文语音识别和合成
- 可通过语音命令导航页面

### 体感控制
- 使用摄像头进行动作识别
- 支持运动类游戏的体感操作
- 需要用户授权摄像头权限

### MMSE 评估
- 语音问答模式
- 自动评分和结果分析
- 完成后跳转到结果页面

## 注意事项

1. **HTTPS 要求**：语音识别和摄像头权限在 HTTP 下可能受限，生产环境必须使用 HTTPS（Render 自动提供）

2. **浏览器兼容性**：
   - 语音识别：Chrome、Edge 支持较好
   - 摄像头：所有现代浏览器支持
   - 建议使用 Chrome/Edge 获得最佳体验

3. **性能优化**：
   - 首次加载可能较慢（需要加载所有资源）
   - 考虑使用 CDN 加速静态资源

4. **安全**：
   - 星火 API 密钥不要提交到代码仓库
   - 使用环境变量管理敏感信息

## 故障排查

### 部署失败
- 检查 `package.json` 中的脚本是否正确
- 查看 Render 的构建日志
- 确认环境变量都已设置

### 语音识别不工作
- 确认使用 HTTPS
- 检查浏览器权限设置
- 查看浏览器控制台错误

### API 调用失败
- 检查星火 API 密钥是否正确
- 查看服务器日志
- 确认网络连接正常

## 技术支持

如有问题，请查看：
- Render 文档：https://render.com/docs
- 项目 Issues（如果有 GitHub 仓库）

