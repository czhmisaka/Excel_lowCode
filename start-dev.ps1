# Check-in System Development Environment Startup Script
# Pure English version for maximum compatibility
# Supports Windows PowerShell 2.0+

# Project root directory
$PROJECT_ROOT = $PSScriptRoot
$BACKEND_DIR = "$PROJECT_ROOT\backend"
$FRONTEND_DIR = "$PROJECT_ROOT\fe"

Write-Host ""
Write-Host "========================================"
Write-Host "  Check-in System Dev Environment Startup"
Write-Host "========================================"
Write-Host ""

# Check directories
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "[ERROR] backend directory not found: $BACKEND_DIR"
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

if (-not (Test-Path $FRONTEND_DIR)) {
    Write-Host "[ERROR] fe directory not found: $FRONTEND_DIR"
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "[INFO] Directory structure check passed"

# Check npm dependencies
$backendPackageJson = "$BACKEND_DIR\package.json"
$frontendPackageJson = "$FRONTEND_DIR\package.json"

if (Test-Path $backendPackageJson) {
    $backendNodeModules = "$BACKEND_DIR\node_modules"
    if (-not (Test-Path $backendNodeModules)) {
        Write-Host "[WARNING] backend dependencies not installed, run: cd backend; npm install"
    } else {
        Write-Host "[INFO] backend dependencies installed"
    }
}

if (Test-Path $frontendPackageJson) {
    $frontendNodeModules = "$FRONTEND_DIR\node_modules"
    if (-not (Test-Path $frontendNodeModules)) {
        Write-Host "[WARNING] fe dependencies not installed, run: cd fe; npm install"
    } else {
        Write-Host "[INFO] fe dependencies installed"
    }
}

# Get ports
$backendPort = 3000
$frontendPort = 5173

$backendEnvFile = "$BACKEND_DIR\.env"
if (Test-Path $backendEnvFile) {
    try {
        $content = Get-Content $backendEnvFile
        foreach ($line in $content) {
            if ($line -match "^PORT=(\d+)") {
                $port = [int]$matches[1]
                if ($port -ge 1 -and $port -le 65535) {
                    $backendPort = $port
                    break
                }
            }
        }
    } catch {
        Write-Host "[WARNING] Failed to read backend config, using default port: $backendPort"
    }
}

$viteConfigFile = "$FRONTEND_DIR\vite.config.ts"
if (Test-Path $viteConfigFile) {
    try {
        $content = Get-Content $viteConfigFile
        foreach ($line in $content) {
            if ($line -match "port:\s*(\d+)") {
                $port = [int]$matches[1]
                if ($port -ge 1 -and $port -le 65535) {
                    $frontendPort = $port
                    break
                }
            }
        }
    } catch {
        Write-Host "[WARNING] Failed to read frontend config, using default port: $frontendPort"
    }
}

Write-Host ""
Write-Host "[INFO] Preparing to start development environment..."
Write-Host ""

# Start backend service
Write-Host "[INFO] Starting backend service (port: $backendPort)..."

# Create simple backend command file
$backendScriptFile = "$env:TEMP\start_backend_english.ps1"
"cd `"$BACKEND_DIR`"" | Out-File -FilePath $backendScriptFile -Encoding ASCII
"Write-Host 'Starting backend service...'" | Out-File -FilePath $backendScriptFile -Encoding ASCII -Append
"npm run dev" | Out-File -FilePath $backendScriptFile -Encoding ASCII -Append

# Start backend process
$backendArgs = "-NoExit -File `"$backendScriptFile`""
Start-Process powershell.exe -ArgumentList $backendArgs

Write-Host "[INFO] Backend service process started"

# Wait 2 seconds
Write-Host "[INFO] Waiting for backend service to start..."
Start-Sleep -Seconds 2

# Start frontend service
Write-Host "[INFO] Starting frontend service (port: $frontendPort)..."

# Create simple frontend command file
$frontendScriptFile = "$env:TEMP\start_frontend_english.ps1"
"cd `"$FRONTEND_DIR`"" | Out-File -FilePath $frontendScriptFile -Encoding ASCII
"Write-Host 'Starting frontend service...'" | Out-File -FilePath $frontendScriptFile -Encoding ASCII -Append
"npm run dev" | Out-File -FilePath $frontendScriptFile -Encoding ASCII -Append

# Start frontend process
$frontendArgs = "-NoExit -File `"$frontendScriptFile`""
Start-Process powershell.exe -ArgumentList $frontendArgs

Write-Host "[INFO] Frontend service process started"

Write-Host "[SUCCESS] Development environment startup completed!"
Write-Host ""
Write-Host "Access URLs:"
Write-Host "  Backend API: http://localhost:$backendPort"
Write-Host "  Frontend App: http://localhost:$frontendPort"
Write-Host ""
Write-Host "PowerShell windows will remain open"

Write-Host ""
Write-Host "========================================"
Write-Host "       Script execution completed"
Write-Host "========================================"
Write-Host ""

Write-Host "Main script completed, window remains open."
Write-Host "You can close this window or press Ctrl+C to exit."

# Do not wait for user input, end directly
