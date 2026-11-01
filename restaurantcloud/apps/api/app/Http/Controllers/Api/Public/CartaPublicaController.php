<?php

namespace App\Http\Controllers\Api\Public;

use App\Domains\Carta\Services\CartaPublicaService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CartaPublicaController extends Controller
{
    public function __construct(private CartaPublicaService $carta) {}

    /**
     * CU-CLIENTE-01: Carta digital de la sede identificada por su slug.
     */
    public function show(string $slug): JsonResponse
    {
        $carta = preg_match('/^[a-z0-9-]{1,100}$/', $slug) === 1
            ? $this->carta->obtenerPorSlug($slug)
            : null;

        return $carta
            ? ApiResponse::ok($carta)
            : ApiResponse::error(
                'ERR_CARTA_NO_ENCONTRADA',
                'No pudimos encontrar la carta de este restaurante.',
                404,
            );
    }
}
