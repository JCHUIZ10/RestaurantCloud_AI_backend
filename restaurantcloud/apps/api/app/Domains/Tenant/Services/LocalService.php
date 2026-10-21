<?php

namespace App\Domains\Tenant\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class LocalService
{
    public function __construct(
        private LocalProvisioningService $provisioningService
    ) {}

    /**
     * Lista todos los locales de la empresa junto con el consumo de cuota del plan (CU-PROP-04).
     */
    public function listado(string $empresaId): array
    {
        $cuota = $this->calcularCuota($empresaId);

        $localesRaw = DB::table('local as l')
            ->where('l.empresa_id', $empresaId)
            ->orderByDesc('l.created_at')
            ->get();

        $localesActivosCount = $cuota['locales_activos'];

        $locales = $localesRaw->map(function ($local) use ($empresaId, $localesActivosCount) {
            // 1. Obtener administrador asignado a la sede
            $adminRaw = DB::table('usuario')
                ->where('empresa_id', $empresaId)
                ->where('local_id', $local->id)
                ->where('rol', 'admin_local')
                ->where('estado', 'activo')
                ->first();

            $admin = $adminRaw ? [
                'id' => $adminRaw->id,
                'nombre' => $adminRaw->nombre,
                'correo' => $adminRaw->correo,
                'telefono' => $adminRaw->telefono,
            ] : null;

            // 2. Métricas de infraestructura
            $totalPisos = DB::table('piso')->where('local_id', $local->id)->count();
            $totalMesas = DB::table('mesa')->where('local_id', $local->id)->count();

            // 3. Viabilidad de baja preliminar
            $esUltimoActivo = ($local->estado === 'activo' && $localesActivosCount <= 1);
            $tieneCajaAbierta = DB::table('caja')
                ->where('local_id', $local->id)
                ->where('estado', 'abierta')
                ->exists();
            $tienePedidosActivos = DB::table('pedido')
                ->where('local_id', $local->id)
                ->whereIn('estado', ['pendiente', 'en_preparacion', 'listo', 'servido'])
                ->exists();

            $puedeDesactivar = ! $esUltimoActivo && ! $tieneCajaAbierta && ! $tienePedidosActivos;

            return [
                'id' => $local->id,
                'empresa_id' => $local->empresa_id,
                'nombre' => $local->nombre,
                'slug' => $local->slug,
                'url_carta_digital' => "/sede/{$local->slug}/carta",
                'direccion' => $local->direccion,
                'ubigeo_cod' => $local->ubigeo_cod,
                'departamento' => $local->departamento,
                'provincia' => $local->provincia,
                'distrito' => $local->distrito,
                'ciudad' => $local->ciudad,
                'referencia' => $local->referencia,
                'telefono' => $local->telefono,
                'zona_horaria' => $local->zona_horaria ?? 'America/Lima',
                'moneda' => $local->moneda ?? 'PEN',
                'giro_negocio' => $local->giro_negocio,
                'estado' => $local->estado,
                'es_autogestionado' => ($admin === null),
                'administrador' => $admin,
                'metricas' => [
                    'total_pisos' => $totalPisos,
                    'total_mesas' => $totalMesas,
                ],
                'puede_desactivar' => $puedeDesactivar,
                'created_at' => (string) $local->created_at,
            ];
        })->all();

        return [
            'cuota_plan' => $cuota,
            'locales' => $locales,
        ];
    }

    /**
     * Verifica disponibilidad de cupos y lista administradores asignables (CU-PROP-04).
     */
    public function verificarDisponibilidad(string $empresaId): array
    {
        $cuota = $this->calcularCuota($empresaId);

        $admins = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('rol', 'admin_local')
            ->where('estado', '!=', 'pendiente_activacion')
            ->select(['id', 'nombre', 'correo', 'telefono', 'local_id', 'estado'])
            ->orderBy('nombre')
            ->get()
            ->all();

        return [
            'puede_crear' => ($cuota['cupos_disponibles'] > 0),
            'cupos_disponibles' => $cuota['cupos_disponibles'],
            'max_permitido' => $cuota['locales_permitidos'],
            'administradores_disponibles' => $admins,
        ];
    }

    /**
     * Verifica disponibilidad global de slug y calcula sugerencias alternativas.
     */
    public function verificarSlug(string $slugPropuesto, ?string $excluirLocalId = null): array
    {
        $slugClean = Str::slug($slugPropuesto);
        if (empty($slugClean)) {
            $slugClean = 'sede';
        }

        $query = DB::table('local')->whereRaw('LOWER(slug) = ?', [$slugClean]);
        if ($excluirLocalId) {
            $query->where('id', '!=', $excluirLocalId);
        }

        $existe = $query->exists();

        if ($existe) {
            // Generar sugerencia incremental
            $contador = 2;
            do {
                $sugerencia = "{$slugClean}-{$contador}";
                $existeSugerencia = DB::table('local')->whereRaw('LOWER(slug) = ?', [$sugerencia])->exists();
                $contador++;
            } while ($existeSugerencia && $contador < 50);

            return [
                'slug' => $slugClean,
                'disponible' => false,
                'sugerencia' => $sugerencia,
                'mensaje' => 'Esta dirección web ya está en uso. Puedes adoptar la sugerencia generada.',
            ];
        }

        return [
            'slug' => $slugClean,
            'disponible' => true,
            'sugerencia' => null,
            'mensaje' => 'Enlace web disponible para la carta digital de tu restaurante.',
        ];
    }

    /**
     * Registra un nuevo local delegando en el servicio de aprovisionamiento.
     */
    public function crear(string $empresaId, array $datos): array
    {
        return $this->provisioningService->provisionar($empresaId, $datos);
    }

    /**
     * Actualiza los datos comerciales y de administración de una sede existente.
     */
    public function actualizar(string $localId, string $empresaId, array $datos): array
    {
        return DB::transaction(function () use ($localId, $empresaId, $datos) {
            $local = DB::table('local')
                ->where('id', $localId)
                ->where('empresa_id', $empresaId)
                ->lockForUpdate()
                ->first();

            if (! $local) {
                throw new \OutOfBoundsException('El local solicitado no existe en la empresa.');
            }

            // Validar unicidad del slug si cambió
            $slug = Str::slug($datos['slug'] ?? $local->slug);
            if ($slug !== $local->slug) {
                $existeSlug = DB::table('local')
                    ->whereRaw('LOWER(slug) = ?', [$slug])
                    ->where('id', '!=', $localId)
                    ->exists();

                if ($existeSlug) {
                    throw new \DomainException("La dirección web \"{$slug}\" ya está ocupada por otra sede.");
                }
            }

            // Normalizar teléfono si fue suministrado
            $telefono = isset($datos['telefono']) && trim($datos['telefono']) !== ''
                ? $this->provisioningService->normalizarTelefonoPeru($datos['telefono'])
                : $local->telefono;

            // Actualizar datos de la sede
            DB::table('local')->where('id', $localId)->update([
                'nombre' => trim($datos['nombre'] ?? $local->nombre),
                'slug' => $slug,
                'direccion' => trim($datos['direccion'] ?? $local->direccion),
                'ubigeo_cod' => $datos['ubigeo_cod'] ?? $local->ubigeo_cod,
                'departamento' => $datos['departamento'] ?? $local->departamento,
                'provincia' => $datos['provincia'] ?? $local->provincia,
                'distrito' => $datos['distrito'] ?? $local->distrito,
                'ciudad' => $datos['ciudad'] ?? $local->ciudad,
                'referencia' => array_key_exists('referencia', $datos) ? $datos['referencia'] : $local->referencia,
                'telefono' => $telefono,
                'updated_at' => now(),
            ]);

            // Gestión de modo de administración y reasignación de personal
            $modoAdmin = $datos['modo_administracion'] ?? null;
            if ($modoAdmin === 'propietario') {
                // Desvincular cualquier administrador a cargo de esta sede y DESACTIVARLO para evitar accesos no autorizados
                $adminsPrevios = DB::table('usuario')
                    ->where('empresa_id', $empresaId)
                    ->where('local_id', $localId)
                    ->where('rol', 'admin_local')
                    ->get();

                foreach ($adminsPrevios as $previo) {
                    DB::table('usuario')
                        ->where('id', $previo->id)
                        ->update([
                            'local_id' => null,
                            'estado' => 'inactivo',
                            'updated_at' => now(),
                        ]);

                    try {
                        Redis::setex("jwt:blacklist:{$previo->id}", 86400, 'revocado');
                    } catch (\Throwable $e) {
                        // Silencioso
                    }
                }
            } elseif ($modoAdmin === 'asignar_admin') {
                $nuevoAdminId = $datos['administrador_usuario_id'] ?? null;
                if ($nuevoAdminId) {
                    $admin = DB::table('usuario')
                        ->where('id', $nuevoAdminId)
                        ->where('empresa_id', $empresaId)
                        ->where('rol', 'admin_local')
                        ->where('estado', '!=', 'pendiente_activacion')
                        ->first();

                    if (! $admin) {
                        throw new \InvalidArgumentException('El administrador seleccionado no es válido o aún no ha completado la activación de su cuenta.');
                    }

                    // Liberar admin anterior de esta sede (si no es el mismo) y desactivarlo
                    $adminsPrevios = DB::table('usuario')
                        ->where('empresa_id', $empresaId)
                        ->where('local_id', $localId)
                        ->where('id', '!=', $nuevoAdminId)
                        ->where('rol', 'admin_local')
                        ->get();

                    foreach ($adminsPrevios as $previo) {
                        DB::table('usuario')
                            ->where('id', $previo->id)
                            ->update([
                                'local_id' => null,
                                'estado' => 'inactivo',
                                'updated_at' => now(),
                            ]);

                        try {
                            Redis::setex("jwt:blacklist:{$previo->id}", 86400, 'revocado');
                        } catch (\Throwable $e) {
                            // Silencioso
                        }
                    }

                    // Asignar al nuevo admin y ACTIVARLO
                    DB::table('usuario')
                        ->where('id', $nuevoAdminId)
                        ->update([
                            'local_id' => $localId,
                            'estado' => 'activo',
                            'updated_at' => now(),
                        ]);
                }
            }

            // Retornar el local actualizado
            return $this->obtenerDetalleLocal($localId, $empresaId);
        });
    }

    /**
     * Audita en tiempo real la viabilidad operativa para dar de baja una sede (Bloqueo Duro).
     */
    public function validarBaja(string $localId, string $empresaId): array
    {
        $local = DB::table('local')
            ->where('id', $localId)
            ->where('empresa_id', $empresaId)
            ->first();

        if (! $local) {
            throw new \OutOfBoundsException('Sede no encontrada.');
        }

        // 1. Regla de Sede Única: Un restaurante debe tener al menos una sede activa
        $localesActivos = DB::table('local')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activo')
            ->count();

        $esUltimoActivo = ($localesActivos <= 1 && $local->estado === 'activo');
        if ($esUltimoActivo) {
            return [
                'local_id' => $local->id,
                'nombre' => $local->nombre,
                'puede_desactivar' => false,
                'es_ultimo_local_activo' => true,
                'bloqueos_operativos' => [],
                'aviso' => 'No puedes desactivar la única sede activa de tu restaurante. Tu empresa requiere al menos una sede operativa.',
            ];
        }

        // 2. Auditoría Operativa de Bloqueos Duros
        $bloqueos = [];

        // A. Cajas registradoras abiertas
        $cajasAbiertas = DB::table('caja as c')
            ->leftJoin('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.local_id', $localId)
            ->where('c.estado', 'abierta')
            ->select(['c.id', 'c.monto_apertura', 'c.notas_apertura', 'u.nombre as cajero_nombre'])
            ->get();

        foreach ($cajasAbiertas as $caja) {
            $bloqueos[] = [
                'tipo' => 'CAJA_ABIERTA',
                'descripcion' => 'Caja de turno se encuentra ABIERTA',
                'responsable' => $caja->cajero_nombre ? "{$caja->cajero_nombre} (Cajero)" : 'Cajero de turno',
                'monto_acumulado' => (float) $caja->monto_apertura,
                'sesion_id' => $caja->id,
            ];
        }

        // B. Comandas o pedidos activos en salón
        $pedidosActivos = DB::table('pedido as p')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['pendiente', 'en_preparacion', 'listo', 'servido'])
            ->select(['p.id', 'p.numero_comanda', 'm.numero as mesa_numero'])
            ->get();

        if ($pedidosActivos->isNotEmpty()) {
            $mesas = $pedidosActivos->pluck('mesa_numero')
                ->filter()
                ->unique()
                ->map(fn ($num) => "Mesa {$num}")
                ->values()
                ->all();

            $bloqueos[] = [
                'tipo' => 'PEDIDOS_ACTIVOS',
                'descripcion' => "Existen {$pedidosActivos->count()} pedido(s) pendientes de atención o cobro en el salón",
                'mesas_afectadas' => ! empty($mesas) ? $mesas : ['Salón general'],
            ];
        }

        $puedeDesactivar = empty($bloqueos);
        $aviso = $puedeDesactivar
            ? 'La sede no tiene actividad operativa en curso. Puedes desactivarla de forma segura sin perder datos históricos ni reportes.'
            : 'Debes cerrar todas las sesiones de caja y liquidar los pedidos en comanda antes de desactivar la sede.';

        return [
            'local_id' => $local->id,
            'nombre' => $local->nombre,
            'puede_desactivar' => $puedeDesactivar,
            'es_ultimo_local_activo' => false,
            'bloqueos_operativos' => $bloqueos,
            'aviso' => $aviso,
        ];
    }

    /**
     * Modifica el estado operativo de una sede (desactivar / reactivar).
     */
    public function cambiarEstado(string $localId, string $empresaId, string $nuevoEstado): array
    {
        return DB::transaction(function () use ($localId, $empresaId, $nuevoEstado) {
            $local = DB::table('local')
                ->where('id', $localId)
                ->where('empresa_id', $empresaId)
                ->lockForUpdate()
                ->first();

            if (! $local) {
                throw new \OutOfBoundsException('Sede no encontrada.');
            }

            if ($nuevoEstado === 'inactivo') {
                $auditoria = $this->validarBaja($localId, $empresaId);
                if (! $auditoria['puede_desactivar']) {
                    throw new \DomainException($auditoria['aviso'] ?? 'No es posible desactivar la sede debido a bloqueos operativos activos.');
                }
            } elseif ($nuevoEstado === 'activo') {
                $cuota = $this->calcularCuota($empresaId);
                if ($cuota['cupos_disponibles'] <= 0) {
                    throw new \OverflowException("Has alcanzado el límite máximo de locales de tu Plan {$cuota['plan_nombre']} ({$cuota['locales_permitidos']} locales).");
                }
            }

            DB::table('local')->where('id', $localId)->update([
                'estado' => $nuevoEstado,
                'updated_at' => now(),
            ]);

            // Si se desactiva la sede, desactivar administradores asignados para prevenir accesos no autorizados
            if ($nuevoEstado === 'inactivo') {
                $adminsAsignados = DB::table('usuario')
                    ->where('empresa_id', $empresaId)
                    ->where('local_id', $localId)
                    ->where('rol', 'admin_local')
                    ->get();

                foreach ($adminsAsignados as $adm) {
                    DB::table('usuario')
                        ->where('id', $adm->id)
                        ->update([
                            'estado' => 'inactivo',
                            'updated_at' => now(),
                        ]);

                    try {
                        Redis::setex("jwt:blacklist:{$adm->id}", 86400, 'revocado');
                    } catch (\Throwable $e) {
                        // Silencioso
                    }
                }
            } elseif ($nuevoEstado === 'activo') {
                // Si la sede se reactiva, reactivar al administrador si ya completó su activación
                $adminsAsignados = DB::table('usuario')
                    ->where('empresa_id', $empresaId)
                    ->where('local_id', $localId)
                    ->where('rol', 'admin_local')
                    ->where('estado', '!=', 'pendiente_activacion')
                    ->get();

                foreach ($adminsAsignados as $adm) {
                    DB::table('usuario')
                        ->where('id', $adm->id)
                        ->update([
                            'estado' => 'activo',
                            'updated_at' => now(),
                        ]);
                }
            }

            return [
                'id' => $localId,
                'nombre' => $local->nombre,
                'estado' => $nuevoEstado,
                'mensaje' => ($nuevoEstado === 'activo')
                    ? "Sede \"{$local->nombre}\" reactivada con éxito."
                    : "Sede \"{$local->nombre}\" desactivada correctamente. Cupo del plan liberado.",
            ];
        });
    }

    /**
     * Calcula la cuota de locales del plan asignado a la empresa.
     */
    private function calcularCuota(string $empresaId): array
    {
        $empresa = DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->leftJoin('suscripcion as s', 's.id', '=', 'e.ultima_suscripcion_id')
            ->where('e.id', $empresaId)
            ->select([
                'e.id',
                'e.plan_id',
                'p.nombre as plan_nombre',
                'p.max_locales',
                's.proximo_plan_id',
            ])
            ->first();

        if (! $empresa) {
            return [
                'plan_id' => 1,
                'plan_nombre' => 'Starter',
                'locales_permitidos' => 1,
                'locales_activos' => 0,
                'cupos_disponibles' => 1,
                'limite_alcanzado' => false,
                'downgrade_programado' => false,
            ];
        }

        $localesActivos = DB::table('local')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activo')
            ->count();

        $cuposDisponibles = max(0, $empresa->max_locales - $localesActivos);
        $downgradeProgramado = ! empty($empresa->proximo_plan_id) && $empresa->proximo_plan_id < $empresa->plan_id;

        return [
            'plan_id' => $empresa->plan_id,
            'plan_nombre' => $empresa->plan_nombre,
            'locales_permitidos' => $empresa->max_locales,
            'locales_activos' => $localesActivos,
            'cupos_disponibles' => $cuposDisponibles,
            'limite_alcanzado' => ($cuposDisponibles === 0),
            'downgrade_programado' => $downgradeProgramado,
        ];
    }

    /**
     * Obtiene el DTO completo de un local individual.
     */
    private function obtenerDetalleLocal(string $localId, string $empresaId): array
    {
        $local = DB::table('local')->where('id', $localId)->where('empresa_id', $empresaId)->first();
        $adminRaw = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('local_id', $localId)
            ->where('rol', 'admin_local')
            ->where('estado', 'activo')
            ->first();

        $admin = $adminRaw ? [
            'id' => $adminRaw->id,
            'nombre' => $adminRaw->nombre,
            'correo' => $adminRaw->correo,
            'telefono' => $adminRaw->telefono,
        ] : null;

        $totalPisos = DB::table('piso')->where('local_id', $localId)->count();
        $totalMesas = DB::table('mesa')->where('local_id', $localId)->count();

        return [
            'id' => $local->id,
            'empresa_id' => $local->empresa_id,
            'nombre' => $local->nombre,
            'slug' => $local->slug,
            'url_carta_digital' => "/sede/{$local->slug}/carta",
            'direccion' => $local->direccion,
            'ubigeo_cod' => $local->ubigeo_cod,
            'departamento' => $local->departamento,
            'provincia' => $local->provincia,
            'distrito' => $local->distrito,
            'ciudad' => $local->ciudad,
            'referencia' => $local->referencia,
            'telefono' => $local->telefono,
            'zona_horaria' => $local->zona_horaria ?? 'America/Lima',
            'moneda' => $local->moneda ?? 'PEN',
            'giro_negocio' => $local->giro_negocio,
            'estado' => $local->estado,
            'es_autogestionado' => ($admin === null),
            'administrador' => $admin,
            'metricas' => [
                'total_pisos' => $totalPisos,
                'total_mesas' => $totalMesas,
            ],
            'puede_desactivar' => true,
            'created_at' => (string) $local->created_at,
        ];
    }
}
