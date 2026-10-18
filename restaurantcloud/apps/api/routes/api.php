<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\CategoriaController;
use App\Http\Controllers\Api\CajaController;
use App\Http\Controllers\Api\CocinaController;
use App\Http\Controllers\Api\MozoController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Healthcheck
    Route::get('/health', fn () => response()->json([
        'exito' => true,
        'datos' => ['servicio' => 'restaurantcloud-api', 'status' => 'online'],
        'meta' => ['timestamp' => now()->toIso8601String()],
    ]));

    // Autenticación pública
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/seleccionar-cuenta', [AuthController::class, 'seleccionarCuenta']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Rutas protegidas con Caché de Sesión en Redis (Alta Velocidad)
    Route::middleware(['auth.redis', 'tenant.context'])->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::prefix('admin')->middleware('role:admin_local,propietario,admin_saas')->group(function (): void {
            Route::get('/categorias', [CategoriaController::class, 'index']);
            Route::post('/categorias', [CategoriaController::class, 'store']);
            Route::patch('/categorias/reordenar', [CategoriaController::class, 'reordenar']);
            Route::post('/categorias/plantilla', [CategoriaController::class, 'plantilla']);
            Route::patch('/categorias/{id}', [CategoriaController::class, 'update']);
            Route::patch('/categorias/{id}/visibilidad', [CategoriaController::class, 'visibilidad']);
            Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy']);
            Route::post('/categorias/{id}/reasignar-y-eliminar', [CategoriaController::class, 'reasignar']);
        });


        // Salón / Mozo (CU-MOZO-01, CU-MOZO-02, CU-MOZO-08)
        Route::prefix('mozo')->group(function (): void {
            // CU-MOZO-01: Centro de Salón y Mesas en Vivo
            Route::get('/plano', [MozoController::class, 'getPlano']);
            Route::post('/mesas/{id}/abrir', [MozoController::class, 'abrirMesa']);
            Route::get('/mesas/{id}/detalle', [MozoController::class, 'getDetalleMesa']);
            Route::patch('/items/{id}/servido', [MozoController::class, 'marcarItemServido']);
            Route::post('/mesas/{id}/solicitar-cuenta', [MozoController::class, 'solicitarCuenta']);
            Route::post('/mesas/{id}/liberar', [MozoController::class, 'liberarMesa']);

            // CU-MOZO-02: Catálogo de Carta, Historial y Despacho de Comandas
            Route::get('/carta', [MozoController::class, 'getCarta']);
            Route::get('/mesas/{id}/carta', [MozoController::class, 'getCartaMesa']);
            Route::get('/mesas/{id}/historial', [MozoController::class, 'getHistorialMesa']);
            Route::post('/pedidos', [MozoController::class, 'crearPedido']);
            Route::post('/mesas/{id}/pedidos', [MozoController::class, 'enviarPedidoMesa']);

            // CU-MOZO-08: Precuenta Digital en Salón
            Route::get('/mesas/{id}/precuenta', [MozoController::class, 'getPrecuentaMesa']);
            Route::get('/clientes/buscar', [CajaController::class, 'buscarCliente']);

            // CU-MOZO-09: Dividir Cuenta en Mesa (Subcuentas)
            Route::get('/mesas/{id}/items-dividir', [MozoController::class, 'getItemsDividir']);
            Route::post('/mesas/{id}/dividir-cuenta', [MozoController::class, 'dividirCuenta']);
        });

        // Cocina / KDS (CU-COCINA-01 y CU-COCINA-02)
        Route::prefix('cocina')->group(function (): void {
            Route::get('/configuracion', [CocinaController::class, 'getConfiguracion']);
            Route::get('/comandas', [CocinaController::class, 'getComandas']);
            Route::get('/consolidado-all-day', [CocinaController::class, 'getConsolidadoAllDay']);
            Route::patch('/items/{id}/estado', [CocinaController::class, 'cambiarEstadoItem']);
            Route::post('/items/{id}/deshacer', [CocinaController::class, 'deshacerItem']);
            Route::post('/pedidos/{id}/despachar', [CocinaController::class, 'despacharPedido']);
            Route::get('/pedidos/despachados-recientes', [CocinaController::class, 'getDespachadosRecientes']);
            Route::get('/metricas-despacho', [CocinaController::class, 'getMetricasDespacho']);
        });

        // Caja / POS (CU-CAJA-01, CU-CAJA-02, CU-CAJA-03, CU-CAJA-04)
        Route::prefix('caja')->group(function (): void {
            // CU-CAJA-01: Apertura de Turno y Estado de Sesión
            Route::get('/estado-sesion', [CajaController::class, 'getEstadoSesion']);
            Route::post('/apertura', [CajaController::class, 'apertura']);

            // CU-CAJA-02: Monitor POS y Precuenta
            Route::get('/mesas-monitor', [CajaController::class, 'getMesasMonitor']);
            Route::get('/metricas-pos', [CajaController::class, 'getMetricasPos']);
            Route::get('/mesas/{id}/cuenta', [CajaController::class, 'getPrecuentaMesa']);
            Route::post('/mesas/{id}/conmutar-cuenta-pedida', [CajaController::class, 'conmutarCuentaPedida']);

            // CU-CAJA-04: Dividir Cuenta en Monitor POS (Subcuentas)
            Route::get('/mesas/{id}/items-dividir', [MozoController::class, 'getItemsDividir']);
            Route::post('/mesas/{id}/dividir-cuenta', [MozoController::class, 'dividirCuenta']);

            // CU-CAJA-03: Cobro y Facturación Fiscal SUNAT
            Route::post('/cobrar', [CajaController::class, 'cobrar']);
            Route::get('/clientes/buscar', [CajaController::class, 'buscarCliente']);
        });
    });
});
