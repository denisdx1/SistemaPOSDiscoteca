<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetallePedido extends Model
{
    use HasFactory;
    
    protected $table = 'detalle_pedidos';
    
    protected $fillable = [
        'pedido_id',
        'producto_id',
        'cantidad',
        'cantidad_recibida',
        'precio_unitario',
        'subtotal',
        'observaciones',
    ];
    
    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];
    
    /**
     * Obtener el pedido al que pertenece este detalle
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }
    
    /**
     * Obtener el producto relacionado con este detalle
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
