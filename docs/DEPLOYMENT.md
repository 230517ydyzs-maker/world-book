# 部署说明

以下示例适用于 Ubuntu 服务器、Nginx、PM2。

## 1. 安装依赖

```bash
sudo apt update
sudo apt install -y nginx unzip
```

安装 Node.js 后，在项目目录执行：

```bash
npm install
npm run build
```

## 2. 部署静态文件

```bash
sudo mkdir -p /var/www/worldbook
sudo rm -rf /var/www/worldbook/dist
sudo cp -r dist /var/www/worldbook/dist
sudo chown -R www-data:www-data /var/www/worldbook
```

## 3. 启动 AI 代理

```bash
npm install -g pm2
pm2 start scripts/ai-proxy.mjs --name worldbook-ai-proxy
pm2 save
```

代理默认监听 `127.0.0.1:8787`。

## 4. Nginx 配置示例

创建 `/etc/nginx/sites-available/worldbook`：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    root /var/www/worldbook/dist;
    index index.html;

    location /api/ai-proxy {
        proxy_pass http://127.0.0.1:8787/api/ai-proxy;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/worldbook /etc/nginx/sites-enabled/worldbook
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 5. 更新部署

本地生成 zip 后，上传到服务器并执行：

```bash
cd ~
rm -rf worldbook-new
mkdir worldbook-new
unzip -o worldbook-fixed-scroll-sidebars-20260513.zip -d worldbook-new

sudo cp -a /var/www/worldbook/dist /var/www/worldbook/dist.bak.$(date +%Y%m%d%H%M%S)
sudo rm -rf /var/www/worldbook/dist
sudo cp -r worldbook-new/dist /var/www/worldbook/dist
sudo chown -R www-data:www-data /var/www/worldbook

sudo nginx -t
sudo systemctl reload nginx
```

