# 世界书

世界书是一款网页端文字互动冒险游戏。玩家创建一本属于自己的小说，输入世界观、规则和角色设定，再接入自己的 AI 大模型供应商。之后 AI 会生成小说正文、人物、线索和状态变化，玩家通过输入角色行动推进故事，直到结局。

## 功能

- 创建故事：标题、题材、风格、世界观、世界规则、角色身份、能力、弱点和目标。
- 玩家自选 AI：支持填写 OpenAI 兼容格式的 `Base URL`、模型名和 API Key。
- AI 续写：根据玩家行动继续生成小说正文、裁判结果、状态变化和下一步抉择。
- 本地存档：故事和进度保存在玩家浏览器本地 IndexedDB，可读取多个存档。
- 阅读器：中间阅读小说，左右透明侧栏展示角色卡、世界设定、世界记忆、人物、线索和状态。
- 独立滚动：小说正文、左右侧栏和展开模块内容均可单独滚动。
- 导出故事：导出纯小说正文，不包含行动建议。

## 本地开发

需要 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

开发服务器默认运行在 Vite 提示的地址，例如 `http://localhost:5173/create`。

如果需要本地独立代理服务：

```bash
npm run dev:proxy
```

## 测试与构建

```bash
npm test
npm run build
```

构建产物会生成到 `dist/`，该目录不提交到 GitHub。

## AI 模型配置

玩家在网页中自行填写：

- `Base URL`：模型供应商的 OpenAI 兼容接口地址，例如 `https://example.com/v1`
- `模型名`：供应商提供的模型 ID
- `API Key`：玩家自己的密钥

API Key 会随请求发送到后端代理，不会写入导出的故事文本。模型配置记忆功能使用浏览器 `localStorage`，故事存档使用浏览器 IndexedDB。

## 生产部署

前端由 Nginx 托管 `dist/`，AI 请求通过 `scripts/ai-proxy.mjs` 转发。

常见部署流程：

```bash
npm install
npm run build
pm2 start scripts/ai-proxy.mjs --name worldbook-ai-proxy
pm2 save
```

Nginx 需要：

- 静态文件根目录指向构建后的 `dist/`
- `/api/ai-proxy` 反向代理到 `http://127.0.0.1:8787`
- SPA fallback 到 `index.html`

更完整的服务器部署示例见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 安全说明

- 不要把真实 API Key 提交到 GitHub。
- 本项目不内置任何模型供应商密钥。
- 生产代理默认只允许 HTTPS 的模型 Base URL。
- 如果公开给他人使用，应提示玩家自行承担模型调用费用。

