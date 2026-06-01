# MySQL 8 忘记 root 密码 — 重置步骤

你的环境：

| 项目 | 值 |
|------|-----|
| 安装目录 | `G:\Program Files\mysql-8.0.11-winx64` |
| 配置文件 | `G:\Program Files\mysql-8.0.11-winx64\my.ini` |
| 数据目录 | `G:\Program Files\mysql-8.0.11-winx64\Data` |
| Windows 服务名 | **mysql8** |
| 端口 | 3306 |

---

## 方法一：一键脚本（推荐）

1. 用记事本打开 `scripts\mysql-reset-password.bat`
2. 修改这一行为你的新密码：
   ```bat
   set NEW_PASSWORD=SpineTrain@2026
   ```
3. **右键**该文件 → **以管理员身份运行**
4. 等待执行完毕，用新密码测试：
   ```powershell
   & "G:\Program Files\mysql-8.0.11-winx64\bin\mysql.exe" -u root -p
   ```
5. 修改项目 `server\.env`：
   ```env
   DATABASE_URL="mysql://root:你的新密码@localhost:3306/spine_train"
   ```

---

## 方法二：手动操作（脚本失败时用）

### 步骤 1：停止服务

**以管理员**打开 PowerShell 或 CMD：

```powershell
net stop mysql8
```

### 步骤 2：创建改密文件

在 `C:\mysql-init.txt` 写入（**把密码改成你要的**）：

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'SpineTrain@2026';
FLUSH PRIVILEGES;
```

注意：文件保存为 **UTF-8** 或 **ANSI** 均可，路径不要有中文。

### 步骤 3：用 init-file 启动一次 mysqld

仍用**管理员** CMD，执行（会占用当前窗口，等十几秒）：

```powershell
cd "G:\Program Files\mysql-8.0.11-winx64\bin"
.\mysqld.exe --defaults-file="G:\Program Files\mysql-8.0.11-winx64\my.ini" --init-file=C:\mysql-init.txt --console
```

看到类似 `ready for connections` 且无报错后，按 **Ctrl+C** 结束该窗口。

### 步骤 4：正常启动服务

```powershell
net start mysql8
```

### 步骤 5：验证登录

```powershell
& "G:\Program Files\mysql-8.0.11-winx64\bin\mysql.exe" -u root -p
```

输入新密码，能进入 `mysql>` 即成功。

### 步骤 6：建项目库

```sql
CREATE DATABASE IF NOT EXISTS spine_train
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

## 方法三：skip-grant-tables（方法二不行时）

### 1. 停止服务

```powershell
net stop mysql8
```

### 2. 跳过权限表启动（窗口 A，保持打开）

```powershell
cd "G:\Program Files\mysql-8.0.11-winx64\bin"
.\mysqld.exe --defaults-file="G:\Program Files\mysql-8.0.11-winx64\my.ini" --skip-grant-tables --shared-memory --console
```

### 3. 新开窗口 B 连接并改密

```powershell
cd "G:\Program Files\mysql-8.0.11-winx64\bin"
.\mysql.exe -u root
```

在 `mysql>` 里执行：

```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'SpineTrain@2026';
exit;
```

### 4. 关闭窗口 A（Ctrl+C），再启动服务

```powershell
net start mysql8
```

---

## 常见问题

### `net stop mysql8` 提示拒绝访问

→ 必须用**管理员**身份运行 CMD / PowerShell。

### `Access denied` 改密后仍登不上

- 确认改的是 `'root'@'localhost'`
- 若用 Navicat 连 `127.0.0.1`，可再执行：
  ```sql
  ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '你的密码';
  FLUSH PRIVILEGES;
  ```

### 端口 3306 被占用

```powershell
netstat -ano | findstr 3306
```

确认只有 mysql8 在监听；若有残留 `mysqld.exe`，在任务管理器结束后再 `net start mysql8`。

### 本机还有 phpStudy / XAMPP 等

可能装了**第二个 MySQL**，端口冲突。本项目需连 **3306 上的 mysql8**（目录为你提供的 `G:\Program Files\mysql-8.0.11-winx64`）。

---

## 重置成功后

```powershell
cd G:\workspace2026\training-plan\server
copy .env.example .env
# 编辑 DATABASE_URL 中的密码

npm install
npx prisma migrate deploy
npm run start:dev
```
