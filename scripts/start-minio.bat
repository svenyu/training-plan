@echo off
chcp 65001 >nul
setlocal

REM MinIO 数据目录（可按需修改）
set MINIO_DATA=%~dp0..\data\minio
if not exist "%MINIO_DATA%" mkdir "%MINIO_DATA%"

REM 若 minio 在 PATH 中可直接用 minio；否则请改下面 MINIO_EXE 为完整路径
set MINIO_EXE=minio
where minio >nul 2>&1
if errorlevel 1 (
  if exist "%~dp0minio.exe" (
    set MINIO_EXE=%~dp0minio.exe
  ) else (
    echo [错误] 未找到 minio.exe
    echo 请下载 https://dl.min.io/server/minio/release/windows-amd64/minio.exe
    echo 放到 scripts\minio.exe 或加入系统 PATH
  pause
    exit /b 1
  )
)

echo 启动 MinIO...
echo   API:      http://localhost:9000
echo   控制台:   http://localhost:9001
echo   账号密码: minioadmin / minioadmin
echo   数据目录: %MINIO_DATA%
echo.
echo 首次请打开控制台创建 bucket: spine-train （访问策略可设为 public）
echo.

set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin

"%MINIO_EXE%" server "%MINIO_DATA%" --console-address ":9001"

pause
