<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    use HasFactory;
    
    protected $table = 'proveedores';
    
    protected $fillable = [
        'nombre',
        'ruc',
        'direccion',
        'telefono',
        'email',
        'contacto',
        'observaciones',
        'activo',
    ];
    
    protected $casts = [
        'activo' => 'boolean',
    ];
    
    /**
     * Obtener todos los pedidos de este proveedor
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }
}
