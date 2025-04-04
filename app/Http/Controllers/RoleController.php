<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index()
    {
        return Inertia::render('roles/index', [
            'roles' => Role::with('permissions')->get(),
            'permissions' => Permission::all()->groupBy('modulo'),
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|unique:roles,nombre|max:255',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $role = Role::create($validated);

        return redirect()->route('roles.index');
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|unique:roles,nombre,'.$role->id.'|max:255',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $role->update($validated);

        return redirect()->route('roles.index');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role)
    {
        // No permitir eliminar roles si tienen usuarios asignados
        if ($role->users()->count() > 0) {
            return redirect()->route('roles.index')
                ->with('error', 'No se puede eliminar un rol con usuarios asignados.');
        }

        $role->delete();

        return redirect()->route('roles.index');
    }

    /**
     * Update permissions for a role.
     */
    public function updatePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->sync($validated['permissions']);

        return redirect()->route('roles.index');
    }
}
