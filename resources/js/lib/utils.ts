import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import axios from 'axios';

// Cache para moneda actual
let currentCurrency: {
    codigo: string;
    simbolo: string;
    locale: string;
    formato_numero: string;
} | null = null;

// Variable para evitar múltiples solicitudes simultáneas
let isFetchingCurrency = false;
// Variable para almacenar la última vez que se cargó la moneda
let lastCurrencyFetch = 0;
// Tiempo mínimo entre solicitudes (5 minutos = 300000 ms)
const CURRENCY_CACHE_TIME = 300000;

// Función para cargar la moneda actual desde el servidor
export async function loadCurrentCurrency(): Promise<void> {
    // Si ya estamos obteniendo la moneda o si la obtuvimos recientemente, no hacemos otra solicitud
    const now = Date.now();
    if (isFetchingCurrency || (currentCurrency && (now - lastCurrencyFetch < CURRENCY_CACHE_TIME))) {
        return;
    }

    try {
        isFetchingCurrency = true;
        const response = await axios.get('/api/moneda/actual');
        if (response.data) {
            currentCurrency = {
                codigo: response.data.codigo || 'PEN',
                simbolo: response.data.simbolo || 'S/',
                locale: response.data.locale || 'es-PE',
                formato_numero: response.data.formato_numero || 'S/0,0.00'
            };
            // Actualizar tiempo de la última carga
            lastCurrencyFetch = Date.now();
        }
    } catch (error) {
        console.error('Error al cargar la moneda actual:', error);
        // Valores por defecto en caso de error
        currentCurrency = {
            codigo: 'PEN',
            simbolo: 'S/',
            locale: 'es-PE',
            formato_numero: 'S/0,0.00'
        };
    } finally {
        isFetchingCurrency = false;
    }
}

// Cargar la moneda al iniciar la aplicación
if (typeof window !== 'undefined') {
    loadCurrentCurrency();
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
    try {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (e) {
        return dateString;
    }
}

export const formatCurrency = (amount: number, currencyCode?: string) => {
    // Si no tenemos moneda actual, intentar cargarla
    if (!currentCurrency && typeof window !== 'undefined') {
        loadCurrentCurrency();
    }
    
    // Si no se proporciona un código específico, usar la moneda actual
    if (!currencyCode && currentCurrency) {
        currencyCode = currentCurrency.codigo;
    }
    
    // Valores predeterminados para el Sol Peruano (PEN)
    let locale = currentCurrency?.locale || 'es-PE';
    let currency = currencyCode || currentCurrency?.codigo || 'PEN';
    let formatOptions = {};

    // Si se proporciona un código de moneda específico, úsalo
    if (currencyCode && currencyCode !== currentCurrency?.codigo) {
        // Mapeo de códigos de moneda a configuraciones locales
        const localeMap: Record<string, string> = {
            'PEN': 'es-PE',
            'USD': 'en-US',
            'EUR': 'es-ES',
            'COP': 'es-CO',
            'MXN': 'es-MX'
        };
        
        locale = localeMap[currency] || locale;
    }

    // Formatear el monto según la configuración de moneda
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        ...formatOptions
    }).format(amount);
};
