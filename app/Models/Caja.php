<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    use HasFactory;

    /**
     * La tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'cajas';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'numero_caja',
        'monto_inicial',
        'monto_final',
        'diferencia',
        'estado',
        'observaciones',
        'fecha_apertura',
        'fecha_cierre',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'monto_inicial' => 'decimal:2',
        'monto_final' => 'decimal:2',
        'diferencia' => 'decimal:2',
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
        'numero_caja' => 'integer',
    ];

    /**
     * Obtiene el usuario asociado a esta caja.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Obtiene el historial de movimientos de esta caja.
     */
    public function movimientos(): HasMany
    {
        return $this->hasMany(HistorialCaja::class);
    }

    /**
     * Obtiene la caja abierta por número.
     */
    public static function cajaAbiertaPorNumero($numeroCaja)
    {
        return static::where('numero_caja', $numeroCaja)
            ->where('estado', 'abierta')
            ->first();
    }
}
