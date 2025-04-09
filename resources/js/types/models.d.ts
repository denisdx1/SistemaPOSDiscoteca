interface Orden {
  id?: number;
  numero_orden: string;
  estado: OrdenEstado;
  mesa_id: number | null;
  mesa?: Mesa;
  user_id: number;
  user?: User;
  total: number;
  pagado: boolean;
  bartender_id?: number | null;
  bartender?: User;
  items: OrdenItem[];
  notas?: string;
  created_at?: string;
  updated_at?: string;
  hora_inicio?: string;
} 