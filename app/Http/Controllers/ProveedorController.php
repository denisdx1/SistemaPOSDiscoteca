<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Proveedor::query();

        // Búsqueda
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(ruc) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(contacto) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
            });
        }

        // Filtro de activos/inactivos
        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        return Inertia::render('inventario/proveedores', [
            'proveedores' => $query->orderBy('nombre', 'asc')
                ->paginate(10)
                ->withQueryString()
                ->through(fn ($proveedor) => [
                    'id' => $proveedor->id,
                    'nombre' => $proveedor->nombre,
                    'ruc' => $proveedor->ruc,
                    'direccion' => $proveedor->direccion,
                    'telefono' => $proveedor->telefono,
                    'email' => $proveedor->email,
                    'contacto' => $proveedor->contacto,
                    'observaciones' => $proveedor->observaciones,
                    'activo' => $proveedor->activo,
                    'created_at' => $proveedor->created_at->format('d/m/Y'),
                ]),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'ruc' => 'nullable|string|max:20|unique:proveedores,ruc',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'contacto' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'activo' => 'boolean',
        ]);

        Proveedor::create($validated);

        return redirect()->back()->with('success', 'Proveedor creado con éxito');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Proveedor $proveedor)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'ruc' => 'nullable|string|max:20|unique:proveedores,ruc,' . $proveedor->id,
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'contacto' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'activo' => 'boolean',
        ]);

        $proveedor->update($validated);

        return redirect()->back()->with('success', 'Proveedor actualizado con éxito');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Proveedor $proveedor)
    {
        // Verificar si tiene pedidos asociados antes de eliminar
        if ($proveedor->pedidos()->count() > 0) {
            return redirect()->back()->with('error', 'No se puede eliminar el proveedor porque tiene pedidos asociados');
        }

        $proveedor->delete();

        return redirect()->back()->with('success', 'Proveedor eliminado con éxito');
    }
}
