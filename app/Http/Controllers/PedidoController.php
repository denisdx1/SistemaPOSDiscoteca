<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\DetallePedido;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PedidoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pedido::query()
            ->with('proveedor:id,nombre');

        // Búsqueda
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(numero_pedido) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(observaciones) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('proveedor', function ($query) use ($search) {
                      $query->whereRaw('LOWER(nombre) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        // Filtro por proveedor
        if ($request->filled('proveedor_id')) {
            $query->where('proveedor_id', $request->input('proveedor_id'));
        }

        // Filtro por fecha
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_pedido', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_pedido', '<=', $request->input('fecha_hasta'));
        }

        return Inertia::render('inventario/pedidos', [
            'pedidos' => $query->orderBy('fecha_pedido', 'desc')
                ->paginate(10)
                ->withQueryString()
                ->through(fn ($pedido) => [
                    'id' => $pedido->id,
                    'numero_pedido' => $pedido->numero_pedido,
                    'proveedor' => [
                        'id' => $pedido->proveedor->id,
                        'nombre' => $pedido->proveedor->nombre
                    ],
                    'estado' => $pedido->estado,
                    'fecha_pedido' => $pedido->fecha_pedido->format('d/m/Y'),
                    'fecha_esperada' => $pedido->fecha_esperada ? $pedido->fecha_esperada->format('d/m/Y') : null,
                    'fecha_recepcion' => $pedido->fecha_recepcion ? $pedido->fecha_recepcion->format('d/m/Y') : null,
                    'total' => $pedido->total,
                    'observaciones' => $pedido->observaciones,
                ]),
            'proveedores' => Proveedor::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'estados' => [
                ['value' => 'pendiente', 'label' => 'Pendiente'],
                ['value' => 'recibido', 'label' => 'Recibido'],
                ['value' => 'parcial', 'label' => 'Parcial'],
                ['value' => 'cancelado', 'label' => 'Cancelado'],
            ],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Pedido $pedido)
    {
        $pedido->load([
            'proveedor:id,nombre,ruc,telefono,email',
            'detalles.producto:id,nombre,codigo',
            'usuario:id,name',
        ]);

        return Inertia::render('inventario/detalle-pedido', [
            'pedido' => [
                'id' => $pedido->id,
                'numero_pedido' => $pedido->numero_pedido,
                'proveedor' => [
                    'id' => $pedido->proveedor->id,
                    'nombre' => $pedido->proveedor->nombre,
                    'ruc' => $pedido->proveedor->ruc,
                    'telefono' => $pedido->proveedor->telefono,
                    'email' => $pedido->proveedor->email,
                ],
                'usuario' => $pedido->usuario ? [
                    'id' => $pedido->usuario->id,
                    'name' => $pedido->usuario->name,
                ] : null,
                'estado' => $pedido->estado,
                'fecha_pedido' => $pedido->fecha_pedido->format('d/m/Y'),
                'fecha_esperada' => $pedido->fecha_esperada ? $pedido->fecha_esperada->format('d/m/Y') : null,
                'fecha_recepcion' => $pedido->fecha_recepcion ? $pedido->fecha_recepcion->format('d/m/Y') : null,
                'total' => $pedido->total,
                'observaciones' => $pedido->observaciones,
                'detalles' => $pedido->detalles->map(fn($detalle) => [
                    'id' => $detalle->id,
                    'producto' => [
                        'id' => $detalle->producto->id,
                        'nombre' => $detalle->producto->nombre,
                        'codigo' => $detalle->producto->codigo,
                    ],
                    'cantidad' => $detalle->cantidad,
                    'cantidad_recibida' => $detalle->cantidad_recibida,
                    'precio_unitario' => $detalle->precio_unitario,
                    'subtotal' => $detalle->subtotal,
                    'observaciones' => $detalle->observaciones,
                ]),
            ],
            'productos' => Producto::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo', 'precio', 'costo']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'proveedor_id' => 'required|exists:proveedores,id',
            'fecha_pedido' => 'required|date',
            'fecha_esperada' => 'nullable|date',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Generar número de pedido
            $numeroPedido = 'PED-' . date('Ymd') . '-' . Str::padLeft(Pedido::count() + 1, 4, '0');
            
            // Calcular el total del pedido
            $total = 0;
            foreach ($validated['detalles'] as $detalle) {
                $total += $detalle['precio_unitario'] * $detalle['cantidad'];
            }
            
            // Crear el pedido
            $pedido = Pedido::create([
                'numero_pedido' => $numeroPedido,
                'proveedor_id' => $validated['proveedor_id'],
                'user_id' => auth()->id(),
                'estado' => 'pendiente',
                'fecha_pedido' => $validated['fecha_pedido'],
                'fecha_esperada' => $validated['fecha_esperada'],
                'total' => $total,
                'observaciones' => $validated['observaciones'],
            ]);
            
            // Crear los detalles del pedido
            foreach ($validated['detalles'] as $detalle) {
                $subtotal = $detalle['precio_unitario'] * $detalle['cantidad'];
                $pedido->detalles()->create([
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'cantidad_recibida' => 0,
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal' => $subtotal,
                    'observaciones' => $detalle['observaciones'] ?? null,
                ]);
            }
            
            DB::commit();
            return redirect()->route('inventario.pedidos.show', $pedido->id)
                ->with('success', 'Pedido creado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al crear el pedido: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Pedido $pedido)
    {
        // Solo permite actualizar si el pedido está en estado pendiente
        if ($pedido->estado !== 'pendiente') {
            return redirect()->back()->with('error', 'Solo se pueden editar pedidos en estado pendiente');
        }

        $validated = $request->validate([
            'proveedor_id' => 'required|exists:proveedores,id',
            'fecha_pedido' => 'required|date',
            'fecha_esperada' => 'nullable|date',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.id' => 'nullable|exists:detalle_pedidos,id',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.observaciones' => 'nullable|string',
            'detalles_eliminados' => 'nullable|array',
            'detalles_eliminados.*' => 'exists:detalle_pedidos,id',
        ]);

        DB::beginTransaction();
        try {
            // Calcular el total del pedido
            $total = 0;
            foreach ($validated['detalles'] as $detalle) {
                $total += $detalle['precio_unitario'] * $detalle['cantidad'];
            }
            
            // Actualizar el pedido
            $pedido->update([
                'proveedor_id' => $validated['proveedor_id'],
                'fecha_pedido' => $validated['fecha_pedido'],
                'fecha_esperada' => $validated['fecha_esperada'],
                'total' => $total,
                'observaciones' => $validated['observaciones'],
            ]);
            
            // Eliminar detalles que ya no están
            if (!empty($validated['detalles_eliminados'])) {
                DetallePedido::whereIn('id', $validated['detalles_eliminados'])->delete();
            }
            
            // Actualizar o crear los detalles del pedido
            foreach ($validated['detalles'] as $detalle) {
                $subtotal = $detalle['precio_unitario'] * $detalle['cantidad'];
                
                if (isset($detalle['id'])) {
                    // Actualizar detalle existente
                    DetallePedido::find($detalle['id'])->update([
                        'producto_id' => $detalle['producto_id'],
                        'cantidad' => $detalle['cantidad'],
                        'precio_unitario' => $detalle['precio_unitario'],
                        'subtotal' => $subtotal,
                        'observaciones' => $detalle['observaciones'] ?? null,
                    ]);
                } else {
                    // Crear nuevo detalle
                    $pedido->detalles()->create([
                        'producto_id' => $detalle['producto_id'],
                        'cantidad' => $detalle['cantidad'],
                        'cantidad_recibida' => 0,
                        'precio_unitario' => $detalle['precio_unitario'],
                        'subtotal' => $subtotal,
                        'observaciones' => $detalle['observaciones'] ?? null,
                    ]);
                }
            }
            
            DB::commit();
            return redirect()->back()->with('success', 'Pedido actualizado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al actualizar el pedido: ' . $e->getMessage());
        }
    }

    /**
     * Recibir pedido completo o parcial
     */
    public function recibir(Request $request, Pedido $pedido)
    {
        // No se pueden recibir pedidos ya completados o cancelados
        if ($pedido->estado === 'recibido' || $pedido->estado === 'cancelado') {
            return redirect()->back()->with('error', 'El pedido ya ha sido recibido o cancelado');
        }

        $validated = $request->validate([
            'detalles' => 'required|array',
            'detalles.*.id' => 'required|exists:detalle_pedidos,id',
            'detalles.*.cantidad_recibida' => 'required|integer|min:0',
            'observaciones' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Actualizar cada detalle con la cantidad recibida
            $totalRecibido = true;
            $algoRecibido = false;
            
            foreach ($validated['detalles'] as $detalle) {
                $detalleObj = DetallePedido::find($detalle['id']);
                
                // Verificar que la cantidad recibida no exceda la cantidad del pedido
                if ($detalle['cantidad_recibida'] > $detalleObj->cantidad) {
                    throw new \Exception('La cantidad recibida no puede exceder la cantidad pedida');
                }
                
                // Verificar si este item fue recibido completamente
                if ($detalle['cantidad_recibida'] < $detalleObj->cantidad) {
                    $totalRecibido = false;
                }
                
                // Verificar si se recibió algo
                if ($detalle['cantidad_recibida'] > 0) {
                    $algoRecibido = true;
                    
                    // Calcular la cantidad a agregar al stock (nueva recepción - ya recibido antes)
                    $cantidadAAgregar = $detalle['cantidad_recibida'] - $detalleObj->cantidad_recibida;
                    
                    if ($cantidadAAgregar > 0) {
                        // Registrar el movimiento de entrada en el inventario
                        MovimientoInventario::create([
                            'producto_id' => $detalleObj->producto_id,
                            'cantidad' => $cantidadAAgregar,
                            'tipo_movimiento' => 'entrada',
                            'precio_unitario' => $detalleObj->precio_unitario,
                            'user_id' => auth()->id(),
                            'pedido_id' => $pedido->id,
                            'observacion' => 'Recepción de pedido #' . $pedido->numero_pedido,
                        ]);
                        
                        // Actualizar el stock del producto
                        $stock = $detalleObj->producto->stock;
                        if ($stock) {
                            $stock->update(['cantidad' => $stock->cantidad + $cantidadAAgregar]);
                        } else {
                            $detalleObj->producto->stock()->create(['cantidad' => $cantidadAAgregar]);
                        }
                    }
                }
                
                // Actualizar la cantidad recibida en el detalle
                $detalleObj->update(['cantidad_recibida' => $detalle['cantidad_recibida']]);
            }
            
            // Actualizar el estado del pedido
            if ($totalRecibido && $algoRecibido) {
                $estado = 'recibido';
                $fechaRecepcion = now();
            } elseif (!$totalRecibido && $algoRecibido) {
                $estado = 'parcial';
                $fechaRecepcion = now();
            } else {
                $estado = $pedido->estado; // Mantener el estado actual
                $fechaRecepcion = $pedido->fecha_recepcion;
            }
            
            $pedido->update([
                'estado' => $estado,
                'fecha_recepcion' => $fechaRecepcion,
                'observaciones' => $pedido->observaciones . "\n" . ($validated['observaciones'] ?? ''),
            ]);
            
            DB::commit();
            return redirect()->back()->with('success', 'Recepción de pedido procesada con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al procesar la recepción: ' . $e->getMessage());
        }
    }

    /**
     * Cancelar un pedido pendiente
     */
    public function cancelar(Pedido $pedido)
    {
        // Solo se pueden cancelar pedidos pendientes
        if ($pedido->estado !== 'pendiente') {
            return redirect()->back()->with('error', 'Solo se pueden cancelar pedidos en estado pendiente');
        }

        DB::beginTransaction();
        try {
            $pedido->update([
                'estado' => 'cancelado',
                'observaciones' => $pedido->observaciones . "\nPedido cancelado el " . now()->format('d/m/Y H:i'),
            ]);
            
            DB::commit();
            return redirect()->back()->with('success', 'Pedido cancelado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al cancelar el pedido: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pedido $pedido)
    {
        // Solo permitir eliminar pedidos pendientes o cancelados
        if (!in_array($pedido->estado, ['pendiente', 'cancelado'])) {
            return redirect()->back()->with('error', 'Solo se pueden eliminar pedidos pendientes o cancelados');
        }

        DB::beginTransaction();
        try {
            // Eliminar los detalles y el pedido
            $pedido->delete();
            
            DB::commit();
            return redirect()->route('inventario.pedidos.index')->with('success', 'Pedido eliminado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al eliminar el pedido: ' . $e->getMessage());
        }
    }
}
