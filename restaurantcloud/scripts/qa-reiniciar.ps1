[CmdletBinding()]
param(
    [string]$EnvFile = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$RaizDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = Join-Path $RaizDir ".env"
}
$ComposeFile = Join-Path $RaizDir "docker-compose.prod.yml"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Error "No existe '$EnvFile'. Ejecuta primero .\scripts\generar-env.ps1 qa"
    exit 1
}

if (-not $Force) {
    $resp = Read-Host "Esto eliminará los contenedores y volúmenes de QA para recrearlos desde cero. ¿Continuar? [s/N]"
    if ($resp -notin @("s", "S", "si", "SI", "y", "Y")) {
        Write-Host "Operación cancelada."
        exit 0
    }
}

Write-Host "Bajando entorno QA y eliminando volúmenes..."
& docker compose -f $ComposeFile --env-file $EnvFile down -v --remove-orphans
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Levantando entorno QA..."
& docker compose -f $ComposeFile --env-file $EnvFile up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Preparando datos de demostración..."
& (Join-Path $PSScriptRoot "qa-preparar.ps1") -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
