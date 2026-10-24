<?php

namespace App\Http\Controllers\Api;

use App\Domains\Inventario\Services\StockDeduccionService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
<<<<<<< Updated upstream
use App\Domains\Inventario\Services\StockDeduccionService;
use Carbon\Carbon;
=======
>>>>>>> Stashed changes
use Illuminate\Support\Str;

class MozoController extends Controller
{
    /**
     * CU-MOZO-01: Obtener el plano del salón completo con pisos, mesas y despacho en vivo.
     */
    public function getPlano(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;
        $pisoSolicitadoId = $request->query('piso_id');

        // 1. Pisos activos del local
        $pisosRaw = DB::table('piso')
            ->where('local_id', $localId)
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get();

        if ($pisosRaw->isEmpty()) {
            return ApiResponse::ok([
                'piso_activo' => null,
                'pisos_disponibles' => [],
                'mesas' => [],
                'items_despacho' => [],
                'comandas_preparacion' => [],
                'alertas_operativas' => [],
                'mesas_libres' => 0,
                'mesas_ocupadas' => 0,
                'total_mesas' => 0,
                'mis_mesas_activas' => 0,
                'total_venta_turno' => 0.0,
                'mozo_actual' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'rol' => $user->rol,
                ],
            ]);
        }

        $pisoActivo = $pisosRaw->firstWhere('id', $pisoSolicitadoId) ?? $pisosRaw->first();

        // 2. Mesas del local con su pedido activo
        $mesasRaw = DB::table('mesa as m')
            ->leftJoin('pedido as p', function ($join) {
                $join->on('p.mesa_id', '=', 'm.id')
                    ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador']);
            })
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('m.local_id', $localId)
            ->where('m.estado', 'activa')
            ->select([
                'm.id',
                'm.piso_id',
                'm.numero',
                'm.capacidad',
                'm.forma',
                'm.posicion_x',
                'm.posicion_y',
                'm.permite_union',
                'm.mesa_principal_id',
                'p.id as pedido_id',
                'p.numero_comanda',
                'p.estado as pedido_estado',
                'p.comensales',
                'p.mozo_id',
                'p.created_at as pedido_created_at',
                'p.precuenta_generada_at',
                'u.nombre as mozo_nombre',
            ])
            ->orderBy('m.numero')
            ->get();

        // Obtener ítems de todos los pedidos activos para calcular métricas por mesa
        $pedidoIds = $mesasRaw->pluck('pedido_id')->filter()->unique();
        $itemsPorPedido = collect();
        if ($pedidoIds->isNotEmpty()) {
            $itemsPorPedido = DB::table('pedido_item as pi')
                ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
                ->whereIn('pi.pedido_id', $pedidoIds)
                ->where('pi.estado', '!=', 'anulado')
                ->select([
                    'pi.id',
                    'pi.pedido_id',
                    'pi.producto_id',
                    'pi.cantidad',
                    'pi.precio_unitario',
                    'pi.estado',
                    'pi.nota_cocina',
                    'pi.fecha_listo_cocina',
                    'pi.created_at',
                    'prod.nombre as producto_nombre',
                    'prod.requiere_preparacion',
                ])
                ->get()
                ->groupBy('pedido_id');
        }

        // Subcuentas activas por pedido (para indicar si la cuenta está dividida)
        $subcuentasPorPedido = collect();
        if ($pedidoIds->isNotEmpty()) {
            $subcuentasPorPedido = DB::table('pedido_subcuenta')
                ->whereIn('pedido_id', $pedidoIds)
                ->where('estado', '!=', 'anulado')
                ->select('pedido_id', DB::raw('COUNT(*) as total_subcuentas'))
                ->groupBy('pedido_id')
                ->pluck('total_subcuentas', 'pedido_id');
        }

        // Pre-cálculo de etiquetas de unión de mesas (ej. "Mesa [ 02 ; 03 ]")
        $mesasHijasPorPrincipal = $mesasRaw->whereNotNull('mesa_principal_id')->groupBy('mesa_principal_id');
        $etiquetasUnionPorMesa = [];

        foreach ($mesasHijasPorPrincipal as $principalId => $hijas) {
            $principal = $mesasRaw->firstWhere('id', $principalId);
            if ($principal) {
                $numeros = collect([$principal->numero])
                    ->merge($hijas->pluck('numero'))
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();
                $etiqueta = 'Mesa [ ' . implode(' ; ', $numeros) . ' ]';
                $etiquetasUnionPorMesa[$principalId] = $etiqueta;
                foreach ($hijas as $hija) {
                    $etiquetasUnionPorMesa[$hija->id] = $etiqueta;
                }
            }
        }

        // Consultar políticas de reserva para ventana preventiva y tolerancia
        $politicaReserva = DB::table('politicas_reserva')
            ->where('local_id', $localId)
            ->first();
        $bloqueoPrevioMin = (int) ($politicaReserva->minutos_bloqueo_previo ?? 30);
        $toleranciaNoShowMin = (int) ($politicaReserva->tolerancia_no_show_min ?? 15);

        // Ventana preventiva: desde (fecha_hora - bloqueoPrevioMin) hasta (fecha_hora + toleranciaNoShowMin)
        $reservasProximas = DB::table('reserva as r')
            ->join('reserva_mesa as rm', 'rm.reserva_id', '=', 'r.id')
            ->where('r.local_id', $localId)
            ->whereIn('r.estado', ['confirmada', 'bloqueada'])
            ->where('r.fecha_hora', '<=', now()->addMinutes($bloqueoPrevioMin))
            ->where('r.fecha_hora', '>=', now()->subMinutes($toleranciaNoShowMin))
            ->select([
                'rm.mesa_id',
                'r.cliente_nombre',
                'r.fecha_hora',
            ])
            ->get()
            ->keyBy('mesa_id');

        $mesas = $mesasRaw->map(function ($m) use ($user, $itemsPorPedido, $reservasProximas, $subcuentasPorPedido, $etiquetasUnionPorMesa, $mesasRaw, $mesasHijasPorPrincipal) {
            // Resolver si la mesa es secundaria de una unión
            $titular = null;
            if (! empty($m->mesa_principal_id)) {
                $titular = $mesasRaw->firstWhere('id', $m->mesa_principal_id);
            }

            // Calcular capacidad efectiva (titular suma la capacidad de sus mesas hijas vinculadas)
            $capacidadEfectiva = (int) $m->capacidad;
            if ($mesasHijasPorPrincipal->has($m->id)) {
                $hijas = $mesasHijasPorPrincipal->get($m->id);
                $capacidadEfectiva += (int) $hijas->sum('capacidad');
            }

            // Atributos efectivos de pedido (propios o heredados de la mesa titular)
            $pedidoIdEfectivo = $m->pedido_id ?: ($titular?->pedido_id);
            $pedidoEstadoEfectivo = $m->pedido_id ? $m->pedido_estado : ($titular?->pedido_estado);
            $pedidoCreatedAtEfectivo = $m->pedido_id ? $m->pedido_created_at : ($titular?->pedido_created_at);
            $precuentaGeneradaAtEfectivo = $m->pedido_id ? $m->precuenta_generada_at : ($titular?->precuenta_generada_at);
            $mozoIdEfectivo = $m->pedido_id ? $m->mozo_id : ($titular?->mozo_id);
            $mozoNombreEfectivo = $m->pedido_id ? $m->mozo_nombre : ($titular?->mozo_nombre);
            $comensalesEfectivo = $m->pedido_id ? $m->comensales : ($titular?->comensales);

            $pedidoItems = $pedidoIdEfectivo ? ($itemsPorPedido->get($pedidoIdEfectivo) ?? collect()) : collect();

            $platosListos = $pedidoItems->where('requiere_preparacion', true)->where('estado', 'listo')->count();
            $platosEnCocina = $pedidoItems->where('requiere_preparacion', true)->whereIn('estado', ['en_cola', 'en_preparacion'])->count();
            $despachoDirecto = $pedidoItems->where('requiere_preparacion', false)->where('estado', 'listo')->count();
            $totalConsumo = (float) $pedidoItems->sum(fn ($i) => (float) $i->cantidad * (float) $i->precio_unitario);

            $estadoMesa = 'libre';
            $reservaCliente = null;
            $reservaHora = null;
            $minutosReserva = null;

            if ($pedidoIdEfectivo) {
                $estadoMesa = ($pedidoEstadoEfectivo === 'cuenta_pedida' || ! empty($precuentaGeneradaAtEfectivo))
                    ? 'cuenta_pedida'
                    : 'ocupada';
            } elseif (! empty($m->mesa_principal_id)) {
                // Mesa secundaria anexa a grupo
                $estadoMesa = 'ocupada';
            } elseif ($reservasProximas->has($m->id)) {
                $res = $reservasProximas->get($m->id);
                $estadoMesa = 'bloqueada';
                $reservaCliente = $res->cliente_nombre;
                $reservaHora = date('H:i', strtotime($res->fecha_hora));
                $minutosReserva = (int) max(1, round((strtotime($res->fecha_hora) - now()->timestamp) / 60));
            }

            $minutosOcupada = $pedidoCreatedAtEfectivo
                ? (int) max(0, round((now()->timestamp - strtotime($pedidoCreatedAtEfectivo)) / 60))
                : null;

            $etiquetaUnion = $etiquetasUnionPorMesa[$m->id] ?? null;

            $partesSubcuentas = $pedidoIdEfectivo ? (int) ($subcuentasPorPedido->get($pedidoIdEfectivo) ?? 0) : 0;
            $esCuentaDividida = $partesSubcuentas > 0;

            $quiebreItem = $pedidoItems->firstWhere('estado', 'no_disponible');
            $tieneQuiebreCocina = $quiebreItem !== null;

            return [
                'id' => $m->id,
                'piso_id' => $m->piso_id,
                'numero' => $m->numero,
                'capacidad' => $capacidadEfectiva,
                'forma' => $m->forma,
                'posicion_x' => (int) $m->posicion_x,
                'posicion_y' => (int) $m->posicion_y,
                'permite_union' => (bool) $m->permite_union,
                'mesa_principal_id' => $m->mesa_principal_id,
                'etiqueta_union' => $etiquetaUnion,
                'estado' => $estadoMesa,
                'pedido_id' => $pedidoIdEfectivo,
                'comensales_sentados' => $pedidoIdEfectivo ? (int) $comensalesEfectivo : null,
                'minutos_ocupada' => $minutosOcupada,
                'total_consumo' => $pedidoIdEfectivo ? round($totalConsumo, 2) : null,
                'mozo_id' => $mozoIdEfectivo,
                'mozo_nombre' => $mozoNombreEfectivo,
                'es_mi_mesa' => $mozoIdEfectivo === $user->id,
                'platos_listos' => $platosListos,
                'platos_en_cocina' => $platosEnCocina,
                'despacho_directo_pendiente' => $despachoDirecto,
                'bebidas_pendientes' => $despachoDirecto,
                'reserva_cliente' => $reservaCliente,
                'reserva_hora' => $reservaHora,
                'minutos_para_reserva' => $minutosReserva,
                'es_cuenta_dividida' => $esCuentaDividida,
                'partes_subcuentas' => $esCuentaDividida ? $partesSubcuentas : null,
                'tiene_quiebre_cocina' => $tieneQuiebreCocina,
                'quiebre_producto_nombre' => $quiebreItem ? $quiebreItem->producto_nombre : null,
                'quiebre_item_id' => $quiebreItem ? $quiebreItem->id : null,
            ];
        });

        // 3. Contadores por piso
        $pisosDTO = $pisosRaw->map(function ($p) use ($mesas) {
            $mesasPiso = $mesas->where('piso_id', $p->id);
            $ocupadas = $mesasPiso->whereIn('estado', ['ocupada', 'cuenta_pedida'])->count();
            $libres = $mesasPiso->where('estado', 'libre')->count();

            return [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'total_mesas' => $mesasPiso->count(),
                'mesas_ocupadas' => $ocupadas,
                'mesas_libres' => $libres,
            ];
        });

        $pisoActivoDTO = $pisosDTO->firstWhere('id', $pisoActivo->id);

        // 4. Barra Lateral: Ítems Despacho en Vivo (Cocina KDS listos + Bebidas Salón listas)
        $itemsDespachoRaw = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->where('pi.estado', 'listo')
            ->select([
                'pi.id as item_id',
                'pi.pedido_id',
                'm.id as mesa_id',
                'm.numero as mesa_numero',
                'pis.nombre as ambiente',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.nota_cocina as nota_especial',
                'prod.requiere_preparacion',
                'pi.fecha_listo_cocina',
                'pi.created_at',
                'u.nombre as mozo_nombre',
                'p.mozo_id',
            ])
            ->orderBy('pi.updated_at', 'desc')
            ->get();

        $itemsDespacho = $itemsDespachoRaw->map(function ($it) use ($user) {
            $segundos = $it->fecha_listo_cocina
                ? (int) max(0, now()->timestamp - strtotime($it->fecha_listo_cocina))
                : (int) max(0, now()->timestamp - strtotime($it->created_at));

            return [
                'item_id' => $it->item_id,
                'pedido_id' => $it->pedido_id,
                'mesa_id' => $it->mesa_id,
                'mesa_numero' => $it->mesa_numero,
                'ambiente' => $it->ambiente,
                'producto_nombre' => $it->producto_nombre,
                'cantidad' => (int) $it->cantidad,
                'nota_especial' => $it->nota_especial,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
                'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                'pase_cocina' => $it->requiere_preparacion ? 'Pase Caliente #01' : null,
                'segundos_listo' => $segundos,
                'mozo_nombre' => $it->mozo_nombre,
                'es_mi_mesa' => $it->mozo_id === $user->id,
            ];
        });

        // 5. Comandas en Preparación KDS
        $comandasPrepRaw = DB::table('pedido as p')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('pedido_item as pi', 'pi.pedido_id', '=', 'p.id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'borrador'])
            ->where('prod.requiere_preparacion', true)
            ->whereIn('pi.estado', ['en_cola', 'en_preparacion'])
            ->select([
                'p.id as pedido_id',
                'm.numero as mesa_numero',
                'p.numero_comanda',
                'p.created_at',
                DB::raw('COUNT(pi.id) as total_items'),
                DB::raw("COUNT(CASE WHEN pi.estado = 'en_preparacion' THEN 1 END) as items_en_fuego"),
            ])
            ->groupBy('p.id', 'm.numero', 'p.numero_comanda', 'p.created_at')
            ->get();

        $comandasPreparacion = $comandasPrepRaw->map(function ($cp) {
            $minutos = (int) max(0, round((now()->timestamp - strtotime($cp->created_at)) / 60));

            return [
                'pedido_id' => $cp->pedido_id,
                'mesa_numero' => $cp->mesa_numero,
                'numero_comanda' => (int) $cp->numero_comanda,
                'minutos_transcurridos' => $minutos,
                'total_items' => (int) $cp->total_items,
                'items_en_fuego' => (int) $cp->items_en_fuego,
            ];
        });

        // 6. Alertas operativas (productos agotados o demoras)
        $alertasOperativas = [];
        $productosAgotados = DB::table('producto')
            ->where('local_id', $localId)
            ->where('disponibilidad', 'agotado')
            ->select('id', 'nombre')
            ->limit(3)
            ->get();

        foreach ($productosAgotados as $pa) {
            $alertasOperativas[] = [
                'id' => 'alerta-agotado-'.$pa->id,
                'tipo' => 'quiebre_insumo',
                'titulo' => 'Plato Agotado en Cocina',
                'descripcion' => "{$pa->nombre} no disponible para comandar.",
                'hora' => date('H:i'),
            ];
        }

        // 7. Métricas del piso activo y turno
        $mesasPisoActivo = $mesas->where('piso_id', $pisoActivo->id);
        $mesasLibres = $mesasPisoActivo->where('estado', 'libre')->count();
        $mesasOcupadas = $mesasPisoActivo->whereIn('estado', ['ocupada', 'cuenta_pedida'])->count();
        $totalMesas = $mesasPisoActivo->count();
        $misMesasActivas = $mesas->where('es_mi_mesa', true)->whereIn('estado', ['ocupada', 'cuenta_pedida'])->count();
        $totalVentaTurno = (float) $mesas->whereIn('estado', ['ocupada', 'cuenta_pedida'])->sum('total_consumo');

        $totalReservasHoy = DB::table('reserva')
            ->where('local_id', $localId)
            ->whereDate('fecha_hora', now()->toDateString())
            ->whereIn('estado', ['confirmada', 'bloqueada'])
            ->count();

        return ApiResponse::ok([
            'piso_activo' => $pisoActivoDTO,
            'pisos_disponibles' => $pisosDTO,
            'mesas' => $mesas->values(),
            'items_despacho' => $itemsDespacho->values(),
            'comandas_preparacion' => $comandasPreparacion->values(),
            'alertas_operativas' => $alertasOperativas,
            'mesas_libres' => $mesasLibres,
            'mesas_ocupadas' => $mesasOcupadas,
            'total_mesas' => $totalMesas,
            'mis_mesas_activas' => $misMesasActivas,
            'total_venta_turno' => round($totalVentaTurno, 2),
            'reservas_activas_count' => $totalReservasHoy,
            'mozo_actual' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'rol' => $user->rol,
            ],
        ]);
    }

    /**
     * CU-MOZO-01: Abrir una mesa libre sentando comensales.
     */
    public function abrirMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('La mesa especificada no existe en esta sede.', 404);
        }

        $comensales = (int) $request->input('comensales', $mesa->capacidad ?: 2);

        return DB::transaction(function () use ($mesa, $comensales, $user, $localId) {
            $mesa = DB::table('mesa')->where('id', $mesa->id)->where('local_id', $localId)->lockForUpdate()->first();
            if (! $mesa || $mesa->estado !== 'activa'
                || ! DB::table('piso')->where('id', $mesa->piso_id)->where('local_id', $localId)->where('estado', 'activo')->exists()
                || ! DB::table('local')->where('id', $localId)->where('estado', 'activo')->exists()) {
                return ApiResponse::error('ERR_MESA_NO_DISPONIBLE', 'La mesa o su ambiente no están disponibles.', 409);
            }

            // Verificar si ya tiene pedido activo
            $pedidoExistente = DB::table('pedido')
                ->where('mesa_id', $mesa->id)
                ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
                ->first();

            if ($pedidoExistente) {
                return ApiResponse::ok([
                    'pedido_id' => $pedidoExistente->id,
                    'pedidoId' => $pedidoExistente->id,
                    'mensaje' => 'La mesa ya contaba con un pedido activo.',
                ]);
            }

            $siguienteComanda = ((int) DB::table('pedido')
                ->where('local_id', $localId)
                ->max('numero_comanda')) + 1;

            $pedidoId = (string) Str::uuid();

            DB::table('pedido')->insert([
                'id' => $pedidoId,
                'local_id' => $localId,
                'numero_comanda' => $siguienteComanda,
                'mesa_id' => $mesa->id,
                'mozo_id' => $user->id,
                'estado' => 'enviado',
                'comensales' => $comensales,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return ApiResponse::ok([
                'pedido_id' => $pedidoId,
                'pedidoId' => $pedidoId,
                'mensaje' => "Mesa {$mesa->numero} abierta exitosamente con {$comensales} comensales.",
            ], 201);
        });
    }

    /**
     * CU-MOZO-01: Obtener detalle de mesa para el Quick-Drawer táctil.
     */
    public function getDetalleMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa as m')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.id', $id)
            ->where('m.local_id', $localId)
            ->select('m.*', 'pis.nombre as ambiente_nombre')
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $mesaEfectivaId = $mesa->mesa_principal_id ?? $mesa->id;

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesaEfectivaId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select('p.*', 'u.nombre as mozo_nombre')
            ->orderBy('p.created_at', 'desc')
            ->first();

        // Información de agrupación / unión de mesas
        $esMesaUnida = false;
        $etiquetaUnion = null;
        $mesasAgrupadasDetalle = null;
        $mesaPrincipalId = $mesa->mesa_principal_id;

        if ($mesaPrincipalId) {
            $principal = DB::table('mesa')->where('id', $mesaPrincipalId)->first();
            $hermanas = DB::table('mesa')->where('mesa_principal_id', $mesaPrincipalId)->get();
            $todosNumeros = collect([$principal?->numero])
                ->merge($hermanas->pluck('numero'))
                ->filter()
                ->sort()
                ->values();
            $etiquetaUnion = 'Mesa [ ' . implode(' ; ', $todosNumeros->all()) . ' ]';
            $mesasAgrupadasDetalle = 'Mesa ' . ($principal?->numero ?? '') . ' (Titular) + ' . $hermanas->pluck('numero')->map(fn($n) => "Mesa $n")->implode(', ');
            $esMesaUnida = true;
        } else {
            $hijas = DB::table('mesa')->where('mesa_principal_id', $mesa->id)->get();
            if ($hijas->isNotEmpty()) {
                $todosNumeros = collect([$mesa->numero])
                    ->merge($hijas->pluck('numero'))
                    ->sort()
                    ->values();
                $etiquetaUnion = 'Mesa [ ' . implode(' ; ', $todosNumeros->all()) . ' ]';
                $mesasAgrupadasDetalle = "Mesa {$mesa->numero} (Titular) + " . $hijas->pluck('numero')->map(fn($n) => "Mesa $n")->implode(', ');
                $esMesaUnida = true;
            }
        }

        if (! $pedido) {
            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'numero' => $mesa->numero,
                'ambiente' => $mesa->ambiente_nombre,
                'estado' => 'libre',
                'etiqueta_union' => $etiquetaUnion,
                'comanda_id' => null,
                'numero_comanda' => null,
                'mozo_nombre' => $user->nombre,
                'es_mi_mesa' => false,
                'minutos_en_mesa' => 0,
                'comensales' => (int) $mesa->capacidad,
                'hora_apertura' => null,
                'items' => [],
                'total_subtotal' => 0.0,
                'nota_general' => null,
                'es_mesa_unida' => $esMesaUnida,
                'mesa_principal_id' => $mesaPrincipalId,
                'mesas_agrupadas_detalle' => $mesasAgrupadasDetalle,
                'es_cuenta_dividida' => false,
                'partes_subcuentas' => null,
                'subcuentas_resumen' => [],
            ]);
        }

        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->select([
                'pi.id',
                'pi.producto_id',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'prod.requiere_preparacion',
                'pi.estado',
                'pi.numero_ronda',
                'pi.updated_at',
            ])
            ->orderBy('pi.created_at')
            ->get();

        $items = $itemsRaw->map(function ($it) {
            $subtotal = (float) $it->cantidad * (float) $it->precio_unitario;
            $minutosEstado = (int) max(0, round((now()->timestamp - strtotime($it->updated_at)) / 60));

            return [
                'id' => $it->id,
                'producto_id' => $it->producto_id,
                'producto_nombre' => $it->producto_nombre,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => round($subtotal, 2),
                'nota_cocina' => $it->nota_cocina,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
                'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                'estado' => $it->estado,
                'minutos_en_estado' => $minutosEstado,
                'numero_ronda' => (int) $it->numero_ronda,
            ];
        });

        $totalSubtotal = (float) $items->sum('subtotal');
        $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

        // Subcuentas registradas
        $subcuentasRaw = DB::table('pedido_subcuenta')
            ->where('pedido_id', $pedido->id)
            ->where('estado', '!=', 'anulado')
            ->orderBy('numero_subcuenta')
            ->get();

        $subcuentasResumen = $subcuentasRaw->map(function ($s) {
            $totalItems = DB::table('pedido_subcuenta_item')
                ->where('subcuenta_id', $s->id)
                ->sum('cantidad');

            return [
                'id' => $s->id,
                'numero' => (int) $s->numero_subcuenta,
                'nombre_referencia' => $s->nombre_cliente,
                'tipo_comprobante' => $s->tipo_comprobante,
                'cliente' => $s->nombre_cliente,
                'documento' => $s->documento_cliente,
                'medio_pago' => $s->medio_pago,
                'total' => (float) $s->total,
                'total_items' => (int) $totalItems,
                'estado' => $s->estado,
            ];
        });
        $esCuentaDividida = $subcuentasResumen->isNotEmpty();

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'numero' => $mesa->numero,
            'ambiente' => $mesa->ambiente_nombre,
            'estado' => ($pedido->estado === 'cuenta_pedida' || ! empty($pedido->precuenta_generada_at)) ? 'cuenta_pedida' : 'ocupada',
            'etiqueta_union' => $etiquetaUnion,
            'comanda_id' => $pedido->id,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'mozo_nombre' => $pedido->mozo_nombre ?? $user->nombre,
            'es_mi_mesa' => $pedido->mozo_id === $user->id,
            'minutos_en_mesa' => $minutosEnMesa,
            'comensales' => (int) $pedido->comensales,
            'hora_apertura' => date('H:i', strtotime($pedido->created_at)),
            'items' => $items->values(),
            'total_subtotal' => round($totalSubtotal, 2),
            'nota_general' => null,
            'es_mesa_unida' => $esMesaUnida,
            'mesa_principal_id' => $mesaPrincipalId,
            'mesas_agrupadas_detalle' => $mesasAgrupadasDetalle,
            'es_cuenta_dividida' => $esCuentaDividida,
            'partes_subcuentas' => $esCuentaDividida ? $subcuentasResumen->count() : null,
            'subcuentas_resumen' => $subcuentasResumen->values(),
        ]);
    }

    /**
     * CU-MOZO-01: Marcar plato o bebida servido en salón en 1 toque.
     */
    public function marcarItemServido(string $id, Request $request): JsonResponse
    {
        $user = $request->user();

        $item = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('pi.id', $id)
            ->where('p.local_id', $user->local_id)
            ->select('pi.id', 'pi.estado')
            ->first();

        if (! $item) {
            return ApiResponse::error('Ítem de pedido no encontrado.', 404);
        }

        DB::table('pedido_item')
            ->where('id', $id)
            ->update([
                'estado' => 'entregado',
                'updated_at' => now(),
            ]);

        return ApiResponse::ok([
            'item_id' => $id,
            'estado' => 'entregado',
            'mensaje' => 'Ítem marcado como servido al comensal.',
        ]);
    }

    /**
     * CU-MOZO-01 / CU-MOZO-08: Solicitar cuenta a caja y persistir sugerencias fiscales SUNAT.
     */
    public function solicitarCuenta(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $preferencias = $request->validate([
            'medio_pago' => ['nullable', 'string'],
            'metodo_pago' => ['nullable', 'string'],
            'numero_operacion' => ['nullable', 'string', 'max:100'],
            'tipo_comprobante' => ['nullable', 'in:boleta,factura,nota_venta'],
            'tipo_comprobante_sugerido' => ['nullable', 'in:boleta,factura,nota_venta'],
            'documento_cliente' => ['nullable', 'string', 'max:20'],
            'documento_cliente_sugerido' => ['nullable', 'string', 'max:20'],
            'nombre_cliente' => ['nullable', 'string', 'max:255'],
            'nombre_cliente_sugerido' => ['nullable', 'string', 'max:255'],
            'promocion_id' => ['nullable', 'uuid'],
        ]);

        $pedido = DB::table('pedido')
            ->where('mesa_id', $id)
            ->where('local_id', $localId)
            ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('No hay una comanda activa para solicitar la cuenta en esta mesa.', 404);
        }

        $tipoComprobante = $preferencias['tipo_comprobante'] 
            ?? $preferencias['tipo_comprobante_sugerido'] 
            ?? $pedido->tipo_comprobante_sugerido;

        $docCliente = $preferencias['documento_cliente'] 
            ?? $preferencias['documento_cliente_sugerido'] 
            ?? $pedido->documento_cliente_sugerido;

        $nomCliente = $preferencias['nombre_cliente'] 
            ?? $preferencias['nombre_cliente_sugerido'] 
            ?? $pedido->nombre_cliente_sugerido;

        $promocionId = $preferencias['promocion_id'] ?? $pedido->promocion_id;

        DB::table('pedido')
            ->where('id', $pedido->id)
            ->update([
                'precuenta_generada_at' => now(),
                'estado' => 'cuenta_pedida',
                'promocion_id' => $promocionId,
                'tipo_comprobante_sugerido' => $tipoComprobante,
                'documento_cliente_sugerido' => $docCliente,
                'nombre_cliente_sugerido' => $nomCliente,
                'updated_at' => now(),
            ]);

        return ApiResponse::ok([
            'mesa_id' => $id,
            'pedido_id' => $pedido->id,
            'mensaje' => 'Cuenta solicitada exitosamente. Se ha alertado al personal de Caja.',
        ]);
    }

    /**
     * CU-MOZO-01 / CU-MOZO-06: Liberar mesa cuando el cliente se retiró sin consumir (0 ítems).
     */
    public function liberarMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('La mesa no existe en esta sede.', 404);
        }

        // Si la mesa es secundaria, la titular es mesa_principal_id; si es titular o individual, es ella misma
        $titularId = $mesa->mesa_principal_id ?? $mesa->id;
        $titular = ($titularId === $mesa->id)
            ? $mesa
            : DB::table('mesa')->where('id', $titularId)->where('local_id', $localId)->first();

        // Buscar todas las mesas secundarias vinculadas a la titular
        $secundarias = DB::table('mesa')
            ->where('local_id', $localId)
            ->where('mesa_principal_id', $titularId)
            ->get();

        $todasMesasIds = collect([$titularId])->merge($secundarias->pluck('id'))->unique();

        // Buscar comanda activa en la titular (o en alguna mesa del grupo)
        $pedido = DB::table('pedido')
            ->whereIn('mesa_id', $todasMesasIds)
            ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            // Si no hay pedido activo pero había unión huérfana, desunir de todas formas
            if ($secundarias->isNotEmpty()) {
                DB::table('mesa')
                    ->where('local_id', $localId)
                    ->where('mesa_principal_id', $titularId)
                    ->update([
                        'mesa_principal_id' => null,
                        'updated_at' => now(),
                    ]);
            }

            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'numero' => $mesa->numero,
                'union_disuelta' => $secundarias->isNotEmpty(),
                'mesas_restauradas' => collect([$titular?->numero])->merge($secundarias->pluck('numero'))->unique()->filter()->values()->all(),
                'mensaje' => 'La mesa ya se encuentra libre.',
            ]);
        }

        // Verificar si existen ítems activos registrados
        $itemsActivos = DB::table('pedido_item')
            ->where('pedido_id', $pedido->id)
            ->where('estado', '!=', 'anulado')
            ->count();

        if ($itemsActivos > 0) {
            return ApiResponse::error(
                'No se puede liberar la mesa directamente porque posee platos o bebidas registrados. Debe anular los ítems o la comanda mediante el procedimiento regular.',
                422
            );
        }

        return DB::transaction(function () use ($mesa, $titular, $secundarias, $pedido, $titularId, $localId) {
            // Anular la comanda vacía
            DB::table('pedido')
                ->where('id', $pedido->id)
                ->update([
                    'estado' => 'anulado',
                    'updated_at' => now(),
                ]);

            $unionDisuelta = false;
            if ($secundarias->isNotEmpty()) {
                DB::table('mesa')
                    ->where('local_id', $localId)
                    ->where('mesa_principal_id', $titularId)
                    ->update([
                        'mesa_principal_id' => null,
                        'updated_at' => now(),
                    ]);
                $unionDisuelta = true;
            }

            $todosNumeros = collect([$titular?->numero])
                ->merge($secundarias->pluck('numero'))
                ->unique()
                ->filter()
                ->sort()
                ->values();

            $mensaje = $unionDisuelta
                ? "Mesa {$titular->numero} y sus mesas unidas (" . $secundarias->pluck('numero')->implode(', ') . ") liberadas exitosamente y separadas como nuevas."
                : "Mesa {$mesa->numero} liberada exitosamente. Vuelve a estar disponible para nuevos comensales.";

            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'numero' => $mesa->numero,
                'union_disuelta' => $unionDisuelta,
                'mesas_restauradas' => $todosNumeros->all(),
                'mensaje' => $mensaje,
            ]);
        });
    }

    /**
     * CU-MOZO-04: Obtener candidatas para unir a una mesa titular.
     */
    public function getCandidatasUnion(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesaOrigen = DB::table('mesa')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $mesaOrigen) {
            return ApiResponse::error('Mesa de origen no encontrada.', 404);
        }

        // Obtener todas las mesas del mismo piso (excluyendo la origen)
        $mesasPiso = DB::table('mesa')
            ->where('local_id', $localId)
            ->where('piso_id', $mesaOrigen->piso_id)
            ->where('id', '!=', $mesaOrigen->id)
            ->where('estado', 'activa')
            ->orderBy('numero')
            ->get();

        // Pedidos activos en el piso
        $pedidosActivos = DB::table('pedido')
            ->where('local_id', $localId)
            ->whereIn('mesa_id', $mesasPiso->pluck('id'))
            ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
            ->get()
            ->keyBy('mesa_id');

        // Reservas próximas (dentro de 35 min)
        $reservasProximas = DB::table('reserva as r')
            ->join('reserva_mesa as rm', 'rm.reserva_id', '=', 'r.id')
            ->where('r.local_id', $localId)
            ->where('r.estado', 'confirmada')
            ->where('r.fecha_hora', '>=', now())
            ->where('r.fecha_hora', '<=', now()->addMinutes(35))
            ->whereIn('rm.mesa_id', $mesasPiso->pluck('id'))
            ->pluck('rm.mesa_id')
            ->flip();

        $candidatas = $mesasPiso->map(function ($m) use ($pedidosActivos, $reservasProximas) {
            $pedido = $pedidosActivos->get($m->id);
            $tieneReserva = $reservasProximas->has($m->id);

            $estadoMesa = 'libre';
            if ($pedido) {
                $estadoMesa = $pedido->estado === 'cuenta_pedida' ? 'cuenta_pedida' : 'ocupada';
            } elseif ($tieneReserva) {
                $estadoMesa = 'bloqueada';
            }

            $elegible = true;
            $motivoBloqueo = null;

            if (! $m->permite_union) {
                $elegible = false;
                $motivoBloqueo = 'Mesa fija (No permite unión)';
            } elseif ($estadoMesa === 'ocupada') {
                $elegible = false;
                $motivoBloqueo = 'Ocupada con comanda activa';
            } elseif ($estadoMesa === 'cuenta_pedida') {
                $elegible = false;
                $motivoBloqueo = 'Cuenta pedida en espera de caja';
            } elseif ($estadoMesa === 'bloqueada') {
                $elegible = false;
                $motivoBloqueo = 'Bloqueada por reserva inminente';
            } elseif (! empty($m->mesa_principal_id)) {
                $elegible = false;
                $motivoBloqueo = 'Ya vinculada a otro grupo';
            }

            return [
                'id' => $m->id,
                'numero' => $m->numero,
                'capacidad' => (int) $m->capacidad,
                'posicion_x' => (int) $m->posicion_x,
                'posicion_y' => (int) $m->posicion_y,
                'estado' => $estadoMesa,
                'permite_union' => (bool) $m->permite_union,
                'elegible' => $elegible,
                'motivo_bloqueo' => $motivoBloqueo,
            ];
        });

        return ApiResponse::ok([
            'mesa_origen_id' => $mesaOrigen->id,
            'numero_origen' => $mesaOrigen->numero,
            'capacidad_origen' => (int) $mesaOrigen->capacidad,
            'candidatas' => $candidatas->values(),
        ]);
    }

    /**
     * CU-MOZO-04: Unir mesas físicas en salón bajo una mesa titular.
     */
    public function unirMesas(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'mesa_titular_id' => ['required', 'uuid'],
            'mesas_secundarias_ids' => ['required', 'array', 'min:1'],
            'mesas_secundarias_ids.*' => ['required', 'uuid'],
        ]);

        $titularId = $validated['mesa_titular_id'];
        $secundariasIds = array_unique($validated['mesas_secundarias_ids']);

        if (in_array($titularId, $secundariasIds, true)) {
            return ApiResponse::error('La mesa titular no puede incluirse como secundaria.', 422);
        }

        $titular = DB::table('mesa')
            ->where('id', $titularId)
            ->where('local_id', $localId)
            ->first();

        if (! $titular) {
            return ApiResponse::error('Mesa titular no encontrada.', 404);
        }

        if (! empty($titular->mesa_principal_id)) {
            return ApiResponse::error('La mesa titular seleccionada ya pertenece como secundaria a otro grupo.', 422);
        }

        $secundarias = DB::table('mesa')
            ->where('local_id', $localId)
            ->where('piso_id', $titular->piso_id)
            ->whereIn('id', $secundariasIds)
            ->get();

        if ($secundarias->count() !== count($secundariasIds)) {
            return ApiResponse::error('Una o más mesas secundarias no existen o no pertenecen al mismo piso.', 422);
        }

        // Validar que ninguna secundaria tenga pedido activo ni unión previa
        foreach ($secundarias as $sec) {
            if (! $sec->permite_union) {
                return ApiResponse::error("La mesa {$sec->numero} está configurada como mesa fija y no permite unión.", 422);
            }
            if (! empty($sec->mesa_principal_id)) {
                return ApiResponse::error("La mesa {$sec->numero} ya se encuentra unida a otro grupo.", 422);
            }

            $pedidoActivo = DB::table('pedido')
                ->where('mesa_id', $sec->id)
                ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
                ->first();

            if ($pedidoActivo) {
                return ApiResponse::error("La mesa {$sec->numero} posee una comanda activa. No puede unirse hasta cobrar o anular dicho pedido.", 422);
            }
        }

        return DB::transaction(function () use ($titular, $secundarias, $secundariasIds) {
            // Actualizar mesas secundarias asignando mesa_principal_id
            DB::table('mesa')
                ->whereIn('id', $secundariasIds)
                ->update([
                    'mesa_principal_id' => $titular->id,
                    'updated_at' => now(),
                ]);

            $todosNumeros = collect([$titular->numero])
                ->merge($secundarias->pluck('numero'))
                ->sort()
                ->values();

            $labelUnificado = 'Mesa [ ' . implode(' ; ', $todosNumeros->all()) . ' ]';
            $capacidadTotal = (int) $titular->capacidad + (int) $secundarias->sum('capacidad');

            $mesasItems = [
                [
                    'id' => $titular->id,
                    'numero' => $titular->numero,
                    'es_principal' => true,
                    'capacidad' => (int) $titular->capacidad,
                ],
            ];

            foreach ($secundarias as $s) {
                $mesasItems[] = [
                    'id' => $s->id,
                    'numero' => $s->numero,
                    'es_principal' => false,
                    'capacidad' => (int) $s->capacidad,
                ];
            }

            return ApiResponse::ok([
                'mesa_principal_id' => $titular->id,
                'label_unificado' => $labelUnificado,
                'capacidad_total' => $capacidadTotal,
                'mesas' => $mesasItems,
                'created_at' => now()->toIso8601String(),
            ]);
        });
    }

    /**
     * CU-MOZO-04: Validar si un grupo de mesas unidas puede separarse.
     */
    public function validarSeparacionMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $titularId = $mesa->mesa_principal_id ?: $mesa->id;
        $titular = DB::table('mesa')->where('id', $titularId)->first();
        $secundarias = DB::table('mesa')->where('mesa_principal_id', $titularId)->get();

        if ($secundarias->isEmpty() && empty($mesa->mesa_principal_id)) {
            return ApiResponse::error('La mesa no forma parte de ninguna unión de mesas.', 422);
        }

        $todosNumeros = collect([$titular?->numero])
            ->merge($secundarias->pluck('numero'))
            ->filter()
            ->sort()
            ->values();

        $label = 'Mesa [ ' . implode(' ; ', $todosNumeros->all()) . ' ]';

        $mesasRestaurar = [
            [
                'id' => $titular->id,
                'numero' => $titular->numero,
                'capacidad' => (int) $titular->capacidad,
                'rol' => 'titular',
            ],
        ];

        foreach ($secundarias as $s) {
            $mesasRestaurar[] = [
                'id' => $s->id,
                'numero' => $s->numero,
                'capacidad' => (int) $s->capacidad,
                'rol' => 'secundaria',
            ];
        }

        // Consultar consumos activos de la comanda titular
        $pedido = DB::table('pedido')
            ->where('mesa_id', $titularId)
            ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
            ->first();

        $itemsActivos = collect();
        if ($pedido) {
            $itemsActivos = DB::table('pedido_item')
                ->where('pedido_id', $pedido->id)
                ->where('estado', '!=', 'anulado')
                ->get();
        }

        $totalConsumo = (float) $itemsActivos->sum(fn ($i) => (float) $i->cantidad * (float) $i->precio_unitario);

        return ApiResponse::ok([
            'puede_separar' => true,
            'tiene_consumo_activo' => $itemsActivos->isNotEmpty(),
            'total_consumo' => round($totalConsumo, 2),
            'items_activos' => $itemsActivos->count(),
            'mesa_label' => $label,
            'mesa_titular' => [
                'id' => $titular->id,
                'numero' => $titular->numero,
                'capacidad' => (int) $titular->capacidad,
            ],
            'mesas_secundarias' => $secundarias->map(fn ($s) => [
                'id' => $s->id,
                'numero' => $s->numero,
                'capacidad' => (int) $s->capacidad,
            ])->values()->all(),
            'mesas_a_restaurar' => $mesasRestaurar,
        ]);
    }

    /**
     * CU-MOZO-04: Separar mesas unidas (selectiva o totalmente).
     * Las mesas secundarias desvinculadas retornan a estado LIBRE.
     * La mesa titular CONSERVA su comanda activa y consumos, permaneciendo OCUPADA.
     */
    public function separarMesas(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $titularId = $mesa->mesa_principal_id ?: $mesa->id;
        $titular = DB::table('mesa')->where('id', $titularId)->first();
        $secundarias = DB::table('mesa')->where('mesa_principal_id', $titularId)->get();

        if ($secundarias->isEmpty()) {
            return ApiResponse::error('La mesa no posee mesas secundarias asociadas para separar.', 422);
        }

        // Obtener IDs de secundarias a desvincular (opcional; si no se envía, desvincular todas)
        $solicitadas = $request->input('mesas_secundarias_ids');
        $secundariasIdsValidas = $secundarias->pluck('id')->all();

        $desvincularIds = [];
        if (! empty($solicitadas) && is_array($solicitadas)) {
            $desvincularIds = array_values(array_intersect($solicitadas, $secundariasIdsValidas));
            if (empty($desvincularIds)) {
                return ApiResponse::error('Ninguna de las mesas secundarias solicitadas pertenece a esta unión.', 422);
            }
        } else {
            $desvincularIds = $secundariasIdsValidas;
        }

        return DB::transaction(function () use ($titular, $titularId, $secundarias, $desvincularIds) {
            // Desvincular ÚNICAMENTE las secundarias seleccionadas
            DB::table('mesa')
                ->whereIn('id', $desvincularIds)
                ->update([
                    'mesa_principal_id' => null,
                    'updated_at' => now(),
                ]);

            $secundariasRestantes = $secundarias->whereNotIn('id', $desvincularIds);
            $grupoDisuelto = $secundariasRestantes->isEmpty();

            $desvinculadasNumeros = $secundarias->whereIn('id', $desvincularIds)->pluck('numero')->sort()->values();
            $restantesNumeros = collect([$titular->numero])->merge($secundariasRestantes->pluck('numero'))->sort()->values();

            $nuevaEtiqueta = $grupoDisuelto
                ? null
                : 'Mesa [ ' . implode(' ; ', $restantesNumeros->all()) . ' ]';

            $mensaje = $grupoDisuelto
                ? "Todas las mesas secundarias (" . implode(', ', $desvinculadasNumeros->all()) . ") fueron desvinculadas y liberadas. La Mesa {$titular->numero} continúa ocupada con la comanda activa."
                : "Mesa(s) " . implode(', ', $desvinculadasNumeros->all()) . " desvinculada(s) y liberada(s). Mesa {$titular->numero} y restantes continúan con la comanda activa ({$nuevaEtiqueta}).";

            return ApiResponse::ok([
                'mesa_principal_id' => $titularId,
                'mesas_separadas' => $desvincularIds,
                'mesas_separadas_numeros' => $desvinculadasNumeros->all(),
                'mesas_restantes_numeros' => $restantesNumeros->all(),
                'grupo_disuelto' => $grupoDisuelto,
                'nueva_etiqueta' => $nuevaEtiqueta,
                'mensaje' => $mensaje,
            ]);
        });
    }

    /**
     * CU-MOZO-02: Obtener catálogo de la carta para el mozo.
     */
    public function getCarta(Request $request): JsonResponse
    {
        return $this->getCartaMesa('', $request);
    }

    /**
     * CU-MOZO-02: Obtener catálogo de la carta en contexto de una mesa específica.
     */
    public function getCartaMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesaNumero = '04';
        $ambienteNombre = 'Salón Principal';

        if (! empty($id)) {
            $mesa = DB::table('mesa as m')
                ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
                ->where('m.id', $id)
                ->where('m.local_id', $localId)
                ->select('m.numero', 'pis.nombre as ambiente_nombre')
                ->first();

            if ($mesa) {
                $mesaNumero = $mesa->numero;
                $ambienteNombre = $mesa->ambiente_nombre;
            }
        }

        $categorias = DB::table('categoria_producto')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->orderBy('orden')
            ->get();

        $productosRaw = DB::table('producto as p')
            ->join('categoria_producto as c', 'c.id', '=', 'p.categoria_id')
            ->where('c.local_id', $localId)
            ->where('p.activo', true)
            ->select([
                'p.id',
                'p.categoria_id',
                'c.nombre as categoria_nombre',
                'p.nombre',
                'p.descripcion',
                'p.precio',
                'p.foto_url',
                'p.disponibilidad',
                'p.requiere_preparacion',
            ])
            ->orderBy('p.nombre')
            ->get();

        $productos = $productosRaw->map(function ($p) {
            return [
                'id' => $p->id,
                'categoria_id' => $p->categoria_id,
                'categoria_nombre' => $p->categoria_nombre,
                'nombre' => $p->nombre,
                'descripcion' => $p->descripcion ?? '',
                'precio' => (float) $p->precio,
                'foto_url' => $p->foto_url,
                'disponibilidad' => $p->disponibilidad,
                'requiere_preparacion' => (bool) $p->requiere_preparacion,
            ];
        });

        $categoriasDTO = $categorias->map(function ($c) use ($productos) {
            $totalCount = $productos->where('categoria_id', $c->id)->count();
            return [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'total' => $totalCount,
                'total_platos' => $totalCount,
            ];
        });

        return ApiResponse::ok([
            'mesa_id' => $id,
            'mesa_numero' => $mesaNumero,
            'ambiente_nombre' => $ambienteNombre,
            'categorias' => $categoriasDTO->values(),
            'productos' => $productos->values(),
        ]);
    }

    /**
     * CU-MOZO-02: Obtener historial de consumos y rondas previas de la mesa.
     */
    public function getHistorialMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa as m')
            ->leftJoin('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.id', $id)
            ->where('m.local_id', $localId)
            ->select('m.*', 'pis.nombre as ambiente_nombre')
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $mesaEfectivaId = $mesa->mesa_principal_id ?? $mesa->id;

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesaEfectivaId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select('p.*', 'u.nombre as mozo_nombre')
            ->orderBy('p.created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'mesa_numero' => $mesa->numero,
                'ambiente' => $mesa->ambiente_nombre ?? 'Salón Principal',
                'comensales' => (int) $mesa->capacidad,
                'minutos_en_mesa' => 0,
                'mozo_nombre' => $user->nombre,
                'comanda_id' => null,
                'numero_comanda' => null,
                'estado_mesa' => 'libre',
                'cuenta_pedida' => false,
                'ronda_actual' => 1,
                'ronda_previa_items' => [],
                'total_previo' => 0.0,
                'rondas_previas' => [],
                'total_acumulado' => 0.0,
            ]);
        }

        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->select([
                'pi.id',
                'pi.producto_id',
                'pi.numero_ronda',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'prod.requiere_preparacion',
                'pi.estado',
                'pi.created_at',
            ])
            ->orderBy('pi.numero_ronda')
            ->orderBy('pi.created_at')
            ->get();

        $maxRonda = $itemsRaw->max('numero_ronda') ?: 0;
        $rondaActual = $maxRonda + 1;

        $rondasAgrupadas = $itemsRaw->groupBy('numero_ronda')->map(function ($items, $numRonda) {
            $primero = $items->first();
            $minutosHace = (int) max(0, round((now()->timestamp - strtotime($primero->created_at)) / 60));

            return [
                'numero_ronda' => (int) $numRonda,
                'enviada_a' => date('H:i', strtotime($primero->created_at)),
                'minutos_hace' => $minutosHace,
                'items' => $items->map(fn ($it) => [
                    'id' => $it->id,
                    'producto_id' => $it->producto_id,
                    'producto_nombre' => $it->producto_nombre,
                    'cantidad' => (int) $it->cantidad,
                    'precio_unitario' => (float) $it->precio_unitario,
                    'subtotal' => round((float) $it->cantidad * (float) $it->precio_unitario, 2),
                    'nota_cocina' => $it->nota_cocina,
                    'requiere_preparacion' => (bool) $it->requiere_preparacion,
                    'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                    'estado' => $it->estado,
                ])->values(),
            ];
        });

        $rondaPreviaItems = $itemsRaw->map(function ($it) {
            $subtotal = round((float) $it->cantidad * (float) $it->precio_unitario, 2);
            $minutosEstado = (int) max(0, round((now()->timestamp - strtotime($it->created_at)) / 60));

            return [
                'id' => $it->id,
                'producto_id' => $it->producto_id,
                'producto_nombre' => $it->producto_nombre,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => $subtotal,
                'nota_cocina' => $it->nota_cocina,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
                'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                'estado' => $it->estado,
                'minutos_en_estado' => $minutosEstado,
                'numero_ronda' => (int) $it->numero_ronda,
            ];
        })->values();

        $totalPrevio = round((float) $itemsRaw->sum(fn ($i) => (float) $i->cantidad * (float) $i->precio_unitario), 2);
        $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'ambiente' => $mesa->ambiente_nombre ?? 'Salón Principal',
            'comensales' => (int) $pedido->comensales,
            'minutos_en_mesa' => $minutosEnMesa,
            'mozo_nombre' => $pedido->mozo_nombre ?? $user->nombre,
            'comanda_id' => $pedido->id,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'estado_mesa' => $pedido->estado,
            'cuenta_pedida' => $pedido->estado === 'cuenta_pedida',
            'ronda_actual' => $rondaActual,
            'ronda_previa_items' => $rondaPreviaItems,
            'total_previo' => $totalPrevio,
            'rondas_previas' => $rondasAgrupadas->values(),
            'total_acumulado' => $totalPrevio,
        ]);
    }

    /**
     * Alias de envío para /mozo/mesas/{id}/pedidos.
     */
    public function enviarPedidoMesa(string $id, Request $request): JsonResponse
    {
        $request->merge(['mesa_id' => $id]);

        return $this->crearPedido($request);
    }

    /**
     * CU-MOZO-02: Envío de comanda a cocina y salón con validación de agotados (409 Conflict).
     */
    public function crearPedido(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'mesa_id' => ['required', 'uuid'],
            'comensales' => ['nullable', 'integer', 'min:1'],
            'numero_ronda' => ['nullable', 'integer', 'min:1'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => ['required', 'uuid'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.nota_cocina' => ['nullable', 'string', 'max:200'],
        ]);

        $mesa = DB::table('mesa')->where('id', $validated['mesa_id'])->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('La mesa especificada no existe en esta sede.', 404);
        }

        // 1. Validación de Disponibilidad / Stock Concurrente
        $productoIds = collect($validated['items'])->pluck('producto_id')->unique();
        $productosDB = DB::table('producto')
            ->whereIn('id', $productoIds)
            ->where('local_id', $localId)
            ->get()
            ->keyBy('id');

        foreach ($validated['items'] as $it) {
            $prod = $productosDB->get($it['producto_id']);
            if (! $prod) {
                return ApiResponse::error("El producto {$it['producto_id']} no existe en el catálogo.", 400);
            }
            if ($prod->disponibilidad === 'agotado') {
                return response()->json([
                    'exito' => false,
                    'datos' => null,
                    'errores' => [
                        [
                            'codigo' => 'ERR_PRODUCTO_AGOTADO',
                            'mensaje' => "El insumo o plato '{$prod->nombre}' se agotó en cocina hace segundos. Por favor coordina una sustitución con el comensal.",
                            'producto_id' => $prod->id,
                            'producto_nombre' => $prod->nombre,
                        ],
                    ],
                    'meta' => ['timestamp' => now()->toIso8601String()],
                ], 409);
            }
        }

        // 2. Transacción de inserción
        return DB::transaction(function () use ($validated, $user, $localId, $productosDB, $mesa) {
            $mesa = DB::table('mesa')->where('id', $mesa->id)->where('local_id', $localId)->lockForUpdate()->first();
            if (! $mesa || $mesa->estado !== 'activa'
                || ! DB::table('piso')->where('id', $mesa->piso_id)->where('local_id', $localId)->where('estado', 'activo')->exists()
                || ! DB::table('local')->where('id', $localId)->where('estado', 'activo')->exists()) {
                return ApiResponse::error('ERR_MESA_NO_DISPONIBLE', 'La mesa o su ambiente no están disponibles.', 409);
            }

            $pedidoExistente = DB::table('pedido')
                ->where('mesa_id', $validated['mesa_id'])
                ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
                ->first();

            if ($pedidoExistente && $pedidoExistente->estado === 'cuenta_pedida') {
                return ApiResponse::error(
                    'La mesa se encuentra en estado CUENTA PEDIDA. La comanda está en proceso de cobro en Caja y no se pueden agregar nuevos platos ni bebidas.',
                    422
                );
            }

            $comensales = $validated['comensales'] ?? ($pedidoExistente?->comensales ?? $mesa->capacidad ?: 2);
            $pedidoId = $pedidoExistente ? $pedidoExistente->id : (string) Str::uuid();

            if (! $pedidoExistente) {
                $siguienteComanda = ((int) DB::table('pedido')
                    ->where('local_id', $localId)
                    ->max('numero_comanda')) + 1;

                DB::table('pedido')->insert([
                    'id' => $pedidoId,
                    'local_id' => $localId,
                    'numero_comanda' => $siguienteComanda,
                    'mesa_id' => $validated['mesa_id'],
                    'mozo_id' => $user->id,
                    'estado' => 'enviado',
                    'comensales' => $comensales,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Calcular número de ronda
            $rondaMax = (int) DB::table('pedido_item')
                ->where('pedido_id', $pedidoId)
                ->max('numero_ronda');
            $numeroRonda = $validated['numero_ronda'] ?? ($rondaMax + 1);

            $itemsInsertados = 0;
            $itemsCocina = 0;
            $itemsSalon = 0;

            foreach ($validated['items'] as $item) {
                $prod = $productosDB->get($item['producto_id']);
                if (! $prod) {
                    continue;
                }

                $requiereCocina = (bool) $prod->requiere_preparacion;
                // Si requiere preparación va a la cola KDS, si es bebida/postre de salón nace listo de inmediato
                $estadoInicial = $requiereCocina ? 'en_cola' : 'listo';
                $fechaListo = $requiereCocina ? null : now();

                $itemId = (string) Str::uuid();

                DB::table('pedido_item')->insert([
                    'id' => $itemId,
                    'pedido_id' => $pedidoId,
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $prod->precio,
                    'nota_cocina' => $item['nota_cocina'] ?? null,
                    'estado' => $estadoInicial,
                    'numero_ronda' => $numeroRonda,
                    'fecha_listo_cocina' => $fechaListo,
                    'stock_descontado' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Despacho directo de salón: si el producto no requiere preparación culinaria, descontar stock de inmediato
                if (! $requiereCocina) {
                    app(StockDeduccionService::class)->descontarRecetaItem($itemId, $user->id);
                }

                $itemsInsertados++;
                if ($requiereCocina) {
                    $itemsCocina++;
                } else {
                    $itemsSalon++;
                }
            }

            return ApiResponse::ok([
                'pedido_id' => $pedidoId,
                'ronda' => $numeroRonda,
                'items_cocina' => $itemsCocina,
                'items_salon' => $itemsSalon,
                'mensaje' => "Comanda enviada exitosamente ({$itemsCocina} a cocina, {$itemsSalon} a salón).",
            ], 201);
        });
    }

    /**
     * CU-MOZO-08: Precuenta digital de mesa en salón.
     */
    public function getPrecuentaMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa as m')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.id', $id)
            ->where('m.local_id', $localId)
            ->select('m.*', 'pis.nombre as ambiente_nombre')
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $mesaEfectivaId = $mesa->mesa_principal_id ?? $mesa->id;

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesaEfectivaId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select('p.*', 'u.nombre as mozo_nombre')
            ->orderBy('p.created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('No existe un pedido activo para generar la precuenta de esta mesa.', 404);
        }

        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->select([
                'pi.id',
                'pi.producto_id',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'pi.numero_ronda',
                'prod.requiere_preparacion',
                'pi.estado',
            ])
            ->get();

        $items = $itemsRaw->map(function ($it) {
            $subtotal = round((float) $it->cantidad * (float) $it->precio_unitario, 2);

            return [
                'id' => $it->id,
                'producto_id' => $it->producto_id,
                'nombre' => $it->producto_nombre,
                'producto_nombre' => $it->producto_nombre,
                'nota_cocina' => $it->nota_cocina,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => $subtotal,
                'estado_cocina' => $it->estado,
                'numero_ronda' => (int) $it->numero_ronda,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
            ];
        });

        $total = (float) $items->sum('subtotal');
        $baseImponible = round($total / 1.18, 2);
        $igv = round($total - $baseImponible, 2);

        $tieneCocinaPendiente = $itemsRaw->where('requiere_preparacion', true)->whereIn('estado', ['en_cola', 'en_preparacion'])->isNotEmpty();

        $metodosPagoRaw = DB::table('metodo_pago_local')
            ->where('local_id', $localId)
            ->where('activo', true)
            ->whereIn('codigo', ['efectivo', 'tarjeta', 'billetera_digital'])
            ->orderBy('orden')
            ->get();

        $opcionesPago = $metodosPagoRaw->map(function ($mp) use ($total) {
            $porcentajeRecargo = $mp->codigo === 'tarjeta'
                ? (float) $mp->comision_porcentaje
                : 0.0;
            $comision = round($total * ($porcentajeRecargo / 100), 2);
            $datosAdicionales = is_string($mp->datos_adicionales)
                ? json_decode($mp->datos_adicionales, true)
                : (array) ($mp->datos_adicionales ?? []);

            $esBilletera = in_array($mp->codigo, ['billetera_digital', 'yape', 'plin']);

            return [
                'id' => $mp->id,
                'codigo' => $mp->codigo,
                'nombre' => $mp->nombre,
                'icono' => $mp->icono ?? 'wallet',
                'comision_porcentaje' => $porcentajeRecargo,
                'monto_comision' => $comision,
                'total_estimado' => round($total + $comision, 2),
                'detalle_billetera' => $esBilletera ? [
                    'telefono' => $datosAdicionales['telefono'] ?? '930723537',
                    'titular' => $datosAdicionales['titular'] ?? 'ÁUREA S.A.C.',
                    'ruc' => $datosAdicionales['ruc'] ?? '20601234567',
                    'monto_exacto' => round($total, 2),
                ] : null,
                'datos_adicionales' => $datosAdicionales,
            ];
        });

        $promociones = DB::table('promocion')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->get()
            ->map(fn ($pr) => [
                'id' => $pr->id,
                'nombre' => $pr->nombre,
                'tipo_descuento' => 'porcentaje',
                'porcentaje_descuento' => (float) $pr->valor,
                'valor' => (float) $pr->valor,
                'descripcion' => $pr->descripcion,
                'descripcion_condicion' => $pr->descripcion,
            ]);

        $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

        $subcuentasRaw = DB::table('pedido_subcuenta')
            ->where('pedido_id', $pedido->id)
            ->where('estado', '!=', 'anulado')
            ->orderBy('numero_subcuenta')
            ->get();

        $subcuentas = $subcuentasRaw->map(function ($s) {
            return [
                'id' => $s->id,
                'numero_subcuenta' => (int) $s->numero_subcuenta,
                'nombre_referencia' => "Subcuenta #{$s->numero_subcuenta}",
                'nombre_titular' => $s->nombre_cliente,
                'titular_referencia' => $s->nombre_cliente,
                'tipo_comprobante' => $s->tipo_comprobante,
                'tipo_comprobante_sugerido' => strtoupper($s->tipo_comprobante),
                'total_neto' => (float) $s->total,
                'estado' => $s->estado,
                'estado_pago' => $s->estado,
                'medio_pago_tentativo' => $s->medio_pago,
            ];
        });

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'ambiente' => $mesa->ambiente_nombre,
            'es_mesa_unida' => ! empty($mesa->mesa_principal_id),
            'mozo_nombre' => $pedido->mozo_nombre ?? $user->nombre,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'comensales' => (int) $pedido->comensales,
            'minutos_en_mesa' => $minutosEnMesa,
            'items' => $items->values(),
            'consumos' => $items->values(),
            'tiene_cocina_pendiente' => $tieneCocinaPendiente,
            'alerta_cocina' => $tieneCocinaPendiente ? 'Existen platos pendientes de salida en cocina.' : null,
            'promociones_disponibles' => $promociones,
            'promocion_activa' => null,
            'tributacion_sunat' => [
                'consumo_bruto' => round($total, 2),
                'descuento_comercial' => 0.0,
                'total_neto' => round($total, 2),
                'base_imponible' => $baseImponible,
                'igv' => $igv,
                'tasa_igv' => 18.0,
            ],
            'opciones_pago' => $opcionesPago->values(),
            'subcuentas' => $subcuentas->isNotEmpty() ? $subcuentas->values() : null,
            'subtotal' => $baseImponible,
            'descuento' => 0.0,
            'base_imponible' => $baseImponible,
            'igv' => $igv,
            'total' => round($total, 2),
            'calculada_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * CU-MOZO-09 / CU-CAJA-04: Obtener ítems consumidos de la mesa listos para subdividir.
     */
    public function getItemsDividir(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $mesa) {
            return ApiResponse::error('La mesa no existe en esta sede.', 404);
        }

        $pedido = DB::table('pedido')
            ->where('mesa_id', $mesa->id)
            ->where('local_id', $localId)
            ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('No hay un pedido activo para dividir en esta mesa.', 404);
        }

        // Obtener ítems activos de la comanda
        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->where('pi.estado_pago', 'pendiente')
            ->select([
                'pi.id',
                'pi.producto_id',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'pi.estado as estado_cocina',
            ])
            ->orderBy('pi.created_at')
            ->get();

        // Consultar si existen subcuentas pendientes previamente guardadas
        $subcuentasPrevias = DB::table('pedido_subcuenta')
            ->where('pedido_id', $pedido->id)
            ->where('estado', 'pendiente')
            ->orderBy('numero_subcuenta')
            ->get();

        // Mapeo de items asignados si ya existían subcuentas
        $subcuentaItemsMap = collect();
        if ($subcuentasPrevias->isNotEmpty()) {
            $subcuentaItemsMap = DB::table('pedido_subcuenta_item')
                ->whereIn('subcuenta_id', $subcuentasPrevias->pluck('id'))
                ->get()
                ->keyBy('pedido_item_id');
        }

        $items = $itemsRaw->map(function ($it) use ($subcuentaItemsMap) {
            $subcuentaAsignadaId = $subcuentaItemsMap->get($it->id)?->subcuenta_id;

            return [
                'id' => $it->id,
                'pedido_item_id' => $it->id,
                'producto_id' => $it->producto_id,
                'nombre' => $it->producto_nombre,
                'nota_cocina' => $it->nota_cocina,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => round((float) $it->cantidad * (float) $it->precio_unitario, 2),
                'subcuenta_asignada_id' => $subcuentaAsignadaId,
            ];
        });

        $totalBruto = (float) $items->sum('subtotal');

        return ApiResponse::ok([
            'pedido_id' => $pedido->id,
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'comensales' => (int) $pedido->comensales,
            'total_bruto' => round($totalBruto, 2),
            'items' => $items->values(),
            'subcuentas_existentes' => $subcuentasPrevias->map(function ($s) {
                return [
                    'id' => $s->id,
                    'numero_subcuenta' => (int) $s->numero_subcuenta,
                    'nombre_referencia' => $s->nombre_cliente,
                    'tipo_comprobante' => $s->tipo_comprobante,
                    'documento_cliente' => $s->documento_cliente,
                    'nombre_cliente' => $s->nombre_cliente,
                    'direccion_cliente' => $s->direccion_cliente,
                    'medio_pago' => $s->medio_pago,
                    'promocion_id' => $s->promocion_id,
                    'subtotal_bruto' => (float) $s->subtotal_bruto,
                    'descuento' => (float) $s->descuento,
                    'monto_recargo' => (float) $s->monto_recargo,
                    'total_neto' => (float) $s->total,
                    'estado' => $s->estado,
                ];
            })->values(),
        ]);
    }

    /**
     * CU-MOZO-09 / CU-CAJA-04: Registrar la división de cuenta en subcuentas y pasar a cuenta_pedida.
     */
    public function dividirCuenta(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'pedido_id' => ['required', 'uuid'],
            'subcuentas' => ['required', 'array', 'min:2'],
            'subcuentas.*.numero_subcuenta' => ['required', 'integer', 'min:1'],
            'subcuentas.*.nombre_referencia' => ['nullable', 'string', 'max:100'],
            'subcuentas.*.tipo_comprobante' => ['required', 'string', 'in:boleta,factura,nota_venta'],
            'subcuentas.*.documento_cliente' => ['nullable', 'string', 'max:20'],
            'subcuentas.*.nombre_cliente' => ['required', 'string', 'max:150'],
            'subcuentas.*.direccion_cliente' => ['nullable', 'string', 'max:255'],
            'subcuentas.*.medio_pago' => ['required', 'string', 'in:efectivo,tarjeta,billetera_digital'],
            'subcuentas.*.promocion_id' => ['nullable', 'uuid'],
            'subcuentas.*.subtotal_bruto' => ['required', 'numeric', 'min:0.01'],
            'subcuentas.*.descuento' => ['nullable', 'numeric', 'min:0'],
            'subcuentas.*.monto_recargo' => ['nullable', 'numeric', 'min:0'],
            'subcuentas.*.total_neto' => ['required', 'numeric', 'min:0.01'],
            'subcuentas.*.items' => ['required', 'array', 'min:1'],
            'subcuentas.*.items.*.pedido_item_id' => ['required', 'string'],
            'subcuentas.*.items.*.cantidad' => ['required', 'integer', 'min:1'],
            'subcuentas.*.items.*.precio_unitario' => ['required', 'numeric', 'min:0'],
            'subcuentas.*.items.*.subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $mesa = DB::table('mesa')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $mesa) {
            return ApiResponse::error('La mesa no existe en esta sede.', 404);
        }

        return DB::transaction(function () use ($validated, $mesa, $localId) {
            $pedido = DB::table('pedido')
                ->where('id', $validated['pedido_id'])
                ->where('mesa_id', $mesa->id)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $pedido) {
                return ApiResponse::error('La comanda especificada no existe o no pertenece a esta mesa.', 404);
            }

            // Verificar si alguna subcuenta previa ya fue cobrada
            $tieneCobros = DB::table('pedido_subcuenta')
                ->where('pedido_id', $pedido->id)
                ->where('estado', 'cobrado')
                ->exists();

            if ($tieneCobros) {
                return ApiResponse::error(
                    'No se puede re-dividir la cuenta porque ya existen subcuentas cobradas en esta mesa.',
                    422
                );
            }

            // Eliminar subcuentas pendientes anteriores si las hubiese (para reemplazo limpio)
            DB::table('pedido_subcuenta')
                ->where('pedido_id', $pedido->id)
                ->where('estado', 'pendiente')
                ->delete();

            $subcuentasResumen = [];
            $totalBrutoAcumulado = 0.0;
            $totalNetoAcumulado = 0.0;

            foreach ($validated['subcuentas'] as $sub) {
                $subcuentaId = (string) Str::uuid();
                $subtotalBruto = (float) $sub['subtotal_bruto'];
                $descuento = (float) ($sub['descuento'] ?? 0.0);
                $montoRecargo = (float) ($sub['monto_recargo'] ?? 0.0);
                $totalNeto = (float) $sub['total_neto'];

                $totalBrutoAcumulado += $subtotalBruto;
                $totalNetoAcumulado += $totalNeto;

                DB::table('pedido_subcuenta')->insert([
                    'id' => $subcuentaId,
                    'pedido_id' => $pedido->id,
                    'numero_subcuenta' => (int) $sub['numero_subcuenta'],
                    'promocion_id' => $sub['promocion_id'] ?? null,
                    'tipo_comprobante' => $sub['tipo_comprobante'],
                    'documento_cliente' => $sub['documento_cliente'] ?? null,
                    'nombre_cliente' => $sub['nombre_cliente'],
                    'direccion_cliente' => $sub['direccion_cliente'] ?? null,
                    'medio_pago' => $sub['medio_pago'],
                    'subtotal_bruto' => $subtotalBruto,
                    'descuento' => $descuento,
                    'monto_recargo' => $montoRecargo,
                    'total' => $totalNeto,
                    'estado' => 'pendiente',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Insertar ítems en pedido_subcuenta_item
                foreach ($sub['items'] as $item) {
                    $rawId = $item['pedido_item_id'];
                    $originalItemId = str_contains($rawId, '-u') ? explode('-u', $rawId)[0] : $rawId;

                    DB::table('pedido_subcuenta_item')->insert([
                        'id' => (string) Str::uuid(),
                        'subcuenta_id' => $subcuentaId,
                        'pedido_item_id' => $originalItemId,
                        'cantidad' => (int) $item['cantidad'],
                        'precio_unitario' => (float) $item['precio_unitario'],
                        'subtotal' => (float) $item['subtotal'],
                        'created_at' => now(),
                    ]);
                }

                $subcuentasResumen[] = [
                    'id' => $subcuentaId,
                    'numero' => (int) $sub['numero_subcuenta'],
                    'nombre_referencia' => $sub['nombre_referencia'] ?? "Subcuenta #{$sub['numero_subcuenta']}",
                    'tipo_comprobante' => $sub['tipo_comprobante'],
                    'cliente' => $sub['nombre_cliente'],
                    'documento' => $sub['documento_cliente'] ?? null,
                    'medio_pago' => $sub['medio_pago'],
                    'total' => round($totalNeto, 2),
                    'total_items' => count($sub['items']),
                    'estado' => 'pendiente',
                ];
            }

            // Conmutar comanda a 'cuenta_pedida'
            DB::table('pedido')
                ->where('id', $pedido->id)
                ->update([
                    'estado' => 'cuenta_pedida',
                    'precuenta_generada_at' => now(),
                    'updated_at' => now(),
                ]);

            return ApiResponse::ok([
                'status' => 'success',
                'mesa_id' => $mesa->id,
                'mesa_numero' => $mesa->numero,
                'estado_mesa' => 'cuenta_pedida',
                'partes' => count($validated['subcuentas']),
                'total_bruto' => round($totalBrutoAcumulado, 2),
                'total_neto' => round($totalNetoAcumulado, 2),
                'mensaje' => 'Subcuentas registradas con éxito. Comanda conmutada a cuenta pedida.',
                'subcuentas_resumen' => $subcuentasResumen,
            ], 201);
        });
    }

    /**
     * Mapea categorías de frontend al CHECK constraint estricto de pedido_anulacion en PostgreSQL.
     */
    private function normalizarMotivoCategoria(string $categoria): string
    {
        $categoria = strtolower(trim($categoria));
        return match ($categoria) {
            'error_toma', 'error_registro' => 'error_registro',
            'demora_cliente' => 'demora_cliente',
            'queja_calidad', 'plato_caido', 'contaminacion' => 'queja_calidad',
            'cambio_plato', 'sustitucion_quiebre', 'quiebre_stock_cocina', 'quiebre_cocina' => 'cambio_plato',
            'retiro_sin_consumo', 'error_apertura' => 'retiro_sin_consumo',
            'reclamo_general', 'emergencia', 'otro' => 'otro',
            default => 'otro',
        };
    }

    /**
     * Resuelve la mesa titular y su etiqueta congelada (individual o unión).
     */
    private function resolverMesaTitularYEtiqueta(string $mesaId, string $localId): array
    {
        $mesa = DB::table('mesa')
            ->where('id', $mesaId)
            ->where('local_id', $localId)
            ->first();

        if (!$mesa) {
            return [null, null];
        }

        $titularId = $mesa->mesa_principal_id ?? $mesa->id;
        $titular = $titularId === $mesa->id
            ? $mesa
            : DB::table('mesa')->where('id', $titularId)->first();

        if (!$titular) {
            return [null, null];
        }

        // Buscar si tiene mesas secundarias vinculadas
        $secundarias = DB::table('mesa')
            ->where('mesa_principal_id', $titular->id)
            ->where('local_id', $localId)
            ->orderBy('numero')
            ->get();

        if ($secundarias->isNotEmpty()) {
            $numeros = collect([$titular->numero])
                ->merge($secundarias->pluck('numero'))
                ->sort()
                ->values();
            $etiqueta = 'Mesa [ ' . $numeros->implode(' ; ') . ' ]';
        } else {
            $etiqueta = 'Mesa ' . $titular->numero;
        }

        return [$titular, $etiqueta];
    }

    /**
     * CU-MOZO-06: Anular un ítem específico de la comanda con motivo y control de merma.
     */
    public function anularItem(string $id, string $itemId, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'motivo_categoria' => 'required|string',
            'motivo_detalle' => 'required|string|min:10',
        ]);

        [$titular, $etiquetaUnion] = $this->resolverMesaTitularYEtiqueta($id, $localId);
        if (!$titular) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'Mesa no encontrada.', 404);
        }

        $item = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('pi.id', $itemId)
            ->where('p.local_id', $localId)
            ->select('pi.*', 'p.mozo_id', 'p.estado as pedido_estado', 'p.created_at as pedido_created_at')
            ->first();

        if (!$item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato no existe en la comanda del local.', 404);
        }

        if ($item->estado === 'anulado') {
            return ApiResponse::error('ITEM_YA_ANULADO', 'El plato ya se encuentra anulado.', 422);
        }

        if (in_array($item->pedido_estado, ['cobrado', 'anulado'])) {
            return ApiResponse::error('PEDIDO_CERRADO', 'No se pueden anular platos de un pedido cobrado o anulado.', 422);
        }

        $producto = DB::table('producto')->where('id', $item->producto_id)->first();
        $estadoAnterior = $item->estado;
        $esMerma = in_array($estadoAnterior, ['listo', 'entregado']);
        $costoEstandar = (float) ($producto->costo_estandar ?? 0);
        $costoMerma = $esMerma ? round((int) $item->cantidad * $costoEstandar, 2) : 0.00;

        $anuladoAt = now();
        $pedidoCreatedAt = \Carbon\Carbon::parse($item->pedido_created_at);
        $minutosEspera = max(0, (int) round($pedidoCreatedAt->diffInMinutes($anuladoAt)));

        return DB::transaction(function () use (
            $item, $producto, $titular, $etiquetaUnion, $validated, $user, $localId,
            $estadoAnterior, $esMerma, $costoMerma, $anuladoAt, $minutosEspera
        ) {
            // 1. Actualizar ítem a anulado
            DB::table('pedido_item')
                ->where('id', $item->id)
                ->update([
                    'estado' => 'anulado',
                    'motivo_anulacion' => $validated['motivo_detalle'],
                    'anulado_por' => $user->id,
                    'es_merma' => $esMerma,
                    'updated_at' => $anuladoAt,
                ]);

            // 2. Insertar registro inmutable en pedido_anulacion
            $anulacionId = (string) Str::uuid();
            $motivoNormalizado = $this->normalizarMotivoCategoria($validated['motivo_categoria']);

            DB::table('pedido_anulacion')->insert([
                'id' => $anulacionId,
                'local_id' => $localId,
                'pedido_id' => $item->pedido_id,
                'pedido_item_id' => $item->id,
                'tipo_anulacion' => 'item_individual',
                'mesa_id' => $titular->id,
                'mesa_numero' => $etiquetaUnion,
                'producto_id' => $item->producto_id,
                'producto_nombre' => $producto ? $producto->nombre : 'Producto desconocido',
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'monto_total' => round((int) $item->cantidad * (float) $item->precio_unitario, 2),
                'mozo_id' => $item->mozo_id,
                'anulado_por' => $user->id,
                'motivo_categoria' => $motivoNormalizado,
                'motivo_detalle' => $validated['motivo_detalle'],
                'pedido_created_at' => $item->pedido_created_at,
                'anulado_at' => $anuladoAt,
                'minutos_espera' => $minutosEspera,
                'estado_anterior' => $estadoAnterior,
                'es_merma' => $esMerma,
                'costo_merma' => $costoMerma,
                'revisado' => false,
                'created_at' => $anuladoAt,
            ]);

            // 3. Registrar en log_auditoria
            $empresaId = $user->empresa_id ?? DB::table('local')->where('id', $localId)->value('empresa_id');
            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'ANULACION_ITEM_PEDIDO',
                'entidad_tipo' => 'pedido_item',
                'entidad_id' => $item->id,
                'detalle' => json_encode([
                    'pedido_id' => $item->pedido_id,
                    'mesa_id' => $titular->id,
                    'mesa_numero' => $etiquetaUnion,
                    'producto_id' => $item->producto_id,
                    'producto_nombre' => $producto ? $producto->nombre : null,
                    'cantidad' => (int) $item->cantidad,
                    'precio_unitario' => (float) $item->precio_unitario,
                    'motivo_categoria' => $validated['motivo_categoria'],
                    'motivo_detalle' => $validated['motivo_detalle'],
                    'es_merma' => $esMerma,
                    'costo_merma' => $costoMerma,
                ]),
                'fecha' => $anuladoAt,
            ]);

            // 4. Verificar ítems activos restantes
            $activosRestantes = DB::table('pedido_item')
                ->where('pedido_id', $item->pedido_id)
                ->where('estado', '!=', 'anulado')
                ->get();

            $mesaLiberada = false;
            $nuevoSubtotal = 0.00;

            if ($activosRestantes->isEmpty()) {
                // Comanda sin platos activos: anular pedido y liberar mesas
                DB::table('pedido')
                    ->where('id', $item->pedido_id)
                    ->update([
                        'estado' => 'anulado',
                        'updated_at' => $anuladoAt,
                    ]);

                // Desvincular secundarias si existían uniones
                DB::table('mesa')
                    ->where('local_id', $localId)
                    ->where('mesa_principal_id', $titular->id)
                    ->update([
                        'mesa_principal_id' => null,
                        'updated_at' => $anuladoAt,
                    ]);

                $mesaLiberada = true;
            } else {
                $nuevoSubtotal = (float) $activosRestantes->sum(function ($it) {
                    return (int) $it->cantidad * (float) $it->precio_unitario;
                });
            }

            return ApiResponse::ok([
                'item_id' => $item->id,
                'pedido_id' => $item->pedido_id,
                'mesa_id' => $titular->id,
                'mesa_numero' => $etiquetaUnion,
                'producto_nombre' => $producto ? $producto->nombre : 'Desconocido',
                'cantidad' => (int) $item->cantidad,
                'estado_anterior' => $estadoAnterior,
                'es_merma' => (bool) $esMerma,
                'nuevo_subtotal' => round($nuevoSubtotal, 2),
                'mesa_liberada' => $mesaLiberada,
                'mensaje' => $mesaLiberada
                    ? 'Plato anulado. La mesa quedó sin consumos activos y ha sido liberada.'
                    : 'Plato anulado exitosamente.',
                'anulado_at' => $anuladoAt->toIso8601String(),
            ]);
        });
    }

    /**
     * CU-MOZO-06: Anular la comanda completa de una mesa y liberarla de inmediato.
     */
    public function anularComanda(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'motivo_categoria' => 'required|string',
            'motivo_detalle' => 'required|string|min:10',
            'confirmar_vacio' => 'required|accepted',
        ]);

        [$titular, $etiquetaUnion] = $this->resolverMesaTitularYEtiqueta($id, $localId);
        if (!$titular) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'Mesa no encontrada.', 404);
        }

        $pedido = DB::table('pedido')
            ->where('mesa_id', $titular->id)
            ->where('local_id', $localId)
            ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->latest('created_at')
            ->first();

        if (!$pedido) {
            return ApiResponse::error('NO_PEDIDO_ACTIVO', 'La mesa no cuenta con un pedido activo para anular.', 422);
        }

        $items = DB::table('pedido_item')
            ->where('pedido_id', $pedido->id)
            ->where('estado', '!=', 'anulado')
            ->get();

        $productosIds = $items->pluck('producto_id')->unique()->filter();
        $productosMap = DB::table('producto')
            ->whereIn('id', $productosIds)
            ->get()
            ->keyBy('id');

        $anuladoAt = now();
        $pedidoCreatedAt = \Carbon\Carbon::parse($pedido->created_at);
        $minutosEspera = max(0, (int) round($pedidoCreatedAt->diffInMinutes($anuladoAt)));
        $motivoNormalizado = $this->normalizarMotivoCategoria($validated['motivo_categoria']);
        $empresaId = $user->empresa_id ?? DB::table('local')->where('id', $localId)->value('empresa_id');

        return DB::transaction(function () use (
            $pedido, $items, $productosMap, $titular, $etiquetaUnion, $validated,
            $user, $localId, $empresaId, $anuladoAt, $minutosEspera, $motivoNormalizado
        ) {
            $totalAnulado = 0.00;

            if ($items->isNotEmpty()) {
                foreach ($items as $item) {
                    $producto = $productosMap->get($item->producto_id);
                    $estadoAnterior = $item->estado;
                    $esMerma = in_array($estadoAnterior, ['listo', 'entregado']);
                    $costoEstandar = (float) ($producto->costo_estandar ?? 0);
                    $costoMerma = $esMerma ? round((int) $item->cantidad * $costoEstandar, 2) : 0.00;
                    $montoItem = round((int) $item->cantidad * (float) $item->precio_unitario, 2);
                    $totalAnulado += $montoItem;

                    // 1. Actualizar ítem a anulado
                    DB::table('pedido_item')
                        ->where('id', $item->id)
                        ->update([
                            'estado' => 'anulado',
                            'motivo_anulacion' => $validated['motivo_detalle'],
                            'anulado_por' => $user->id,
                            'es_merma' => $esMerma,
                            'updated_at' => $anuladoAt,
                        ]);

                    // 2. Insertar en pedido_anulacion
                    DB::table('pedido_anulacion')->insert([
                        'id' => (string) Str::uuid(),
                        'local_id' => $localId,
                        'pedido_id' => $pedido->id,
                        'pedido_item_id' => $item->id,
                        'tipo_anulacion' => 'comanda_completa',
                        'mesa_id' => $titular->id,
                        'mesa_numero' => $etiquetaUnion,
                        'producto_id' => $item->producto_id,
                        'producto_nombre' => $producto ? $producto->nombre : 'Desconocido',
                        'cantidad' => (int) $item->cantidad,
                        'precio_unitario' => (float) $item->precio_unitario,
                        'monto_total' => $montoItem,
                        'mozo_id' => $pedido->mozo_id,
                        'anulado_por' => $user->id,
                        'motivo_categoria' => $motivoNormalizado,
                        'motivo_detalle' => $validated['motivo_detalle'],
                        'pedido_created_at' => $pedido->created_at,
                        'anulado_at' => $anuladoAt,
                        'minutos_espera' => $minutosEspera,
                        'estado_anterior' => $estadoAnterior,
                        'es_merma' => $esMerma,
                        'costo_merma' => $costoMerma,
                        'revisado' => false,
                        'created_at' => $anuladoAt,
                    ]);
                }
            } else {
                // Comanda vacía abierta sin platos
                DB::table('pedido_anulacion')->insert([
                    'id' => (string) Str::uuid(),
                    'local_id' => $localId,
                    'pedido_id' => $pedido->id,
                    'pedido_item_id' => null,
                    'tipo_anulacion' => 'comanda_completa',
                    'mesa_id' => $titular->id,
                    'mesa_numero' => $etiquetaUnion,
                    'producto_id' => null,
                    'producto_nombre' => 'Comanda sin platos',
                    'cantidad' => 1,
                    'precio_unitario' => 0.00,
                    'monto_total' => 0.00,
                    'mozo_id' => $pedido->mozo_id,
                    'anulado_por' => $user->id,
                    'motivo_categoria' => $motivoNormalizado,
                    'motivo_detalle' => $validated['motivo_detalle'],
                    'pedido_created_at' => $pedido->created_at,
                    'anulado_at' => $anuladoAt,
                    'minutos_espera' => $minutosEspera,
                    'estado_anterior' => 'borrador',
                    'es_merma' => false,
                    'costo_merma' => 0.00,
                    'revisado' => false,
                    'created_at' => $anuladoAt,
                ]);
            }

            // 3. Conmutar pedido a anulado
            DB::table('pedido')
                ->where('id', $pedido->id)
                ->update([
                    'estado' => 'anulado',
                    'updated_at' => $anuladoAt,
                ]);

            // 4. Desvincular secundarias si existían uniones
            DB::table('mesa')
                ->where('local_id', $localId)
                ->where('mesa_principal_id', $titular->id)
                ->update([
                    'mesa_principal_id' => null,
                    'updated_at' => $anuladoAt,
                ]);

            // 5. Registrar en log_auditoria
            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'ANULACION_COMANDA_COMPLETA',
                'entidad_tipo' => 'pedido',
                'entidad_id' => $pedido->id,
                'detalle' => json_encode([
                    'mesa_id' => $titular->id,
                    'mesa_numero' => $etiquetaUnion,
                    'total_anulado' => round($totalAnulado, 2),
                    'items_total' => $items->count(),
                    'motivo_categoria' => $validated['motivo_categoria'],
                    'motivo_detalle' => $validated['motivo_detalle'],
                ]),
                'fecha' => $anuladoAt,
            ]);

            return ApiResponse::ok([
                'pedido_id' => $pedido->id,
                'mesa_id' => $titular->id,
                'mesa_numero' => $etiquetaUnion,
                'mesa_estado' => 'libre',
                'total_anulado' => round($totalAnulado, 2),
                'items_total' => $items->count(),
                'mensaje' => 'Comanda completa anulada exitosamente y mesa(s) liberada(s).',
                'anulado_at' => $anuladoAt->toIso8601String(),
            ]);
        });
    }

    /**
     * CU-MOZO-07: Obtener catálogo de sustitución universal de platos con sugerencias afines y cálculo de delta de precio.
     */
    public function getCatalogoSustitucion(string $id, string $itemId, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        [$titular, $etiquetaUnion] = $this->resolverMesaTitularYEtiqueta($id, $localId);
        if (! $titular) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'Mesa no encontrada.', 404);
        }

        $item = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->leftJoin('categoria_producto as cat', 'cat.id', '=', 'prod.categoria_id')
            ->where('pi.id', $itemId)
            ->where('p.local_id', $localId)
            ->select([
                'pi.id as item_id',
                'pi.producto_id',
                'pi.cantidad',
                'pi.precio_unitario',
                'prod.nombre as producto_nombre',
                'prod.categoria_id',
                'cat.nombre as categoria_nombre',
            ])
            ->first();

        if (! $item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato no existe en la comanda del local.', 404);
        }

        $precioOriginal = (float) $item->precio_unitario;
        $categoriaOriginalId = $item->categoria_id;
        $categoriaNombre = $item->categoria_nombre ?? 'General';

        // Obtener productos disponibles en la sede
        $productosRaw = DB::table('producto as p')
            ->leftJoin('categoria_producto as c', 'c.id', '=', 'p.categoria_id')
            ->where('p.local_id', $localId)
            ->where('p.disponibilidad', 'disponible')
            ->where('p.activo', true)
            ->where('p.id', '!=', $item->producto_id)
            ->select([
                'p.id as producto_id',
                'p.nombre',
                'p.categoria_id',
                'c.nombre as categoria_nombre',
                'p.precio',
                'p.disponibilidad',
            ])
            ->orderBy('p.nombre')
            ->get();

        $mappedProductos = $productosRaw->map(function ($p) use ($precioOriginal, $categoriaOriginalId) {
            $dif = round((float) $p->precio - $precioOriginal, 2);
            $esMisma = ($p->categoria_id === $categoriaOriginalId);

            return [
                'producto_id' => $p->producto_id,
                'nombre' => $p->nombre,
                'categoria_id' => $p->categoria_id ?? 'cat-general',
                'categoria_nombre' => $p->categoria_nombre ?? 'General',
                'precio' => (float) $p->precio,
                'diferencia' => $dif,
                'es_misma_categoria' => $esMisma,
                'disponible' => true,
            ];
        });

        // Top 6 sugerencias calculadas
        $sugerenciasTop = $mappedProductos->sort(function ($a, $b) use ($precioOriginal) {
            $absA = abs($a['precio'] - $precioOriginal);
            $absB = abs($b['precio'] - $precioOriginal);
            if ($absA != $absB) {
                return $absA <=> $absB;
            }
            if ($a['es_misma_categoria'] !== $b['es_misma_categoria']) {
                return $a['es_misma_categoria'] ? -1 : 1;
            }
            return strcmp($a['nombre'], $b['nombre']);
        })->values()->slice(0, 6)->all();

        // Categorías chips con contadores
        $categoriasConteo = [];
        foreach ($mappedProductos as $p) {
            $catId = $p['categoria_id'];
            if (! isset($categoriasConteo[$catId])) {
                $categoriasConteo[$catId] = [
                    'categoria_id' => $catId,
                    'nombre' => $p['categoria_nombre'],
                    'total_platos' => 0,
                ];
            }
            $categoriasConteo[$catId]['total_platos']++;
        }
        $categoriasChips = array_values($categoriasConteo);

        // Filtrado por parámetros de búsqueda y categoría
        $filtroCategoria = $request->query('categoria_id');
        $filtroBusqueda = $request->query('query', $request->query('busqueda'));

        $productosFiltrados = $mappedProductos;

        if ($filtroCategoria && $filtroCategoria !== 'todas') {
            $productosFiltrados = $productosFiltrados->filter(fn ($p) => $p['categoria_id'] === $filtroCategoria);
        }

        if ($filtroBusqueda && trim($filtroBusqueda) !== '') {
            $q = mb_strtolower(trim($filtroBusqueda));
            $productosFiltrados = $productosFiltrados->filter(function ($p) use ($q) {
                return str_contains(mb_strtolower($p['nombre']), $q)
                    || str_contains(mb_strtolower($p['categoria_nombre']), $q);
            });
        }

        return ApiResponse::ok([
            'plato_original_id' => $item->producto_id,
            'plato_original_item_id' => $item->item_id,
            'plato_original' => $item->producto_nombre,
            'precio_original' => $precioOriginal,
            'categoria_nombre' => $categoriaNombre,
            'sugerencias_top' => $sugerenciasTop,
            'categorias' => $categoriasChips,
            'productos' => $productosFiltrados->values()->all(),
        ]);
    }

    /**
     * CU-MOZO-07: Sustituir un plato observado por otro plato de carta y enviar orden prioritaria a cocina.
     */
    public function sustituirPlato(string $id, string $itemId, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'nuevo_producto_id' => ['required', 'uuid'],
            'cantidad' => ['nullable', 'integer', 'min:1'],
            'notas_cocina' => ['nullable', 'string', 'max:500'],
        ]);

        [$titular, $etiquetaUnion] = $this->resolverMesaTitularYEtiqueta($id, $localId);
        if (! $titular) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'Mesa no encontrada.', 404);
        }

        $item = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.id', $itemId)
            ->where('p.local_id', $localId)
            ->select('pi.*', 'prod.nombre as producto_original_nombre', 'p.estado as pedido_estado', 'p.numero_comanda')
            ->first();

        if (! $item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato no existe en la comanda del local.', 404);
        }

        if ($item->estado === 'anulado') {
            return ApiResponse::error('ITEM_YA_ANULADO', 'El plato ya se encuentra anulado.', 422);
        }

        if (in_array($item->pedido_estado, ['cobrado', 'anulado'])) {
            return ApiResponse::error('PEDIDO_CERRADO', 'No se pueden sustituir platos en un pedido cerrado o anulado.', 422);
        }

        $nuevoProd = DB::table('producto')
            ->where('id', $validated['nuevo_producto_id'])
            ->where('local_id', $localId)
            ->first();

        if (! $nuevoProd) {
            return ApiResponse::error('PRODUCTO_NO_ENCONTRADO', 'El plato para sustitución no existe en la carta.', 404);
        }

        if ($nuevoProd->disponibilidad === 'agotado') {
            return ApiResponse::error('PRODUCTO_AGOTADO', 'El plato seleccionado para sustitución se encuentra agotado.', 422);
        }

        return DB::transaction(function () use (
            $item, $nuevoProd, $titular, $etiquetaUnion, $validated, $user, $localId
        ) {
            $now = now();
            $cantidad = (int) ($validated['cantidad'] ?? $item->cantidad);

            // 1. Anular ítem original por sustitución (sin merma)
            DB::table('pedido_item')
                ->where('id', $item->id)
                ->update([
                    'estado' => 'anulado',
                    'motivo_anulacion' => 'sustitucion_quiebre_cocina',
                    'anulado_por' => $user->id,
                    'es_merma' => false,
                    'updated_at' => $now,
                ]);

            // 2. Crear nuevo ítem en comanda con prioridad
            $nuevoItemId = (string) Str::uuid();
            $notaCocina = ! empty($validated['notas_cocina'])
                ? 'SUSTITUCIÓN URGENTE (Quiebre): ' . trim($validated['notas_cocina'])
                : 'SUSTITUCIÓN URGENTE (Quiebre)';

            DB::table('pedido_item')->insert([
                'id' => $nuevoItemId,
                'pedido_id' => $item->pedido_id,
                'producto_id' => $nuevoProd->id,
                'cantidad' => $cantidad,
                'precio_unitario' => $nuevoProd->precio,
                'nota_cocina' => $notaCocina,
                'estado' => 'en_cola',
                'numero_ronda' => $item->numero_ronda,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // 3. Recalcular nuevo subtotal
            $activosRestantes = DB::table('pedido_item')
                ->where('pedido_id', $item->pedido_id)
                ->where('estado', '!=', 'anulado')
                ->get();

            $nuevoSubtotal = (float) $activosRestantes->sum(function ($it) {
                return (int) $it->cantidad * (float) $it->precio_unitario;
            });

            $diferenciaMonto = round(((float) $nuevoProd->precio * $cantidad) - ((float) $item->precio_unitario * (int) $item->cantidad), 2);

            // 4. Registrar en log de auditoría
            $empresaId = $user->empresa_id ?? DB::table('local')->where('id', $localId)->value('empresa_id');
            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'SUSTITUCION_PLATO_QUIEBRE',
                'entidad_tipo' => 'pedido_item',
                'entidad_id' => $nuevoItemId,
                'detalle' => json_encode([
                    'pedido_id' => $item->pedido_id,
                    'mesa_id' => $titular->id,
                    'mesa_numero' => $etiquetaUnion,
                    'item_original_id' => $item->id,
                    'producto_original' => $item->producto_original_nombre,
                    'nuevo_producto_id' => $nuevoProd->id,
                    'nuevo_producto_nombre' => $nuevoProd->nombre,
                    'cantidad' => $cantidad,
                    'diferencia_monto' => $diferenciaMonto,
                    'nuevo_subtotal' => round($nuevoSubtotal, 2),
                ]),
                'fecha' => $now,
            ]);

            // 5. Notificación prioritaria a Cocina
            DB::table('notificacion')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => null,
                'rol_destinatario' => 'cocina',
                'tipo' => 'sustitucion_plato_urgente',
                'prioridad' => 'alta',
                'titulo' => "⚡ Sustitución Urgente: Mesa {$titular->numero}",
                'mensaje' => "El plato {$item->producto_original_nombre} fue sustituido por {$nuevoProd->nombre} ({$cantidad}x). Prioridad en cocina.",
                'entidad_tipo' => 'pedido_item',
                'entidad_id' => $nuevoItemId,
                'leida' => false,
                'created_at' => $now,
            ]);

            return ApiResponse::ok([
                'pedido_id' => $item->pedido_id,
                'mesa_id' => $titular->id,
                'mesa_numero' => $etiquetaUnion,
                'nuevo_item_id' => $nuevoItemId,
                'nuevo_producto' => $nuevoProd->nombre,
                'diferencia_monto' => $diferenciaMonto,
                'nuevo_subtotal' => round($nuevoSubtotal, 2),
                'mensaje' => "Sustitución completada exitosamente por \"{$nuevoProd->nombre}\". Enviado a cocina con máxima prioridad.",
                'created_at' => $now->toIso8601String(),
            ]);
        });
    }

    /**
     * CU-MOZO-07: Anular plato observado por quiebre de stock en cocina (sin merma ni costo para el comensal).
     */
    public function anularPorQuiebreCocina(string $id, string $itemId, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'motivo_detalle' => ['required', 'string', 'min:5'],
        ]);

        [$titular, $etiquetaUnion] = $this->resolverMesaTitularYEtiqueta($id, $localId);
        if (! $titular) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'Mesa no encontrada.', 404);
        }

        $item = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.id', $itemId)
            ->where('p.local_id', $localId)
            ->select('pi.*', 'prod.nombre as producto_nombre', 'p.mozo_id', 'p.estado as pedido_estado', 'p.created_at as pedido_created_at')
            ->first();

        if (! $item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato no existe en la comanda del local.', 404);
        }

        if ($item->estado === 'anulado') {
            return ApiResponse::error('ITEM_YA_ANULADO', 'El plato ya se encuentra anulado.', 422);
        }

        if (in_array($item->pedido_estado, ['cobrado', 'anulado'])) {
            return ApiResponse::error('PEDIDO_CERRADO', 'No se pueden anular platos de un pedido cerrado o anulado.', 422);
        }

        return DB::transaction(function () use (
            $item, $titular, $etiquetaUnion, $validated, $user, $localId
        ) {
            $now = now();
            $montoAnulado = round((int) $item->cantidad * (float) $item->precio_unitario, 2);
            $pedidoCreatedAt = Carbon::parse($item->pedido_created_at);
            $minutosEspera = max(0, (int) round($pedidoCreatedAt->diffInMinutes($now)));

            // 1. Actualizar ítem a anulado (sin merma)
            DB::table('pedido_item')
                ->where('id', $item->id)
                ->update([
                    'estado' => 'anulado',
                    'motivo_anulacion' => $validated['motivo_detalle'],
                    'anulado_por' => $user->id,
                    'es_merma' => false,
                    'updated_at' => $now,
                ]);

            // 2. Registro formal en pedido_anulacion (CHECK constraint motivo_categoria = 'cambio_plato')
            $anulacionId = (string) Str::uuid();
            $motivoDetalleCompleto = strlen($validated['motivo_detalle']) >= 10
                ? $validated['motivo_detalle']
                : 'Quiebre de stock en cocina: ' . $validated['motivo_detalle'];

            DB::table('pedido_anulacion')->insert([
                'id' => $anulacionId,
                'local_id' => $localId,
                'pedido_id' => $item->pedido_id,
                'pedido_item_id' => $item->id,
                'tipo_anulacion' => 'item_individual',
                'mesa_id' => $titular->id,
                'mesa_numero' => $etiquetaUnion,
                'producto_id' => $item->producto_id,
                'producto_nombre' => $item->producto_nombre,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'monto_total' => $montoAnulado,
                'mozo_id' => $item->mozo_id,
                'anulado_por' => $user->id,
                'motivo_categoria' => 'cambio_plato',
                'motivo_detalle' => $motivoDetalleCompleto,
                'pedido_created_at' => $item->pedido_created_at,
                'anulado_at' => $now,
                'minutos_espera' => $minutosEspera,
                'estado_anterior' => $item->estado,
                'es_merma' => false,
                'costo_merma' => 0.00,
                'revisado' => false,
                'created_at' => $now,
            ]);

            // 3. Auditoría en log_auditoria
            $empresaId = $user->empresa_id ?? DB::table('local')->where('id', $localId)->value('empresa_id');
            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'ANULACION_POR_QUIEBRE_COCINA',
                'entidad_tipo' => 'pedido_item',
                'entidad_id' => $item->id,
                'detalle' => json_encode([
                    'pedido_id' => $item->pedido_id,
                    'mesa_id' => $titular->id,
                    'mesa_numero' => $etiquetaUnion,
                    'producto_nombre' => $item->producto_nombre,
                    'monto_anulado' => $montoAnulado,
                    'motivo_detalle' => $validated['motivo_detalle'],
                    'es_merma' => false,
                ]),
                'fecha' => $now,
            ]);

            // 4. Notificación para Administrador de Sede (CU-ADMIN-12)
            DB::table('notificacion')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => null,
                'rol_destinatario' => 'admin_local',
                'tipo' => 'anulacion_quiebre_cocina',
                'prioridad' => 'media',
                'titulo' => "⚠️ Anulación por Quiebre: Mesa {$titular->numero}",
                'mensaje' => "El plato {$item->producto_nombre} fue anulado sin merma por quiebre de stock en cocina.",
                'entidad_tipo' => 'pedido_anulacion',
                'entidad_id' => $anulacionId,
                'leida' => false,
                'created_at' => $now,
            ]);

            // 5. Verificar si quedan consumos activos
            $activosRestantes = DB::table('pedido_item')
                ->where('pedido_id', $item->pedido_id)
                ->where('estado', '!=', 'anulado')
                ->get();

            $mesaLiberada = false;
            $nuevoSubtotal = 0.00;

            if ($activosRestantes->isEmpty()) {
                DB::table('pedido')
                    ->where('id', $item->pedido_id)
                    ->update([
                        'estado' => 'anulado',
                        'updated_at' => $now,
                    ]);

                DB::table('mesa')
                    ->where('local_id', $localId)
                    ->where('mesa_principal_id', $titular->id)
                    ->update([
                        'mesa_principal_id' => null,
                        'updated_at' => $now,
                    ]);

                $mesaLiberada = true;
            } else {
                $nuevoSubtotal = (float) $activosRestantes->sum(function ($it) {
                    return (int) $it->cantidad * (float) $it->precio_unitario;
                });
            }

            return ApiResponse::ok([
                'pedido_id' => $item->pedido_id,
                'mesa_id' => $titular->id,
                'mesa_numero' => $etiquetaUnion,
                'monto_anulado' => $montoAnulado,
                'nuevo_subtotal' => round($nuevoSubtotal, 2),
                'mesa_liberada' => $mesaLiberada,
                'mensaje' => $mesaLiberada
                    ? 'Plato anulado por quiebre. La mesa quedó sin consumos activos y ha sido liberada.'
                    : "Plato anulado sin merma ni costo. Se descontaron S/ {$montoAnulado}.",
                'anulado_at' => $now->toIso8601String(),
            ]);
        });
    }

    /**
     * Resuelve los turnos operativos para una fecha a partir de horario_atencion del local (CU-ADMIN-09).
     */
    private function resolverTurnosFecha(string $localId, string $fecha): array
    {
        $diaSemana = Carbon::parse($fecha)->dayOfWeekIso; // 1 = Lunes, 7 = Domingo

        $horarios = DB::table('horario_atencion')
            ->where('local_id', $localId)
            ->where('dia_semana', $diaSemana)
            ->where('atiende', true)
            ->orderBy('hora_inicio')
            ->get();

        $turnoAlmuerzo = null;
        $turnoCena = null;

        foreach ($horarios as $h) {
            $nombre = mb_strtolower($h->nombre_turno);
            if (str_contains($nombre, 'almuerzo')) {
                $turnoAlmuerzo = ['inicio' => $h->hora_inicio, 'fin' => $h->hora_fin, 'nombre' => $h->nombre_turno];
            } elseif (str_contains($nombre, 'cena')) {
                $turnoCena = ['inicio' => $h->hora_inicio, 'fin' => $h->hora_fin, 'nombre' => $h->nombre_turno];
            }
        }

        // Si no hay turnos explícitamente nombrados "Almuerzo" y "Cena", analizamos los horarios registrados
        if (! $turnoAlmuerzo && ! $turnoCena && $horarios->isNotEmpty()) {
            $primerHorario = $horarios->first();
            $ultimoHorario = $horarios->last();
            $horaApertura = $primerHorario->hora_inicio;
            $horaCierre = $ultimoHorario->hora_fin;

            // División de turno acoplada a la jornada del local (corte a las 17:00)
            $corteTurno = '17:00:00';
            $turnoAlmuerzo = ['inicio' => $horaApertura, 'fin' => $corteTurno, 'nombre' => 'Almuerzo'];
            $turnoCena = ['inicio' => $corteTurno, 'fin' => $horaCierre, 'nombre' => 'Cena'];
        }

        // Fallback estándar si no hay horario configurado para este día
        if (! $turnoAlmuerzo) {
            $turnoAlmuerzo = ['inicio' => '12:00:00', 'fin' => '17:00:00', 'nombre' => 'Almuerzo'];
        }
        if (! $turnoCena) {
            $turnoCena = ['inicio' => '17:00:00', 'fin' => '23:30:00', 'nombre' => 'Cena'];
        }

        return [
            'almuerzo' => $turnoAlmuerzo,
            'cena' => $turnoCena,
        ];
    }

    /**
     * CU-MOZO-05: Obtener políticas de reserva del local y turnos del día.
     */
    public function getPoliticasReserva(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $politica = DB::table('politicas_reserva')
            ->where('local_id', $localId)
            ->first();

        $fechaHoy = now()->toDateString();
        $turnos = $this->resolverTurnosFecha($localId, $fechaHoy);

        $dto = [
            'duracion_reserva_min' => (int) ($politica->duracion_reserva_min ?? 90),
            'buffer_reserva_min' => (int) ($politica->buffer_reserva_min ?? 15),
            'minutos_bloqueo_previo' => (int) ($politica->minutos_bloqueo_previo ?? 30),
            'tolerancia_no_show_min' => (int) ($politica->tolerancia_no_show_min ?? 15),
            'permite_reservas_online' => (bool) ($politica->acepta_reservas ?? false),
            'max_dias_anticipacion' => (int) ($politica->anticipacion_maxima_dias ?? 30),
            'turnos_operativos' => $turnos,
        ];

        return ApiResponse::ok($dto);
    }

    /**
     * CU-MOZO-05: Obtener disponibilidad de mesas para una fecha, hora y comensales.
     */
    public function getMesasDisponiblesReserva(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $fecha = $request->query('fecha', now()->toDateString());
        $hora = $request->query('hora', now()->format('H:i'));
        $numPersonas = (int) $request->query('comensales', $request->query('num_personas', 4));

        $politica = DB::table('politicas_reserva')
            ->where('local_id', $localId)
            ->first();

        $duracion = (int) ($politica->duracion_reserva_min ?? 90);
        $buffer = (int) ($politica->buffer_reserva_min ?? 15);

        try {
            $solicitadoInicio = Carbon::parse("{$fecha} {$hora}");
        } catch (\Exception $e) {
            $solicitadoInicio = now();
        }

        $solicitadoFin = $solicitadoInicio->copy()->addMinutes($duracion);
        $ventanaInicio = $solicitadoInicio->copy()->subMinutes($buffer);
        $ventanaFin = $solicitadoFin->copy()->addMinutes($buffer);

        // Obtener todas las mesas activas del local
        $mesasRaw = DB::table('mesa')
            ->where('local_id', $localId)
            ->where('estado', 'activa')
            ->whereNull('mesa_principal_id')
            ->orderBy('numero')
            ->get();

        // Reservas activas (confirmada, bloqueada) que se solapen con la ventana
        $reservasEnVentana = DB::table('reserva as r')
            ->join('reserva_mesa as rm', 'rm.reserva_id', '=', 'r.id')
            ->where('r.local_id', $localId)
            ->whereIn('r.estado', ['confirmada', 'bloqueada'])
            ->where(function ($q) use ($ventanaInicio, $ventanaFin, $duracion) {
                $q->where('r.fecha_hora', '<', $ventanaFin)
                  ->whereRaw("r.fecha_hora + interval '{$duracion} minutes' > ?", [$ventanaInicio]);
            })
            ->select('rm.mesa_id', 'r.cliente_nombre', 'r.fecha_hora')
            ->get()
            ->keyBy('mesa_id');

        // Si la reserva solicitada es para hoy y en la hora actual (+- 60 min), revisar si la mesa tiene pedido activo
        $esHoy = ($fecha === now()->toDateString());
        $mesasConPedidoActivo = collect();
        if ($esHoy && abs($solicitadoInicio->diffInMinutes(now())) <= 60) {
            $mesasConPedidoActivo = DB::table('pedido')
                ->where('local_id', $localId)
                ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
                ->pluck('mesa_id')
                ->flip();
        }

        $mesasDTO = $mesasRaw->map(function ($m) use ($reservasEnVentana, $mesasConPedidoActivo, $numPersonas) {
            $tieneConflictoReserva = $reservasEnVentana->has($m->id);
            $tienePedidoActivo = $mesasConPedidoActivo->has($m->id);
            $capacidadSuficiente = (int) $m->capacidad >= $numPersonas;

            $disponible = ! $tieneConflictoReserva && ! $tienePedidoActivo;
            $motivoBloqueo = null;

            if ($tieneConflictoReserva) {
                $disponible = false;
                $resConflicto = $reservasEnVentana->get($m->id);
                $horaConf = date('H:i', strtotime($resConflicto->fecha_hora));
                $motivoBloqueo = "Reservada a las {$horaConf}";
            } elseif ($tienePedidoActivo) {
                $disponible = false;
                $motivoBloqueo = 'Ocupada con comanda activa';
            } elseif (! $capacidadSuficiente && ! $m->permite_union) {
                $disponible = false;
                $motivoBloqueo = 'Capacidad insuficiente';
            }

            return [
                'mesa_id' => $m->id,
                'numero' => $m->numero,
                'capacidad' => (int) $m->capacidad,
                'disponible' => $disponible,
                'permite_union' => (bool) $m->permite_union,
                'motivo_bloqueo' => $motivoBloqueo,
            ];
        });

        return ApiResponse::ok([
            'fecha_hora_solicitada' => $solicitadoInicio->toIso8601String(),
            'num_personas' => $numPersonas,
            'mesas' => $mesasDTO->values(),
        ]);
    }

    /**
     * CU-MOZO-05: Listar reservas de la jornada con cálculo de anticipación y tolerancia.
     */
    public function getReservas(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $fecha = $request->query('fecha', now()->toDateString());
        $turno = $request->query('turno', 'todos');

        $politica = DB::table('politicas_reserva')
            ->where('local_id', $localId)
            ->first();

        $toleranciaMin = (int) ($politica->tolerancia_no_show_min ?? 15);
        $bloqueoPrevioMin = (int) ($politica->minutos_bloqueo_previo ?? 30);

        $turnos = $this->resolverTurnosFecha($localId, $fecha);

        $query = DB::table('reserva as r')
            ->where('r.local_id', $localId)
            ->whereDate('r.fecha_hora', $fecha)
            ->orderBy('r.fecha_hora');

        if ($turno === 'almuerzo' && isset($turnos['almuerzo'])) {
            $query->whereTime('r.fecha_hora', '>=', $turnos['almuerzo']['inicio'])
                  ->whereTime('r.fecha_hora', '<', $turnos['almuerzo']['fin']);
        } elseif ($turno === 'cena' && isset($turnos['cena'])) {
            $query->whereTime('r.fecha_hora', '>=', $turnos['cena']['inicio']);
            if (isset($turnos['cena']['fin']) && $turnos['cena']['fin'] > $turnos['cena']['inicio']) {
                $query->whereTime('r.fecha_hora', '<=', $turnos['cena']['fin']);
            }
        }

        $reservasRaw = $query->get();

        if ($reservasRaw->isEmpty()) {
            return ApiResponse::ok([]);
        }

        $reservaIds = $reservasRaw->pluck('id');

        $mesasAsignadas = DB::table('reserva_mesa as rm')
            ->join('mesa as m', 'm.id', '=', 'rm.mesa_id')
            ->whereIn('rm.reserva_id', $reservaIds)
            ->select('rm.reserva_id', 'm.id as mesa_id', 'm.numero')
            ->get()
            ->groupBy('reserva_id');

        $pedidosActivos = DB::table('pedido')
            ->where('local_id', $localId)
            ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->select('id', 'mesa_id')
            ->get()
            ->keyBy('mesa_id');

        $nowTimestamp = now()->timestamp;

        $reservasDTO = $reservasRaw->map(function ($r) use ($mesasAsignadas, $pedidosActivos, $nowTimestamp, $toleranciaMin, $bloqueoPrevioMin) {
            $mesas = $mesasAsignadas->get($r->id) ?? collect();
            $mesaIds = $mesas->pluck('mesa_id')->values()->all();

            $numeros = $mesas->pluck('numero')->sort()->values()->all();
            if (count($numeros) === 0) {
                $mesasEtiqueta = 'Sin mesa';
            } elseif (count($numeros) === 1) {
                $mesasEtiqueta = 'Mesa ' . $numeros[0];
            } else {
                $mesasEtiqueta = 'Mesa [ ' . implode(' ; ', $numeros) . ' ]';
            }

            $reservaTimestamp = strtotime($r->fecha_hora);
            $minutosRestantes = (int) round(($reservaTimestamp - $nowTimestamp) / 60);

            $enTolerancia = ($minutosRestantes <= 0 && abs($minutosRestantes) <= $toleranciaMin);
            $toleranciaExpiro = ($minutosRestantes < 0 && abs($minutosRestantes) > $toleranciaMin && in_array($r->estado, ['confirmada', 'bloqueada']));

            $estadoEfectivo = $r->estado;
            if ($r->estado === 'confirmada' && $minutosRestantes <= $bloqueoPrevioMin && ! $toleranciaExpiro) {
                $estadoEfectivo = 'bloqueada';
            }

            $pedidoId = null;
            if (! empty($mesaIds)) {
                $primerMesaId = $mesaIds[0];
                if ($pedidosActivos->has($primerMesaId)) {
                    $pedidoId = $pedidosActivos->get($primerMesaId)->id;
                }
            }

            return [
                'id' => $r->id,
                'cliente_nombre' => $r->cliente_nombre,
                'cliente_telefono' => $r->cliente_telefono,
                'fecha_hora' => Carbon::parse($r->fecha_hora)->toIso8601String(),
                'hora_texto' => date('H:i', $reservaTimestamp),
                'minutos_restantes' => $minutosRestantes,
                'num_personas' => (int) $r->num_personas,
                'mesas_etiqueta' => $mesasEtiqueta,
                'mesa_ids' => $mesaIds,
                'estado' => $estadoEfectivo,
                'notas' => $r->notas ?? $r->motivo_cancelacion,
                'en_tolerancia' => $enTolerancia,
                'tolerancia_expiro' => $toleranciaExpiro,
                'pedido_id' => $pedidoId,
                'created_at' => Carbon::parse($r->created_at)->toIso8601String(),
            ];
        });

        return ApiResponse::ok($reservasDTO->values());
    }

    /**
     * CU-MOZO-05: Crear una nueva reserva en salón con asignación de mesas.
     */
    public function crearReserva(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'cliente_nombre' => ['required', 'string', 'min:3', 'max:100'],
            'cliente_telefono' => ['required', 'string', 'min:8', 'max:20'],
            'fecha_hora' => ['required', 'date'],
            'num_personas' => ['required', 'integer', 'min:1', 'max:50'],
            'mesa_ids' => ['required', 'array', 'min:1'],
            'mesa_ids.*' => ['required', 'uuid'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        $mesaIds = $validated['mesa_ids'];
        $fechaHora = Carbon::parse($validated['fecha_hora']);

        $mesasDB = DB::table('mesa')
            ->where('local_id', $localId)
            ->whereIn('id', $mesaIds)
            ->get();

        if ($mesasDB->count() !== count($mesaIds)) {
            return ApiResponse::error('Una o más mesas seleccionadas no pertenecen al local o son inválidas.', 422);
        }

        $politica = DB::table('politicas_reserva')
            ->where('local_id', $localId)
            ->first();

        $duracion = (int) ($politica->duracion_reserva_min ?? 90);
        $buffer = (int) ($politica->buffer_reserva_min ?? 15);

        $solicitadoInicio = $fechaHora;
        $ventanaInicio = $solicitadoInicio->copy()->subMinutes($buffer);
        $ventanaFin = $solicitadoInicio->copy()->addMinutes($duracion + $buffer);

        $colisiones = DB::table('reserva as r')
            ->join('reserva_mesa as rm', 'rm.reserva_id', '=', 'r.id')
            ->join('mesa as m', 'm.id', '=', 'rm.mesa_id')
            ->where('r.local_id', $localId)
            ->whereIn('rm.mesa_id', $mesaIds)
            ->whereIn('r.estado', ['confirmada', 'bloqueada'])
            ->where(function ($q) use ($ventanaInicio, $ventanaFin, $duracion) {
                $q->where('r.fecha_hora', '<', $ventanaFin)
                  ->whereRaw("r.fecha_hora + interval '{$duracion} minutes' > ?", [$ventanaInicio]);
            })
            ->select('m.numero')
            ->distinct()
            ->pluck('numero');

        if ($colisiones->isNotEmpty()) {
            return ApiResponse::error(
                'Conflicto de horario: La mesa ' . $colisiones->implode(', ') . ' ya cuenta con una reserva activa en esa franja.',
                422
            );
        }

        return DB::transaction(function () use ($validated, $user, $localId, $fechaHora, $mesaIds, $mesasDB, $politica) {
            $reservaId = (string) Str::uuid();

            $bloqueoPrevioMin = (int) ($politica->minutos_bloqueo_previo ?? 30);
            $minutosRestantes = (int) round(($fechaHora->timestamp - now()->timestamp) / 60);

            $estadoInicial = ($minutosRestantes <= $bloqueoPrevioMin && $minutosRestantes >= 0)
                ? 'bloqueada'
                : 'confirmada';

            DB::table('reserva')->insert([
                'id' => $reservaId,
                'local_id' => $localId,
                'cliente_nombre' => $validated['cliente_nombre'],
                'cliente_telefono' => $validated['cliente_telefono'],
                'fecha_hora' => $fechaHora,
                'num_personas' => $validated['num_personas'],
                'estado' => $estadoInicial,
                'creado_por' => $user->id,
                'notas' => $validated['notas'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($mesaIds as $mId) {
                DB::table('reserva_mesa')->insert([
                    'reserva_id' => $reservaId,
                    'mesa_id' => $mId,
                ]);
            }

            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $user->empresa_id,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'CREACION_RESERVA',
                'entidad_tipo' => 'reserva',
                'entidad_id' => $reservaId,
                'detalle' => json_encode([
                    'cliente' => $validated['cliente_nombre'],
                    'personas' => $validated['num_personas'],
                    'fecha_hora' => $fechaHora->toIso8601String(),
                    'mesas' => $mesasDB->pluck('numero')->all(),
                ]),
                'fecha' => now(),
            ]);

            $numeros = $mesasDB->pluck('numero')->sort()->values()->all();
            $etiqueta = count($numeros) === 1 ? 'Mesa ' . $numeros[0] : 'Mesa [ ' . implode(' ; ', $numeros) . ' ]';

            return ApiResponse::ok([
                'id' => $reservaId,
                'cliente_nombre' => $validated['cliente_nombre'],
                'cliente_telefono' => $validated['cliente_telefono'],
                'fecha_hora' => $fechaHora->toIso8601String(),
                'hora_texto' => $fechaHora->format('H:i'),
                'minutos_restantes' => $minutosRestantes,
                'num_personas' => (int) $validated['num_personas'],
                'mesas_etiqueta' => $etiqueta,
                'mesa_ids' => $mesaIds,
                'estado' => $estadoInicial,
                'notas' => $validated['notas'] ?? null,
                'en_tolerancia' => false,
                'tolerancia_expiro' => false,
                'pedido_id' => null,
                'created_at' => now()->toIso8601String(),
            ], 201);
        });
    }

    /**
     * CU-MOZO-05: Sentar comensales de una reserva, unir mesas si aplica y abrir comanda.
     */
    public function sentarReserva(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $reserva = DB::table('reserva')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $reserva) {
            return ApiResponse::error('Reserva no encontrada en este local.', 404);
        }

        if (in_array($reserva->estado, ['atendida', 'cancelada', 'no_show'])) {
            return ApiResponse::error("La reserva ya se encuentra en estado '{$reserva->estado}' y no puede ser sentada.", 422);
        }

        $mesasAsignadas = DB::table('reserva_mesa as rm')
            ->join('mesa as m', 'm.id', '=', 'rm.mesa_id')
            ->where('rm.reserva_id', $id)
            ->select('m.*')
            ->orderBy('m.numero')
            ->get();

        if ($mesasAsignadas->isEmpty()) {
            return ApiResponse::error('La reserva no tiene mesas asignadas.', 422);
        }

        $titular = $mesasAsignadas->first();
        $secundarias = $mesasAsignadas->slice(1);

        return DB::transaction(function () use ($reserva, $titular, $secundarias, $user, $localId, $id) {
            // 1. Si son varias mesas, unirlas físicamente
            if ($secundarias->isNotEmpty()) {
                DB::table('mesa')
                    ->whereIn('id', $secundarias->pluck('id'))
                    ->update([
                        'mesa_principal_id' => $titular->id,
                        'updated_at' => now(),
                    ]);
            }

            // 2. Verificar si la mesa titular ya tiene pedido activo
            $pedidoExistente = DB::table('pedido')
                ->where('mesa_id', $titular->id)
                ->where('local_id', $localId)
                ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
                ->first();

            $pedidoId = null;
            if ($pedidoExistente) {
                $pedidoId = $pedidoExistente->id;
            } else {
                $ultimoNumero = DB::table('pedido')
                    ->where('local_id', $localId)
                    ->max('numero_comanda') ?? 0;

                $pedidoId = (string) Str::uuid();
                DB::table('pedido')->insert([
                    'id' => $pedidoId,
                    'local_id' => $localId,
                    'numero_comanda' => $ultimoNumero + 1,
                    'mesa_id' => $titular->id,
                    'mozo_id' => $user->id,
                    'estado' => 'enviado',
                    'comensales' => (int) $reserva->num_personas,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 3. Marcar reserva atendida
            DB::table('reserva')
                ->where('id', $id)
                ->update([
                    'estado' => 'atendida',
                    'updated_at' => now(),
                ]);

            // 4. Log auditoría
            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $user->empresa_id,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'RECEPCION_RESERVA_SALON',
                'entidad_tipo' => 'reserva',
                'entidad_id' => $id,
                'detalle' => json_encode([
                    'cliente' => $reserva->cliente_nombre,
                    'mesa_titular' => $titular->numero,
                    'pedido_id' => $pedidoId,
                    'comensales' => $reserva->num_personas,
                ]),
                'fecha' => now(),
            ]);

            return ApiResponse::ok([
                'reserva_id' => $id,
                'mesa_id' => $titular->id,
                'pedido_id' => $pedidoId,
                'mensaje' => "Comensales de {$reserva->cliente_nombre} sentados exitosamente en Mesa {$titular->numero}. Comanda abierta.",
            ]);
        });
    }

    /**
     * CU-MOZO-05: Registrar inasistencia del comensal y liberar mesas inmediatamente.
     */
    public function registrarNoShow(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $reserva = DB::table('reserva')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $reserva) {
            return ApiResponse::error('Reserva no encontrada.', 404);
        }

        $motivo = $request->input('motivo_inasistencia', $request->input('motivo', 'Inasistencia del cliente'));

        $notasActuales = $reserva->notas ? "{$reserva->notas} | Inasistencia: {$motivo}" : "Inasistencia: {$motivo}";

        DB::table('reserva')
            ->where('id', $id)
            ->update([
                'estado' => 'no_show',
                'motivo_cancelacion' => $motivo,
                'notas' => $notasActuales,
                'updated_at' => now(),
            ]);

        DB::table('log_auditoria')->insert([
            'id' => (string) Str::uuid(),
            'empresa_id' => $user->empresa_id,
            'local_id' => $localId,
            'usuario_id' => $user->id,
            'accion' => 'NO_SHOW_RESERVA',
            'entidad_tipo' => 'reserva',
            'entidad_id' => $id,
            'detalle' => json_encode([
                'cliente' => $reserva->cliente_nombre,
                'motivo' => $motivo,
            ]),
            'fecha' => now(),
        ]);

        return ApiResponse::ok([
            'reservaId' => $id,
            'mesaLiberada' => true,
            'mensaje' => "Inasistencia de {$reserva->cliente_nombre} registrada. Mesa liberada inmediatamente a LIBRE.",
        ]);
    }

    /**
     * CU-MOZO-05: Cancelar reserva de forma justificada y liberar mesa.
     */
    public function cancelarReserva(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $reserva = DB::table('reserva')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $reserva) {
            return ApiResponse::error('Reserva no encontrada.', 404);
        }

        $validated = $request->validate([
            'motivo_cancelacion' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        $motivo = $validated['motivo_cancelacion'];
        $notasActuales = $reserva->notas ? "{$reserva->notas} | Cancelada: {$motivo}" : "Cancelada: {$motivo}";

        DB::table('reserva')
            ->where('id', $id)
            ->update([
                'estado' => 'cancelada',
                'motivo_cancelacion' => $motivo,
                'notas' => $notasActuales,
                'updated_at' => now(),
            ]);

        DB::table('log_auditoria')->insert([
            'id' => (string) Str::uuid(),
            'empresa_id' => $user->empresa_id,
            'local_id' => $localId,
            'usuario_id' => $user->id,
            'accion' => 'CANCELACION_RESERVA',
            'entidad_tipo' => 'reserva',
            'entidad_id' => $id,
            'detalle' => json_encode([
                'cliente' => $reserva->cliente_nombre,
                'motivo' => $motivo,
            ]),
            'fecha' => now(),
        ]);

        return ApiResponse::ok([
            'reservaId' => $id,
            'mensaje' => "Reserva de {$reserva->cliente_nombre} cancelada. Mesas liberadas correctamente.",
        ]);
    }

    /**
     * CU-MOZO-05: Reasignar mesa asignada a una reserva existente.
     */
    public function reasignarMesaReserva(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $reserva = DB::table('reserva')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $reserva) {
            return ApiResponse::error('Reserva no encontrada.', 404);
        }

        $validated = $request->validate([
            'nueva_mesa_id' => ['required', 'uuid'],
            'motivo' => ['nullable', 'string', 'max:255'],
        ]);

        $nuevaMesaId = $validated['nueva_mesa_id'];
        $nuevaMesa = DB::table('mesa')
            ->where('id', $nuevaMesaId)
            ->where('local_id', $localId)
            ->first();

        if (! $nuevaMesa) {
            return ApiResponse::error('La nueva mesa indicada no existe en este local.', 404);
        }

        return DB::transaction(function () use ($reserva, $nuevaMesa, $validated, $id, $localId, $user) {
            DB::table('reserva_mesa')->where('reserva_id', $id)->delete();
            DB::table('reserva_mesa')->insert([
                'reserva_id' => $id,
                'mesa_id' => $nuevaMesa->id,
            ]);

            $motivo = $validated['motivo'] ?? null;
            $notasActuales = $reserva->notas;
            if ($motivo) {
                $notasActuales = $notasActuales ? "{$notasActuales} | Reasignación: {$motivo}" : "Reasignación: {$motivo}";
                DB::table('reserva')->where('id', $id)->update([
                    'notas' => $notasActuales,
                    'updated_at' => now(),
                ]);
            }

            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $user->empresa_id,
                'local_id' => $localId,
                'usuario_id' => $user->id,
                'accion' => 'REASIGNACION_MESA_RESERVA',
                'entidad_tipo' => 'reserva',
                'entidad_id' => $id,
                'detalle' => json_encode([
                    'cliente' => $reserva->cliente_nombre,
                    'nueva_mesa' => $nuevaMesa->numero,
                    'motivo' => $motivo,
                ]),
                'fecha' => now(),
            ]);

            $minutosRestantes = (int) round((strtotime($reserva->fecha_hora) - now()->timestamp) / 60);

            return ApiResponse::ok([
                'id' => $reserva->id,
                'cliente_nombre' => $reserva->cliente_nombre,
                'cliente_telefono' => $reserva->cliente_telefono,
                'fecha_hora' => Carbon::parse($reserva->fecha_hora)->toIso8601String(),
                'hora_texto' => date('H:i', strtotime($reserva->fecha_hora)),
                'minutos_restantes' => $minutosRestantes,
                'num_personas' => (int) $reserva->num_personas,
                'mesas_etiqueta' => 'Mesa ' . $nuevaMesa->numero,
                'mesa_ids' => [$nuevaMesa->id],
                'estado' => $reserva->estado,
                'notas' => $notasActuales,
                'en_tolerancia' => false,
                'tolerancia_expiro' => false,
                'pedido_id' => null,
                'created_at' => Carbon::parse($reserva->created_at)->toIso8601String(),
            ]);
        });
    }
}
