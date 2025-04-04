import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, ArrowDownUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Actualizar la interfaz para que coincida con la respuesta de la API
interface Movement {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigo: string;
  };
  tipo_movimiento: string;
  cantidad: number;
  created_at: string; // Cambiado de 'fecha' a 'created_at'
  user?: {           // Cambiado de 'usuario' a 'user' y hecho opcional
    id: number;
    name: string;
  };
  observacion: string;
}

interface MovementHistoryTableProps {
  searchQuery?: string;
}

export const MovementHistoryTable: React.FC<MovementHistoryTableProps> = ({ 
  searchQuery = '' 
}) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Filtrando movimientos basados en searchQuery con verificación de propiedades null/undefined
  const filteredMovements = movements ? movements.filter(movement => 
    searchQuery === '' || 
    (movement.producto && movement.producto.nombre && movement.producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (movement.producto && movement.producto.codigo && movement.producto.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (movement.observacion && movement.observacion.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Cálculo de páginas
  const totalFilteredMovements = filteredMovements.length;
  const totalFilteredPages = Math.ceil(totalFilteredMovements / perPage);
  
  // Obtener movimientos actuales para la página
  const currentMovements = filteredMovements.slice(
    (currentPage - 1) * perPage, 
    currentPage * perPage
  );

  useEffect(() => {
    fetchMovements();
  }, []);

  // Resetear a la primera página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/inventario/movimientos');
      console.log('API Response:', response.data); // Debugging log
      
      // The controller specifically returns data in this format:
      // { success: true, data: [...movements], message: string }
      if (response.data && response.data.data) {
        // This is the correct path based on the MovimientoInventarioController.php
        setMovements(response.data.data);
        setTotalPages(Math.ceil(response.data.data.length / perPage));
        setLoading(false);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Formato de respuesta inesperado. Revisa la consola para más detalles.');
        setMovements([]);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching movements:', err);
      setError('Error al cargar los movimientos: ' + (err.message || 'Desconocido'));
      setLoading(false);
    }
  };

  const getMovementIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
      case 'salida':
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
      case 'ajuste':
        return <ArrowDownUp className="h-4 w-4 text-yellow-500" />;
      case 'venta':
        return <ArrowUpIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getMovementType = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entrada</Badge>;
      case 'salida':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Salida</Badge>;
      case 'ajuste':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ajuste</Badge>;
      case 'venta':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Venta</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Cargando movimientos...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : currentMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {searchQuery 
                      ? 'No se encontraron movimientos que coincidan con la búsqueda' 
                      : 'No hay movimientos registrados en el sistema'}
                  </TableCell>
                </TableRow>
              ) : (
                currentMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {/* Formateamos la fecha según el formato recibido */}
                      {new Date(movement.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{movement.producto.nombre}</span>
                        <span className="text-xs text-muted-foreground">({movement.producto.codigo})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getMovementIcon(movement.tipo_movimiento)}
                        {getMovementType(movement.tipo_movimiento)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${movement.tipo_movimiento === 'salida' ? 'text-red-600' : movement.tipo_movimiento === 'entrada' ? 'text-green-600' : ''}`}>
                        {movement.tipo_movimiento === 'salida' ? '-' : movement.tipo_movimiento === 'entrada' ? '+' : ''}
                        {movement.cantidad}
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.user ? movement.user.name : 'Sistema'}
                    </TableCell>
                    <TableCell>
                      {movement.observacion || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Versión alternativa para móviles (se muestra en pantallas pequeñas) */}
      <div className="lg:hidden mt-4 space-y-4">
        {loading ? (
          <div className="text-center py-6">Cargando movimientos...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">{error}</div>
        ) : currentMovements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {searchQuery 
              ? 'No se encontraron movimientos que coincidan con la búsqueda' 
              : 'No hay movimientos registrados en el sistema'}
          </div>
        ) : (
          currentMovements.map((movement) => (
            <div key={movement.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{movement.producto.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{movement.producto.codigo}</p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {getMovementIcon(movement.tipo_movimiento)}
                  {getMovementType(movement.tipo_movimiento)}
                </div>
              </div>
              
              <div className="grid grid-cols-3 text-sm gap-2 mt-2">
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="text-xs">
                    {new Date(movement.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs">
                    {new Date(movement.created_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Cantidad</p>
                  <p className={`font-semibold ${movement.tipo_movimiento === 'salida' ? 'text-red-600' : movement.tipo_movimiento === 'entrada' ? 'text-green-600' : ''}`}>
                    {movement.tipo_movimiento === 'salida' ? '-' : movement.tipo_movimiento === 'entrada' ? '+' : ''}
                    {movement.cantidad}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Usuario</p>
                  <p>{movement.user ? movement.user.name : 'Sistema'}</p>
                </div>
              </div>
              
              {movement.observacion && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-muted-foreground text-sm">Observación:</p>
                  <p className="text-sm">{movement.observacion}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && !error && totalFilteredPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map((page) => {
              // Mostrar solo las páginas cercanas a la actual para no tener demasiadas páginas visibles
              if (
                page === 1 || 
                page === totalFilteredPages || 
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (page === currentPage - 3 && currentPage > 3) ||
                (page === currentPage + 3 && currentPage < totalFilteredPages - 2)
              ) {
                return <PaginationEllipsis key={page} />;
              }
              return null;
            }).filter(Boolean)}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(totalFilteredPages, currentPage + 1))}
                className={currentPage === totalFilteredPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default MovementHistoryTable;
