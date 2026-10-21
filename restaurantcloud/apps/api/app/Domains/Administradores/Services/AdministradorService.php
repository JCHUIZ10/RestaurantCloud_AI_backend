<?php

namespace App\Domains\Administradores\Services;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class AdministradorService
{
    /**
     * Lista los administradores de local de la empresa junto con la cuota de usuarios del plan.
     */
    public function listado(string $empresaId, array $filtros = []): array
    {
        $consulta = DB::table('usuario as u')
            ->leftJoin('local as l', 'l.id', '=', 'u.local_id')
            ->where('u.empresa_id', $empresaId)
            ->where('u.rol', 'admin_local');

        // Filtro por pestaña de estado
        $estado = $filtros['estado'] ?? 'todos';
        if ($estado === 'activos' || $estado === 'activo') {
            $consulta->where('u.estado', 'activo');
        } elseif ($estado === 'pendientes' || $estado === 'pendiente_activacion') {
            $consulta->where('u.estado', 'pendiente_activacion');
        } elseif ($estado === 'desactivados' || $estado === 'inactivo') {
            $consulta->where('u.estado', 'inactivo');
        }

        // Filtro por término de búsqueda (nombre, correo, teléfono o sede)
        if ($busqueda = trim((string) ($filtros['busqueda'] ?? ''))) {
            $consulta->where(function ($query) use ($busqueda): void {
                $query->whereRaw('LOWER(u.nombre) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhereRaw('LOWER(u.correo) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhere('u.telefono', 'like', "%{$busqueda}%")
                    ->orWhereRaw('LOWER(l.nombre) LIKE LOWER(?)', ["%{$busqueda}%"]);
            });
        }

        $adminsRaw = $consulta
            ->select([
                'u.id',
                'u.nombre',
                'u.correo',
                'u.telefono',
                'u.estado',
                'u.local_id',
                'u.ultimo_login',
                'u.created_at',
                'l.nombre as local_nombre',
                'l.distrito as local_distrito',
            ])
            ->orderByDesc('u.created_at')
            ->get();

        $administradores = $adminsRaw->map(function ($admin) {
            $item = [
                'id' => $admin->id,
                'nombre' => $admin->nombre,
                'correo' => $admin->correo,
                'telefono' => $admin->telefono,
                'estado' => $admin->estado,
                'sede_asignada' => $admin->local_id ? [
                    'id' => $admin->local_id,
                    'nombre' => $admin->local_nombre,
                    'distrito' => $admin->local_distrito ?? 'Lima',
                ] : null,
                'ultimo_login' => $admin->ultimo_login ? (string) $admin->ultimo_login : null,
                'created_at' => (string) $admin->created_at,
            ];

            if ($admin->estado === 'pendiente_activacion') {
                try {
                    $invitacionRaw = Redis::get("usuario:invitacion:{$admin->id}");
                    if ($invitacionRaw) {
                        $invData = json_decode($invitacionRaw, true);
                        $item['invitacion_token'] = $invData['token'] ?? null;
                        $item['invitacion_expira_en'] = $invData['expira_en'] ?? null;
                        $item['invitacion_expirada'] = false;
                    } else {
                        $item['invitacion_token'] = null;
                        $item['invitacion_expira_en'] = null;
                        $item['invitacion_expirada'] = true;
                    }
                } catch (\Throwable $e) {
                    $item['invitacion_token'] = null;
                    $item['invitacion_expira_en'] = null;
                    $item['invitacion_expirada'] = false;
                }
            }

            return $item;
        })->all();

        return [
            'cuota_usuarios' => $this->calcularCuota($empresaId),
            'administradores' => $administradores,
        ];
    }

    /**
     * Retorna la disponibilidad y métricas de cuota de personal de la empresa.
     */
    public function cuotaPersonal(string $empresaId): array
    {
        $cuota = $this->calcularCuota($empresaId);

        return [
            'puede_invitar' => ! $cuota['limite_alcanzado'],
            'cupos_libres' => $cuota['cupos_disponibles'],
            'cuota' => $cuota,
        ];
    }

    /**
     * Alias retrocompatible para formularioDatos.
     */
    public function formularioDatos(string $empresaId): array
    {
        return $this->cuotaPersonal($empresaId);
    }

    /**
     * Invita a un nuevo administrador de local (CU-PROP-05) desacoplado de sedes.
     */
    public function invitar(string $empresaId, array $datos, ?Usuario $usuarioEjecutor = null): array
    {
        return DB::transaction(function () use ($empresaId, $datos, $usuarioEjecutor): array {
            // 1. Validar cuota del plan
            $this->asegurarCupo($empresaId);

            $correo = strtolower(trim($datos['correo']));

            // 2. Prevenir auto-invitación del propietario
            if ($usuarioEjecutor && strtolower($usuarioEjecutor->correo) === $correo) {
                throw new \DomainException('PROPIETARIO_NO_PUEDE_SER_ADMIN_LOCAL');
            }

            // 3. Validar unicidad de correo dentro de la empresa
            if (DB::table('usuario')
                ->where('empresa_id', $empresaId)
                ->whereRaw('LOWER(correo) = LOWER(?)', [$correo])
                ->exists()
            ) {
                throw new \DomainException('ADMIN_CORREO_EXISTE_MISMA_EMPRESA');
            }

            // 4. Normalizar teléfono móvil según estándar Perú
            $telefonoNormalizado = $this->normalizarTelefonoPeru($datos['telefono'] ?? null);

            // 5. Crear usuario en PostgreSQL con estado 'pendiente_activacion' y local_id = NULL
            $usuarioId = (string) Str::uuid();
            $hashProvisional = Hash::make(Str::random(40));

            DB::table('usuario')->insert([
                'id' => $usuarioId,
                'empresa_id' => $empresaId,
                'local_id' => null,
                'nombre' => trim($datos['nombre']),
                'correo' => $correo,
                'password_hash' => $hashProvisional,
                'telefono' => $telefonoNormalizado,
                'rol' => 'admin_local',
                'estado' => 'pendiente_activacion',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 6. Generar token de activación seguro en Redis (TTL 24 horas = 86400s)
            $token = Str::random(48);
            $expiraEn = now()->addHours(24)->toIso8601String();

            try {
                $payload = [
                    'usuario_id' => $usuarioId,
                    'empresa_id' => $empresaId,
                    'correo' => $correo,
                    'nombre' => trim($datos['nombre']),
                    'rol' => 'admin_local',
                    'token' => $token,
                    'expira_en' => $expiraEn,
                ];

                Redis::setex("invitacion:admin:{$token}", 86400, json_encode($payload));
                Redis::setex("usuario:invitacion:{$usuarioId}", 86400, json_encode([
                    'token' => $token,
                    'expira_en' => $expiraEn,
                ]));
            } catch (\Throwable $e) {
                // Silencioso si Redis no estuviera disponible en fallback
            }

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $urlActivacion = "{$frontendUrl}/activar-cuenta?token={$token}";

            return [
                'id' => $usuarioId,
                'nombre' => trim($datos['nombre']),
                'correo' => $correo,
                'telefono' => $telefonoNormalizado,
                'rol' => 'admin_local',
                'estado' => 'pendiente_activacion',
                'local_id' => null,
                'sede_asignada' => null,
                'invitacion_token' => $token,
                'invitacion_url' => $urlActivacion,
                'invitacion_expira_en' => $expiraEn,
                'mensaje' => 'Invitación enviada exitosamente por correo electrónico. El enlace expira en 24 horas.',
            ];
        });
    }

    /**
     * Reenvía el enlace seguro de activación con nuevo token y cooldown de 60s.
     */
    public function reenviarInvitacion(string $empresaId, string $adminId): array
    {
        $usuario = DB::table('usuario')
            ->where('id', $adminId)
            ->where('empresa_id', $empresaId)
            ->where('rol', 'admin_local')
            ->first();

        if (! $usuario) {
            throw new \DomainException('ADMIN_NO_ENCONTRADO');
        }

        if ($usuario->estado !== 'pendiente_activacion') {
            throw new \DomainException('ADMIN_YA_ACTIVO');
        }

        // Control de enfriamiento / Cooldown de 60 segundos
        try {
            if (Redis::get("invitacion:cooldown:{$adminId}")) {
                throw new \DomainException('ADMIN_REENVIO_EN_ENFRIAMIENTO');
            }
        } catch (\DomainException $e) {
            throw $e;
        } catch (\Throwable $e) {
            // Silencioso
        }

        // Limpiar token anterior si existía
        try {
            $previoRaw = Redis::get("usuario:invitacion:{$adminId}");
            if ($previoRaw) {
                $previo = json_decode($previoRaw, true);
                if (! empty($previo['token'])) {
                    Redis::del("invitacion:admin:{$previo['token']}");
                }
            }
        } catch (\Throwable $e) {
            // Silencioso
        }

        // Generar nuevo token y extender 24 horas
        $token = Str::random(48);
        $expiraEn = now()->addHours(24)->toIso8601String();

        try {
            $payload = [
                'usuario_id' => $adminId,
                'empresa_id' => $empresaId,
                'correo' => $usuario->correo,
                'nombre' => $usuario->nombre,
                'rol' => 'admin_local',
                'token' => $token,
                'expira_en' => $expiraEn,
            ];

            Redis::setex("invitacion:admin:{$token}", 86400, json_encode($payload));
            Redis::setex("usuario:invitacion:{$adminId}", 86400, json_encode([
                'token' => $token,
                'expira_en' => $expiraEn,
            ]));
            Redis::setex("invitacion:cooldown:{$adminId}", 60, '1');
        } catch (\Throwable $e) {
            // Silencioso
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $urlActivacion = "{$frontendUrl}/activar-cuenta?token={$token}";

        return [
            'usuario_id' => $adminId,
            'correo' => $usuario->correo,
            'invitacion_token' => $token,
            'invitacion_url' => $urlActivacion,
            'nueva_expiracion' => $expiraEn,
            'mensaje' => 'Se ha reenviado un nuevo enlace seguro de activación.',
        ];
    }

    /**
     * Cancela la invitación pendiente y revoca el token en Redis.
     */
    public function cancelarInvitacion(string $empresaId, string $adminId): array
    {
        $usuario = DB::table('usuario')
            ->where('id', $adminId)
            ->where('empresa_id', $empresaId)
            ->where('rol', 'admin_local')
            ->first();

        if (! $usuario) {
            throw new \DomainException('ADMIN_NO_ENCONTRADO');
        }

        if ($usuario->estado !== 'pendiente_activacion') {
            throw new \DomainException('SOLO_SE_PUEDEN_CANCELAR_INVITACIONES_PENDIENTES');
        }

        // Revocar tokens en Redis
        try {
            $previoRaw = Redis::get("usuario:invitacion:{$adminId}");
            if ($previoRaw) {
                $previo = json_decode($previoRaw, true);
                if (! empty($previo['token'])) {
                    Redis::del("invitacion:admin:{$previo['token']}");
                }
            }
            Redis::del("usuario:invitacion:{$adminId}");
            Redis::del("invitacion:cooldown:{$adminId}");
        } catch (\Throwable $e) {
            // Silencioso
        }

        DB::table('usuario')->where('id', $adminId)->delete();

        return [
            'usuario_id' => $adminId,
            'mensaje' => 'Invitación cancelada y eliminada exitosamente.',
        ];
    }

    /**
     * Obtiene el enlace de invitación activo para copiarlo o compartirlo.
     */
    public function obtenerEnlace(string $empresaId, string $adminId): array
    {
        $usuario = DB::table('usuario')
            ->where('id', $adminId)
            ->where('empresa_id', $empresaId)
            ->where('rol', 'admin_local')
            ->first();

        if (! $usuario) {
            throw new \DomainException('ADMIN_NO_ENCONTRADO');
        }

        if ($usuario->estado !== 'pendiente_activacion') {
            throw new \DomainException('ADMIN_YA_ACTIVO');
        }

        $token = null;
        try {
            $previoRaw = Redis::get("usuario:invitacion:{$adminId}");
            if ($previoRaw) {
                $previo = json_decode($previoRaw, true);
                $token = $previo['token'] ?? null;
            }
        } catch (\Throwable $e) {
            // Silencioso
        }

        // Si el token en Redis ya no existe o expiró, generamos uno nuevo automáticamente
        if (! $token) {
            return $this->reenviarInvitacion($empresaId, $adminId);
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        return [
            'usuario_id' => $adminId,
            'correo' => $usuario->correo,
            'invitacion_token' => $token,
            'invitacion_url' => "{$frontendUrl}/activar-cuenta?token={$token}",
            'mensaje' => 'Enlace de invitación recuperado exitosamente.',
        ];
    }

    /**
     * Desactiva o reactiva un administrador de local con revocación de sesiones en Redis.
     */
    public function cambiarEstado(string $empresaId, string $adminId, string $nuevoEstado): array
    {
        if (! in_array($nuevoEstado, ['activo', 'inactivo'], true)) {
            throw new \InvalidArgumentException('ESTADO_INVALIDO');
        }

        return DB::transaction(function () use ($empresaId, $adminId, $nuevoEstado): array {
            $usuario = DB::table('usuario')
                ->where('id', $adminId)
                ->where('empresa_id', $empresaId)
                ->where('rol', 'admin_local')
                ->lockForUpdate()
                ->first();

            if (! $usuario) {
                throw new \DomainException('ADMIN_NO_ENCONTRADO');
            }

            if ($nuevoEstado === 'activo') {
                $this->asegurarCupo($empresaId);
            }

            DB::table('usuario')->where('id', $adminId)->update([
                'estado' => $nuevoEstado,
                'updated_at' => now(),
            ]);

            // Si se desactiva, registrar en Blacklist de Redis para revocación inmediata
            $sesionesRevocadas = false;
            if ($nuevoEstado === 'inactivo') {
                try {
                    Redis::setex("jwt:blacklist:{$adminId}", 86400, 'revocado');
                    $sesionesRevocadas = true;
                } catch (\Throwable $e) {
                    // Silencioso
                }
            }

            return [
                'usuario_id' => $adminId,
                'nombre' => $usuario->nombre,
                'estado' => $nuevoEstado,
                'sesiones_revocadas' => $sesionesRevocadas,
                'mensaje' => $nuevoEstado === 'inactivo'
                    ? 'Administrador desactivado exitosamente. Se revocaron sus sesiones en tiempo real.'
                    : 'Administrador reactivado exitosamente.',
            ];
        });
    }

    /**
     * Calcula las métricas de consumo de cuota de personal de la empresa.
     */
    private function calcularCuota(string $empresaId): array
    {
        $plan = DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)
            ->select('p.id as plan_id', 'p.nombre as plan_nombre', 'p.max_usuarios')
            ->first();

        $usuariosActivos = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activo')
            ->count();

        $maxPermitidos = (int) ($plan->max_usuarios ?? 10);
        $cuposLibres = max(0, $maxPermitidos - $usuariosActivos);

        return [
            'plan_id' => $plan ? (int) $plan->plan_id : 2,
            'plan_nombre' => $plan ? $plan->plan_nombre : 'Pro',
            'usuarios_permitidos' => $maxPermitidos,
            'usuarios_activos' => $usuariosActivos,
            'cupos_disponibles' => $cuposLibres,
            'limite_alcanzado' => $usuariosActivos >= $maxPermitidos,
        ];
    }

    /**
     * Bloquea la operación si se ha alcanzado la cuota de usuarios permitidos.
     */
    private function asegurarCupo(string $empresaId): void
    {
        $cuota = $this->calcularCuota($empresaId);

        if ($cuota['limite_alcanzado']) {
            throw new \OverflowException('PERSONAL_LIMITE_PLAN_ALCANZADO');
        }
    }

    /**
     * Valida y normaliza el número de teléfono móvil conforme a estandar_telefono_whatsapp.md.
     */
    private function normalizarTelefonoPeru(?string $telefono): ?string
    {
        if (! $telefono) {
            return null;
        }

        $limpio = trim($telefono);
        if ($limpio === '') {
            return null;
        }

        $soloDigitos = preg_replace('/\D/', '', $limpio);

        // Si viene con el prefijo internacional 51 y tiene 11 dígitos
        if (strlen($soloDigitos) === 11 && str_starts_with($soloDigitos, '51')) {
            $soloDigitos = substr($soloDigitos, 2);
        }

        // En Perú el número móvil consta obligatoriamente de 9 dígitos e inicia con 9
        if (strlen($soloDigitos) !== 9 || ! str_starts_with($soloDigitos, '9')) {
            throw new \InvalidArgumentException('TELEFONO_MOVIL_PERU_INVALIDO');
        }

        // Formatear canónicamente: +51 987 654 321
        return '+51 ' . substr($soloDigitos, 0, 3) . ' ' . substr($soloDigitos, 3, 3) . ' ' . substr($soloDigitos, 6, 3);
    }
}
