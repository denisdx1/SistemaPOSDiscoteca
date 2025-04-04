<?php

namespace App\Events;

use App\Models\Orden;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class OrdenStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $orden;

    /**
     * Create a new event instance.
     */
    public function __construct(Orden $orden)
    {
        $this->orden = $orden;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        Log::info('OrdenStatusUpdated::broadcastOn llamado', [
            'orden_id' => $this->orden->id,
            'canal' => 'ordenes'
        ]);
        
        return [
            new Channel('ordenes'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        Log::info('OrdenStatusUpdated::broadcastAs llamado', [
            'evento' => 'orden.updated'
        ]);
        
        return 'orden.updated';
    }

    /**
     * Determine if this event should broadcast.
     */
    public function broadcastWhen(): bool
    {
        Log::info('OrdenStatusUpdated::broadcastWhen llamado', [
            'orden_id' => $this->orden->id,
            'estado' => $this->orden->estado,
            'tiene_tragos' => $this->orden->productos->contains('categoria_id', 1)
        ]);
        
        // Siempre transmitir
        return true;
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        Log::info('OrdenStatusUpdated::broadcastWith llamado', [
            'orden_id' => $this->orden->id,
            'estado' => $this->orden->estado
        ]);
        
        // Cargar la relación de productos si no está cargada
        if (!$this->orden->relationLoaded('productos')) {
            Log::info('Cargando relaciones de productos que no estaban cargadas');
            $this->orden->load(['productos.categoria']);
        }
        
        // Log para verificar los productos de la orden
        if ($this->orden->productos->count() > 0) {
            Log::info('Productos en la orden:', [
                'total' => $this->orden->productos->count(),
                'con_categoria_1' => $this->orden->productos->where('categoria_id', 1)->count(),
                'ids_productos' => $this->orden->productos->pluck('id')->toArray(),
                'ids_categorias' => $this->orden->productos->pluck('categoria_id')->unique()->toArray()
            ]);
        } else {
            Log::warning('La orden no tiene productos asociados');
        }
        
        // Preparar los productos para la transmisión
        $productos = $this->orden->productos->map(function ($producto) {
            return [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'categoria_id' => $producto->categoria_id,
                'categoria' => [
                    'id' => $producto->categoria->id,
                    'nombre' => $producto->categoria->nombre,
                    'color' => $producto->categoria->color ?? '#888888',
                ],
                'precio_unitario' => $producto->pivot->precio_unitario,
                'cantidad' => $producto->pivot->cantidad,
                'subtotal' => $producto->pivot->subtotal,
                'notas' => $producto->pivot->notas,
            ];
        });
        
        // Crear array con todos los datos necesarios
        $eventData = [
            'id' => $this->orden->id,
            'estado' => $this->orden->estado,
            'mesa_id' => $this->orden->mesa_id,
            'mesa' => $this->orden->mesa ? [
                'id' => $this->orden->mesa->id,
                'numero' => $this->orden->mesa->numero
            ] : null,
            'user_id' => $this->orden->user_id,
            'user' => $this->orden->user ? [
                'id' => $this->orden->user->id,
                'name' => $this->orden->user->name,
                'role' => $this->orden->user->role
            ] : null,
            'numero_orden' => $this->orden->numero_orden,
            'subtotal' => $this->orden->subtotal,
            'total' => $this->orden->subtotal, // Usando subtotal como total (sin impuestos)
            'pagado' => (bool)$this->orden->pagado, // Convertir explícitamente a booleano
            'created_at' => $this->orden->created_at?->toIso8601String(),
            'updated_at' => $this->orden->updated_at?->toIso8601String(),
            'productos' => $productos,
        ];
        
        Log::info('Datos del evento preparados para broadcast', [
            'orden_id' => $eventData['id'],
            'tiene_mesa' => isset($eventData['mesa']),
            'tiene_user' => isset($eventData['user']),
            'pagado' => $eventData['pagado'] ? 'SI' : 'NO',
            'productos_count' => count($eventData['productos'])
        ]);
        
        return $eventData;
    }
}