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

## 如何游玩

世界书提供两种使用方式：本地部署和服务器部署。只想自己玩，选择本地部署；想让别人通过 IP 或域名访问，选择服务器部署。

### 方式一：本地部署

本地部署适合玩家在自己的电脑上游玩，不需要云服务器。故事存档和 AI 模型配置都会保存在玩家自己的浏览器本地。

#### 1. 安装 Node.js

先安装 Node.js 18 或更高版本。

- Windows / macOS：从 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本并安装。
- Ubuntu / Debian：可以使用系统包管理器或 NodeSource 安装 Node.js。

安装后，在终端里确认版本：

```bash
node -v
npm -v
```

#### 2. 下载项目

方式一：在 GitHub 页面点击 `Code` -> `Download ZIP`，下载后解压。

方式二：使用 Git 克隆：

```bash
git clone https://github.com/230517ydyzs-maker/world-book.git
cd world-book
```

如果代码在 `codex/story-generator-mvp` 分支，可以切换到该分支：

```bash
git checkout codex/story-generator-mvp
```

#### 3. 安装依赖并启动

在项目目录执行：

```bash
npm install
npm run dev
```

终端会显示一个本地地址，通常是：

```text
http://localhost:5173/
```

打开创建页面：

```text
http://localhost:5173/create
```

#### 4. 配置 AI 模型

进入网页后，玩家需要填写自己的模型供应商信息：

- `Base URL`：模型供应商的 OpenAI 兼容接口地址，例如 `https://example.com/v1`
- `模型名`：供应商提供的模型 ID
- `API Key`：玩家自己的密钥

本地游玩时，AI 请求仍然会从玩家自己的电脑发出。模型调用费用由玩家自己的模型供应商账号承担。

#### 5. 存档位置

- 故事存档保存在浏览器 IndexedDB。
- AI 模型配置记忆保存在浏览器 `localStorage`。
- 清理浏览器站点数据可能会删除本地存档。
- 更换浏览器或电脑后，原浏览器里的本地存档不会自动同步。

### 方式二：服务器部署

服务器部署适合把世界书放到云服务器上，让其他玩家通过公网 IP 或域名访问。

常见部署方式是：

1. 在服务器安装 Node.js、Nginx 和 PM2。
2. 上传或克隆本项目代码。
3. 执行 `npm install` 安装依赖。
4. 执行 `npm run build` 生成前端静态文件。
5. 使用 PM2 启动 `scripts/ai-proxy.mjs` 作为 AI 请求代理。
6. 使用 Nginx 托管 `dist/`，并把 `/api/ai-proxy` 反向代理到本地代理服务。

常用命令：

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

更完整的 Ubuntu + Nginx + PM2 部署示例见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 本地开发

开发者同样需要 Node.js 18 或更高版本。

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

## 安全说明

- 不要把真实 API Key 提交到 GitHub。
- 本项目不内置任何模型供应商密钥。
- 生产代理默认只允许 HTTPS 的模型 Base URL。
- 如果公开给他人使用，应提示玩家自行承担模型调用费用。
