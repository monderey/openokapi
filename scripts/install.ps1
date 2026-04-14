$ErrorActionPreference = "Stop"

$colors = @{
    Info    = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
}

function Log-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $colors.Info
}

function Log-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $colors.Success
}

function Log-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $colors.Warning
}

function Log-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $colors.Error
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..")
$distPkgPath = Join-Path $rootDir "dist-pkg"

$wrapperContent = @"
@echo off
node "$distPkgPath\cli\index.cjs" %*
"@

$installDir = Join-Path $env:LOCALAPPDATA "OpenOKAPI\bin"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

$wrapperPath = Join-Path $installDir "openokapi.bat"
$wrapperContent | Set-Content -Path $wrapperPath -Encoding ASCII

$path = [Environment]::GetEnvironmentVariable("Path", "User")
if ($path -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$installDir;$path", "User")
    Log-Info "Added to PATH: $installDir"
    Log-Warning "Restart terminal to use openokapi."
}

Log-Success "Installed: $wrapperPath"