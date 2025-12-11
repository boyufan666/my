# Render 环境变量配置

请在 Render 控制台的 **Environment** 标签页添加以下环境变量：

## 必需变量

```
SPARK_APPID=81bc3993
SPARK_API_SECRET=ZjUyZjFkZGYzZjI3ODE2OTQ0NTA0YjNj
SPARK_API_KEY=a8dcdd4a1723840efe19d07982f71534
SPARK_URL=https://spark-api-open.xf-yun.com/v2/chat/completions
SPARK_DOMAIN=generalv1.5
APIPassword=IsXfLKYLJAdwcWsTelxV:iAFMupnCOCPZMhizojvf
```

## 可选变量

```
NODE_ENV=production
PORT=5000
NODE_VERSION=20
```

## 说明

- **SPARK_URL**: 使用 HTTP 接口地址（v2版本）
- **SPARK_DOMAIN**: 对应 Spark X1.5 的 Domain
- **APIPassword**: API 密码（可选，用于某些认证场景）
- 所有变量值已配置好，直接复制粘贴即可

