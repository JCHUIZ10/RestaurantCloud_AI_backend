[CmdletBinding()]
param(
    [ValidateSet("iniciar", "detener", "estado", "preparar", "reiniciar", "ayuda")]
    [string]$Accion = "iniciar"
)

$ErrorActionPreference = "Stop"

$RaizDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ComposeFile = Join-Path $RaizDir "docker-compose.prod.yml"
$EnvFile = Join-Path $RaizDir ".env"

function Show-Ayuda {
    Write-Host @"
Uso: .\scripts\qa.ps1 [accion]

Acciones disponibles:
  iniciar    Comprueba requisitos, genera .env si falta, construye, levanta y prepara los datos demo (por defecto).
  detener    Detiene los contenedores de QA sin borrar los datos.
  estado     Muestra el estado actual de los contenedores de QA.
  preparar   Aplica seed/historial faltante y verifica el pronóstico en nivel 3.
  reiniciar  Borra los volúmenes de QA (con confirmación) y vuelve a levantar todo desde cero.
  ayuda      Muestra esta ayuda.
"@
}

function Test-Requisitos {
    Write-Host "Comprobando requisitos previos..."

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker no está instalado o no está en PATH. Instala Docker Desktop y vuelve a intentarlo."
        exit 1
    }

    $null = & docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker no está en marcha o no responde. Abre Docker Desktop, espera a que aparezca como activo y vuelve a intentarlo."
        exit 1
    }

    $null = & docker compose version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker Compose v2 no está disponible. Actualiza Docker Desktop a una versión reciente."
        exit 1
    }

    # Verificar memoria asignada a Docker (umbral 3.7 GiB para tolerar redondeo de WSL2 de 4 GB).
    $memBytesRaw = (& docker info --format "{{.MemTotal}}" 2>$null).Trim()
    [double]$memBytes = 0
    if ([double]::TryParse($memBytesRaw, [ref]$memBytes) -and $memBytes -gt 0) {
        $memGiB = [math]::Round($memBytes / 1GB, 2)
        if ($memGiB -lt 3.7) {
            Write-Error "Docker solo tiene ${memGiB} GiB de memoria asignada (se recomiendan al menos 4 GiB, ideal 6 GiB). Sube la memoria en Docker Desktop (Settings -> Resources) o en %USERPROFILE%\.wslconfig y reinicia Docker."
            exit 1
        }
        Write-Host "  OK: Docker en marcha (${memGiB} GiB disponibles)."
    }

    # Verificar que el puerto 80 esté libre (salvo que ya lo use nuestro propio servicio web de QA).
    $webCid = (& docker ps -q --filter "label=com.docker.compose.project=restaurantcloud" --filter "label=com.docker.compose.service=web" 2>$null | Out-String).Trim()
    $webActivo = -not [string]::IsNullOrWhiteSpace($webCid)

    if (-not $webActivo) {
        $listener = $null
        try {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, 80)
            $listener.Start()
        } catch {
            Write-Error "El puerto 80 ya está ocupado por otro programa (por ejemplo: el entorno de desarrollo, IIS, Apache o Nginx). Detén ese servicio (si es desarrollo: 'docker compose down') y vuelve a intentarlo."
            exit 1
        } finally {
            if ($listener) { $listener.Stop() }
        }
        Write-Host "  OK: Puerto 80 libre."
    } else {
        Write-Host "  OK: Puerto 80 en uso por el contenedor web de QA actual."
    }
}

switch ($Accion) {
    "ayuda" {
        Show-Ayuda
        exit 0
    }
    "detener" {
        if (-not (Test-Path -LiteralPath $EnvFile)) {
            Write-Error "No existe '$EnvFile'."
            exit 1
        }
        & docker compose -f $ComposeFile --env-file $EnvFile down
        exit $LASTEXITCODE
    }
    "estado" {
        if (-not (Test-Path -LiteralPath $EnvFile)) {
            Write-Error "No existe '$EnvFile'."
            exit 1
        }
        & docker compose -f $ComposeFile --env-file $EnvFile ps
        exit $LASTEXITCODE
    }
    "preparar" {
        & (Join-Path $PSScriptRoot "qa-preparar.ps1")
        exit $LASTEXITCODE
    }
    "reiniciar" {
        & (Join-Path $PSScriptRoot "qa-reiniciar.ps1")
        exit $LASTEXITCODE
    }
    "iniciar" {
        Test-Requisitos

        if (-not (Test-Path -LiteralPath $EnvFile)) {
            Write-Host "No existe .env: generando configuración inicial de QA..."
            & (Join-Path $PSScriptRoot "generar-env.ps1") -Modo qa
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        } else {
            Write-Host "Usando configuración existente: $EnvFile"
        }

        Write-Host "Construyendo y levantando servicios de QA..."
        & docker compose -f $ComposeFile --env-file $EnvFile up -d --build
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

        & (Join-Path $PSScriptRoot "qa-preparar.ps1") -EnvFile $EnvFile
        exit $LASTEXITCODE
    }
}
