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
use App\Events\TestEvent;

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
        
        // Cargar los bartenders disponibles (usuarios con rol bartender)
        $bartenders = \App\Models\User::whereHas('role', function($query) {
            $query->where('nombre', 'bartender');
        })->get(['id', 'name']);
        
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
            'productos' => $productos,
            'bartenders' => $bartenders
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Datos recibidos para crear orden:', $request->all());

        $validated = $request->validate([
            'mesa_id' => 'nullable|exists:mesas,id',
            'bartender_id' => 'nullable|exists:users,id',
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
            if (!empty($validated['mesa_id'])) {
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
                'mesa_id' => $validated['mesa_id'] ?? null,
                'user_id' => Auth::id(),
                'bartender_id' => $validated['bartender_id'] ?? null,
                'estado' => 'pendiente',
                'subtotal' => $subtotal,
                'impuestos' => $impuestos,
                'descuento' => $descuento,
                'total' => $total,
                'notas' => $validated['notas'] ?? '',
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
            if (!empty($validated['mesa_id'])) {
                $mesa->marcarComoOcupada();
            }

            // Registrar en el historial
            HistorialOrden::create([
                'orden_id' => $orden->id,
                'user_id' => Auth::id(),
                'tipo_accion' => 'creacion',
                'detalles' => 'Orden creada' . (!empty($validated['mesa_id']) ? ' para mesa #' . $mesa->numero : ' sin mesa asignada'),
                'fecha_accion' => now(),
            ]);

            DB::commit();

            // Emitir evento de actualización con la orden recién creada
            $ordenConRelaciones = $orden->fresh(['mesa', 'user', 'productos.categoria']);
            
            Log::info('Emitiendo eventos para nueva orden', [
                'orden_id' => $ordenConRelaciones->id,
                'numero_orden' => $ordenConRelaciones->numero_orden,
                'broadcast_driver' => env('BROADCAST_DRIVER')
            ]);
            
            try {
                // Emitir el evento OrdenStatusUpdated
                event(new OrdenStatusUpdated($ordenConRelaciones));
                
                // También emitir un TestEvent para asegurar que se vea en la herramienta de debug
                event(new TestEvent(
                    json_encode([
                        'id' => $ordenConRelaciones->id,
                        'numero_orden' => $ordenConRelaciones->numero_orden,
                        'estado' => $ordenConRelaciones->estado,
                        'pagado' => (bool)$ordenConRelaciones->pagado,
                        'total' => $ordenConRelaciones->total,
                        'timestamp' => now()->toIso8601String(),
                        'tipo' => 'nueva_orden'
                    ]),
                    'ordenes',
                    'test.nueva.orden'
                ));
                
                Log::info('Eventos emitidos correctamente para nueva orden', [
                    'eventos' => ['OrdenStatusUpdated', 'TestEvent'],
                    'orden_id' => $ordenConRelaciones->id
                ]);
            } catch (\Exception $e) {
                Log::error('Error al emitir eventos para nueva orden', [
                    'orden_id' => $ordenConRelaciones->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

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
            Log::info('Intentando marcar orden como pagada', [
                'orden_id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado_actual' => $orden->estado,
                'pagado_actual' => $orden->pagado ? 'Sí' : 'No'
            ]);
            
            $orden->pagado = true;
            $orden->save();
            
            Log::info('Orden marcada como pagada', [
                'orden_id' => $orden->id,
                'numero_orden' => $orden->numero_orden
            ]);
            
            // Forzar carga de relaciones para transmitir el evento con datos completos
            $orden->load(['productos.categoria']);
            
            try {
                Log::info('Intentando emitir evento OrdenStatusUpdated para orden pagada', [
                    'orden_id' => $orden->id,
                    'numero_orden' => $orden->numero_orden,
                    'broadcast_driver' => env('BROADCAST_DRIVER')
                ]);
                
                // Emitir el evento de actualización de orden
                event(new OrdenStatusUpdated($orden));
                
                // También emitir un evento de prueba con el mismo contenido
                event(new TestEvent(
                    json_encode([
                        'id' => $orden->id,
                        'numero_orden' => $orden->numero_orden,
                        'estado' => $orden->estado,
                        'pagado' => (bool)$orden->pagado,
                        'total' => $orden->total,
                        'timestamp' => now()->toIso8601String(),
                        'tipo' => 'orden_pagada'
                    ]),
                    'ordenes',
                    'test.orden.pagada'
                ));
                
                Log::info('Eventos emitidos correctamente para orden pagada', [
                    'eventos' => ['OrdenStatusUpdated', 'TestEvent'],
                    'orden_id' => $orden->id
                ]);
            } catch (\Exception $e) {
                Log::error('Error al emitir el evento de orden pagada', [
                    'orden_id' => $orden->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Orden marcada como pagada correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al marcar orden como pagada', [
                'orden_id' => $orden->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
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
        $ordenes = Orden::with(['mesa', 'user', 'bartender', 'productos.categoria'])
            ->whereIn('estado', ['pendiente', 'en_proceso', 'lista'])
            ->orderByRaw("CASE 
                WHEN estado = 'lista' THEN 1
                WHEN estado = 'en_proceso' THEN 2
                WHEN estado = 'pendiente' THEN 3
                ELSE 4
            END")
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Obtener bartenders disponibles para el filtro
        $bartenders = \App\Models\User::whereHas('role', function($query) {
            $query->where('nombre', 'bartender');
        })->get(['id', 'name']);
        
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
            'ordenes' => $ordenes,
            'bartenders' => $bartenders
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

    /**
     * Genera un número de orden único
     */
    private function generateNumeroOrden(): string
    {
        // Formato: ORD-YYYYMMDD-XXXX donde XXXX es un número secuencial
        $fecha = now()->format('Ymd');
        
        // Obtener el último número de orden para hoy
        $ultimaOrden = Orden::where('numero_orden', 'like', "ORD-{$fecha}-%")
            ->orderBy('id', 'desc')
            ->first();
        
        if ($ultimaOrden) {
            // Extraer el número secuencial y aumentarlo en 1
            $partes = explode('-', $ultimaOrden->numero_orden);
            $secuencial = (int)end($partes) + 1;
        } else {
            // Si no hay órdenes hoy, empezar desde 1
            $secuencial = 1;
        }
        
        // Formatear con ceros a la izquierda (4 dígitos)
        $secuencialFormateado = str_pad($secuencial, 4, '0', STR_PAD_LEFT);
        
        return "ORD-{$fecha}-{$secuencialFormateado}";
    }

    /**
     * Asignar o cambiar el bartender de una orden
     */
    public function assignBartender(Request $request, Orden $orden)
    {
        try {
            $validated = $request->validate([
                'bartender_id' => 'nullable|exists:users,id',
            ]);

            // Si bartender_id es null, simplemente quitar la asignación
            if ($validated['bartender_id'] === null) {
                Log::info('Quitando bartender asignado de la orden', [
                    'orden_id' => $orden->id,
                    'bartender_anterior' => $orden->bartender_id
                ]);

                // Actualizar la orden
                $orden->update([
                    'bartender_id' => null
                ]);

                // Registrar en el historial
                \App\Models\HistorialOrden::create([
                    'orden_id' => $orden->id,
                    'user_id' => auth()->id(),
                    'tipo_accion' => 'actualizacion',
                    'detalles' => 'Bartender desasignado',
                    'fecha_accion' => now(),
                ]);

                // Recargar relaciones
                $ordenActualizada = $orden->fresh(['mesa', 'user', 'bartender', 'productos.categoria']);

                return response()->json([
                    'success' => true,
                    'message' => 'Bartender removido correctamente',
                    'orden' => $ordenActualizada
                ]);
            }

            // Verificar que el usuario seleccionado sea un bartender
            $user = \App\Models\User::find($validated['bartender_id']);
            
            if (!$user) {
                Log::error('Usuario no encontrado', [
                    'bartender_id' => $validated['bartender_id']
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario seleccionado no existe',
                ], 422);
            }

            // Verificar si el usuario es un bartender
            $esBartender = false;
            
            // Primero verificamos si role es un string (columna en la tabla users)
            if (is_string($user->role)) {
                $esBartender = strtolower($user->role) === 'bartender';
                Log::info('Verificando rol (string)', [
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'esBartender' => $esBartender ? 'Sí' : 'No'
                ]);
            } 
            // Si no es string, verificamos si es un objeto con la relación role
            else if (is_object($user->role)) {
                $esBartender = $user->role->nombre === 'bartender';
                Log::info('Verificando rol (objeto)', [
                    'user_id' => $user->id,
                    'role_nombre' => $user->role->nombre ?? 'No disponible',
                    'esBartender' => $esBartender ? 'Sí' : 'No'
                ]);
            } 
            // Si no hay rol, verificamos el método hasRole si existe
            else if (method_exists($user, 'hasRole')) {
                $esBartender = $user->hasRole('bartender');
                Log::info('Verificando rol (método hasRole)', [
                    'user_id' => $user->id,
                    'esBartender' => $esBartender ? 'Sí' : 'No'
                ]);
            }
            
            // Para pruebas, permitimos cualquier usuario
            $esBartender = true;
            
            if (!$esBartender) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario seleccionado no es un bartender',
                ], 422);
            }

            Log::info('Asignando bartender a orden', [
                'orden_id' => $orden->id,
                'bartender_id' => $validated['bartender_id'],
                'bartender_name' => $user->name
            ]);

            // Actualizar la orden
            $orden->update([
                'bartender_id' => $validated['bartender_id']
            ]);

            // Registrar en el historial
            \App\Models\HistorialOrden::create([
                'orden_id' => $orden->id,
                'user_id' => auth()->id(),
                'tipo_accion' => 'actualizacion',
                'detalles' => 'Bartender asignado: ' . $user->name,
                'fecha_accion' => now(),
            ]);

            // Recargar relaciones
            $ordenActualizada = $orden->fresh(['mesa', 'user', 'bartender', 'productos.categoria']);

            // Emitir evento de actualización
            try {
                event(new \App\Events\OrdenStatusUpdated($ordenActualizada));
                event(new \App\Events\TestEvent(
                    json_encode([
                        'id' => $ordenActualizada->id,
                        'numero_orden' => $ordenActualizada->numero_orden,
                        'estado' => $ordenActualizada->estado,
                        'pagado' => (bool)$ordenActualizada->pagado,
                        'bartender_id' => $ordenActualizada->bartender_id,
                        'timestamp' => now()->toIso8601String(),
                        'tipo' => 'bartender_asignado'
                    ]),
                    'ordenes',
                    'test.orden.bartender'
                ));
                
                Log::info('Eventos emitidos para asignación de bartender', [
                    'orden_id' => $ordenActualizada->id,
                    'bartender_id' => $ordenActualizada->bartender_id
                ]);
            } catch (\Exception $e) {
                Log::error('Error al emitir eventos para asignación de bartender', [
                    'orden_id' => $ordenActualizada->id,
                    'error' => $e->getMessage()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Bartender asignado correctamente',
                'orden' => $ordenActualizada
            ]);
        } catch (\Exception $e) {
            Log::error('Error al asignar bartender', [
                'orden_id' => $orden->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al asignar bartender: ' . $e->getMessage()
            ], 500);
        }
    }
}
