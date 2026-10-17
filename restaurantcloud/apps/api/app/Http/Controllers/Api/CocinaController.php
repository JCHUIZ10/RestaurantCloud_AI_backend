<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CocinaController extends Controller
{
    /**
     * Obtener la lista de comandas activas para la pantalla KDS.
     */
    public function getComandas(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        // Comandas activas con ítems que requieren preparación culinaria
        $pedidos = DB::table('pedido as p')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->select([
                'p.id as pedido_id',
                'p.numero_comanda',
                'p.estado as pedido_estado',
                'p.comensales',
                'p.created_at',
                'm.id as mesa_id',
                'm.numero as mesa_numero',
                'u.nombre as mozo_nombre',
            ])
            ->orderBy('p.created_at', 'asc')
            ->get();

        $comandas = [];

        foreach ($pedidos as $p) {
            $items = DB::table('pedido_item as pi')
                ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
                ->where('pi.pedido_id', $p->pedido_id)
                ->whereIn('pi.estado', ['en_cola', 'en_preparacion', 'listo'])
                ->select([
                    'pi.id',
                    'pi.producto_id',
                    'pr.nombre as producto_nombre',
                    'pi.cantidad',
                    'pi.nota_cocina',
                    'pi.estado',
                    'pi.numero_ronda',
                    'pi.fecha_inicio_coccion',
                    'pi.fecha_listo_cocina',
                    'pi.created_at',
                ])
                ->get();

            if ($items->isEmpty()) {
                continue;
            }

            $minutosTranscurridos = (int) max(0, round((now()->timestamp - strtotime($p->created_at)) / 60));

            $comandas[] = [
                'id' => $p->pedido_id,
                'numero_comanda' => (int) $p->numero_comanda,
                'mesa_id' => $p->mesa_id,
                'mesa_numero' => $p->mesa_numero,
                'mozo_nombre' => $p->mozo_nombre,
                'comensales' => (int) $p->comensales,
                'created_at' => $p->created_at,
                'minutos_transcurridos' => $minutosTranscurridos,
                'items' => $items,
            ];
        }

        return ApiResponse::ok($comandas);
    }

    /**
     * Actualizar el estado de cocción de un ítem (en_preparacion, listo, entregado).
     */
    public function cambiarEstadoItem(Request $request, string $itemId): JsonResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'string', 'in:en_cola,en_preparacion,listo,entregado'],
        ]);

        $item = DB::table('pedido_item')->where('id', $itemId)->first();

        if (! $item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato solicitado no existe.', 404);
        }

        $updateData = [
            'estado' => $validated['estado'],
            'updated_at' => now(),
        ];

        if ($validated['estado'] === 'en_preparacion' && ! $item->fecha_inicio_coccion) {
            $updateData['fecha_inicio_coccion'] = now();
        }

        if ($validated['estado'] === 'listo' && ! $item->fecha_listo_cocina) {
            $updateData['fecha_listo_cocina'] = now();
        }

        DB::table('pedido_item')->where('id', $itemId)->update($updateData);

        return ApiResponse::ok([
            'id' => $itemId,
            'nuevo_estado' => $validated['estado'],
            'mensaje' => 'Estado del plato actualizado.',
        ]);
    }
}
