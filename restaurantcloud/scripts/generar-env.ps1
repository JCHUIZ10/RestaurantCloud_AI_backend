[CmdletBinding()]
param(
    [ValidateSet("qa", "produccion")]
    [string]$Modo = "qa",
    [string]$Sitio = "",
    [string]$FilesDomain = "",
    [string]$Salida = ""
)

$ErrorActionPreference = "Stop"

$RaizDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($Salida)) {
    $Salida = Join-Path $RaizDir ".env"
}

if (Test-Path -LiteralPath $Salida) {
    Write-Error "Ya existe '$Salida'. Este script nunca sobrescribe un .env existente. Respalda o elimina primero ese archivo si deseas regenerarlo."
    exit 1
}

$Plantilla = if ($Modo -eq "qa") {
    Join-Path $RaizDir ".env.qa.example"
} else {
    Join-Path $RaizDir ".env.production.example"
}

if (-not (Test-Path -LiteralPath $Plantilla)) {
    Write-Error "No se encontró la plantilla '$Plantilla'."
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker no está instalado o no está en PATH."
    exit 1
}

function New-RandomHex {
    param([int]$Bytes = 24)
    $buf = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($buf)
    } finally {
        $rng.Dispose()
    }
    return ([System.BitConverter]::ToString($buf) -replace "-", "").ToLowerInvariant()
}

function New-AppKey {
    $buf = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($buf)
    } finally {
        $rng.Dispose()
    }
    return "base64:" + [System.Convert]::ToBase64String($buf)
}

Write-Host "Construyendo o reutilizando imagen de API para generar claves JWT..."
$ImagenApi = "restaurantcloud-api:prod"
$Dockerfile = Join-Path $RaizDir "infra\docker\api.Dockerfile"
& docker build -q -f $Dockerfile --target prod -t $ImagenApi $RaizDir | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló la construcción de la imagen de la API para generar las claves JWT."
    exit $LASTEXITCODE
}

$JwtSalida = & docker run --rm --entrypoint php $ImagenApi artisan jwt:claves
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló la ejecución de 'php artisan jwt:claves' dentro del contenedor."
    exit $LASTEXITCODE
}

$JwtPrivLine = ($JwtSalida | Where-Object { $_ -match '^JWT_PRIVATE_KEY=' } | Select-Object -First 1)
$JwtPubLine = ($JwtSalida | Where-Object { $_ -match '^JWT_PUBLIC_KEY=' } | Select-Object -First 1)

if ([string]::IsNullOrWhiteSpace($JwtPrivLine) -or [string]::IsNullOrWhiteSpace($JwtPubLine)) {
    Write-Error "No se pudieron obtener JWT_PRIVATE_KEY y JWT_PUBLIC_KEY desde artisan jwt:claves."
    exit 1
}

$Reemplazos = @{
    "APP_KEY"                          = "APP_KEY=$(New-AppKey)"
    "JWT_PRIVATE_KEY"                  = $JwtPrivLine.TrimEnd("`r")
    "JWT_PUBLIC_KEY"                   = $JwtPubLine.TrimEnd("`r")
    "POSTGRES_PASSWORD"                = "POSTGRES_PASSWORD=$(New-RandomHex 24)"
    "REDIS_PASSWORD"                   = "REDIS_PASSWORD=$(New-RandomHex 24)"
    "MINIO_ROOT_PASSWORD"              = "MINIO_ROOT_PASSWORD=$(New-RandomHex 24)"
    "ANALITICA_DB_PASSWORD"            = "ANALITICA_DB_PASSWORD=$(New-RandomHex 24)"
    "ANALITICA_DB_APP_PASSWORD"        = "ANALITICA_DB_APP_PASSWORD=$(New-RandomHex 24)"
    "ANALITICA_SECRETO"                = "ANALITICA_SECRETO=$(New-RandomHex 32)"
    "PRONOSTICO_DB_PASSWORD"           = "PRONOSTICO_DB_PASSWORD=$(New-RandomHex 24)"
    "PRONOSTICO_DB_APP_PASSWORD"       = "PRONOSTICO_DB_APP_PASSWORD=$(New-RandomHex 24)"
    "PRONOSTICO_SECRETO"               = "PRONOSTICO_SECRETO=$(New-RandomHex 32)"
    "NOTIFICACIONES_MONGO_PASSWORD"    = "NOTIFICACIONES_MONGO_PASSWORD=$(New-RandomHex 24)"
    "NOTIFICACIONES_MONGO_APP_PASSWORD"= "NOTIFICACIONES_MONGO_APP_PASSWORD=$(New-RandomHex 24)"
    "NOTIFICACIONES_SECRETO"           = "NOTIFICACIONES_SECRETO=$(New-RandomHex 32)"
}

if (-not [string]::IsNullOrWhiteSpace($Sitio)) {
    $Reemplazos["SITIO"] = "SITIO=$Sitio"
    $Reemplazos["APP_URL"] = "APP_URL=$Sitio"
    $Reemplazos["FRONTEND_URL"] = "FRONTEND_URL=$Sitio"
    $Reemplazos["KONG_CORS_ORIGENES"] = "KONG_CORS_ORIGENES=$Sitio"
}

if (-not [string]::IsNullOrWhiteSpace($FilesDomain)) {
    $Reemplazos["FILES_DOMAIN"] = "FILES_DOMAIN=$FilesDomain"
    $Reemplazos["AWS_URL"] = "AWS_URL=https://$FilesDomain/restaurantcloud"
    $Reemplazos["AWS_TEMPORARY_URL"] = "AWS_TEMPORARY_URL=https://$FilesDomain"
}

$LineasSalida = New-Object System.Collections.Generic.List[string]
foreach ($linea in Get-Content -LiteralPath $Plantilla -Encoding UTF8) {
    $clave = ($linea -split "=", 2)[0]
    if ($Reemplazos.ContainsKey($clave)) {
        $LineasSalida.Add($Reemplazos[$clave])
    } else {
        $LineasSalida.Add($linea)
    }
}

$TmpSalida = "$Salida.tmp.$PID"
try {
    $Utf8SinBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($TmpSalida, ($LineasSalida -join "`n") + "`n", $Utf8SinBom)
    Move-Item -LiteralPath $TmpSalida -Destination $Salida
} finally {
    if (Test-Path -LiteralPath $TmpSalida) {
        Remove-Item -LiteralPath $TmpSalida -Force
    }
}

Write-Host "Archivo generado correctamente: $Salida (modo: $Modo)"
if ($Modo -eq "produccion") {
    Write-Host "Recuerda revisar SITIO, FILES_DOMAIN, SMTP y credenciales externas (STRIPE_*, APIDEV_TOKEN) si aplican."
}
