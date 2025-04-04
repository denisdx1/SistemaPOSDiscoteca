<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    protected $validThemes = ['light', 'dark', 'system', 'sepia', 'green', 'blue'];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $appearance = $request->cookie('appearance');
        
        // Validar que el tema sea válido
        if (!in_array($appearance, $this->validThemes)) {
            $appearance = 'system';
        }

        View::share('appearance', $appearance);

        return $next($request);
    }
}
