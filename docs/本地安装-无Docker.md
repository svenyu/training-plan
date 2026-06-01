# 本地安装指南（无 Docker）

适用于 Windows，本机直接安装 **Node.js**、**MySQL** 和 **MinIO**（无需 Docker）。

---

## 〇、安装 Node.js

| 项目 | 要求 |
|------|------|
| 最低版本 | **18.18.0** |
| **推荐** | **20.x LTS**（长期支持，与 NestJS / uni-app / Prisma 兼容最好） |
| 可选 | 22.x LTS |
| npm | ≥ 9（随 Node 20 安装包自带） |

1. 打开 https://nodejs.org/ ，下载并安装 **20 LTS**（Windows Installer `.msi`）。
2. 安装时勾选 **Add to PATH**。
3. 新开 PowerShell 验证：

```powershell
node -v   # 示例：v20.18.0
npm -v    # 示例：10.8.2
```

### 使用 nvm-windows（可选）

若本机已装 [nvm-windows](https://github.com/coreybutler/nvm-windows)：

```powershell
cd G:\workspace2026\training-plan
nvm install 20
nvm use 20
```

项目根目录 `.nvmrc` 已写明推荐版本 `20`。

### 常见问题

- **`node` 不是内部或外部命令**：重装 Node 并勾选 PATH，或重启终端。
- **版本过低**（如 v16）：需升级到 18.18+，否则 `npm install` / `prisma` 可能报错。
- **权限错误**：不要用管理员身份乱改全局目录；项目在普通用户目录下即可。

---

## 一、安装 MySQL

### 方式 A：已有 MySQL / MariaDB

跳过安装，只需建库（见下方 SQL）。

### 方式 B：新安装（推荐 MySQL 8）

1. 下载：[MySQL Community Server](https://dev.mysql.com/downloads/mysql/)（Windows MSI）。
2. 安装时设置 **root 密码**（请记住，后面要写进 `.env`）。
3. 打开 **MySQL 命令行** 或 **Navicat / DBeaver**，执行：

```sql
CREATE DATABASE IF NOT EXISTS spine_train
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

也可直接运行项目里的脚本（把 `-p` 后的密码改成你的）：

```powershell
mysql -u root -p < scripts\init-mysql.sql
```

4. 修改 `server/.env` 中的连接串（密码改成你的）：

```env
DATABASE_URL="mysql://root:你的密码@localhost:3306/spine_train"
```

**忘记 root 密码？** 见 [MySQL忘记密码-重置步骤.md](MySQL忘记密码-重置步骤.md)（本机服务名 `mysql8`，目录 `G:\Program Files\mysql-8.0.11-winx64`）。

---

## 二、安装并启动 MinIO

MinIO 是单个可执行文件，用来存训练视频（和 Docker 里用的是同一个东西）。

### 1. 下载

- 打开 https://dl.min.io/server/minio/release/windows-amd64/minio.exe  
- 放到例如：`G:\tools\minio\minio.exe`

或用 winget（若已安装）：

```powershell
winget install MinIO.MinIO
```

### 2. 启动

在项目根目录双击运行，或 PowerShell 执行：

```powershell
.\scripts\start-minio.bat
```

默认：

| 项目 | 地址 |
|------|------|
| API（上传/播放） | http://localhost:9000 |
| 控制台 | http://localhost:9001 |
| 账号 / 密码 | minioadmin / minioadmin |

### 3. 创建存储桶

浏览器打开 http://localhost:9001 ，登录后：

1. 左侧 **Buckets** → **Create Bucket**
2. 名称填：`spine-train`
3. 创建后在该桶 **Access Policy** 设为 **public**（开发阶段方便小程序播视频；上线可改私有+签名）

与 `server/.env` 保持一致即可：

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=spine-train
MINIO_PUBLIC_URL=http://localhost:9000/spine-train
```

> **真机调试小程序**时，手机访问不到电脑的 `localhost`。需把 `MINIO_PUBLIC_URL` 和 `miniapp/src/config.js` 的 `API_BASE` 都改成你电脑的 **局域网 IP**（如 `http://192.168.1.100:9000/spine-train`），并在微信后台配置合法域名（开发阶段可在开发者工具勾选「不校验合法域名」）。

---

## 三、启动后端

```powershell
cd server
copy .env.example .env
# 编辑 .env：DATABASE_URL、WECHAT_APPID、WECHAT_SECRET 等

npm install
npm run prisma:generate   # 生成 @prisma/client 类型，否则 TypeScript 编译报错
npx prisma migrate deploy
npm run start:dev
```

浏览器访问：http://localhost:3000/api/v1/auth/me（未登录会 401，说明服务已起来）。

---

## 四、启动小程序

```powershell
cd miniapp
npm install
```

编辑 `miniapp/src/config.js`：

```javascript
export const API_BASE = 'http://192.168.x.x:3000/api/v1';  // 改成你电脑 IP
```

```powershell
npm run dev:mp-weixin
```

用 **微信开发者工具** 打开目录：`miniapp\dist\dev\mp-weixin`。

---

## 五、日常开发要开几个窗口

| 窗口 | 命令 | 说明 |
|------|------|------|
| — | Node 20 已安装 | 无需单独启动 |
| 1 | `scripts\start-minio.bat` | MinIO |
| 2 | `cd server && npm run start:dev` | API（需 Node ≥ 18.18） |
| 3 | `cd miniapp && npm run dev:mp-weixin` | 编译小程序 |
| 4 | 微信开发者工具 | 预览 |

MySQL 安装后会作为 Windows 服务常驻，一般不用每次手动开。

---

## 六、不想装 MinIO 时（仅调其它功能）

可暂时不传视频，动作只填文字说明；上传接口会失败，不影响登录、计划、打分流程。  
要测视频上传，仍需 MinIO（或以后改成腾讯云 COS，需改代码）。

---

## 七、可选：以后再用 Docker

若以后安装了 Docker Desktop，仍可使用项目根目录的 `docker compose up -d` 一键起 MySQL + MinIO，与本文互斥，**二选一**即可。
