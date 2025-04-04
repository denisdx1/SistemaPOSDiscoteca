<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoInventario extends Model
{
    use HasFactory;
    
    protected $table = 'movimientos_inventario';
    
    protected $fillable = [
        'producto_id',
        'cantidad',
        'tipo_movimiento',
        'precio_unitario',
        'user_id',
        'pedido_id',
        'observacion',
    ];
    
    /**
     * Obtener el producto relacionado con este movimiento
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
    
    /**
     * Obtener el usuario que registró el movimiento
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    /**
     * Obtener el pedido relacionado con este movimiento (si aplica)
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }
}
