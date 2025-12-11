# 忆趣康元 - AI康复平台

一个温暖、关怀、专业的智能康复平台，集成了语音对话、体感控制和认知评估功能。

## ✨ 主要功能

### 🎤 实时语音对话
- 与 AI 助手"小忆"进行自然语音对话
- 支持语音命令控制页面导航
- 智能理解用户意图，提供个性化建议

### 🧠 MMSE 认知评估
- 语音问答模式进行认知评估
- 自动评分和结果分析
- 根据评估结果推荐个性化康复方案

### 🎮 体感游戏
- 支持摄像头动作识别
- 多种康复游戏（乒乓球、太极拳、记忆配对等）
- 实时动作反馈和评分

### 👨‍👩‍👧 社交中心
- 与家人分享康复进展
- 接收家人的鼓励和留言
- 协作涂色等互动活动

### 📊 数据中心
- 详细的康复数据统计
- 趋势分析和进度追踪
- 成就系统

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
SPARK_APPID=81bc3993
SPARK_API_SECRET=ZjUyZjFkZGYzZjI3ODE2OTQ0NTA0YjNj
SPARK_API_KEY=a8dcdd4a1723840efe19d07982f71534
SPARK_URL=https://spark-api-open.xf-yun.com/v2/chat/completions
SPARK_DOMAIN=generalv1.5
APIPassword=IsXfLKYLJAdwcWsTelxV:iAFMupnCOCPZMhizojvf
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
npm run start
```

## 📦 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI + Framer Motion
- **后端**: Express.js + WebSocket
- **AI**: 科大讯飞星火大模型
- **语音**: Web Speech API
- **体感**: MediaStream API + 动作识别

## 🌐 部署

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

推荐使用 **Render.com** 进行部署（免费、支持 Node.js + WebSocket）

## 📱 浏览器支持

- ✅ Chrome/Edge（推荐，语音识别支持最好）
- ✅ Firefox
- ✅ Safari（部分功能可能受限）

**注意**：语音识别和摄像头功能需要 HTTPS 环境（生产环境必须）

## 🎯 使用说明

### 语音对话
1. 点击麦克风按钮开始对话
2. 可以说："打开游戏库"、"开始评估"、"查看数据"等
3. 小忆会语音回复并执行相应操作

### 体感游戏
1. 在游戏页面点击"启动摄像头"
2. 授权摄像头权限
3. 在摄像头前做动作，系统会识别并控制游戏

### MMSE 评估
1. 进入评估页面
2. 点击"开始评估"
3. 通过语音回答小忆的问题
4. 完成后查看评估结果和推荐方案

## 🔒 隐私与安全

- 所有数据仅在本地处理
- 语音数据不会长期存储
- 摄像头数据仅用于实时动作识别
- API 密钥通过环境变量管理，不会暴露在前端代码中

## 📄 许可证

本项目仅供学习和研究使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

**忆趣康元** - 让康复更有温度 ❤️
