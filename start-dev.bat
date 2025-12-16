@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ========================================
REM       打卡系统开发环境启动脚本 (Windows)
REM ========================================
REM 功能：同时启动backend和fe的dev模式，打开两个命令提示符窗口
REM 支持：Windows 10/11 原生支持
REM ========================================

REM 颜色定义
set "ESC="
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "NC=%ESC%[0m"

REM 日志函数
:log_info
echo %BLUE%[INFO]%NC% %*
exit /b

:log_success
echo %GREEN%[SUCCESS]%NC% %*
exit /b

:log_warning
echo %YELLOW%[WARNING]%NC% %*
exit /b

:log_error
echo %RED%[ERROR]%NC% %*
exit /b

REM 项目根目录
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%fe"

echo.
echo ========================================
echo       打卡系统开发环境启动脚本
echo ========================================
echo.

REM 检查目录是否存在
call :check_directories
if errorlevel 1 (
    pause
    exit /b 1
)

REM 检查npm依赖
call :check_dependencies

REM 获取端口
call :get_backend_port
set "BACKEND_PORT=%BACKEND_PORT%"
call :get_frontend_port
set "FRONTEND_PORT=%FRONTEND_PORT%"

echo.
call :log_info "准备启动开发环境..."
echo.

REM 启动后端服务
call :log_info "启动后端服务 (端口: %BACKEND_PORT%)..."
start "后端服务 (%BACKEND_PORT%)" cmd /k "cd /d "%BACKEND_DIR%" && echo 启动后端服务... && npm run dev"

REM 等待2秒，确保后端启动
timeout /t 2 /nobreak >nul

REM 启动前端服务
call :log_info "启动前端服务 (端口: %FRONTEND_PORT%)..."
start "前端服务 (%FRONTEND_PORT%)" cmd /k "cd /d "%FRONTEND_DIR%" && echo 启动前端服务... && npm run dev"

call :log_success "开发环境启动完成！"
echo.
echo 访问地址：
echo   后端API: http://localhost:%BACKEND_PORT%
echo   前端应用: http://localhost:%FRONTEND_PORT%
echo.
echo 命令提示符窗口会保持打开状态
echo 按任意键关闭本窗口...
echo.
echo ========================================
echo       脚本执行完成
echo ========================================
echo.

pause
exit /b 0

REM ========================================
REM               函数定义
REM ========================================

:check_directories
call :log_info "检查项目目录结构..."
if not exist "%BACKEND_DIR%" (
    call :log_error "backend目录不存在: %BACKEND_DIR%"
    exit /b 1
)
if not exist "%FRONTEND_DIR%" (
    call :log_error "fe目录不存在: %FRONTEND_DIR%"
    exit /b 1
)
call :log_success "项目目录结构检查通过"
exit /b 0

:check_dependencies
call :log_info "检查npm依赖..."
if exist "%BACKEND_DIR%\package.json" (
    if not exist "%BACKEND_DIR%\node_modules" (
        call :log_warning "backend依赖未安装，请运行: cd backend && npm install"
    ) else (
        call :log_info "backend依赖已安装"
    )
)
if exist "%FRONTEND_DIR%\package.json" (
    if not exist "%FRONTEND_DIR%\node_modules" (
        call :log_warning "fe依赖未安装，请运行: cd fe && npm install"
    ) else (
        call :log_info "fe依赖已安装"
    )
)
exit /b 0

:get_backend_port
set "BACKEND_PORT=3000"
set "BACKEND_ENV_FILE=%BACKEND_DIR%\.env"
if exist "%BACKEND_ENV_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr /r "^PORT=" "%BACKEND_ENV_FILE%"') do (
        set "port=%%a"
        set "port=!port: =!"
        if defined port (
            echo !port! | findstr /r "^[0-9][0-9]*$" >nul
            if !errorlevel! equ 0 (
                if !port! geq 1 if !port! leq 65535 (
                    set "BACKEND_PORT=!port!"
                ) else (
                    call :log_warning "后端端口配置无效: !port!，使用默认端口: 3000"
                )
            ) else (
                call :log_warning "后端端口配置无效或未找到，使用默认端口: 3000"
            )
        ) else (
            call :log_warning "后端配置文件不存在有效端口，使用默认端口: 3000"
        )
    )
) else (
    call :log_warning "后端配置文件不存在: %BACKEND_ENV_FILE%，使用默认端口: 3000"
)
exit /b 0

:get_frontend_port
set "FRONTEND_PORT=5173"
set "VITE_CONFIG_FILE=%FRONTEND_DIR%\vite.config.ts"
if exist "%VITE_CONFIG_FILE%" (
    for /f "tokens=*" %%a in ('type "%VITE_CONFIG_FILE%" ^| findstr /r "port:[[:space:]]*[0-9][0-9]*"') do (
        for /f "tokens=*" %%b in ("%%a") do (
            set "line=%%b"
            set "line=!line:port:=!"
            set "line=!line: =!"
            set "line=!line:,=!"
            set "line=!line:`=!"
            echo !line! | findstr /r "^[0-9][0-9]*$" >nul
            if !errorlevel! equ 0 (
                if !line! geq 1 if !line! leq 65535 (
                    set "FRONTEND_PORT=!line!"
                    goto :found_port
                )
            )
        )
    )
    call :log_warning "前端端口配置无效或未找到，使用默认端口: 5173"
) else (
    call :log_warning "前端配置文件不存在: %VITE_CONFIG_FILE%，使用默认端口: 5173"
)
:found_port
exit /b 0
