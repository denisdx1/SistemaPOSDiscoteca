<?php

namespace App\Http\Controllers;

use App\Models\Mesa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MesaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('mesas/index', [
            'mesas' => Mesa::query()
                ->when(request('search'), function($query, $search) {
                    $query->where('numero', 'like', "%{$search}%")
                        ->orWhere('ubicacion', 'like', "%{$search}%");
                })
                ->orderBy('numero')
                ->paginate(20)
                ->withQueryString()
                ->through(function ($mesa) {
                    $data = [
                        'id' => $mesa->id,
                        'numero' => $mesa->numero,
                        'capacidad' => $mesa->capacidad,
                        'estado' => $mesa->estado,
                        'ubicacion' => $mesa->ubicacion,
                        'notas' => $mesa->notas,
                        'activa' => $mesa->activa,
                        'created_at' => $mesa->created_at->format('d/m/Y'),
                    ];
                    
                    // Si la mesa está ocupada, incluir información de la orden
                    if ($mesa->estado === 'ocupada') {
                        $ordenActiva = $mesa->obtenerOrdenActiva();
                        if ($ordenActiva) {
                            $ordenActiva->load(['user', 'productos.categoria']);
                            $data['orden'] = [
                                'id' => $ordenActiva->id,
                                'numero_orden' => $ordenActiva->numero_orden,
                                'estado' => $ordenActiva->estado,
                                'subtotal' => $ordenActiva->subtotal,
                                'total' => $ordenActiva->total,
                                'pagado' => $ordenActiva->pagado,
                                'created_at' => $ordenActiva->created_at->format('Y-m-d H:i:s'),
                                'items' => $ordenActiva->productos->map(function($producto) {
                                    return [
                                        'id' => $producto->id,
                                        'cantidad' => $producto->pivot->cantidad,
                                        'precio_unitario' => $producto->pivot->precio_unitario,
                                        'subtotal' => $producto->pivot->subtotal,
                                        'producto' => [
                                            'id' => $producto->id,
                                            'nombre' => $producto->nombre,
                                            'descripcion' => $producto->descripcion,
                                            'categoria' => $producto->categoria ? [
                                                'id' => $producto->categoria->id,
                                                'nombre' => $producto->categoria->nombre,
                                            ] : null,
                                        ],
                                    ];
                                }),
                                'user' => $ordenActiva->user ? [
                                    'id' => $ordenActiva->user->id,
                                    'name' => $ordenActiva->user->name,
                                ] : null,
                            ];
                        }
                    }
                    
                    return $data;
                }),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero' => 'required|integer|unique:mesas,numero',
            'capacidad' => 'required|integer|min:1',
            'estado' => 'required|in:disponible,ocupada,reservada',
            'ubicacion' => 'required|string|max:255',
            'notas' => 'nullable|string',
            'activa' => 'boolean',
        ]);

        try {
            DB::beginTransaction();
            
            $mesa = Mesa::create($validated);
            
            DB::commit();
            return redirect()->back()->with('success', 'Mesa creada con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al crear la mesa: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Mesa $mesa)
    {
        $validated = $request->validate([
            'numero' => 'required|integer|unique:mesas,numero,' . $mesa->id,
            'capacidad' => 'required|integer|min:1',
            'estado' => 'required|in:disponible,ocupada,reservada',
            'ubicacion' => 'required|string|max:255',
            'notas' => 'nullable|string',
            'activa' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            // Si la mesa tiene órdenes activas, no permitir cambios de estado
            if ($mesa->obtenerOrdenActiva() && $validated['estado'] !== $mesa->estado) {
                throw new \Exception('No se puede cambiar el estado de una mesa con órdenes activas');
            }

            $mesa->update($validated);
            
            DB::commit();
            return redirect()->back()->with('success', 'Mesa actualizada con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al actualizar la mesa: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Mesa $mesa)
    {
        try {
            DB::beginTransaction();

            // Verificar si la mesa tiene órdenes activas
            if ($mesa->obtenerOrdenActiva()) {
                throw new \Exception('No se puede eliminar una mesa con órdenes activas');
            }

            $mesa->delete();
            
            DB::commit();
            return redirect()->back()->with('success', 'Mesa eliminada con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al eliminar la mesa: ' . $e->getMessage());
        }
    }
    
    /**
     * Cambiar el estado de una mesa
     */
    public function cambiarEstado(Request $request, Mesa $mesa)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'estado' => 'required|in:disponible,ocupada,reservada',
            ]);

            // Verificar si el cambio de estado es válido
            if ($validated['estado'] === Mesa::ESTADO_DISPONIBLE) {
                // Solo permitir marcar como disponible si no hay órdenes activas
                if ($mesa->obtenerOrdenActiva()) {
                    throw new \Exception('No se puede marcar como disponible una mesa con órdenes activas');
                }
                $mesa->marcarComoDisponible();
            } elseif ($validated['estado'] === Mesa::ESTADO_OCUPADA) {
                // Solo permitir marcar como ocupada si está disponible
                if (!$mesa->marcarComoOcupada()) {
                    throw new \Exception('La mesa no está disponible para ser ocupada');
                }
            } else {
                // Para el estado reservada, verificar que no haya órdenes activas
                if ($mesa->obtenerOrdenActiva()) {
                    throw new \Exception('No se puede reservar una mesa con órdenes activas');
                }
                $mesa->update(['estado' => $validated['estado']]);
            }
            
            DB::commit();
            return redirect()->back()->with('success', 'Estado de mesa actualizado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
