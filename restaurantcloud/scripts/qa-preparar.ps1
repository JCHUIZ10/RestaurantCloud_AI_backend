[CmdletBinding()]
param(
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"

$RaizDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = Join-Path $RaizDir ".env"
}
$ComposeFile = Join-Path $RaizDir "docker-compose.prod.yml"
$LocalAurea = "00000000-0000-4000-8000-000000000010"
$EmpresaAurea = "00000000-0000-4000-8000-000000000001"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Error "No existe '$EnvFile'. Ejecuta primero .\scripts\generar-env.ps1 qa"
    exit 1
}

function Invoke-DC {
    param([string[]]$ArgsList)
    & docker compose -f $ComposeFile --env-file $EnvFile @ArgsList
}

function Get-EnvValue {
    param([string]$Clave)
    $linea = Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match "^${Clave}=" } | Select-Object -Last 1
    if (-not $linea) { return "" }
    return (($linea -split "=", 2)[1]).Trim().Trim('"')
}

$PostgresUser = Get-EnvValue "POSTGRES_USER"
$PostgresDb = Get-EnvValue "POSTGRES_DB"
$AnaliticaUser = Get-EnvValue "ANALITICA_DB_USER"
$AnaliticaDb = Get-EnvValue "ANALITICA_DB_NAME"
$Sitio = Get-EnvValue "SITIO"
if ([string]::IsNullOrWhiteSpace($Sitio)) { $Sitio = "http://localhost" }

Write-Host "Esperando a que los servicios estén sanos..."
$Servicios = @("db", "redis", "minio", "api", "db-analitica", "analitica", "db-pronostico", "pronostico", "mongo-notificaciones", "notificaciones", "kong", "web")
$TodosOk = $false
for ($i = 0; $i -lt 60; $i++) {
    $TodosOk = $true
    foreach ($svc in $Servicios) {
        $cid = (& docker compose -f $ComposeFile --env-file $EnvFile ps -q $svc 2>$null)
        if (-not $cid) { $TodosOk = $false; break }
        $estado = (& docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $cid 2>$null)
        if ($estado -ne "healthy" -and $estado -ne "running") {
            $TodosOk = $false
            break
        }
    }
    if ($TodosOk) { break }
    Start-Sleep -Seconds 2
}

if (-not $TodosOk) {
    & docker compose -f $ComposeFile --env-file $EnvFile ps
    Write-Error "Tiempo de espera agotado esperando que todos los servicios estén sanos."
    exit 1
}
Write-Host "Servicios listos."

$ExisteAurea = (& docker compose -f $ComposeFile --env-file $EnvFile exec -T db psql -U $PostgresUser -d $PostgresDb -tAc "SELECT COUNT(*) FROM local WHERE id = '$LocalAurea';").Trim()
if ($ExisteAurea -eq "0") {
    Write-Host "Sembrando datos demo de ÁUREA..."
    & docker compose -f $ComposeFile --env-file $EnvFile exec -T api php artisan db:seed --class=LocalAureaDemoSeeder --force --no-interaction
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "Local ÁUREA ya existe; se conservan los datos actuales y se verifican las cuentas por rol..."
}

$SqlCuentas = @"
INSERT INTO usuario (id, empresa_id, local_id, nombre, correo, password_hash, telefono, rol, estado)
SELECT gen_random_uuid(), '$EmpresaAurea', '$LocalAurea', v.nombre, v.correo, crypt(v.clave, gen_salt('bf', 12)), v.tel, v.rol, 'activo'
FROM (VALUES
  ('Rodrigo De Las Casas', 'propietario@aurea.local', 'propietario2026', '+51 900 000 101', 'propietario'),
  ('Valeria Mendoza',      'admin@aurea.local',       'admin-local2026', '+51 900 000 102', 'admin_local'),
  ('Lucía Quispe',         'cajero@aurea.local',      'cajero2026',      '+51 900 000 105', 'cajero'),
  ('Carlos Huamán',        'mozo@aurea.local',        'mozo2026',        '+51 900 000 103', 'mozo'),
  ('Roberto Vargas',       'cocina@aurea.local',      'cocina2026',      '+51 900 000 104', 'cocina')
) AS v(nombre, correo, clave, tel, rol)
WHERE NOT EXISTS (SELECT 1 FROM usuario u WHERE u.correo = v.correo);
"@
$SqlCuentas | & docker compose -f $ComposeFile --env-file $EnvFile exec -T db psql -U $PostgresUser -d $PostgresDb -v ON_ERROR_STOP=1 | Out-Null
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Ayer = (& docker compose -f $ComposeFile --env-file $EnvFile exec -T db psql -U $PostgresUser -d $PostgresDb -tAc "SELECT ((now() at time zone 'America/Lima')::date - 1)::text;").Trim()
$UltimoDia = (& docker compose -f $ComposeFile --env-file $EnvFile exec -T db-analitica psql -U $AnaliticaUser -d $AnaliticaDb -tAc "SELECT COALESCE(max(fecha_operativa)::text, 'ninguno') FROM venta_diaria_producto WHERE local_id = '$LocalAurea';").Trim()

if ($UltimoDia -eq "ninguno" -or $UltimoDia -lt $Ayer) {
    Write-Host "Generando historial sintético hasta $Ayer (último día actual: $UltimoDia). Esto puede tomar ~4 minutos la primera vez..."
    $Carta = & docker compose -f $ComposeFile --env-file $EnvFile exec -T api php artisan carta:exportar $LocalAurea
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ($Carta -join "`n") | & docker compose -f $ComposeFile --env-file $EnvFile exec -T analitica python -m app.sinteticos generar --carta - --incremental --perfil aurea_v1 --semilla 2026
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "Historial sintético al día hasta $UltimoDia."
}

Write-Host "Verificando pronóstico nivel 3 con metodo = modelo..."
$LoginResp = Invoke-RestMethod -Method Post -Uri "$Sitio/api/v1/auth/login" -ContentType "application/json" -Headers @{ Accept = "application/json" } -Body '{"correo":"admin@aurea.local","password":"admin-local2026"}'
$Token = $LoginResp.datos.token
if (-not $Token) { $Token = $LoginResp.token }
if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Error "No se pudo obtener token de sesión para admin@aurea.local."
    exit 1
}

$PronResp = Invoke-RestMethod -Method Post -Uri "$Sitio/api/v1/admin/pronosticos" -ContentType "application/json" -Headers @{ Accept = "application/json"; Authorization = "Bearer $Token" } -Body '{"cobertura_dias":5}'
$Nivel = $PronResp.datos.nivel
$Preds = $PronResp.datos.pronostico.predicciones
$Total = 0
$NoModelo = 0
foreach ($pl in $Preds) {
    foreach ($dia in $pl.dias) {
        $Total++
        if ($dia.metodo -ne "modelo") { $NoModelo++ }
    }
}
if ($Nivel -ne 3 -or $Total -eq 0 -or $NoModelo -gt 0) {
    Write-Error "Pronóstico inesperado: nivel=$Nivel filas=$Total no_modelo=$NoModelo"
    exit 1
}
Write-Host "OK: pronóstico en nivel $Nivel con metodo=modelo ($Total filas)."

Write-Host ""
Write-Host "Entorno QA listo en: $Sitio"
Write-Host "Cuentas de demostración (ÁUREA):"
Write-Host "  - Propietario    : propietario@aurea.local / propietario2026"
Write-Host "  - Administración : admin@aurea.local       / admin-local2026"
Write-Host "  - Caja           : cajero@aurea.local      / cajero2026"
Write-Host "  - Mozo           : mozo@aurea.local        / mozo2026"
Write-Host "  - Cocina         : cocina@aurea.local      / cocina2026"
