<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Moneda extends Model
{
    use HasFactory;

    /**
     * La tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'monedas';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'codigo',
        'nombre',
        'simbolo',
        'tasa_cambio',
        'es_predeterminada',
        'activo',
        'formato_numero',
        'decimales',
        'separador_decimal',
        'separador_miles',
        'codigo_pais',
        'locale',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tasa_cambio' => 'decimal:6',
        'es_predeterminada' => 'boolean',
        'activo' => 'boolean',
        'decimales' => 'integer',
    ];

    /**
     * Obtiene la moneda predeterminada del sistema.
     *
     * @return self|null
     */
    public static function getPredeterminada()
    {
        return self::where('es_predeterminada', true)
                    ->where('activo', true)
                    ->first();
    }

    /**
     * Convierte un monto a esta moneda desde la moneda predeterminada.
     *
     * @param float $monto
     * @return float
     */
    public function convertirDesdeBase($monto)
    {
        return $monto * $this->tasa_cambio;
    }

    /**
     * Convierte un monto desde esta moneda a la moneda predeterminada.
     *
     * @param float $monto
     * @return float
     */
    public function convertirABase($monto)
    {
        return $monto / $this->tasa_cambio;
    }

    /**
     * Formatea un número según la configuración de esta moneda.
     *
     * @param float $numero
     * @param bool $incluirSimbolo
     * @return string
     */
    public function formatearNumero($numero, $incluirSimbolo = true)
    {
        $numeroFormateado = number_format(
            $numero,
            (int)$this->decimales,
            $this->separador_decimal,
            $this->separador_miles
        );

        return $incluirSimbolo ? "{$this->simbolo}{$numeroFormateado}" : $numeroFormateado;
    }
}
