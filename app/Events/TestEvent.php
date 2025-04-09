<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TestEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    private $channelName;
    private $eventName;

    /**
     * Create a new event instance.
     */
    public function __construct(string $message, string $channel = 'ordenes', string $event = 'test.event')
    {
        $this->message = $message;
        $this->channelName = $channel;
        $this->eventName = $event;
        
        Log::info('TestEvent::__construct', [
            'message' => $message,
            'channel' => $channel,
            'event' => $event
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        Log::info('TestEvent::broadcastOn', [
            'channel' => $this->channelName
        ]);
        
        return [
            new Channel($this->channelName),
        ];
    }
    
    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        Log::info('TestEvent::broadcastAs', [
            'event' => $this->eventName
        ]);
        
        return $this->eventName;
    }
    
    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $data = [
            'message' => $this->message,
            'timestamp' => now()->toIso8601String(),
            'test_id' => uniqid(),
        ];
        
        Log::info('TestEvent::broadcastWith', $data);
        
        return $data;
    }
} 