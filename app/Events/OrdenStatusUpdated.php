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
        Log::info('OrdenStatusUpdated::broadcastOn llamado - Transmitiendo en canal "ordenes"', [
            'orden_id' => $this->orden->id,
            'estado' => $this->orden->estado,
            'pagado' => $this->orden->pagado ? 'Sí' : 'No',
            'evento' => 'orden.updated',
            'canal' => 'ordenes',
            'broadcast_driver' => env('BROADCAST_DRIVER')
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
        Log::info('OrdenStatusUpdated::broadcastAs llamado - NOMBRE DE EVENTO FORZADO', [
            'evento' => 'orden.updated',
            'orden_id' => $this->orden->id,
            'numero_orden' => $this->orden->numero_orden,
            'broadcast_driver' => env('BROADCAST_DRIVER'),
            'reverb_host' => env('REVERB_HOST'),
            'reverb_port' => env('REVERB_PORT')
        ]);
        
        // Forzamos un nombre de evento consistente
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
     */
    public function broadcastWith(): array
    {
        Log::info('OrdenStatusUpdated::broadcastWith llamado - Preparando datos para broadcast', [
            'orden_id' => $this->orden->id,
            'estado' => $this->orden->estado,
            'broadcast_driver' => env('BROADCAST_DRIVER')
        ]);
        
        // Forzar que el campo pagado sea booleano
        $pagado = (bool)$this->orden->pagado;
        
        // Asegurar que todos los datos necesarios estén presentes
        $data = [
            'id' => $this->orden->id,
            'numero_orden' => $this->orden->numero_orden,
            'estado' => $this->orden->estado,
            'pagado' => $pagado,
            'total' => $this->orden->total,
            'timestamp' => now()->toIso8601String(),
            'debug_id' => uniqid('debug_'),
            // Incluimos datos adicionales para propósitos de diagnóstico
            '_debug' => [
                'broadcast_driver' => env('BROADCAST_DRIVER'),
                'app_env' => env('APP_ENV'),
                'evento' => 'orden.updated',
                'canal' => 'ordenes',
                'hora_servidor' => now()->toDateTimeString()
            ]
        ];
        
        Log::info('OrdenStatusUpdated::broadcastWith - Datos preparados para enviar', array_merge(
            ['data_length' => count($data)],
            array_intersect_key($data, array_flip(['id', 'numero_orden', 'estado', 'pagado', 'timestamp', 'debug_id']))
        ));
        
        return $data;
    }
}