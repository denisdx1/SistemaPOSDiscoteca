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
import { Button } from "@/components/ui/button";
import { Edit2Icon, EyeIcon, Trash2Icon } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: number;
  nombre: string;
  codigo: string;
  stock_actual: number;
  stock_minimo: number | null;
  stock_maximo: number | null;
  precio?: number;
  categoria?: {
    nombre: string;
    id: number;
  };
  categoria_id?: number;
  activo: boolean;
}

interface InventoryStockTableProps {
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  searchQuery?: string;
}

export const InventoryStockTable: React.FC<InventoryStockTableProps> = ({ 
  onEditProduct,
  onDeleteProduct,
  searchQuery = ''
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Filtrando productos basados en searchQuery con verificación
  const filteredProducts = Array.isArray(products) ? products.filter(product => 
    searchQuery === '' || 
    (product.nombre && product.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.codigo && product.codigo.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Cálculo de páginas
  const totalFilteredProducts = filteredProducts.length;
  const totalFilteredPages = Math.ceil(totalFilteredProducts / perPage);
  
  // Obtener productos actuales para la página
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * perPage, 
    currentPage * perPage
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  // Resetear a la primera página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/inventario/stock');
      console.log('Stock API response:', response.data); // Debugging log
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Log para debugging
        response.data.data.forEach((product: any, index: number) => {
          console.log(`Producto ${index}:`, product);
          console.log(`Stock actual del producto ${index}:`, product.stock_actual);
        });
        
        // Asegurar que stock_actual esté definido para cada producto
        const productsWithStock = response.data.data.map((product: any) => ({
          ...product,
          stock_actual: product.stock_actual !== undefined ? Number(product.stock_actual) : 0
        }));
        
        setProducts(productsWithStock);
        setTotalPages(Math.ceil(productsWithStock.length / perPage));
      } else {
        console.error('Unexpected stock data format:', response.data);
        setError('Formato de respuesta inesperado. Revisa la consola para más detalles.');
        setProducts([]);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading stock data:', err);
      setError('Error al cargar los productos: ' + (err.message || 'Desconocido'));
      setProducts([]);
      setLoading(false);
    }
  };

  const getStockStatus = (current: number, min: number | null, max: number | null) => {
    if (min !== null && current <= min) {
      return <Badge variant="destructive">Bajo</Badge>;
    } else if (max !== null && current >= max) {
      return <Badge variant="default">Alto</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Normal</Badge>;
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
                <TableHead className="w-[180px]">Producto</TableHead>
                <TableHead className="min-w-[80px]">Código</TableHead>
                <TableHead className="min-w-[80px]">Categoría</TableHead>
                <TableHead className="min-w-[80px] text-center">Stock</TableHead>
                <TableHead className="min-w-[80px] text-center">Estado</TableHead>
                <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Cargando productos...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : currentProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {searchQuery 
                      ? 'No se encontraron productos que coincidan con la búsqueda' 
                      : 'No hay productos registrados en el inventario'}
                  </TableCell>
                </TableRow>
              ) : (
                currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.nombre}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.codigo || '-'}
                    </TableCell>
                    <TableCell>
                      {product.categoria ? product.categoria.nombre : '-'}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {product.stock_actual || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStockStatus(product.stock_actual, product.stock_minimo, product.stock_maximo)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        {onEditProduct && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Editar producto"
                            onClick={() => onEditProduct(product)}
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteProduct && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Eliminar producto"
                            onClick={() => onDeleteProduct(product)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Versión alternativa para móviles (se muestra en pantallas muy pequeñas) */}
      <div className="lg:hidden mt-4 space-y-4">
        {loading ? (
          <div className="text-center py-6">Cargando productos...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">{error}</div>
        ) : currentProducts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {searchQuery 
              ? 'No se encontraron productos que coincidan con la búsqueda' 
              : 'No hay productos registrados en el sistema'}
          </div>
        ) : (
          currentProducts.map((product) => (
            <div key={product.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{product.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{product.codigo || '-'}</p>
                </div>
                <div className="flex gap-1">
                  {onEditProduct && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => onEditProduct(product)}
                    >
                      <Edit2Icon className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteProduct && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 border-red-200 hover:border-red-300" 
                      onClick={() => onDeleteProduct(product)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 text-sm gap-2">
                <div>
                  <p className="text-muted-foreground">Categoría</p>
                  <p>{product.categoria ? product.categoria.nombre : '-'}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-semibold">{product.stock_actual || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Estado</p>
                  <div className="flex justify-end mt-1">
                    {getStockStatus(product.stock_actual, product.stock_minimo, product.stock_maximo)}
                  </div>
                </div>
              </div>
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
            
            {Array.from({ length: totalFilteredPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalFilteredPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => {
                // Agregar elipsis si hay saltos en la secuencia
                if (index > 0 && page > array[index - 1] + 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <PaginationItem className="hidden sm:inline-block">
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                }
                
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
              })
            }
            
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

export default InventoryStockTable;
