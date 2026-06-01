# 脊柱侧弯康复训练小程序（v1 精简版）

家长微信登录 → 维护动作库（MinIO 视频）→ 制定计划（天数 / 日期范围）→ 开始训练打分 → 一次性订阅提醒。

## 文档

- **[本地安装（无 Docker）](docs/本地安装-无Docker.md)** ← 没有 Docker 请看这个
- **[服务器部署](docs/服务器部署.md)** ← 云服务器 / 正式上线
- [环境配置说明](docs/环境配置说明.md)
- [v1 精简设计](docs/v1-精简设计.md)

---

## 环境要求

| 软件 | 版本要求 |
|------|----------|
| **Node.js** | **≥ 18.18**（推荐 **20.x LTS**；22.x LTS 亦可） |
| **npm** | ≥ 9（随 Node 20 自带即可） |
| **MySQL** | 8.0+ |
| **MinIO** | 最新稳定版（单文件 `minio.exe`） |

安装后请确认：

```powershell
node -v    # 应显示 v18.18+ 或 v20.x / v22.x
npm -v     # 应显示 9.x 或 10.x
```

- 下载 Node.js：https://nodejs.org/（选 **20 LTS**）
- 使用 nvm-windows 时，项目根目录有 `.nvmrc`，可执行：`nvm install 20 && nvm use 20`

> 不支持 Node 16 及以下（NestJS 10、Vite 5、Prisma 6 均需 Node 18+）。

---

## 快速启动（无 Docker）

需要本机安装：**Node.js 20 LTS**、**MySQL 8**、**MinIO**（单文件，见下文）。

### 1. MySQL 建库

```sql
CREATE DATABASE spine_train CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

或：`mysql -u root -p < scripts\init-mysql.sql`

### 2. 启动 MinIO

```powershell
# 将 minio.exe 放到 scripts\ 目录，或安装到 PATH 后执行：
.\scripts\start-minio.bat
```

浏览器打开 http://localhost:9001 ，登录 `minioadmin` / `minioadmin`，创建桶 **`spine-train`**（开发期可设为 public 读）。

### 3. 后端

```powershell
cd server
copy .env.example .env
```

编辑 `.env`：

- `DATABASE_URL` — 改成你的 MySQL 密码，例如 `mysql://root:你的密码@localhost:3306/spine_train`
- `WECHAT_APPID` / `WECHAT_SECRET` — 小程序后台获取
- `WECHAT_SUBSCRIBE_TEMPLATE_ID` — 订阅消息模板（可选，不配则不发提醒）

```powershell
npm install
npm run prisma:generate   # 生成 @prisma/client 类型，否则 TypeScript 编译报错
npx prisma migrate deploy
npm run start:dev
```

API：`http://localhost:3000/api/v1`

### 4. 小程序

```powershell
cd miniapp
npm install
```

编辑 `miniapp/src/config.js` 的 `API_BASE`（真机调试用电脑局域网 IP，不要用 localhost）。

```powershell
npm run dev:mp-weixin
```

微信开发者工具打开：`miniapp\dist\dev\mp-weixin`  
开发阶段可勾选「不校验合法域名」。

更详细的图文步骤见 **[docs/本地安装-无Docker.md](docs/本地安装-无Docker.md)**。

---

## 可选：使用 Docker

若本机已安装 Docker Desktop，可一键启动 MySQL + MinIO：

```bash
docker compose up -d
```

然后同样执行 `server` 与 `miniapp` 的步骤。Docker 与手动安装**二选一**即可。

---

## 一次性订阅消息

1. [微信公众平台](https://mp.weixin.qq.com/) → 订阅消息 → 申请模板。
2. 模板 ID 填入 `server/.env` 与 `miniapp/src/config.js`。
3. 用户在小程序「我的」授权 → 每授权 1 次可发送 1 条提醒。

---

## 目录结构

```
training-plan/
├── scripts/           # start-minio.bat、init-mysql.sql
├── server/            # NestJS API
├── miniapp/           # uni-app 小程序
├── docs/
└── docker-compose.yml # 可选，非必须
```
