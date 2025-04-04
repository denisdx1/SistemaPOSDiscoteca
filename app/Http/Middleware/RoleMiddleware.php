<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Verificar si el usuario está autenticado
        if (!$request->user()) {
            return redirect()->route('login');
        }

        // Si no se especifican roles, permitir el acceso
        if (empty($roles)) {
            return $next($request);
        }
        
        // Verificar si el parámetro comienza con "permission:"
        foreach ($roles as $role) {
            if (strpos($role, 'permission:') === 0) {
                $permission = substr($role, 11); // Quitar "permission:" del inicio
                if ($request->user()->hasPermission($permission)) {
                    return $next($request);
                }
            } else {
                // Obtener el rol del usuario actual y verificar si coincide
                $userRole = $request->user()->role;
                if ($userRole === $role) {
                    return $next($request);
                }
            }
        }

        // Si no tiene permiso, redirigir al dashboard con mensaje de error
        return redirect()->route('dashboard')
            ->with('error', 'No tienes permiso para acceder a esta página.');
    }
}
