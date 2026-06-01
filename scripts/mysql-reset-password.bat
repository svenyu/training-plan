@echo off
chcp 65001 >nul
setlocal EnableExtensions

REM ============================================================
REM MySQL 8 root 密码重置（本机 mysql8 服务）
REM 必须以【管理员身份】运行此脚本
REM 安装目录：G:\Program Files\mysql-8.0.11-winx64
REM ============================================================

set MYSQL_HOME=G:\Program Files\mysql-8.0.11-winx64
set MYSQL_BIN=%MYSQL_HOME%\bin
set MYSQL_INI=%MYSQL_HOME%\my.ini
set SERVICE_NAME=mysql8

REM ========== 在这里改成你要设置的新密码 ==========
set NEW_PASSWORD=root
REM ==============================================

set INIT_FILE=%TEMP%\mysql-init-reset.txt

echo.
echo [1/5] 生成临时初始化文件...
(
  echo ALTER USER 'root'@'localhost' IDENTIFIED BY '%NEW_PASSWORD%';
  echo FLUSH PRIVILEGES;
) > "%INIT_FILE%"

echo [2/5] 停止 MySQL 服务 %SERVICE_NAME% ...
net stop %SERVICE_NAME%
if errorlevel 1 (
  echo 停止服务失败。请右键本脚本 -^> 以管理员身份运行
  pause
  exit /b 1
)

echo [3/5] 使用 init-file 启动 mysqld 执行改密（约 10~30 秒）...
echo       若窗口长时间无响应，可 Ctrl+C 后改用手动步骤（见 docs\MySQL忘记密码-重置步骤.md）
start /wait "" "%MYSQL_BIN%\mysqld.exe" --defaults-file="%MYSQL_INI%" --init-file="%INIT_FILE%" --console

echo [4/5] 启动 MySQL 服务...
net start %SERVICE_NAME%

echo [5/5] 删除临时文件...
del /f /q "%INIT_FILE%" 2>nul

echo.
echo ========================================
echo 若上面 net start 成功，新密码为：
echo   %NEW_PASSWORD%
echo.
echo 请测试登录：
echo   "%MYSQL_BIN%\mysql.exe" -u root -p
echo.
echo 成功后请修改 server\.env ：
echo   DATABASE_URL="mysql://root:%NEW_PASSWORD%@localhost:3306/spine_train"
echo ========================================
echo.
pause
