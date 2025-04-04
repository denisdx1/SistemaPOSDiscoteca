<?php

namespace App\Http\Controllers;

use App\Models\Orden;
use App\Models\Mesa;
use App\Models\Caja;
use App\Models\HistorialCaja;
use App\Models\HistorialOrden;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FacturacionController extends Controller
{
    public function create(Request $request)
    {
        $mesa = null;
        $orden = null;

        if ($request->has('mesa')) {
            $mesa = Mesa::findOrFail($request->mesa);
            $orden = $mesa->obtenerOrdenActiva();
        }

        // Obtener todas las cajas abiertas
        $cajasAbiertas = Caja::where('estado', 'abierta')
            ->with('usuario')
            ->get()
            ->map(function($caja) {
                return [
                    'id' => $caja->id,
                    'numero_caja' => $caja->numero_caja,
                    'usuario' => $caja->usuario->name,
                    'monto_inicial' => $caja->monto_inicial,
                    'fecha_apertura' => $caja->fecha_apertura->format('Y-m-d H:i:s')
                ];
            });

        return Inertia::render('facturacion/crear', [
            'mesa' => $mesa,
            'orden' => $orden ? [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado' => $orden->estado,
                'subtotal' => $orden->subtotal,
                'total' => $orden->subtotal,
                'items' => $orden->productos->map(fn($producto) => [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'cantidad' => $producto->pivot->cantidad,
                    'precio_unitario' => $producto->pivot->precio_unitario,
                    'subtotal' => $producto->pivot->subtotal,
                    'notas' => $producto->pivot->notas,
                ])
            ] : null,
            'cajasAbiertas' => $cajasAbiertas
        ]);
    }

    public function cobrar(Orden $orden, Request $request)
    {
        $validated = $request->validate([
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,otro,yape',
            'monto_recibido' => 'required|numeric|min:' . $orden->subtotal,
            'notas' => 'nullable|string',
            'caja_id' => 'required|exists:cajas,id'
        ]);

        try {
            DB::beginTransaction();

            // Verificar que la caja seleccionada esté abierta
            $caja = Caja::where('id', $validated['caja_id'])
                ->where('estado', 'abierta')
                ->first();

            if (!$caja) {
                throw new \Exception('La caja seleccionada no está disponible o no está abierta.');
            }

            // 1. Marcar la orden como pagada y pendiente (para comenzar el proceso de preparación)
            $orden->update([
                'pagado' => true,
                'estado' => 'pendiente',
                'metodo_pago' => $validated['metodo_pago'],
                'notas' => $orden->notas . "\nPago recibido: " . $validated['monto_recibido'] . 
                          "\nMétodo de pago: " . $validated['metodo_pago'] .
                          ($validated['notas'] ? "\nNotas adicionales: " . $validated['notas'] : "")
            ]);

            // 2. Registrar movimientos de inventario para cada producto vendido
            foreach ($orden->productos as $producto) {
                // Verificar si el producto es un combo
                if ($producto->es_combo) {
                    // Procesar cada componente del combo
                    foreach ($producto->componentesCombo as $componente) {
                        $productoComponente = $componente->producto;
                        $cantidadTotal = $componente->cantidad * $producto->pivot->cantidad;
                        
                        // Registrar movimiento para cada componente
                        MovimientoInventario::create([
                            'producto_id' => $productoComponente->id,
                            'cantidad' => $cantidadTotal,
                            'tipo_movimiento' => 'venta',
                            'precio_unitario' => $productoComponente->precio,
                            'user_id' => Auth::id(),
                            'observacion' => "Componente de combo - Orden #{$orden->numero_orden} - Combo: {$producto->nombre}"
                        ]);
                        
                        // Actualizar el stock del componente
                        $stockComponente = $productoComponente->stock;
                        if ($stockComponente) {
                            $stockComponente->update([
                                'cantidad' => $stockComponente->cantidad - $cantidadTotal
                            ]);
                        }
                    }
                    
                    // Para el combo en sí, solo creamos un movimiento sin afectar stock físico
                    MovimientoInventario::create([
                        'producto_id' => $producto->id,
                        'cantidad' => $producto->pivot->cantidad,
                        'tipo_movimiento' => 'venta_combo',
                        'precio_unitario' => $producto->pivot->precio_unitario,
                        'user_id' => Auth::id(),
                        'observacion' => "Venta de combo - Orden #{$orden->numero_orden}" .
                                      ($orden->mesa_id ? " - Mesa #{$orden->mesa->numero}" : "")
                    ]);
                    
                } else {
                    // Producto normal (no combo)
                    MovimientoInventario::create([
                        'producto_id' => $producto->id,
                        'cantidad' => $producto->pivot->cantidad,
                        'tipo_movimiento' => 'venta',
                        'precio_unitario' => $producto->pivot->precio_unitario,
                        'user_id' => Auth::id(),
                        'observacion' => "Venta - Orden #{$orden->numero_orden}" .
                                      ($orden->mesa_id ? " - Mesa #{$orden->mesa->numero}" : "")
                    ]);

                    // Actualizar el stock del producto
                    $stock = $producto->stock;
                    if ($stock) {
                        $stock->update([
                            'cantidad' => $stock->cantidad - $producto->pivot->cantidad
                        ]);
                    }
                }
            }

            // 3. Registrar el movimiento en la caja
            HistorialCaja::create([
                'caja_id' => $caja->id,
                'user_id' => Auth::id(),
                'tipo_movimiento' => 'ingreso',
                'monto' => $orden->subtotal,
                'metodo_pago' => $validated['metodo_pago'],
                'concepto' => "Venta - Orden #{$orden->numero_orden}" . 
                            ($orden->mesa_id ? " - Mesa #{$orden->mesa->numero}" : ""),
                'referencia' => $orden->numero_orden,
                'fecha_movimiento' => now()
            ]);

            // 4. Registrar en el historial de la orden
            HistorialOrden::create([
                'orden_id' => $orden->id,
                'user_id' => Auth::id(),
                'tipo_accion' => 'pago',
                'detalles' => "Orden pagada y pendiente - Método: {$validated['metodo_pago']}",
                'fecha_accion' => now()
            ]);

            // 5. Si la orden tiene mesa asociada, liberarla
            if ($orden->mesa) {
                $orden->mesa->update(['estado' => 'disponible']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Orden cobrada con éxito',
                'cambio' => $validated['monto_recibido'] - $orden->subtotal,
                'redirect' => route('mesas'),
                'boleta_url' => route('facturacion.boleta', ['orden' => $orden->id])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el pago: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generar una boleta imprimible para la orden
     */
    public function generarBoleta(Orden $orden)
    {
        // Cargar relaciones necesarias
        $orden->load(['productos', 'mesa', 'user']);
        
        // Obtener el movimiento de caja asociado a esta orden
        $movimientoCaja = HistorialCaja::where('referencia', $orden->numero_orden)
            ->where('tipo_movimiento', 'ingreso')
            ->with('caja', 'usuario')
            ->orderBy('created_at', 'desc')
            ->first();
        
        // Datos para la vista de la boleta
        $datosBoleta = [
            'orden' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'fecha' => $orden->created_at->format('d/m/Y H:i:s'),
                'fecha_pago' => $orden->updated_at->format('d/m/Y H:i:s'),
                'estado' => $orden->estado,
                'pagado' => $orden->pagado,
                'metodo_pago' => $orden->metodo_pago,
                'subtotal' => $orden->subtotal,
                'total' => $orden->subtotal, // Usando subtotal como total (sin impuestos)
                'mesa' => $orden->mesa ? $orden->mesa->numero : 'N/A',
                'atendido_por' => $orden->user ? $orden->user->name : 'Sistema',
            ],
            'productos' => $orden->productos->map(function($producto) {
                return [
                    'nombre' => $producto->nombre,
                    'cantidad' => $producto->pivot->cantidad,
                    'precio_unitario' => $producto->pivot->precio_unitario,
                    'subtotal' => $producto->pivot->subtotal,
                    'notas' => $producto->pivot->notas,
                ];
            }),
            'caja' => $movimientoCaja ? [
                'numero' => $movimientoCaja->caja->numero_caja,
                'cajero' => $movimientoCaja->usuario->name,
                'monto_recibido' => $movimientoCaja->monto_recibido ?? $orden->subtotal,
                'cambio' => $movimientoCaja->cambio ?? 0,
            ] : null,
            'empresa' => [
                'nombre' => config('app.name', 'Discoteca POS'),
                'direccion' => 'Av. Siempre Viva 123',
                'telefono' => '(01) 123-4567',
                'email' => 'info@discotecapos.com',
                'web' => 'discotecapos.com',
            ]
        ];
        
        return Inertia::render('facturacion/boleta', $datosBoleta);
    }
}