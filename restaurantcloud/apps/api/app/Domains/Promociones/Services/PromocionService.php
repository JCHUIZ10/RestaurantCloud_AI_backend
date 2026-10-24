<?php

namespace App\Domains\Promociones\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PromocionService
{
    /**
     * Calcula el estado visual operativo de la promoción según la fecha actual,
     * el estado activa, y el algoritmo Zero-Cron O(1) de límites.
     */
    public function calcularEstadoVisual(object|array $p): string
    {
        $obj = (object) $p;
        $hoy = Carbon::now('America/Lima')->format('Y-m-d');

        if (! $obj->activa) {
            return 'pausada';
        }

        if ($hoy < $obj->fecha_inicio) {
            return 'programada';
        }

        if ($hoy > $obj->fecha_fin) {
            return 'vencida';
        }

        if ($obj->tipo_limite_usos === 'global' && $obj->limite_usos !== null && $obj->usos_actuales >= $obj->limite_usos) {
            return 'agotada';
        }

        if ($obj->tipo_limite_usos === 'diario' && $obj->limite_usos !== null) {
            $usosHoyEfectivos = ($obj->fecha_ultimo_uso === $hoy) ? (int) $obj->usos_hoy : 0;
            if ($usosHoyEfectivos >= $obj->limite_usos) {
                return 'agotada_hoy';
            }
        }

        return 'vigente';
    }

    /**
     * Mapea un registro de base de datos a PromocionAdminDTO estándar.
     */
    public function mapearPromocionDTO(object $p): array
    {
        $diasSemana = [];
        if (! empty($p->dias_semana)) {
            if (is_array($p->dias_semana)) {
                $diasSemana = array_map('intval', $p->dias_semana);
            } else {
                $raw = trim($p->dias_semana, '{}');
                $diasSemana = strlen($raw) ? array_map('intval', explode(',', $raw)) : [1, 2, 3, 4, 5, 6, 7];
            }
        } else {
            $diasSemana = [1, 2, 3, 4, 5, 6, 7];
        }

        $estadoVisual = $this->calcularEstadoVisual($p);

        return [
            'id' => (string) $p->id,
            'codigo' => (string) $p->codigo,
            'local_id' => (string) $p->local_id,
            'nombre' => (string) $p->nombre,
            'descripcion' => $p->descripcion ? (string) $p->descripcion : null,
            'tipo_descuento' => (string) $p->tipo_descuento,
            'valor' => (float) $p->valor,
            'tope_maximo_descuento' => $p->tope_maximo_descuento !== null ? (float) $p->tope_maximo_descuento : null,
            'monto_minimo_consumo' => (float) ($p->monto_minimo_consumo ?? 0),
            'dias_semana' => $diasSemana,
            'hora_inicio' => $p->hora_inicio ? substr((string) $p->hora_inicio, 0, 5) : null,
            'hora_fin' => $p->hora_fin ? substr((string) $p->hora_fin, 0, 5) : null,
            'fecha_inicio' => (string) $p->fecha_inicio,
            'fecha_fin' => (string) $p->fecha_fin,
            'tipo_limite_usos' => (string) ($p->tipo_limite_usos ?? 'sin_limite'),
            'limite_usos' => $p->limite_usos !== null ? (int) $p->limite_usos : null,
            'usos_actuales' => (int) ($p->usos_actuales ?? 0),
            'usos_hoy' => (int) ($p->usos_hoy ?? 0),
            'fecha_ultimo_uso' => $p->fecha_ultimo_uso ? (string) $p->fecha_ultimo_uso : null,
            'activa' => (bool) $p->activa,
            'estado_visual' => $estadoVisual,
            'total_descontado' => isset($p->total_descontado) ? (float) $p->total_descontado : 0.0,
            'total_ventas_asociadas' => isset($p->total_ventas_asociadas) ? (float) $p->total_ventas_asociadas : 0.0,
            'created_at' => (string) $p->created_at,
            'updated_at' => (string) $p->updated_at,
        ];
    }

    /**
     * Bandeja principal con KPIs y lista filtrable (CU-ADMIN-17 Vista 1).
     */
    public function listado(string $localId, array $filtros = []): array
    {
        $mes = $filtros['mes'] ?? Carbon::now('America/Lima')->format('Y-m');

        // 1. Consulta de promociones del local con agregación financiera de comprobantes
        $query = DB::table('promocion as p')
            ->leftJoin('comprobante as c', function ($join) {
                $join->on('c.promocion_id', '=', 'p.id')
                    ->where('c.estado', '=', 'emitido');
            })
            ->where('p.local_id', $localId)
            ->groupBy(
                'p.id', 'p.local_id', 'p.codigo', 'p.nombre', 'p.descripcion',
                'p.tipo_descuento', 'p.valor', 'p.tope_maximo_descuento',
                'p.monto_minimo_consumo', 'p.dias_semana', 'p.hora_inicio',
                'p.hora_fin', 'p.fecha_inicio', 'p.fecha_fin', 'p.tipo_limite_usos',
                'p.limite_usos', 'p.usos_actuales', 'p.usos_hoy', 'p.fecha_ultimo_uso',
                'p.activa', 'p.created_at', 'p.updated_at'
            )
            ->selectRaw('
                p.*,
                COALESCE(SUM(c.descuento), 0)::numeric(12,2) as total_descontado,
                COALESCE(SUM(c.total + c.descuento), 0)::numeric(12,2) as total_ventas_asociadas
            ')
            ->orderBy('p.activa', 'desc')
            ->orderBy('p.created_at', 'desc');

        $promocionesRaw = $query->get();

        // Mapear a DTO con estado visual
        $todasPromociones = $promocionesRaw->map(fn ($item) => $this->mapearPromocionDTO($item))->all();

        // 2. KPIs Dinámicos de Sede
        $vigentesHoy = collect($todasPromociones)->filter(fn ($p) => $p['estado_visual'] === 'vigente')->count();
        $campanasProgramadas = collect($todasPromociones)->filter(fn ($p) => $p['estado_visual'] === 'programada')->count();

        // Métricas financieras del mes (desde comprobantes con promoción asociada)
        $comprobantesMes = DB::table('comprobante as c')
            ->join('caja as k', 'k.id', '=', 'c.caja_id')
            ->where('k.local_id', $localId)
            ->whereNotNull('c.promocion_id')
            ->where('c.estado', 'emitido')
            ->whereRaw("TO_CHAR(c.fecha, 'YYYY-MM') = ?", [$mes])
            ->selectRaw('COALESCE(SUM(c.descuento), 0)::numeric(12,2) as descuentos_mes, COUNT(c.id)::int as cuentas_beneficiadas')
            ->first();

        $descuentosMes = (float) ($comprobantesMes->descuentos_mes ?? 0);
        $cuentasBeneficiadas = (int) ($comprobantesMes->cuentas_beneficiadas ?? 0);

        // 3. Aplicar filtros en memoria sobre la lista si se solicitan
        $resultadoFiltrado = collect($todasPromociones);

        if (! empty($filtros['estado']) && $filtros['estado'] !== 'todas') {
            $estadoFiltro = $filtros['estado'];
            $resultadoFiltrado = $resultadoFiltrado->filter(function ($p) use ($estadoFiltro) {
                if ($estadoFiltro === 'agotadas') {
                    return $p['estado_visual'] === 'agotada' || $p['estado_visual'] === 'agotada_hoy';
                }
                if ($estadoFiltro === 'vigentes') {
                    return $p['estado_visual'] === 'vigente';
                }
                if ($estadoFiltro === 'programadas') {
                    return $p['estado_visual'] === 'programada';
                }
                if ($estadoFiltro === 'pausadas') {
                    return $p['estado_visual'] === 'pausada';
                }
                if ($estadoFiltro === 'vencidas') {
                    return $p['estado_visual'] === 'vencida';
                }
                return true;
            });
        }

        if (! empty($filtros['tipo_descuento']) && $filtros['tipo_descuento'] !== 'todos') {
            $resultadoFiltrado = $resultadoFiltrado->filter(fn ($p) => $p['tipo_descuento'] === $filtros['tipo_descuento']);
        }

        if (! empty($filtros['busqueda'])) {
            $busqueda = mb_strtolower(trim($filtros['busqueda']));
            $resultadoFiltrado = $resultadoFiltrado->filter(function ($p) use ($busqueda) {
                return str_contains(mb_strtolower($p['nombre']), $busqueda)
                    || str_contains(mb_strtolower($p['codigo']), $busqueda);
            });
        }

        $promocionesFinal = $resultadoFiltrado->values()->all();

        return [
            'kpis' => [
                'vigentes_hoy' => $vigentesHoy,
                'campanas_programadas' => $campanasProgramadas,
                'descuentos_mes' => $descuentosMes,
                'cuentas_beneficiadas' => $cuentasBeneficiadas,
            ],
            'promociones' => $promocionesFinal,
            'total' => count($promocionesFinal),
        ];
    }

    /**
     * Búsqueda optimizada por demanda (CU-ADMIN-17 RN-PROM-10).
     */
    public function buscar(string $localId, string $query, ?string $estado = null, ?string $tipo = null): array
    {
        $termino = trim($query);

        $dbQuery = DB::table('promocion as p')
            ->leftJoin('comprobante as c', function ($join) {
                $join->on('c.promocion_id', '=', 'p.id')
                    ->where('c.estado', '=', 'emitido');
            })
            ->where('p.local_id', $localId)
            ->where(function ($q) use ($termino) {
                $q->where('p.nombre', 'ILIKE', "%{$termino}%")
                  ->orWhere('p.codigo', 'ILIKE', "%{$termino}%");
            })
            ->groupBy(
                'p.id', 'p.local_id', 'p.codigo', 'p.nombre', 'p.descripcion',
                'p.tipo_descuento', 'p.valor', 'p.tope_maximo_descuento',
                'p.monto_minimo_consumo', 'p.dias_semana', 'p.hora_inicio',
                'p.hora_fin', 'p.fecha_inicio', 'p.fecha_fin', 'p.tipo_limite_usos',
                'p.limite_usos', 'p.usos_actuales', 'p.usos_hoy', 'p.fecha_ultimo_uso',
                'p.activa', 'p.created_at', 'p.updated_at'
            )
            ->selectRaw('
                p.*,
                COALESCE(SUM(c.descuento), 0)::numeric(12,2) as total_descontado,
                COALESCE(SUM(c.total + c.descuento), 0)::numeric(12,2) as total_ventas_asociadas
            ')
            ->orderBy('p.activa', 'desc')
            ->orderBy('p.created_at', 'desc');

        if ($tipo && $tipo !== 'todos') {
            $dbQuery->where('p.tipo_descuento', $tipo);
        }

        $resultadosRaw = $dbQuery->get();
        $dtos = $resultadosRaw->map(fn ($item) => $this->mapearPromocionDTO($item));

        if ($estado && $estado !== 'todas') {
            $dtos = $dtos->filter(function ($p) use ($estado) {
                if ($estado === 'agotadas') {
                    return $p['estado_visual'] === 'agotada' || $p['estado_visual'] === 'agotada_hoy';
                }
                if ($estado === 'vigentes') return $p['estado_visual'] === 'vigente';
                if ($estado === 'programadas') return $p['estado_visual'] === 'programada';
                if ($estado === 'pausadas') return $p['estado_visual'] === 'pausada';
                if ($estado === 'vencidas') return $p['estado_visual'] === 'vencida';
                return true;
            });
        }

        $lista = $dtos->values()->all();

        return [
            'termino' => $termino,
            'resultados' => $lista,
            'total' => count($lista),
        ];
    }

    /**
     * Alta de promoción con autogeneración de código y validaciones estrictas (RN-PROM-03, RN-PROM-04, RN-PROM-05).
     */
    public function crear(string $localId, array $data): array
    {
        // 1. Unicidad de nombre por sede
        $existeNombre = DB::table('promocion')
            ->where('local_id', $localId)
            ->whereRaw('LOWER(nombre) = LOWER(?)', [$data['nombre']])
            ->exists();

        if ($existeNombre) {
            throw new \DomainException('Ya existe una promoción con este nombre comercial en la sede.', 409);
        }

        // 2. Coherencia temporal
        if ($data['fecha_inicio'] > $data['fecha_fin']) {
            throw new \InvalidArgumentException('La fecha de inicio no puede ser posterior a la fecha de fin.');
        }

        // 3. Fórmulas de descuento
        $tipoDescuento = $data['tipo_descuento'];
        $valor = (float) $data['valor'];

        if ($tipoDescuento === 'porcentaje' && ($valor <= 0 || $valor > 100)) {
            throw new \InvalidArgumentException('El valor de porcentaje de descuento debe encontrarse estrictamente entre 1% y 100%.');
        }

        if ($tipoDescuento === 'monto_fijo' && $valor <= 0) {
            throw new \InvalidArgumentException('El monto fijo de descuento debe ser estrictamente mayor a S/ 0.00.');
        }

        // 4. Horarios consistentes
        $horaInicio = $data['hora_inicio'] ?? null;
        $horaFin = $data['hora_fin'] ?? null;

        if (($horaInicio && ! $horaFin) || (! $horaInicio && $horaFin)) {
            throw new \InvalidArgumentException('Debe especificar tanto hora de inicio como de fin, o dejar ambos campos vacíos.');
        }

        $diasSemana = ! empty($data['dias_semana']) ? $data['dias_semana'] : [1, 2, 3, 4, 5, 6, 7];
        $diasPg = '{' . implode(',', array_map('intval', $diasSemana)) . '}';

        $id = Str::uuid()->toString();

        DB::table('promocion')->insert([
            'id' => $id,
            'local_id' => $localId,
            'codigo' => null, // El trigger PostgreSQL trg_promocion_codigo autogenera PROMO-YYYY-XXX
            'nombre' => trim($data['nombre']),
            'descripcion' => ! empty($data['descripcion']) ? trim($data['descripcion']) : null,
            'tipo_descuento' => $tipoDescuento,
            'valor' => $valor,
            'tope_maximo_descuento' => ! empty($data['tope_maximo_descuento']) ? (float) $data['tope_maximo_descuento'] : null,
            'monto_minimo_consumo' => ! empty($data['monto_minimo_consumo']) ? (float) $data['monto_minimo_consumo'] : 0.00,
            'dias_semana' => $diasPg,
            'hora_inicio' => $horaInicio,
            'hora_fin' => $horaFin,
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin' => $data['fecha_fin'],
            'tipo_limite_usos' => $data['tipo_limite_usos'] ?? 'sin_limite',
            'limite_usos' => ! empty($data['limite_usos']) ? (int) $data['limite_usos'] : null,
            'activa' => $data['activa'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $creada = DB::table('promocion')->where('id', $id)->first();
        return $this->mapearPromocionDTO($creada);
    }

    /**
     * Consulta detalle completo de una promoción.
     */
    public function obtener(string $id, string $localId): ?array
    {
        $promocion = DB::table('promocion as p')
            ->leftJoin('comprobante as c', function ($join) {
                $join->on('c.promocion_id', '=', 'p.id')
                    ->where('c.estado', '=', 'emitido');
            })
            ->where('p.id', $id)
            ->where('p.local_id', $localId)
            ->groupBy(
                'p.id', 'p.local_id', 'p.codigo', 'p.nombre', 'p.descripcion',
                'p.tipo_descuento', 'p.valor', 'p.tope_maximo_descuento',
                'p.monto_minimo_consumo', 'p.dias_semana', 'p.hora_inicio',
                'p.hora_fin', 'p.fecha_inicio', 'p.fecha_fin', 'p.tipo_limite_usos',
                'p.limite_usos', 'p.usos_actuales', 'p.usos_hoy', 'p.fecha_ultimo_uso',
                'p.activa', 'p.created_at', 'p.updated_at'
            )
            ->selectRaw('
                p.*,
                COALESCE(SUM(c.descuento), 0)::numeric(12,2) as total_descontado,
                COALESCE(SUM(c.total + c.descuento), 0)::numeric(12,2) as total_ventas_asociadas
            ')
            ->first();

        if (! $promocion) {
            return null;
        }

        return $this->mapearPromocionDTO($promocion);
    }

    /**
     * Modificación de parámetros de una promoción.
     */
    public function actualizar(string $id, string $localId, array $data): array
    {
        $existente = DB::table('promocion')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $existente) {
            throw new \DomainException('La promoción no existe o no pertenece a esta sede.', 404);
        }

        // Unicidad de nombre si cambió
        if (isset($data['nombre']) && mb_strtolower($data['nombre']) !== mb_strtolower($existente->nombre)) {
            $duplicado = DB::table('promocion')
                ->where('local_id', $localId)
                ->where('id', '!=', $id)
                ->whereRaw('LOWER(nombre) = LOWER(?)', [$data['nombre']])
                ->exists();

            if ($duplicado) {
                throw new \DomainException('Ya existe otra promoción con este nombre comercial en la sede.', 409);
            }
        }

        $fechaInicio = $data['fecha_inicio'] ?? $existente->fecha_inicio;
        $fechaFin = $data['fecha_fin'] ?? $existente->fecha_fin;

        if ($fechaInicio > $fechaFin) {
            throw new \InvalidArgumentException('La fecha de inicio no puede ser posterior a la fecha de fin.');
        }

        $tipoDescuento = $data['tipo_descuento'] ?? $existente->tipo_descuento;
        $valor = isset($data['valor']) ? (float) $data['valor'] : (float) $existente->valor;

        if ($tipoDescuento === 'porcentaje' && ($valor <= 0 || $valor > 100)) {
            throw new \InvalidArgumentException('El valor de porcentaje de descuento debe encontrarse estrictamente entre 1% y 100%.');
        }

        if ($tipoDescuento === 'monto_fijo' && $valor <= 0) {
            throw new \InvalidArgumentException('El monto fijo de descuento debe ser estrictamente mayor a S/ 0.00.');
        }

        $updateData = [
            'updated_at' => now(),
        ];

        if (isset($data['nombre'])) $updateData['nombre'] = trim($data['nombre']);
        if (array_key_exists('descripcion', $data)) $updateData['descripcion'] = $data['descripcion'] ? trim($data['descripcion']) : null;
        if (isset($data['tipo_descuento'])) $updateData['tipo_descuento'] = $data['tipo_descuento'];
        if (isset($data['valor'])) $updateData['valor'] = $valor;
        if (array_key_exists('tope_maximo_descuento', $data)) $updateData['tope_maximo_descuento'] = $data['tope_maximo_descuento'] ? (float) $data['tope_maximo_descuento'] : null;
        if (isset($data['monto_minimo_consumo'])) $updateData['monto_minimo_consumo'] = (float) $data['monto_minimo_consumo'];
        if (isset($data['dias_semana'])) {
            $updateData['dias_semana'] = '{' . implode(',', array_map('intval', $data['dias_semana'])) . '}';
        }
        if (array_key_exists('hora_inicio', $data)) $updateData['hora_inicio'] = $data['hora_inicio'];
        if (array_key_exists('hora_fin', $data)) $updateData['hora_fin'] = $data['hora_fin'];
        if (isset($data['fecha_inicio'])) $updateData['fecha_inicio'] = $data['fecha_inicio'];
        if (isset($data['fecha_fin'])) $updateData['fecha_fin'] = $data['fecha_fin'];
        if (isset($data['tipo_limite_usos'])) $updateData['tipo_limite_usos'] = $data['tipo_limite_usos'];
        if (array_key_exists('limite_usos', $data)) $updateData['limite_usos'] = $data['limite_usos'] ? (int) $data['limite_usos'] : null;
        if (isset($data['activa'])) $updateData['activa'] = (bool) $data['activa'];

        DB::table('promocion')->where('id', $id)->update($updateData);

        return $this->obtener($id, $localId);
    }

    /**
     * Switch de activación inmediata en caja con salvaguardas de vigencia y cupo (RN-PROM-06).
     */
    public function toggleEstado(string $id, string $localId, bool $activa): array
    {
        $promo = DB::table('promocion')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $promo) {
            throw new \DomainException('La promoción no existe o no pertenece a esta sede.', 404);
        }

        // Si se intenta habilitar en caja (activa = true), verificar salvaguardas
        if ($activa) {
            $hoy = Carbon::now('America/Lima')->format('Y-m-d');
            if ($hoy > $promo->fecha_fin) {
                throw new \DomainException('No es posible habilitar en caja la promoción porque su periodo de vigencia ya culminó.', 400);
            }

            if ($promo->tipo_limite_usos === 'global' && $promo->limite_usos !== null && $promo->usos_actuales >= $promo->limite_usos) {
                throw new \DomainException('No es posible habilitar en caja la promoción porque su cupo global ha sido completado.', 400);
            }
        }

        DB::table('promocion')
            ->where('id', $id)
            ->update([
                'activa' => $activa,
                'updated_at' => now(),
            ]);

        return $this->obtener($id, $localId);
    }

    /**
     * Borrado físico protegido por salvaguarda contable e integridad SUNAT (RN-PROM-02 / ON DELETE RESTRICT).
     */
    public function eliminar(string $id, string $localId): bool
    {
        $promo = DB::table('promocion')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $promo) {
            throw new \DomainException('La promoción no existe o no pertenece a esta sede.', 404);
        }

        // Protección contable: no eliminar si cuenta con historial de comprobantes
        if ($promo->usos_actuales > 0) {
            throw new \DomainException(
                "No es posible eliminar '{$promo->nombre}' porque cuenta con {$promo->usos_actuales} comprobantes SUNAT emitidos. Utilice la opción Pausar.",
                409
            );
        }

        $comprobantesAsociados = DB::table('comprobante')
            ->where('promocion_id', $id)
            ->count();

        if ($comprobantesAsociados > 0) {
            throw new \DomainException(
                "No es posible eliminar '{$promo->nombre}' porque cuenta con comprobantes de pago vinculados en base de datos. Utilice la opción Pausar.",
                409
            );
        }

        DB::table('promocion')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->delete();

        return true;
    }

    /**
     * Métricas de rendimiento y auditoría de comprobantes emitidos (CU-ADMIN-17 Vista 3).
     */
    public function rendimiento(string $id, string $localId): array
    {
        $promo = $this->obtener($id, $localId);
        if (! $promo) {
            throw new \DomainException('La promoción no existe o no pertenece a esta sede.', 404);
        }

        // Consultar los comprobantes emitidos en caja con esta promoción
        $comprobantes = DB::table('comprobante as c')
            ->leftJoin('usuario as u', 'u.id', '=', 'c.caja_id') // o cajero
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->where('c.promocion_id', $id)
            ->where('c.estado', 'emitido')
            ->orderBy('c.fecha', 'desc')
            ->limit(100)
            ->selectRaw("
                c.id,
                c.serie || '-' || LPAD(c.correlativo::text, 6, '0') as numero_comprobante,
                c.fecha as fecha_hora,
                COALESCE(m.numero::text, 'Barra') as mesa_numero,
                COALESCE(u.nombre, 'Caja Principal') as cajero_nombre,
                c.subtotal_consumo::numeric(10,2) as subtotal,
                c.descuento::numeric(10,2) as descuento,
                c.total::numeric(10,2) as total
            ")
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'numero_comprobante' => (string) $c->numero_comprobante,
                'fecha_hora' => (string) $c->fecha_hora,
                'mesa_numero' => is_numeric($c->mesa_numero) ? "Mesa {$c->mesa_numero}" : (string) $c->mesa_numero,
                'cajero_nombre' => (string) $c->cajero_nombre,
                'subtotal' => (float) $c->subtotal,
                'descuento' => (float) $c->descuento,
                'total' => (float) $c->total,
            ])
            ->all();

        $usosTotales = count($comprobantes);
        $ventasTotales = (float) collect($comprobantes)->sum('total') + collect($comprobantes)->sum('descuento');
        $descuentosTotales = (float) collect($comprobantes)->sum('descuento');
        $ticketPromedio = $usosTotales > 0 ? round($ventasTotales / $usosTotales, 2) : 0.00;

        return [
            'promocion' => $promo,
            'ventas_totales' => $ventasTotales,
            'descuentos_totales' => $descuentosTotales,
            'ticket_promedio' => $ticketPromedio,
            'usos_totales' => $promo['usos_actuales'] > 0 ? $promo['usos_actuales'] : $usosTotales,
            'comprobantes' => $comprobantes,
        ];
    }

    /**
     * Cálculo predictivo en tiempo real para Caja POS (CU-CAJA-02).
     */
    public function promocionesVigentesCaja(string $localId, float $totalConsumo): array
    {
        $ahora = Carbon::now('America/Lima');
        $hoy = $ahora->format('Y-m-d');
        $diaIso = (int) $ahora->format('N'); // 1=Lunes .. 7=Domingo
        $horaActual = $ahora->format('H:i');

        $promos = DB::table('promocion')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->where('fecha_inicio', '<=', $hoy)
            ->where('fecha_fin', '>=', $hoy)
            ->get();

        $elegibles = [];
        $noElegibles = [];

        foreach ($promos as $pr) {
            $dias = [];
            if (! empty($pr->dias_semana)) {
                $raw = trim($pr->dias_semana, '{}');
                $dias = strlen($raw) ? array_map('intval', explode(',', $raw)) : [1, 2, 3, 4, 5, 6, 7];
            } else {
                $dias = [1, 2, 3, 4, 5, 6, 7];
            }

            // Validar día
            if (! in_array($diaIso, $dias, true)) {
                $noElegibles[] = [
                    'id' => (string) $pr->id,
                    'nombre' => (string) $pr->nombre,
                    'motivo' => 'No aplica para el día de hoy',
                ];
                continue;
            }

            // Validar horario si aplica
            if ($pr->hora_inicio && $pr->hora_fin) {
                $hi = substr((string) $pr->hora_inicio, 0, 5);
                $hf = substr((string) $pr->hora_fin, 0, 5);
                if ($horaActual < $hi || $horaActual > $hf) {
                    $noElegibles[] = [
                        'id' => (string) $pr->id,
                        'nombre' => (string) $pr->nombre,
                        'motivo' => "Horario válido: {$hi} a {$hf}",
                    ];
                    continue;
                }
            }

            // Validar monto mínimo
            $montoMinimo = (float) ($pr->monto_minimo_consumo ?? 0);
            if ($montoMinimo > 0 && $totalConsumo < $montoMinimo) {
                $noElegibles[] = [
                    'id' => (string) $pr->id,
                    'nombre' => (string) $pr->nombre,
                    'motivo' => "Exige consumo mínimo de S/ " . number_format($montoMinimo, 2),
                ];
                continue;
            }

            // Validar cupos
            if ($pr->tipo_limite_usos === 'global' && $pr->limite_usos !== null && $pr->usos_actuales >= $pr->limite_usos) {
                $noElegibles[] = [
                    'id' => (string) $pr->id,
                    'nombre' => (string) $pr->nombre,
                    'motivo' => 'Cupo global agotado',
                ];
                continue;
            }

            if ($pr->tipo_limite_usos === 'diario' && $pr->limite_usos !== null) {
                $usosHoy = ($pr->fecha_ultimo_uso === $hoy) ? (int) $pr->usos_hoy : 0;
                if ($usosHoy >= $pr->limite_usos) {
                    $noElegibles[] = [
                        'id' => (string) $pr->id,
                        'nombre' => (string) $pr->nombre,
                        'motivo' => 'Cupo de hoy completado',
                    ];
                    continue;
                }
            }

            // Calcular descuento exacto
            $descuentoCalculado = 0.00;
            if ($pr->tipo_descuento === 'porcentaje') {
                $descuentoCalculado = round($totalConsumo * ((float) $pr->valor / 100), 2);
                if ($pr->tope_maximo_descuento !== null && $pr->tope_maximo_descuento > 0) {
                    $descuentoCalculado = min($descuentoCalculado, (float) $pr->tope_maximo_descuento);
                }
            } else {
                $descuentoCalculado = min((float) $pr->valor, $totalConsumo);
            }

            $totalConDescuento = max(0.00, round($totalConsumo - $descuentoCalculado, 2));

            $elegibles[] = [
                'id' => (string) $pr->id,
                'codigo' => (string) $pr->codigo,
                'nombre' => (string) $pr->nombre,
                'tipo_descuento' => (string) $pr->tipo_descuento,
                'valor' => (float) $pr->valor,
                'descuento_calculado' => $descuentoCalculado,
                'total_con_descuento' => $totalConDescuento,
            ];
        }

        return [
            'subtotal_cuenta' => $totalConsumo,
            'elegibles' => $elegibles,
            'no_elegibles' => $noElegibles,
        ];
    }
}
