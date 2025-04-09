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
        $mesaId = $request->input('mesa_id');
        $ordenId = $request->input('orden_id');
        $usuario = Auth::user();
        
        $userInfo = [
            'isCajero' => $usuario->hasRole('cajero'),
            'cajaAsignada' => null,
            'error' => null
        ];
        
        // Obtener todas las cajas abiertas
        $cajasAbiertas = Caja::with('usuario')
            ->where('estado', 'abierta')
            ->get()
            ->map(function ($caja) {
                return [
                    'id' => $caja->id,
                    'numero_caja' => $caja->numero_caja,
                    'usuario' => $caja->usuario ? $caja->usuario->name : 'Sin asignar'
                ];
            });
        
        // Si es cajero, buscar su caja asignada
        if ($userInfo['isCajero']) {
            $cajaAsignada = $usuario->cajaAsignada;
            
            if (!$cajaAsignada) {
                $userInfo['error'] = 'No tiene una caja asignada. Por favor contacte al administrador para que le asigne una caja.';
            } else {
                // Buscar si la caja asignada está abierta
                $cajaAbierta = Caja::where('id', $cajaAsignada->id)
                    ->where('estado', 'abierta')
                    ->first();
                
                if ($cajaAbierta) {
                    $userInfo['cajaAsignada'] = $cajaAbierta;
                    
                    // Filtramos las cajas abiertas para que solo muestre la asignada al cajero
                    $cajasAbiertas = $cajasAbiertas->filter(function($caja) use ($cajaAsignada) {
                        return $caja['id'] == $cajaAsignada->id;
                    })->values();
                } else {
                    $userInfo['error'] = "Su caja #{$cajaAsignada->numero_caja} está asignada pero no está abierta. Debe abrirla desde el módulo de cajas antes de poder cobrar.";
                }
            }
        }
        
        if ($mesaId) {
            $mesa = Mesa::findOrFail($mesaId);
            $ordenActiva = $mesa->obtenerOrdenActiva();
            
            if (!$ordenActiva) {
                return redirect()->route('facturacion.crear')->with('error', 'Esta mesa no tiene una orden activa');
            }
            
            // Cargar las relaciones para la orden
            $ordenActiva->load(['productos.categoria']);
            
            return Inertia::render('facturacion/crear', [
                'mesa' => $mesa,
                'orden' => $ordenActiva,
                'cajasAbiertas' => $cajasAbiertas,
                'userInfo' => $userInfo
            ]);
        } elseif ($ordenId) {
            $orden = Orden::with(['productos.categoria'])->findOrFail($ordenId);
            
            return Inertia::render('facturacion/crear', [
                'orden' => $orden,
                'cajasAbiertas' => $cajasAbiertas,
                'userInfo' => $userInfo
            ]);
        } else {
            return redirect()->route('mesas')->with('error', 'No se especificó una mesa o una orden');
        }
    }

    public function cobrar(Orden $orden, Request $request)
    {
        $validated = $request->validate([
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,otro,yape',
            'monto_recibido' => 'required|numeric|min:' . $orden->subtotal,
            'notas' => 'nullable|string',
            'caja_id' => 'required|exists:cajas,id',
            'propina' => 'nullable|numeric'
        ]);

        try {
            DB::beginTransaction();
            
            $usuario = Auth::user();
            $esCajero = $usuario->hasRole('cajero');
            
            // Si es un cajero, verificar que solo use su caja asignada
            if ($esCajero) {
                $cajaAsignada = $usuario->cajaAsignada;
                
                if (!$cajaAsignada || $cajaAsignada->id != $validated['caja_id']) {
                    throw new \Exception('Solo puede utilizar la caja que tiene asignada.');
                }
            }

            // Verificar que la caja seleccionada esté abierta
            $caja = Caja::where('id', $validated['caja_id'])
                ->where('estado', 'abierta')
                ->first();

            if (!$caja) {
                throw new \Exception('La caja seleccionada no está disponible o no está abierta.');
            }

            // Calcular monto total con propina
            $propina = isset($validated['propina']) ? $validated['propina'] : 0;
            $montoTotal = $orden->subtotal + $propina;
            
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
                                      ($orden->mesa_id ? " - Mesa #{$orden->mesa->numero}" : " - Sin mesa")
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
                                      ($orden->mesa_id ? " - Mesa #{$orden->mesa->numero}" : " - Sin mesa")
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
                'monto' => $montoTotal,
                'metodo_pago' => $validated['metodo_pago'],
                'concepto' => "Venta - Orden #{$orden->numero_orden}" . 
                            ($orden->mesa_id ? " - Mesa #{$orden->mesa->numero}" : " - Sin mesa") .
                            ($propina > 0 ? " - Propina: $" . number_format($propina, 2) : ""),
                'referencia' => $orden->numero_orden,
                'fecha_movimiento' => now(),
                'propina' => $propina
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
                'cambio' => $validated['monto_recibido'] - $montoTotal,
                'montoTotal' => $montoTotal,
                'propina' => $propina,
                'redirect' => $orden->mesa_id ? route('mesas') : route('ordenes.gestion'),
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
                'propina' => $movimientoCaja ? $movimientoCaja->propina : 0,
                'total' => $movimientoCaja ? $movimientoCaja->monto : $orden->subtotal, // Incluye propina si existe
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