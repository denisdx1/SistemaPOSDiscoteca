<?php

namespace App\Http\Controllers;

use App\Models\Orden;
use App\Models\Mesa;
use App\Models\HistorialOrden;
use App\Models\Producto;
use App\Models\DetallePedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use App\Events\OrdenStatusUpdated;

class OrdenController extends Controller
{
    /**
     * Display a listing of the orders.
     */
    public function index()
    {
        return Inertia::render('ordenes/index');
    }

    /**
     * Show the form for creating a new order.
     */
    public function create(Mesa $mesa = null)
    {
        // Si se proporciona una mesa, verificar que esté disponible
        if ($mesa && !$mesa->puedeRecibirOrdenes()) {
            return redirect()->back()->with('error', 'La mesa seleccionada no está disponible para nuevas órdenes');
        }

        // Cargar todas las mesas activas
        $mesas = Mesa::where('activa', true)->get();
        
        // Cargar todas las categorías activas
        $categorias = \App\Models\Categoria::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'color']);
        
        // Cargar todos los productos activos con sus categorías y asegurar que el stock esté cargado
        $productos = \App\Models\Producto::with(['categoria', 'stock', 'componentesCombo.producto.stock'])
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->map(function($producto) {
                // Determinar stock_actual basado en si es combo o producto normal
                if ($producto->es_combo) {
                    $stockActual = $producto->combo_disponible ? 1 : 0;
                } else {
                    // Obtener el stock actual de forma segura para productos normales
                    if (is_object($producto->stock)) {
                        $stockActual = $producto->stock->cantidad;
                    } else if (is_numeric($producto->stock)) {
                        $stockActual = $producto->stock;
                    } else {
                        $stockActual = 0;
                    }
                }
                
                // Asignar stock_actual y stock para mantener compatibilidad
                $producto->stock_actual = $stockActual;
                $producto->stock = $stockActual;
                
                // Asegurar que el precio sea un número
                $producto->precio = (float) $producto->precio;
                
                return $producto;
            });

        return Inertia::render('ordenes/nueva', [
            'mesas' => $mesas,
            'mesaId' => $mesa?->id,
            'mesa' => $mesa,
            'categorias' => $categorias,
            'productos' => $productos
        ]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        Log::info('Datos recibidos para crear orden:', $request->all());

        $validated = $request->validate([
            'mesa_id' => 'nullable|exists:mesas,id',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.notas' => 'nullable|string',
            'items.*.es_complemento_gratuito' => 'nullable|boolean',
            'items.*.complemento_de' => 'nullable|numeric|exists:productos,id',
            'notas' => 'nullable|string',
            'descuento' => 'nullable|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            // Si hay mesa_id, verificar que esté disponible
            if ($validated['mesa_id']) {
                $mesa = Mesa::findOrFail($validated['mesa_id']);
                if ($mesa->estado !== 'disponible') {
                    throw new \Exception('La mesa seleccionada no está disponible');
                }
            }

            $subtotal = collect($validated['items'])->sum(function($item) {
                // Si es un complemento gratuito, no suma al subtotal
                if (isset($item['es_complemento_gratuito']) && $item['es_complemento_gratuito']) {
                    return 0;
                }
                return $item['cantidad'] * $item['precio_unitario'];
            });

            $descuento = 0; // No aplicar descuento
            $impuestos = 0; // No aplicar impuestos
            $total = $subtotal; // Total igual al subtotal

            // Crear la orden
            $orden = Orden::create([
                'numero_orden' => 'ORD-' . now()->format('Ymd-His'),
                'mesa_id' => $validated['mesa_id'],
                'user_id' => Auth::id(),
                'estado' => 'pendiente',
                'subtotal' => $subtotal,
                'impuestos' => $impuestos,
                'descuento' => $descuento,
                'total' => $total,
                'notas' => $validated['notas'],
                'pagado' => false,
            ]);

            // Crear los detalles de la orden
            foreach ($validated['items'] as $item) {
                // Verificar si es un complemento gratuito
                $esComplementoGratuito = isset($item['es_complemento_gratuito']) && $item['es_complemento_gratuito'];
                $complementoDe = $esComplementoGratuito && isset($item['complemento_de']) ? $item['complemento_de'] : null;
                
                // Crear el detalle de la orden
                $orden->productos()->attach($item['producto_id'], [
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $item['cantidad'] * $item['precio_unitario'],
                    'notas' => $item['notas'] ?? null,
                    'es_complemento_gratuito' => $esComplementoGratuito,
                    'complemento_de' => $complementoDe
                ]);
                
                // Registrar en el log el detalle creado
                Log::info('Detalle de orden creado:', [
                    'orden_id' => $orden->id,
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'es_complemento_gratuito' => $esComplementoGratuito ? 'sí' : 'no',
                    'complemento_de' => $complementoDe
                ]);
            }

            // Si hay mesa seleccionada, marcarla como ocupada
            if ($validated['mesa_id']) {
                $mesa->marcarComoOcupada();
            }

            // Registrar en el historial
            HistorialOrden::create([
                'orden_id' => $orden->id,
                'user_id' => Auth::id(),
                'tipo_accion' => 'creacion',
                'detalles' => 'Orden creada' . ($validated['mesa_id'] ? ' para mesa #' . $mesa->numero : ''),
                'fecha_accion' => now(),
            ]);

            DB::commit();

            // Emitir evento de actualización con la orden recién creada
            $ordenConRelaciones = $orden->fresh(['mesa', 'user', 'productos.categoria']);
            event(new OrdenStatusUpdated($ordenConRelaciones));

            return response()->json([
                'success' => true,
                'message' => 'Orden creada con éxito',
                'orden' => $orden->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear la orden:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la orden: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified order.
     */
    public function show(Orden $orden)
    {
        $orden->load(['mesa', 'user', 'productos.categoria']);
        return Inertia::render('ordenes/detalle', ['orden' => $orden]);
    }

    /**
     * Update the specified order status.
     */
    public function updateStatus(Request $request, Orden $orden)
    {
        $validated = $request->validate([
            'estado' => 'required|in:pendiente,en_proceso,lista,entregada,cancelada',
        ]);

        try {
            DB::beginTransaction();

            $orden->update(['estado' => $validated['estado']]);

            // Registrar cambio en el historial
            HistorialOrden::create([
                'orden_id' => $orden->id,
                'user_id' => Auth::id(),
                'tipo_accion' => 'actualizacion',
                'detalles' => 'Estado actualizado a: ' . $validated['estado'],
                'fecha_accion' => now(),
            ]);

            // Desocupar la mesa solo cuando:
            // 1. La orden se cancela
            // 2. La orden se marca como entregada Y está pagada
            if ($orden->mesa_id) {
                if ($validated['estado'] === 'cancelada') {
                    $orden->mesa->marcarComoDisponible();
                    Log::info("Mesa liberada por cancelación de orden: {$orden->id}");
                } elseif ($validated['estado'] === 'entregada' && $orden->pagado) {
                    // Solo se libera la mesa cuando se completa todo el ciclo
                    $orden->mesa->marcarComoDisponible();
                    Log::info("Mesa liberada por entrega de orden pagada: {$orden->id}");
                }
            }

            DB::commit();
            
            // Emitir evento con todas las relaciones cargadas
            $ordenConRelaciones = $orden->fresh(['mesa', 'user', 'productos.categoria']);
            
            // Logs para debugging
            Log::info('Emitiendo evento OrdenStatusUpdated', [
                'orden_id' => $ordenConRelaciones->id,
                'estado' => $ordenConRelaciones->estado,
                'productos_count' => $ordenConRelaciones->productos->count(),
                'has_tragos' => $ordenConRelaciones->productos->contains('categoria_id', 1)
            ]);
            
            // Emitir el evento
            event(new OrdenStatusUpdated($ordenConRelaciones));
            
            Log::info('Evento OrdenStatusUpdated emitido correctamente');

            // Si la solicitud espera una respuesta Inertia, redirigir a la página de historial con mensaje de éxito
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Estado de la orden actualizado con éxito'
                ]);
            }

            return redirect()->back()->with('success', 'Estado de la orden actualizado con éxito');

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al actualizar el estado: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->with('error', 'Error al actualizar el estado: ' . $e->getMessage());
        }
    }

    /**
     * Marcar una orden como pagada.
     */
    public function markAsPaid(Orden $orden)
    {
        try {
            DB::beginTransaction();
            
            // Verificar estado actual con más detalles
            Log::info('Marcando orden como pagada (ANTES):', [
                'orden_id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado_actual' => $orden->estado,
                'pagado_actual' => $orden->pagado ? 'SI' : 'NO',
                'tipo_pagado' => gettype($orden->pagado), 
                'valor_raw' => var_export($orden->pagado, true)
            ]);
            
            // Marcar como pagada explícitamente (forzar el valor booleano)
            $orden->pagado = true;
            $orden->save();
            
            // Verificar que se haya guardado correctamente
            $orden = $orden->fresh();
            Log::info('Estado después de guardar:', [
                'pagado' => $orden->pagado ? 'SI' : 'NO',
                'tipo_pagado' => gettype($orden->pagado),
                'valor_raw' => var_export($orden->pagado, true)
            ]);
            
            // Registrar en el historial
            HistorialOrden::create([
                'orden_id' => $orden->id,
                'user_id' => Auth::id(),
                'tipo_accion' => 'pago',
                'detalles' => 'Orden marcada como pagada',
                'fecha_accion' => now(),
            ]);
            
            DB::commit();
            
            // Cargar todas las relaciones necesarias
            $ordenConRelaciones = $orden->fresh(['mesa', 'user', 'productos.categoria']);
            
            // Asegurar que todos los productos tengan su categoría
            foreach ($ordenConRelaciones->productos as $producto) {
                if (!$producto->categoria) {
                    $producto->load('categoria');
                }
            }
            
            // Asegurar explícitamente que la orden está marcada como pagada
            $ordenConRelaciones->pagado = true;
            
            // Logs para debugging con más detalles
            Log::info('Emitiendo evento OrdenStatusUpdated después de marcar como pagada', [
                'orden_id' => $ordenConRelaciones->id,
                'numero_orden' => $ordenConRelaciones->numero_orden,
                'pagado' => $ordenConRelaciones->pagado ? 'SI' : 'NO',
                'tipo_pagado' => gettype($ordenConRelaciones->pagado),
                'valor_raw' => var_export($ordenConRelaciones->pagado, true),
                'estado' => $ordenConRelaciones->estado,
                'productos_count' => $ordenConRelaciones->productos->count()
            ]);
            
            // Forzar que el campo pagado sea booleano true para el evento
            $ordenConRelaciones->pagado = true;
            
            // Emitir el evento con la orden actualizada
            event(new OrdenStatusUpdated($ordenConRelaciones));
            
            // Verificar qué se está enviando en la respuesta
            Log::info('Datos de orden en la respuesta JSON:', [
                'pagado' => $ordenConRelaciones->pagado ? 'SI' : 'NO',
                'tipo_pagado' => gettype($ordenConRelaciones->pagado),
                'valor_raw' => var_export($ordenConRelaciones->pagado, true)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Orden marcada como pagada con éxito',
                'orden' => $ordenConRelaciones // Incluir la orden actualizada en la respuesta
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error al marcar orden como pagada:', [
                'orden_id' => $orden->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar la orden como pagada: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order history.
     */
    public function history()
    {
        // Primero paginar, luego transformar los resultados
        $ordenesPaginadas = Orden::with(['mesa', 'user', 'productos.categoria'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        // Modificar los datos sin afectar la estructura de paginación
        $ordenesModificadas = $ordenesPaginadas->through(function ($orden) {
            // Eliminar impuestos y descuentos del historial
            $orden->total = $orden->subtotal; // Reemplazar total con subtotal
            // No incluir impuestos y descuentos en la vista
            return $orden;
        });

        return Inertia::render('ordenes/historial', [
            'ordenes' => $ordenesModificadas
        ]);
    }

    /**
     * Get order history as JSON for AJAX requests.
     */
    public function historyData()
    {
        // Primero paginar, luego transformar los resultados
        $ordenesPaginadas = Orden::with(['mesa', 'user', 'productos.categoria'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
            
        // Modificar los datos sin afectar la estructura de paginación
        $ordenesModificadas = $ordenesPaginadas->through(function ($orden) {
            // Eliminar impuestos y descuentos del historial
            $orden->total = $orden->subtotal; // Reemplazar total con subtotal
            // No incluir impuestos y descuentos en la vista
            return $orden;
        });

        return response()->json([
            'success' => true,
            'ordenes' => $ordenesModificadas
        ]);
    }

    /**
     * Remove the specified order from storage.
     */
    public function destroy(Orden $orden)
    {
        try {
            DB::beginTransaction();
            
            // Verificar si la orden existe y está cancelada
            if (!$orden || $orden->estado !== 'cancelada') {
                Log::warning('Intento de eliminar una orden no cancelada:', ['orden_id' => $orden->id, 'estado' => $orden->estado]);
                return response()->json([
                    'success' => false,
                    'message' => 'Solo las órdenes canceladas pueden ser eliminadas'
                ], 403);
            }
            
            // Guardar referencia para el log
            $ordenNumero = $orden->numero_orden;
            $ordenId = $orden->id;
            $mesaInfo = $orden->mesa ? " para mesa #{$orden->mesa->numero}" : "";
            
            Log::info("Iniciando eliminación de orden {$ordenNumero} (ID: {$ordenId}){$mesaInfo}");
            
            // Verificar y registrar todas las relaciones para debugging
            $relacionesProductos = $orden->productos()->count();
            $relacionesHistorial = $orden->historial()->count();
            
            Log::info("Relaciones de la orden {$ordenId}:", [
                'productos' => $relacionesProductos,
                'historial' => $relacionesHistorial
            ]);
            
            // 1. Primero eliminar el historial de la orden
            try {
                Log::info("Eliminando registros de historial para la orden ID: {$ordenId}");
                $orden->historial()->delete();
                Log::info("Registros de historial eliminados correctamente");
            } catch (\Exception $e) {
                Log::error("Error al eliminar historial de la orden:", ['error' => $e->getMessage()]);
                throw new \Exception("No se pudo eliminar el historial de la orden: " . $e->getMessage());
            }
            
            // 2. Eliminar las relaciones con productos
            try {
                Log::info("Eliminando relaciones con productos para la orden ID: {$ordenId}");
                $orden->productos()->detach();
                Log::info("Relaciones con productos eliminadas correctamente");
            } catch (\Exception $e) {
                Log::error("Error al eliminar relaciones con productos:", ['error' => $e->getMessage()]);
                throw new \Exception("No se pudo eliminar las relaciones con productos: " . $e->getMessage());
            }
            
            // 3. Verificar otras posibles relaciones (agregar según sea necesario)
            
            // 4. Finalmente eliminar la orden
            try {
                Log::info("Eliminando la orden ID: {$ordenId}");
                $resultado = $orden->delete();
                
                if (!$resultado) {
                    throw new \Exception("La operación de eliminación falló sin un error específico");
                }
                
                Log::info("Orden eliminada correctamente, resultado: " . ($resultado ? 'true' : 'false'));
            } catch (\Exception $e) {
                Log::error("Error al eliminar la orden:", ['error' => $e->getMessage()]);
                throw new \Exception("No se pudo eliminar la orden: " . $e->getMessage());
            }
            
            // Registrar en logs
            Log::info("Orden {$ordenNumero}{$mesaInfo} (ID: {$ordenId}) eliminada permanentemente");
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Orden eliminada correctamente'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar la orden:', [
                'orden_id' => $orden->id ?? 'desconocido',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la orden: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar la página de gestión de órdenes activas.
     */
    public function gestion()
    {
        // Obtener órdenes activas, sin filtrar por pagado
        $ordenes = Orden::with(['mesa', 'user', 'productos.categoria'])
            ->whereIn('estado', ['pendiente', 'en_proceso', 'lista'])
            ->orderByRaw("CASE 
                WHEN estado = 'lista' THEN 1
                WHEN estado = 'en_proceso' THEN 2
                WHEN estado = 'pendiente' THEN 3
                ELSE 4
            END")
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Transformar la colección para incluir los items directamente
        $ordenes->transform(function ($orden) {
            // Filtrar productos según el rol del usuario
            $productos = $orden->productos;
            
            // Si el usuario es bartender, solo mostrar productos de la categoría Tragos
            if (auth()->user()->role === 'bartender') {
                // Filtrar productos de categoría Tragos
                $productosTragos = $productos->filter(function ($producto) {
                    return $producto->categoria && $producto->categoria->nombre === 'Tragos';
                });
                
                Log::info('Filtrado de productos para bartender', [
                    'orden_id' => $orden->id,
                    'total_productos' => $productos->count(),
                    'productos_tragos' => $productosTragos->count()
                ]);
            } else {
                // Para otros roles, usar todos los productos
                $productosTragos = $productos;
            }
            
            // Asegurar que los productos estén mapeados como ítems para mantener compatibilidad con el frontend
            $orden->items = $productosTragos->map(function ($producto) {
                return [
                    'producto' => [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'categoria' => [
                            'id' => $producto->categoria->id,
                            'nombre' => $producto->categoria->nombre,
                            'color' => $producto->categoria->color ?? '#000000'
                        ]
                    ],
                    'cantidad' => $producto->pivot->cantidad,
                    'precio_unitario' => $producto->pivot->precio_unitario,
                    'subtotal' => $producto->pivot->subtotal,
                    'notas' => $producto->pivot->notas
                ];
            });
            
            // Asegurar explícitamente que el campo pagado sea booleano
            $orden->pagado = (bool)$orden->pagado;
            
            return $orden;
        });
        
        Log::info('Órdenes procesadas para frontend', [
            'ordenes_count' => $ordenes->count()
        ]);
        
        return Inertia::render('ordenes/gestion', [
            'ordenes' => $ordenes
        ]);
    }

    /**
     * Obtener los datos de órdenes activas para AJAX.
     */
    public function gestionData()
    {
        // Obtener órdenes activas, sin filtrar por pagado
        $ordenes = Orden::with(['mesa', 'user', 'productos.categoria'])
            ->whereIn('estado', ['pendiente', 'en_proceso', 'lista'])
            ->orderByRaw("CASE 
                WHEN estado = 'lista' THEN 1
                WHEN estado = 'en_proceso' THEN 2
                WHEN estado = 'pendiente' THEN 3
                ELSE 4
            END")
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Para depuración
        Log::info('Obteniendo órdenes con productos para gestionData', [
            'total_ordenes' => $ordenes->count()
        ]);
        
        // Transformar la colección para incluir los items directamente
        $ordenes->transform(function ($orden) {
            // Cargar explícitamente la relación de categoría para cada producto
            foreach ($orden->productos as $producto) {
                if (!$producto->relationLoaded('categoria')) {
                    $producto->load('categoria');
                }
                
                // Verificar que cada producto tenga información de categoría
                if (!$producto->categoria) {
                    Log::warning('Producto sin categoría en orden', [
                        'orden_id' => $orden->id,
                        'producto_id' => $producto->id,
                        'producto_nombre' => $producto->nombre
                    ]);
                    
                    // Asignar una categoría por defecto para evitar errores
                    $producto->categoria_id = $producto->categoria_id ?? 1;
                    $producto->categoria = $producto->categoria ?? \App\Models\Categoria::find($producto->categoria_id);
                }
            }
            
            // Filtrar productos según el rol del usuario
            $productos = $orden->productos;
            
            // Si el usuario es bartender, solo mostrar productos de la categoría Tragos
            if (auth()->user()->role === 'bartender') {
                // Filtrar productos de categoría Tragos
                $productosTragos = $productos->filter(function ($producto) {
                    return $producto->categoria && $producto->categoria->nombre === 'Tragos';
                });
                
                Log::info('Filtrado de productos para bartender', [
                    'orden_id' => $orden->id,
                    'total_productos' => $productos->count(),
                    'productos_tragos' => $productosTragos->count()
                ]);
            } else {
                // Para otros roles, usar todos los productos
                $productosTragos = $productos;
            }
            
            // Asegurar que los productos estén mapeados como ítems para mantener compatibilidad con el frontend
            $orden->items = $productosTragos->map(function ($producto) {
                return [
                    'producto' => [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'categoria' => [
                            'id' => $producto->categoria->id,
                            'nombre' => $producto->categoria->nombre,
                            'color' => $producto->categoria->color ?? '#000000'
                        ]
                    ],
                    'cantidad' => $producto->pivot->cantidad,
                    'precio_unitario' => $producto->pivot->precio_unitario,
                    'subtotal' => $producto->pivot->subtotal,
                    'notas' => $producto->pivot->notas
                ];
            });
            
            // Asegurar explícitamente que el campo pagado sea booleano
            $orden->pagado = (bool)$orden->pagado;
            
            return $orden;
        });
        
        Log::info('Órdenes procesadas para frontend', [
            'ordenes_count' => $ordenes->count()
        ]);
        
        return response()->json([
            'success' => true,
            'ordenes' => $ordenes
        ]);
    }

    /*
    public function crearOrden(Request $request, $mesaId)
    {
        // Lógica para crear una nueva orden asociada a la mesa
        $mesa = Mesa::findOrFail($mesaId);
        $orden = new Orden();
        $orden->mesa_id = $mesa->id;
        $orden->estado = 'pendiente';
        $orden->save();

        return redirect()->route('ordenes.editar', $orden->id);
    }
        
    */
}
