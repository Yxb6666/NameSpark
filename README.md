# AI 昵称生成器

一个使用 `HTML + CSS + JavaScript + Node.js + Express` 实现的单页面网页应用。

当前版本已实现：

- 单页面生成界面
- 条件筛选表单
- 前端调用本地后端接口 `/api/generate`
- 后端通过 OpenAI SDK 兼容方式接入智谱 BigModel
- 使用 `glm-5` 生成真实昵称结果
- 基本错误处理

## 环境要求

- Node.js 18 及以上

## 安装依赖

```bash
npm install
```

## 配置环境变量

1. 复制 `.env.example` 为 `.env`
2. 填入你的智谱 API Key

```env
ZAI_API_KEY=your_bigmodel_api_key_here
```

## 启动项目

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

启动后访问：

```text
http://localhost:3000
```

## 项目文件说明

- `server.js`：Express 服务和 `/api/generate` 接口
- `index.html`：页面结构
- `src/styles/main.css`：页面样式
- `src/js/app.js`：前端交互与接口请求
- `src/js/generator.js`：本地模拟生成逻辑，当前主要作为保留文件
- `.env.example`：环境变量模板

## 下一步可继续实现

- 复制功能
- 收藏功能
- 历史记录和收藏写入 localStorage
- 接口返回结果的更严格校验
