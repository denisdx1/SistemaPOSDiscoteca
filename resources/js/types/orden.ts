// Define los tipos para el módulo de órdenes

export type Categoria = {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
  activo?: boolean;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number;
  stock: number;
  stock_actual: number;
  codigo: string;
  imagen_url?: string;
  activo: boolean;
  categoria: Categoria;
  created_at: string;
};

export type Mesa = {
  id: number;
  numero: number;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'reservada';
  ubicacion: string;
  notas?: string;
  activa: boolean;
  created_at: string;
};

export type ItemOrden = {
  id?: number;
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  es_complemento_gratuito?: boolean;
  complemento_de?: number;
};

export type Orden = {
  id?: number;
  numero_orden?: string;
  mesa_id: number | null;
  mesa?: Mesa | null;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  estado: 'pendiente' | 'en_proceso' | 'lista' | 'entregada' | 'cancelada';
  subtotal: number;
  total: number;
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro' | 'yape';
  pagado: boolean;
  notas?: string;
  items: ItemOrden[];
  created_at?: string;
  updated_at?: string;
};
