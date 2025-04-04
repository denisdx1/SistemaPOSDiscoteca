<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('menu/categorias', [
            'categorias' => Categoria::query()
                ->select('id', 'nombre', 'descripcion', 'color', 'activo', 'created_at')
                ->latest('created_at')
                ->paginate(10)
                ->withQueryString()
                ->through(fn ($categoria) => [
                    'id' => $categoria->id,
                    'nombre' => $categoria->nombre,
                    'descripcion' => $categoria->descripcion,
                    'color' => $categoria->color,
                    'activo' => $categoria->activo,
                    'productos_count' => $categoria->productos()->count(),
                    'created_at' => $categoria->created_at->format('d/m/Y'),
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
            'descripcion' => 'nullable|string',
            'color' => 'required|string|max:7',
            'activo' => 'boolean',
        ]);

        Categoria::create($validated);

        return redirect()->back()->with('success', 'Categoría creada con éxito');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'color' => 'required|string|max:7',
            'activo' => 'boolean',
        ]);

        $categoria->update($validated);

        return redirect()->back()->with('success', 'Categoría actualizada con éxito');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Categoria $categoria)
    {
        $categoria->delete();

        return redirect()->back()->with('success', 'Categoría eliminada con éxito');
    }

    /**
     * Get all categories in JSON format
     */
    public function getAll(Request $request)
    {
        $categorias = Categoria::select('id', 'nombre', 'color', 'activo')
            ->where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get();

        return response()->json([
            'categorias' => $categorias
        ]);
    }
}
