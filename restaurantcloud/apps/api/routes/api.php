<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\CategoriaController;
use App\Http\Controllers\Api\Admin\ConfiguracionKdsController;
use App\Http\Controllers\Api\Admin\HorarioController;
use App\Http\Controllers\Api\Admin\InsumoController;
use App\Http\Controllers\Api\Admin\MetodoPagoController;
use App\Http\Controllers\Api\Admin\ProductoController;
use App\Http\Controllers\Api\Admin\RecetaController;
use App\Http\Controllers\Api\Admin\PersonalController;
use App\Http\Controllers\Api\Propietario\AdministradorController;
use App\Http\Controllers\Api\Propietario\LocalController;
use App\Http\Controllers\Api\CajaController;
use App\Http\Controllers\Api\CocinaController;
use App\Http\Controllers\Api\MozoController;
use App\Http\Controllers\Api\Public\RegistroController;
use App\Http\Controllers\Api\Public\ActivacionCuentaController;
use Illuminate\Support\Facades\Route;


Route::prefix('v1')->group(function (): void {
    // Healthcheck
    Route::get('/health', fn () => response()->json([
        'exito' => true,
        'datos' => ['servicio' => 'restaurantcloud-api', 'status' => 'online'],
        'meta' => ['timestamp' => now()->toIso8601String()],
    ]));

    // Onboarding y Registro de Empresa (CU-PROP-01) - Rutas Públicas
    Route::prefix('public')->group(function (): void {
        Route::get('/planes', [RegistroController::class, 'getPlanes']);
        Route::post('/registro/iniciar', [RegistroController::class, 'iniciarRegistro']);
        Route::patch('/registro/modificar-correo', [RegistroController::class, 'modificarCorreo']);
        Route::post('/registro/verificar-otp', [RegistroController::class, 'verificarOtp']);
        Route::post('/registro/completar', [RegistroController::class, 'completarRegistro']);

        // Activación de Cuenta de Colaboradores Invitados (CU-PROP-05)
        Route::prefix('activar-cuenta')->group(function (): void {
            Route::get('/validar', [ActivacionCuentaController::class, 'validar']);
            Route::post('/completar', [ActivacionCuentaController::class, 'completar']);
        });
    });

    // Webhooks de Stripe Billing
    Route::post('/webhooks/stripe', [RegistroController::class, 'stripeWebhook']);

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

            Route::get('/productos', [ProductoController::class, 'index']);
            Route::post('/productos', [ProductoController::class, 'store']);
            Route::get('/productos/{id}', [ProductoController::class, 'show']);
            Route::patch('/productos/{id}', [ProductoController::class, 'update']);
            Route::patch('/productos/{id}/disponibilidad', [ProductoController::class, 'disponibilidad']);
            Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);
            Route::get('/productos/{id}/receta', [RecetaController::class, 'show']);
            Route::put('/productos/{id}/receta', [RecetaController::class, 'update']);
            Route::get('/productos/{id}/capacidad', [RecetaController::class, 'capacidad']);

            Route::prefix('insumos')->group(function (): void {
                Route::get('/', [InsumoController::class, 'index']);
                Route::post('/', [InsumoController::class, 'store']);
                Route::get('/auditoria', [InsumoController::class, 'auditoria']);
                Route::get('/{id}', [InsumoController::class, 'show']);
                Route::put('/{id}', [InsumoController::class, 'update']);
                Route::post('/{id}/ajuste', [InsumoController::class, 'ajuste']);
                Route::patch('/{id}/estado', [InsumoController::class, 'estado']);
            });

            Route::get('/personal', [PersonalController::class, 'index']);
            Route::post('/personal', [PersonalController::class, 'store']);
            Route::patch('/personal/{id}', [PersonalController::class, 'update']);
            Route::post('/personal/{id}/reactivar', [PersonalController::class, 'reactivar']);
            Route::post('/personal/{id}/reset-password', [PersonalController::class, 'resetPassword']);

            Route::get('/horario', [HorarioController::class, 'semana']);
            Route::put('/horario', [HorarioController::class, 'guardarSemana']);
            Route::post('/horario/plantilla', [HorarioController::class, 'aplicarPlantilla']);
            Route::get('/horario/excepciones', [HorarioController::class, 'excepciones']);
            Route::post('/horario/excepciones', [HorarioController::class, 'crearExcepcion']);
            Route::delete('/horario/excepciones/{id}', [HorarioController::class, 'eliminarExcepcion']);
            Route::post('/horario/feriados-peru/cargar', [HorarioController::class, 'cargarFeriadosPeru']);

            Route::prefix('configuracion-kds')->middleware('role:admin_local')->group(function (): void {
                Route::get('/', [ConfiguracionKdsController::class, 'show']);
                Route::put('/', [ConfiguracionKdsController::class, 'update']);
                Route::post('/restaurar-valores-recomendados', [ConfiguracionKdsController::class, 'restaurarValoresRecomendados']);
            });

            Route::prefix('metodos-pago')->middleware('role:admin_local')->group(function (): void {
                Route::get('/', [MetodoPagoController::class, 'index']);
                Route::put('/', [MetodoPagoController::class, 'update']);
            });
        });

        // Propietario (CU-PROP-04: Gestión de Locales / CU-PROP-05: Administradores de Local)
        Route::prefix('propietario')->middleware('role:propietario,admin_saas')->group(function (): void {
            // CU-PROP-04: Registrar y Administrar Locales
            Route::prefix('locales')->group(function (): void {
                Route::get('/', [LocalController::class, 'index']);
                Route::get('/verificar-disponibilidad', [LocalController::class, 'verificarDisponibilidad']);
                Route::get('/verificar-slug', [LocalController::class, 'verificarSlug']);
                Route::post('/', [LocalController::class, 'store']);
                Route::put('/{id}', [LocalController::class, 'update']);
                Route::get('/{id}/validar-baja', [LocalController::class, 'validarBaja']);
                Route::patch('/{id}/cambiar-estado', [LocalController::class, 'cambiarEstado']);
            });

            // CU-PROP-05: Administradores de Local
            Route::prefix('administradores')->group(function (): void {
                Route::get('/', [AdministradorController::class, 'index']);
                Route::get('/cuota-personal', [AdministradorController::class, 'cuotaPersonal']);
                Route::post('/', [AdministradorController::class, 'store']);
                Route::post('/{id}/reenviar-invitacion', [AdministradorController::class, 'reenviarInvitacion']);
                Route::post('/{id}/cancelar-invitacion', [AdministradorController::class, 'cancelarInvitacion']);
                Route::get('/{id}/enlace-invitacion', [AdministradorController::class, 'enlaceInvitacion']);
                Route::patch('/{id}/cambiar-estado', [AdministradorController::class, 'cambiarEstado']);
            });
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

        // Cocina / KDS (CU-COCINA-01, CU-COCINA-02 y CU-COCINA-04)
        Route::prefix('cocina')->group(function (): void {
            Route::get('/configuracion', [CocinaController::class, 'getConfiguracion']);
            Route::get('/comandas', [CocinaController::class, 'getComandas']);
            // CU-COCINA-01 & CU-COCINA-02: Consolidado All-Day y Acciones por Tandas
            Route::get('/consolidado-all-day', [CocinaController::class, 'getConsolidadoAllDay']);
            Route::post('/consolidado/poner-en-fuego', [CocinaController::class, 'ponerEnFuegoTanda']);
            Route::post('/consolidado/marcar-listo', [CocinaController::class, 'marcarListoTanda']);
            Route::patch('/items/{id}/estado', [CocinaController::class, 'cambiarEstadoItem']);
            Route::post('/items/{id}/deshacer', [CocinaController::class, 'deshacerItem']);
            Route::post('/pedidos/{id}/despachar', [CocinaController::class, 'despacharPedido']);
            Route::get('/pedidos/despachados-recientes', [CocinaController::class, 'getDespachadosRecientes']);
            Route::get('/metricas-despacho', [CocinaController::class, 'getMetricasDespacho']);

            // CU-COCINA-04: Gestión de Quiebres y Disponibilidad de Carta
            Route::get('/productos/disponibilidad', [CocinaController::class, 'getDisponibilidadProductos']);
            Route::get('/productos/{id}/items-fuego', [CocinaController::class, 'getItemsEnFuegoProducto']);
            Route::post('/productos/{id}/marcar-agotado', [CocinaController::class, 'marcarProductoAgotado']);
            Route::post('/productos/{id}/resolver-fuego', [CocinaController::class, 'resolverFuegoProducto']);
            Route::post('/productos/{id}/reactivar', [CocinaController::class, 'reactivarProducto']);
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
