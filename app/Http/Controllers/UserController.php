<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        return Inertia::render('usuarios/lista', [
            'users' => User::query()
                ->select('id', 'name', 'email', 'role', 'role_id', 'created_at', 'updated_at')
                ->with('role:id,nombre,descripcion')
                ->latest('created_at')
                ->paginate(10)
                ->withQueryString()
                ->through(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'role_id' => $user->role_id,
                    'roleName' => $user->role_id ? ($user->role()->first() ? $user->role()->first()->nombre : $user->role) : $user->role,
                    'roleDescription' => $user->role_id ? ($user->role()->first() ? $user->role()->first()->descripcion : null) : null,
                    'status' => 'Activo', // En una implementación real, esto se calcularía según el estado en la BD
                    'last_login' => $user->updated_at->diffForHumans(),
                    'created_at' => $user->created_at->format('d/m/Y'),
                ]),
            'roles' => Role::select('id', 'nombre', 'descripcion')->get(),
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|string|in:administrador,cajero,mesero,bartender',
            'role_id' => 'required|exists:roles,id',
            'password' => 'required|string|min:8',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'role_id' => $validated['role_id'],
            'password' => bcrypt($validated['password']),
        ]);

        return redirect()->route('usuarios.lista');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|string|in:administrador,cajero,mesero,bartender',
            'role_id' => 'required|exists:roles,id',
            'password' => 'nullable|string|min:8',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'role_id' => $validated['role_id'],
        ];

        if (isset($validated['password'])) {
            $data['password'] = bcrypt($validated['password']);
        }

        $user->update($data);

        return redirect()->route('usuarios.lista');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('usuarios.lista');
    }
}
