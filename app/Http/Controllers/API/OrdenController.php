<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Orden;
use App\Models\HistorialOrden;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrdenController extends Controller
{
    /**
     * Obtener todas las órdenes con sus relaciones.
     */
    public function index(Request $request)
    {
        $query = Orden::with(['mesa', 'user', 'productos.categoria'])
            ->latest();
            
        // Filtrar por rol del usuario
        $user = $request->user();
        if ($user->role === 'mesero') {
            $query->where('user_id', $user->id);
        }
        
        // Si hay otros filtros en la solicitud
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }
        
        $ordenes = $query->get();
        
        return response()->json([
            'success' => true,
            'data' => $ordenes
        ]);
    }

    /**
     * Obtener una orden específica con todos sus detalles.
     */
    public function show(Orden $orden)
    {
        $orden->load(['mesa', 'user', 'productos.categoria', 'historial']);
        
        return response()->json([
            'success' => true,
            'data' => $orden
        ]);
    }
    
    /**
     * Actualizar el estado de una orden.
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
                'tipo_accion' => 'actualizacion_estado',
                'detalles' => 'Estado actualizado a: ' . $validated['estado'],
                'fecha_accion' => now(),
            ]);

            // Si la orden se cancela o se entrega, liberar la mesa
            if (($validated['estado'] === 'cancelada' || $validated['estado'] === 'entregada') && $orden->mesa_id) {
                $orden->mesa->marcarComoDisponible();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Estado de la orden actualizado con éxito',
                'data' => $orden->fresh(['mesa', 'user', 'productos.categoria'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las órdenes pendientes para el panel del bartender
     */
    public function getPendientes(Request $request)
    {
        try {
            $ordenes = Orden::with(['mesa', 'user', 'productos.categoria'])
                ->whereIn('estado', ['pendiente', 'en_proceso', 'lista'])
                ->latest()
                ->get();
            
            return response()->json([
                'success' => true,
                'ordenes' => $ordenes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener órdenes pendientes: ' . $e->getMessage()
            ], 500);
        }
    }
}
