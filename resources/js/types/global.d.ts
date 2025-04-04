import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}

interface Moneda {
    id: number;
    codigo: string;
    nombre: string;
    simbolo: string;
    tasa_cambio: number;
    es_predeterminada: boolean;
    activo: boolean;
    formato_numero: string;
    decimales: number;
    separador_decimal: string;
    separador_miles: string;
    codigo_pais: string;
    locale: string;
    created_at: string;
    updated_at: string;
}
