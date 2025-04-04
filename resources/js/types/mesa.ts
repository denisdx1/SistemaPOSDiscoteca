// Define the shared Mesa type to be used throughout the application
export type Mesa = {
  id: number;
  numero: number;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'reservada';
  ubicacion: string;
  notas: string;
  activa: boolean;
  created_at: string;
  orden?: {
    id: number;
    numero_orden: string;
    estado: 'pendiente' | 'en_proceso' | 'lista' | 'entregada' | 'cancelada';
    subtotal: number;
    total: number;
    pagado: boolean;
    items?: Array<{
      id?: number;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      producto: {
        id: number;
        nombre: string;
        descripcion?: string;
        categoria?: {
          id: number;
          nombre: string;
        };
      };
    }>;
    user?: {
      id: number;
      name: string;
    };
    created_at?: string;
  };
};
