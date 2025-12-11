# Render构建问题修复说明

## 修复时间
2024-12-11

## 修复的问题

### 1. 静态资源路径问题
**问题**：打包后页面空白，静态资源404错误

**修复**：在 `vite.config.ts` 中添加了 `base: './'` 配置
```typescript
export default defineConfig({
  base: './', // 适配Render的静态资源路径
  // ...
});
```

### 2. 环境变量检查导致构建失败
**问题**：`server.js` 在构建阶段检查环境变量，如果缺失会 `process.exit(1)`，导致构建失败

**修复**：
- 构建阶段：只输出警告，不退出（避免构建失败）
- 运行时：在 `app.listen()` 前检查环境变量，缺失则退出

```javascript
// 构建阶段：只警告
if (!SPARK_CONFIG.APPID || !SPARK_CONFIG.API_SECRET || !SPARK_CONFIG.API_KEY) {
    console.warn("⚠️ 星火大模型配置缺失！");
    // 不在构建阶段退出
}

// 运行时：检查并退出
app.listen(PORT, '0.0.0.0', () => {
    // 启动前再次检查
    if (!SPARK_CONFIG.APPID || !SPARK_CONFIG.API_SECRET || !SPARK_CONFIG.API_KEY) {
        console.error("❌ 错误：星火大模型配置缺失！");
        process.exit(1);
    }
    // ...
});
```

### 3. 端口配置优化
**问题**：确保使用Render提供的PORT环境变量

**修复**：已确认使用 `process.env.PORT || 5000`，监听 `0.0.0.0`

### 4. render.yaml配置优化
**问题**：配置说明不够清晰

**修复**：更新了 `render.yaml`，明确了：
- PORT由Render自动分配，不需要手动设置
- 必需的环境变量需要在Render控制台手动设置

## 部署步骤

### 1. 在Render控制台设置环境变量

进入 Render Dashboard → 你的服务 → Environment → 添加以下环境变量：

**必需的环境变量**：
- `SPARK_APPID` - 星火大模型APPID
- `SPARK_API_SECRET` - 星火大模型API密钥
- `SPARK_API_KEY` - 星火大模型API Key

**可选的环境变量**：
- `SPARK_URL` - 星火大模型接口地址（默认：`https://spark-api-open.xf-yun.com/v2/chat/completions`）
- `SPARK_DOMAIN` - 星火大模型域名（默认：`generalv1.5`）
- `APIPassword` - API密码（可选）

### 2. 构建和部署配置

在 Render Dashboard → 你的服务 → Settings → Build & Deploy：

**Build Command**：
```bash
npm install && npm run build
```

**Start Command**：
```bash
npm run start
```

**注意**：Render会自动设置 `PORT` 环境变量，不需要手动设置。

### 3. 提交代码并触发构建

```bash
cd "/Users/fanboyu/Desktop/康复平台3.0"
git add .
git commit -m "修复Render构建错误：添加base配置，优化环境变量检查"
git push origin main
```

Render会自动检测到新的提交并开始构建。

### 4. 查看构建日志

如果构建失败，在 Render Dashboard → 你的服务 → Logs 查看详细错误信息。

## 常见问题排查

### 问题1：构建失败 - 依赖安装失败
**症状**：日志显示 `npm ERR! missing: 包名`

**解决方法**：
1. 本地执行 `npm install` 确认依赖能正常安装
2. 检查 `package.json` 是否有拼写错误的包名
3. 确保所有依赖都在 `dependencies` 或 `devDependencies` 中

### 问题2：构建失败 - 构建命令错误
**症状**：日志显示 `npm ERR! missing script: build`

**解决方法**：
1. 检查 `package.json` 的 `scripts` 是否有 `build` 指令
2. 确认 Render 的 Build Command 设置为 `npm install && npm run build`

### 问题3：构建成功但页面空白
**症状**：构建成功，但访问页面显示空白

**解决方法**：
1. 检查浏览器控制台是否有404错误
2. 确认 `vite.config.ts` 中已设置 `base: './'`
3. 检查 `server.js` 中静态文件路径是否正确：`express.static('build')`

### 问题4：运行时错误 - 环境变量缺失
**症状**：构建成功，但启动时显示环境变量缺失

**解决方法**：
1. 在 Render Dashboard → Environment 中设置必需的环境变量
2. 确保环境变量名称正确（区分大小写）
3. 重新部署服务

### 问题5：端口配置错误
**症状**：日志显示 `Port not found` 或 `Address already in use`

**解决方法**：
1. 确认 `server.js` 中使用 `process.env.PORT || 5000`
2. 不要手动设置 `PORT` 环境变量，Render会自动分配
3. 确认监听地址为 `0.0.0.0`，不是 `127.0.0.1`

## 验证部署

部署成功后，访问你的Render服务URL，应该能看到：
1. 欢迎页面正常显示
2. 麦克风按钮可以点击
3. 控制台没有404错误
4. API请求正常（需要设置环境变量）

## 注意事项

1. **环境变量**：必须在Render控制台手动设置，不能通过代码提交
2. **构建时间**：首次构建可能需要5-10分钟，请耐心等待
3. **日志查看**：如果遇到问题，优先查看Render的构建日志和运行日志
4. **本地测试**：在提交到Render之前，建议本地执行 `npm run build` 验证构建是否成功

---

**修复完成！现在可以重新部署到Render了！**

