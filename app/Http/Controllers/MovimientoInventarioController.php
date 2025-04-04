<?php

namespace App\Http\Controllers;

use App\Models\MovimientoInventario;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MovimientoInventarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MovimientoInventario::query()
            ->with(['producto:id,nombre,codigo', 'usuario:id,name', 'pedido:id,numero_pedido']);

        // Búsqueda
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(observacion) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('producto', function ($query) use ($search) {
                      $query->whereRaw('LOWER(nombre) LIKE ?', ["%{$search}%"])
                            ->orWhereRaw('LOWER(codigo) LIKE ?', ["%{$search}%"]);
                  })
                  ->orWhereHas('pedido', function ($query) use ($search) {
                      $query->whereRaw('LOWER(numero_pedido) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        // Filtro por tipo de movimiento
        if ($request->filled('tipo_movimiento')) {
            $query->where('tipo_movimiento', $request->input('tipo_movimiento'));
        }

        // Filtro por producto
        if ($request->filled('producto_id')) {
            $query->where('producto_id', $request->input('producto_id'));
        }

        // Filtro por fecha
        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->input('fecha_hasta'));
        }

        // Si la solicitud espera JSON, devolver datos en formato JSON
        if ($request->expectsJson()) {
            return $this->getMovimientosJson($query);
        }

        return Inertia::render('inventario/movimientos', [
            'movimientos' => $query->orderBy('created_at', 'desc')
                ->paginate(15)
                ->withQueryString()
                ->through(fn ($movimiento) => [
                    'id' => $movimiento->id,
                    'producto' => [
                        'id' => $movimiento->producto->id,
                        'nombre' => $movimiento->producto->nombre,
                        'codigo' => $movimiento->producto->codigo,
                    ],
                    'cantidad' => $movimiento->cantidad,
                    'tipo_movimiento' => $movimiento->tipo_movimiento,
                    'precio_unitario' => $movimiento->precio_unitario,
                    'usuario' => $movimiento->usuario ? [
                        'id' => $movimiento->usuario->id,
                        'name' => $movimiento->usuario->name,
                    ] : null,
                    'pedido' => $movimiento->pedido ? [
                        'id' => $movimiento->pedido->id,
                        'numero_pedido' => $movimiento->pedido->numero_pedido,
                    ] : null,
                    'observacion' => $movimiento->observacion,
                    'fecha' => $movimiento->created_at->format('d/m/Y H:i'),
                ]),
            'productos' => Producto::orderBy('nombre')
                ->get(['id', 'nombre', 'codigo', 'activo']),
            'tiposMovimiento' => [
                ['value' => 'entrada', 'label' => 'Entrada'],
                ['value' => 'salida', 'label' => 'Salida'],
                ['value' => 'ajuste', 'label' => 'Ajuste'],
                ['value' => 'venta', 'label' => 'Venta']
            ],
        ]);
    }

    /**
     * Obtener movimientos en formato JSON para API
     */
    private function getMovimientosJson($query)
    {
        try {
            $movimientos = $query->orderBy('created_at', 'desc')
                ->limit(50) // Limitamos a los 50 más recientes
                ->get()
                ->map(function ($movimiento) {
                    return [
                        'id' => $movimiento->id,
                        'producto' => [
                            'id' => $movimiento->producto->id,
                            'nombre' => $movimiento->producto->nombre,
                            'codigo' => $movimiento->producto->codigo,
                        ],
                        'cantidad' => $movimiento->cantidad,
                        'tipo_movimiento' => $movimiento->tipo_movimiento,
                        'user' => $movimiento->user ? [
                            'id' => $movimiento->user->id,
                            'name' => $movimiento->user->name,
                        ] : null,
                        'observacion' => $movimiento->observacion,
                        'created_at' => $movimiento->created_at->toDateTimeString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $movimientos,
                'message' => 'Movimientos de inventario obtenidos con éxito'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener movimientos de inventario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los movimientos de inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|numeric|not_in:0',
            'tipo_movimiento' => 'required|in:entrada,salida,ajuste',
            'precio_unitario' => 'nullable|numeric|min:0',
            'observacion' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            $producto = Producto::findOrFail($validated['producto_id']);
            
            // Obtener o crear el registro de stock para el producto
            $stock = $producto->stock;
            if (!$stock) {
                $stock = $producto->stock()->create(['cantidad' => 0]);
            }
            
            // Si stock es un entero (posiblemente porque stock_actual ya se asignó a stock),
            // crear un nuevo registro de inventario
            if (is_int($stock)) {
                Log::warning('Stock es un entero en lugar de un objeto para el producto ID: ' . $producto->id . '. Creando nuevo registro de inventario.');
                $stock = $producto->stock()->create(['cantidad' => $stock]);
            }
            
            // Determinar la cantidad a ajustar en el stock
            $cantidadAjuste = $validated['cantidad'];
            if ($validated['tipo_movimiento'] === 'salida' && $cantidadAjuste > 0) {
                $cantidadAjuste = -1 * abs($cantidadAjuste);
            } elseif ($validated['tipo_movimiento'] === 'entrada' && $cantidadAjuste < 0) {
                $cantidadAjuste = abs($cantidadAjuste);
            }
            
            // Verificar si hay suficiente stock para la salida
            $cantidadActual = is_object($stock) ? $stock->cantidad : 0;
            if ($validated['tipo_movimiento'] === 'salida' && ($cantidadActual + $cantidadAjuste) < 0) {
                throw new \Exception('No hay suficiente stock para realizar esta operación');
            }
            
            // Actualizar el stock
            if (is_object($stock)) {
                $stock->update(['cantidad' => $cantidadActual + $cantidadAjuste]);
            } else {
                // Si por alguna razón stock sigue sin ser un objeto, crear uno nuevo
                $stock = $producto->stock()->create(['cantidad' => $cantidadAjuste]);
            }
            
            // Registrar el movimiento
            MovimientoInventario::create([
                'producto_id' => $validated['producto_id'],
                'cantidad' => abs($validated['cantidad']),
                'tipo_movimiento' => $validated['tipo_movimiento'],
                'precio_unitario' => $validated['precio_unitario'],
                'user_id' => auth()->id(),
                'observacion' => $validated['observacion'],
            ]);
            
            DB::commit();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Movimiento de inventario registrado con éxito'
                ]);
            }
            
            return redirect()->back()->with('success', 'Movimiento de inventario registrado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al registrar el movimiento: ' . $e->getMessage()
                ], 422);
            }
            
            return redirect()->back()->with('error', 'Error al registrar el movimiento: ' . $e->getMessage());
        }
    }

    /**
     * Realizar un ajuste de inventario
     */
    public function ajuste(Request $request)
    {
        $validated = $request->validate([
            'productos' => 'required|array|min:1',
            'productos.*.id' => 'required|exists:productos,id',
            'productos.*.cantidad_actual' => 'required|numeric|min:0',
            'productos.*.cantidad_real' => 'required|numeric|min:0',
            'observacion' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['productos'] as $item) {
                $producto = Producto::findOrFail($item['id']);
                $cantidadActual = $item['cantidad_actual'];
                $cantidadReal = $item['cantidad_real'];
                
                // Solo procesar si hay diferencia
                if ($cantidadActual != $cantidadReal) {
                    $diferencia = $cantidadReal - $cantidadActual;
                    $tipoMovimiento = $diferencia > 0 ? 'entrada' : 'salida';
                    
                    // Obtener o crear el registro de stock para el producto
                    $stock = $producto->stock;
                    
                    // Si stock es un entero (posiblemente porque stock_actual ya se asignó a stock),
                    // crear un nuevo registro de inventario
                    if (is_int($stock)) {
                        Log::warning('Stock es un entero en lugar de un objeto para el producto ID: ' . $producto->id . '. Creando nuevo registro de inventario.');
                        $stock = $producto->stock()->create(['cantidad' => $stock]);
                    }
                    
                    if (!$stock || !is_object($stock)) {
                        $stock = $producto->stock()->create(['cantidad' => 0]);
                    }
                    
                    // Actualizar el stock
                    $stock->update(['cantidad' => $cantidadReal]);
                    
                    // Registrar el movimiento
                    MovimientoInventario::create([
                        'producto_id' => $producto->id,
                        'cantidad' => abs($diferencia),
                        'tipo_movimiento' => 'ajuste',
                        'precio_unitario' => $producto->costo,
                        'user_id' => auth()->id(),
                        'observacion' => $validated['observacion'] . " (Ajuste de " . $cantidadActual . " a " . $cantidadReal . ")",
                    ]);
                }
            }
            
            DB::commit();
            return redirect()->back()->with('success', 'Ajuste de inventario realizado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al realizar el ajuste: ' . $e->getMessage());
        }
    }

    /**
     * Mostrar formulario para realizar inventario físico
     */
    public function inventarioFisico()
    {
        $productos = Producto::with('stock')
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                // Usar el accessor getStockActualAttribute para obtener el stock
                $stock_actual = $producto->stock_actual;
                
                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'codigo' => $producto->codigo,
                    'cantidad_actual' => $stock_actual,
                    'cantidad_real' => $stock_actual, // Inicialmente igual al stock actual
                ];
            });

        return Inertia::render('inventario/inventario-fisico', [
            'productos' => $productos,
        ]);
    }

    /**
     * Generar reporte de movimientos de inventario
     */
    public function reporte(Request $request)
    {
        $query = MovimientoInventario::query()
            ->with(['producto:id,nombre,codigo', 'usuario:id,name', 'pedido:id,numero_pedido']);

        // Aplicar filtros
        if ($request->filled('producto_id')) {
            $query->where('producto_id', $request->input('producto_id'));
        }

        if ($request->filled('tipo_movimiento')) {
            $query->where('tipo_movimiento', $request->input('tipo_movimiento'));
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->input('fecha_hasta'));
        }

        // Agrupar por producto si se solicita
        if ($request->boolean('agrupar_por_producto')) {
            $reporte = $query->select(
                'producto_id',
                DB::raw('SUM(CASE WHEN tipo_movimiento = "entrada" THEN cantidad ELSE 0 END) as total_entradas'),
                DB::raw('SUM(CASE WHEN tipo_movimiento = "salida" THEN cantidad ELSE 0 END) as total_salidas'),
                DB::raw('SUM(CASE WHEN tipo_movimiento = "ajuste" AND cantidad > 0 THEN cantidad ELSE 0 END) as total_ajustes_positivos'),
                DB::raw('SUM(CASE WHEN tipo_movimiento = "ajuste" AND cantidad < 0 THEN cantidad ELSE 0 END) as total_ajustes_negativos')
            )
            ->groupBy('producto_id')
            ->get()
            ->map(function ($item) {
                $producto = Producto::find($item->producto_id);
                return [
                    'producto' => [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'codigo' => $producto->codigo,
                    ],
                    'total_entradas' => $item->total_entradas,
                    'total_salidas' => $item->total_salidas,
                    'total_ajustes_positivos' => $item->total_ajustes_positivos,
                    'total_ajustes_negativos' => $item->total_ajustes_negativos,
                    'balance' => $item->total_entradas - $item->total_salidas + $item->total_ajustes_positivos + $item->total_ajustes_negativos,
                ];
            });
        } else {
            // Detalle de movimientos
            $reporte = $query->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($movimiento) {
                    return [
                        'id' => $movimiento->id,
                        'producto' => [
                            'id' => $movimiento->producto->id,
                            'nombre' => $movimiento->producto->nombre,
                            'codigo' => $movimiento->producto->codigo,
                        ],
                        'cantidad' => $movimiento->cantidad,
                        'tipo_movimiento' => $movimiento->tipo_movimiento,
                        'precio_unitario' => $movimiento->precio_unitario,
                        'usuario' => $movimiento->usuario ? [
                            'id' => $movimiento->usuario->id,
                            'name' => $movimiento->usuario->name,
                        ] : null,
                        'pedido' => $movimiento->pedido ? [
                            'id' => $movimiento->pedido->id,
                            'numero_pedido' => $movimiento->pedido->numero_pedido,
                        ] : null,
                        'observacion' => $movimiento->observacion,
                        'fecha' => $movimiento->created_at->format('d/m/Y H:i'),
                    ];
                });
        }

        return Inertia::render('inventario/reporte-movimientos', [
            'reporte' => $reporte,
            'filtros' => [
                'producto_id' => $request->input('producto_id'),
                'tipo_movimiento' => $request->input('tipo_movimiento'),
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
                'agrupar_por_producto' => $request->boolean('agrupar_por_producto'),
            ],
            'productos' => Producto::orderBy('nombre')
                ->get(['id', 'nombre', 'codigo', 'activo']),
            'tiposMovimiento' => [
                ['value' => 'entrada', 'label' => 'Entrada'],
                ['value' => 'salida', 'label' => 'Salida'],
                ['value' => 'ajuste', 'label' => 'Ajuste'],
                ['value' => 'venta', 'label' => 'Venta']
            ],
        ]);
    }
}
