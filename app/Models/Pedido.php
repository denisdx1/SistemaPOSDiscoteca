<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pedido extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'numero_pedido',
        'proveedor_id',
        'user_id',
        'estado',
        'fecha_pedido',
        'fecha_esperada',
        'fecha_recepcion',
        'total',
        'observaciones'
    ];
    
    protected $casts = [
        'fecha_pedido' => 'date',
        'fecha_esperada' => 'date',
        'fecha_recepcion' => 'date',
        'total' => 'decimal:2'
    ];
    
    /**
     * Obtener el proveedor de este pedido
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }
    
    /**
     * Obtener el usuario que registró el pedido
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    /**
     * Obtener los detalles del pedido
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetallePedido::class);
    }
    
    /**
     * Obtener los movimientos de inventario asociados a este pedido
     */
    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class);
    }
}
