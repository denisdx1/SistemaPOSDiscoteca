<?php

use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\MesaController;
use App\Http\Controllers\MovimientoInventarioController;
use App\Http\Controllers\OrdenController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ProductoComplementoController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FacturacionController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventarioCajaController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ComboController;
use App\Http\Controllers\MonedaController;
use App\Http\Controllers\ConfiguracionGeneralController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Rutas del Dashboard (requieren autenticación)
Route::middleware('auth')->group(function () {
    // Dashboard principal - accesible para todos los roles autenticados
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Módulo de Menú - Administrador y Bartender
    Route::prefix('menu')->middleware('role:administrador,bartender')->group(function () {
        // Rutas de Productos - Permitir a meseros para visualización
        Route::get('/productos', [ProductoController::class, 'index'])->name('menu.productos')->withoutMiddleware('role:administrador,bartender')->middleware('role:administrador,bartender,mesero,cajero');
        Route::get('/productos/{producto}/stock', [ProductoController::class, 'getStock'])->name('menu.productos.stock')->withoutMiddleware('role:administrador,bartender')->middleware('role:administrador,bartender,mesero,cajero'); 
        Route::get('/stock', [ProductoController::class, 'getAllStock'])->name('menu.productos.stock.all')->withoutMiddleware('role:administrador,bartender')->middleware('role:administrador,bartender,mesero,cajero');
        
        // Rutas de gestión de productos - Solo admin y bartender
        Route::post('/productos', [ProductoController::class, 'store'])->name('menu.productos.store');
        Route::put('/productos/{producto}', [ProductoController::class, 'update'])->name('menu.productos.update');
        Route::delete('/productos/{producto}', [ProductoController::class, 'destroy'])->name('menu.productos.destroy');
        
        // Rutas para complementos de productos
        Route::get('/complementos', [ProductoComplementoController::class, 'index'])->name('menu.complementos');
        Route::get('/complementos/{producto}/edit', [ProductoComplementoController::class, 'edit'])->name('menu.complementos.edit');
        Route::post('/complementos/{producto}', [ProductoComplementoController::class, 'update'])->name('menu.complementos.update');
        
        // Rutas de Categorías - Permitir a meseros para visualización
        Route::get('/categorias', [CategoriaController::class, 'index'])->name('menu.categorias')->withoutMiddleware('role:administrador,bartender')->middleware('role:administrador,bartender,mesero,cajero');
        Route::get('/categorias/all', [CategoriaController::class, 'getAll'])->name('menu.categorias.all')->withoutMiddleware('role:administrador,bartender')->middleware('role:administrador,bartender,mesero,cajero');
        
        // Rutas de gestión de categorías - Solo admin y bartender
        Route::post('/categorias', [CategoriaController::class, 'store'])->name('menu.categorias.store');
        Route::put('/categorias/{categoria}', [CategoriaController::class, 'update'])->name('menu.categorias.update');
        Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('menu.categorias.destroy');

        // Rutas de gestión de combos - Solo admin y bartender
        Route::get('/combos', [ComboController::class, 'index'])->name('menu.combos.index');
        Route::get('/combos/create', [ComboController::class, 'create'])->name('menu.combos.create');
        Route::post('/combos', [ComboController::class, 'store'])->name('menu.combos.store');
        Route::get('/combos/{combo}/edit', [ComboController::class, 'edit'])->name('menu.combos.edit');
        Route::put('/combos/{combo}', [ComboController::class, 'update'])->name('menu.combos.update');
        Route::delete('/combos/{combo}', [ComboController::class, 'destroy'])->name('menu.combos.destroy');
        
        // Ruta para generar código automático
        Route::post('/menu/productos/generar-codigo', [ProductoController::class, 'generarCodigo'])->name('menu.productos.generar-codigo');
    });

    // Módulo de Inventario - Administrador, Cajero y Bartender
    Route::prefix('inventario')->middleware('role:administrador,cajero,bartender')->group(function () {
        Route::get('/', function () {
            return Inertia::render('inventario/index');
        })->name('inventario');
        
        // Rutas para consultar stock (permitir acceso a meseros)
        Route::get('/stock/{producto}', [ProductoController::class, 'getStock'])
            ->name('inventario.stock.producto')
            ->withoutMiddleware('role:administrador,cajero,bartender')
            ->middleware('role:administrador,cajero,bartender,mesero');
        
        Route::get('/stock', [ProductoController::class, 'getAllStock'])
            ->name('inventario.stock.all')
            ->withoutMiddleware('role:administrador,cajero,bartender')
            ->middleware('role:administrador,cajero,bartender,mesero');
        
        // Rutas de Movimientos de Inventario - Solo administrador puede modificar el inventario
        Route::middleware('role:administrador')->group(function () {
            Route::get('/movimientos', [MovimientoInventarioController::class, 'index'])->name('inventario.movimientos');
            Route::post('/movimientos', [MovimientoInventarioController::class, 'store'])->name('inventario.movimientos.store');
        });
    });

    // Módulo de Caja - Administrador y Cajero
    Route::prefix('caja')->middleware('role:administrador,cajero')->group(function () {
        Route::get('/operaciones', [CajaController::class, 'index'])->name('caja.operaciones');
        Route::post('/abrir', [CajaController::class, 'abrirCaja'])->name('caja.abrir');
        Route::post('/cerrar', [CajaController::class, 'cerrarCaja'])->name('caja.cerrar');
        Route::post('/movimiento', [CajaController::class, 'registrarMovimiento'])->name('caja.movimiento');
        Route::get('/historial', [CajaController::class, 'historial'])->name('caja.historial');
    });

    // Módulo de Ordenes - Administrador, Mesero y Bartender
    Route::prefix('ordenes')->middleware('role:administrador,mesero,bartender,cajero')->group(function () {
        Route::get('/', [OrdenController::class, 'index'])->name('ordenes');
        Route::get('/nueva/{mesa?}', [OrdenController::class, 'create'])->name('ordenes.nueva');
        Route::post('/', [OrdenController::class, 'store'])->name('ordenes.store');
        
        // Historial - Solo administrador y cajero
        Route::middleware('role:administrador,cajero')->group(function () {
            Route::get('/historial', [OrdenController::class, 'history'])->name('ordenes.history');
            Route::get('/historial-data', [OrdenController::class, 'historyData'])->name('ordenes.history-data');
        });

        // Gestion - Solo administrador, mesero y bartender
        Route::middleware('role:administrador,bartender,mesero')->group(function(){
            Route::get('/gestion', [OrdenController::class, 'gestion'])->name('ordenes.gestion');
            Route::get('/{orden}', [OrdenController::class, 'show'])->name('ordenes.show');
            Route::patch('/{orden}/estado', [OrdenController::class, 'updateStatus'])->name('ordenes.update-status');
            Route::patch('/{orden}/pagar', [OrdenController::class, 'markAsPaid'])->name('ordenes.mark-as-paid');
            Route::delete('/{orden}', [OrdenController::class, 'destroy'])->name('ordenes.destroy');
        });
    });
    
    // API Routes
    Route::prefix('api')->middleware('auth')->group(function () {
        // Ruta para obtener complementos de un producto
        Route::get('/productos/{producto}/complementos', [ProductoComplementoController::class, 'getComplementos']);
        
        // Ruta para obtener todos los complementos de una vez
        Route::get('/productos/complementos/all', [ProductoComplementoController::class, 'getAllComplementos']);
    });
    
    // Módulo de Pedidos - Administrador
    Route::prefix('pedidos')->middleware('role:administrador')->group(function () {
        Route::get('/crear', function () {
            return Inertia::render('pedidos/crear');
        })->name('pedidos.crear');
    });
    
    // Módulo de Facturación - Administrador y Cajero
    Route::prefix('facturacion')->middleware('role:administrador,cajero')->group(function () {
        Route::get('/crear', [FacturacionController::class, 'create'])->name('facturacion.crear');
        Route::post('/cobrar/{orden}', [FacturacionController::class, 'cobrar'])->name('facturacion.cobrar');
        Route::get('/boleta/{orden}', [FacturacionController::class, 'generarBoleta'])->name('facturacion.boleta');
    });

    // Módulo de Mesas - Administrador, Cajero y Mesero
    Route::prefix('mesas')->middleware('role:administrador,cajero,mesero')->group(function () {
        Route::get('/', [MesaController::class, 'index'])->name('mesas');
        
        // Solo el administrador puede gestionar las mesas (crear, modificar, eliminar)
        Route::middleware('role:administrador')->group(function () {
            Route::post('/', [MesaController::class, 'store'])->name('mesas.store');
            Route::put('/{mesa}', [MesaController::class, 'update'])->name('mesas.update');
            Route::delete('/{mesa}', [MesaController::class, 'destroy'])->name('mesas.destroy');
        });
        
        // Todos los roles con acceso a mesas pueden cambiar el estado y crear órdenes
        Route::patch('/{mesa}/estado', [MesaController::class, 'cambiarEstado'])->name('mesas.cambiar-estado');
        Route::get('/{mesa}/orden', [OrdenController::class, 'create'])->name('ordenes.nueva');
    });

    // Módulo de Usuarios - Solo Administrador
    Route::prefix('usuarios')->middleware('role:administrador')->group(function () {
        Route::get('/lista', [UserController::class, 'index'])
            ->name('usuarios.lista');
        Route::post('/lista', [UserController::class, 'store'])
            ->name('usuarios.store');
        Route::put('/lista/{user}', [UserController::class, 'update'])
            ->name('usuarios.update');
        Route::delete('/lista/{user}', [UserController::class, 'destroy'])
            ->name('usuarios.destroy');
    });

    // Módulo de Roles - Solo Administrador
    Route::prefix('roles')->middleware('role:administrador')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
        Route::put('/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        Route::put('/{role}/permissions', [RoleController::class, 'updatePermissions'])->name('roles.permissions.update');
    });

    // Módulo de Configuración - Solo Administrador
    Route::get('/configuracion', function () {
        return Inertia::render('configuracion/index');
    })->middleware('role:administrador')->name('configuracion');

    // Rutas para la gestión de monedas
    Route::middleware('role:administrador')->group(function () {
        Route::get('/configuracion/monedas', [MonedaController::class, 'index'])
            ->name('monedas.index');
        Route::get('/api/moneda/actual', [MonedaController::class, 'getMonedaActual'])
            ->name('monedas.actual');
        Route::post('/api/moneda/cambiar', [MonedaController::class, 'cambiarMoneda'])
            ->name('monedas.cambiar');
        Route::put('/api/moneda/{moneda}', [MonedaController::class, 'update'])
            ->name('monedas.update');
    });

    // Rutas de configuración general
    Route::get('/configuracion/general', [ConfiguracionGeneralController::class, 'index'])->name('configuracion.general');
    Route::post('/configuracion/actualizar', [ConfiguracionGeneralController::class, 'actualizar'])->name('configuracion.actualizar');
    Route::get('/configuracion/obtener-tema', [ConfiguracionGeneralController::class, 'obtenerTema'])->name('configuracion.obtener-tema');
});

require __DIR__.'/auth.php';
