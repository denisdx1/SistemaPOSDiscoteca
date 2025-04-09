<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\HistorialCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CajaController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Determinar qué cajas debe ver el usuario
        $numerosCajas = [];
        $cajaAsignadaInfo = null;
        
        if ($user->hasRole('administrador')) {
            // El administrador ve todas las cajas (1, 2 y 3)
            $numerosCajas = range(1, 3);
        } elseif ($user->hasRole('cajero') && $user->caja_asignada_id) {
            // El cajero solo ve su caja asignada
            $cajaAsignada = Caja::find($user->caja_asignada_id);
            if ($cajaAsignada) {
                $numerosCajas = [$cajaAsignada->numero_caja];
                $cajaAsignadaInfo = [
                    'id' => $cajaAsignada->id,
                    'numero_caja' => $cajaAsignada->numero_caja
                ];
            }
        } elseif ($user->hasRole('cajero')) {
            // Si el cajero no tiene caja asignada específica, aún puede ver todas (comportamiento anterior)
            $numerosCajas = range(1, 3);
        } else {
            // Otros roles no deberían acceder a esta página, pero por si acaso
            $numerosCajas = range(1, 3);
        }
        
        // Obtener estado de las cajas filtradas
        $cajas = collect($numerosCajas)->map(function($numeroCaja) {
            $caja = Caja::where('numero_caja', $numeroCaja)
                ->where('estado', 'abierta')
                ->first();
                
            return [
                'numero' => $numeroCaja,
                'estado' => $caja ? [
                    'id' => $caja->id,
                    'monto_inicial' => floatval($caja->monto_inicial),
                    'fecha_apertura' => $caja->fecha_apertura->format('Y-m-d H:i:s'),
                    'usuario' => [
                        'id' => $caja->usuario->id,
                        'name' => $caja->usuario->name
                    ],
                    'movimientos' => $caja->movimientos()
                        ->orderBy('fecha_movimiento', 'desc')
                        ->get()
                        ->map(fn($movimiento) => [
                            'id' => $movimiento->id,
                            'tipo_movimiento' => $movimiento->tipo_movimiento,
                            'monto' => floatval($movimiento->monto),
                            'metodo_pago' => $movimiento->metodo_pago,
                            'concepto' => $movimiento->concepto,
                            'fecha_movimiento' => $movimiento->fecha_movimiento->format('Y-m-d H:i:s'),
                        ])
                ] : null
            ];
        });

        // Establecer el valor inicial de cajaActual para la vista
        $cajaActualInicial = 1;
        if ($user->hasRole('cajero') && $cajaAsignadaInfo) {
            $cajaActualInicial = $cajaAsignadaInfo['numero_caja'];
        }

        return Inertia::render('caja/operaciones', [
            'cajas' => $cajas,
            'isAdmin' => $user->hasRole('administrador'),
            'cajaAsignada' => $cajaAsignadaInfo,
            'cajaActualInicial' => $cajaActualInicial,
            'userRole' => $user->hasRole('cajero') ? 'cajero' : ($user->hasRole('administrador') ? 'administrador' : $user->role)
        ]);
    }

    public function abrirCaja(Request $request)
    {
        $validated = $request->validate([
            'numero_caja' => 'required|integer|min:1|max:3',
            'monto_inicial' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string'
        ]);

        $user = Auth::user();
        
        // Verificar si el usuario tiene permiso para abrir esta caja
        if ($user->hasRole('cajero') && $user->caja_asignada_id) {
            $cajaAsignada = Caja::find($user->caja_asignada_id);
            if ($cajaAsignada && $cajaAsignada->numero_caja != $validated['numero_caja']) {
                return response()->json([
                    'success' => false,
                    'message' => "No tienes permiso para abrir la caja #{$validated['numero_caja']}. Solo puedes operar la caja #{$cajaAsignada->numero_caja}."
                ], 403);
            }
        }

        // Verificar si la caja específica ya está abierta
        $cajaAbierta = Caja::cajaAbiertaPorNumero($validated['numero_caja']);

        if ($cajaAbierta) {
            return response()->json([
                'success' => false,
                'message' => "La caja #{$validated['numero_caja']} ya está abierta"
            ], 422);
        }

        try {
            DB::beginTransaction();

            $caja = Caja::create([
                'user_id' => Auth::id(),
                'numero_caja' => $validated['numero_caja'],
                'monto_inicial' => $validated['monto_inicial'],
                'estado' => 'abierta',
                'observaciones' => $validated['observaciones'],
                'fecha_apertura' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Caja #{$validated['numero_caja']} abierta con éxito",
                'caja' => $caja
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al abrir la caja: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cerrarCaja(Request $request)
    {
        $validated = $request->validate([
            'caja_id' => 'required|exists:cajas,id',
            'monto_final' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string'
        ]);

        $caja = Caja::where('id', $validated['caja_id'])
            ->where('estado', 'abierta')
            ->firstOrFail();
            
        $user = Auth::user();
        
        // Verificar si el usuario tiene permiso para cerrar esta caja
        if ($user->hasRole('cajero') && $user->caja_asignada_id) {
            $cajaAsignada = Caja::find($user->caja_asignada_id);
            if ($cajaAsignada && $cajaAsignada->numero_caja != $caja->numero_caja) {
                return response()->json([
                    'success' => false,
                    'message' => "No tienes permiso para cerrar la caja #{$caja->numero_caja}. Solo puedes operar la caja #{$cajaAsignada->numero_caja}."
                ], 403);
            }
        }

        try {
            DB::beginTransaction();

            // Calcular la diferencia
            $totalIngresos = $caja->movimientos()
                ->where('tipo_movimiento', 'ingreso')
                ->sum('monto');
            
            $totalEgresos = $caja->movimientos()
                ->where('tipo_movimiento', 'egreso')
                ->sum('monto');

            $saldoEsperado = $caja->monto_inicial + $totalIngresos - $totalEgresos;
            $diferencia = $validated['monto_final'] - $saldoEsperado;

            $caja->update([
                'monto_final' => $validated['monto_final'],
                'diferencia' => $diferencia,
                'estado' => 'cerrada',
                'observaciones' => ($caja->observaciones ? $caja->observaciones . "\n" : '') . 
                                 "Cierre de caja: " . ($validated['observaciones'] ?? ''),
                'fecha_cierre' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Caja #{$caja->numero_caja} cerrada con éxito",
                'diferencia' => $diferencia
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar la caja: ' . $e->getMessage()
            ], 500);
        }
    }

    public function registrarMovimiento(Request $request)
    {
        $validated = $request->validate([
            'caja_id' => 'required|exists:cajas,id',
            'tipo_movimiento' => 'required|in:ingreso,egreso',
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,otro',
            'concepto' => 'required|string',
            'referencia' => 'nullable|string'
        ]);

        $caja = Caja::where('id', $validated['caja_id'])
            ->where('estado', 'abierta')
            ->firstOrFail();
            
        $user = Auth::user();
        
        // Verificar si el usuario tiene permiso para registrar movimientos en esta caja
        if ($user->hasRole('cajero') && $user->caja_asignada_id) {
            $cajaAsignada = Caja::find($user->caja_asignada_id);
            if ($cajaAsignada && $cajaAsignada->numero_caja != $caja->numero_caja) {
                return response()->json([
                    'success' => false,
                    'message' => "No tienes permiso para registrar movimientos en la caja #{$caja->numero_caja}. Solo puedes operar la caja #{$cajaAsignada->numero_caja}."
                ], 403);
            }
        }

        try {
            DB::beginTransaction();

            // Asegurarse de que el monto sea un número decimal
            $monto = floatval($validated['monto']);

            HistorialCaja::create([
                'caja_id' => $caja->id,
                'user_id' => Auth::id(),
                'tipo_movimiento' => $validated['tipo_movimiento'],
                'monto' => $monto,
                'metodo_pago' => $validated['metodo_pago'],
                'concepto' => $validated['concepto'],
                'referencia' => $validated['referencia'],
                'fecha_movimiento' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Movimiento registrado con éxito'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el movimiento: ' . $e->getMessage()
            ], 500);
        }
    }

    public function historial(Request $request)
    {
        $user = Auth::user();
        $query = Caja::with(['usuario', 'movimientos']);
        
        // Filtrar por caja asignada si es un cajero
        if ($user->hasRole('cajero') && $user->caja_asignada_id) {
            $cajaAsignada = Caja::find($user->caja_asignada_id);
            if ($cajaAsignada) {
                $query->where('numero_caja', $cajaAsignada->numero_caja);
            }
        }
        
        $query->orderBy('fecha_apertura', 'desc');

        // Aplicar filtros
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_apertura', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_apertura', '<=', $request->fecha_hasta);
        }

        if ($request->filled('estado') && $request->estado !== 'all') {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('numero_caja') && $request->numero_caja !== 'all') {
            $query->where('numero_caja', $request->numero_caja);
        }

        $cajas = $query->paginate(10)->through(function ($caja) {
            return [
                'id' => $caja->id,
                'numero_caja' => $caja->numero_caja,
                'usuario' => [
                    'id' => $caja->usuario->id,
                    'name' => $caja->usuario->name
                ],
                'monto_inicial' => $caja->monto_inicial,
                'monto_final' => $caja->monto_final,
                'diferencia' => $caja->diferencia,
                'estado' => $caja->estado,
                'fecha_apertura' => $caja->fecha_apertura->format('Y-m-d H:i:s'),
                'fecha_cierre' => $caja->fecha_cierre ? $caja->fecha_cierre->format('Y-m-d H:i:s') : null,
                'total_ingresos' => $caja->movimientos->where('tipo_movimiento', 'ingreso')->sum('monto'),
                'total_egresos' => $caja->movimientos->where('tipo_movimiento', 'egreso')->sum('monto'),
            ];
        });
        
        // Determinar las opciones de cajas disponibles según el rol
        $numerosCajasDisponibles = [];
        if ($user->hasRole('administrador')) {
            $numerosCajasDisponibles = ['all' => 'Todas'] + array_combine(range(1, 3), range(1, 3));
        } elseif ($user->hasRole('cajero') && $user->caja_asignada_id) {
            $cajaAsignada = Caja::find($user->caja_asignada_id);
            if ($cajaAsignada) {
                $numerosCajasDisponibles = [$cajaAsignada->numero_caja => $cajaAsignada->numero_caja];
            } else {
                $numerosCajasDisponibles = ['all' => 'Todas'] + array_combine(range(1, 3), range(1, 3));
            }
        } else {
            $numerosCajasDisponibles = ['all' => 'Todas'] + array_combine(range(1, 3), range(1, 3));
        }

        return Inertia::render('caja/historial', [
            'cajas' => $cajas,
            'filtros' => [
                'numero_caja' => $request->input('numero_caja'),
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
                'estado' => $request->input('estado'),
            ],
            'opciones_cajas' => $numerosCajasDisponibles
        ]);
    }
}