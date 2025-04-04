import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, XCircle } from 'lucide-react';
import { Producto } from '@/types/orden';
import { formatCurrency } from '@/lib/utils';

interface ProductosListProps {
  productos: Producto[];
  onAddItem: (producto: Producto) => void;
}

const ProductosList: React.FC<ProductosListProps> = ({ productos, onAddItem }) => {
  if (productos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay productos disponibles</p>
      </div>
    );
  }

  const handleCardClick = (producto: Producto) => {
    // Solo permitir añadir si tiene stock
    console.log("Click en producto:", producto.nombre, "Stock:", producto.stock_actual);
    if (producto.stock_actual > 0) {
      onAddItem(producto);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {productos.map((producto) => {
        const hasStock = producto.stock_actual > 0;
        
        return (
          <div 
            key={producto.id}
            onClick={() => handleCardClick(producto)}
            className={`${hasStock ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            <Card className={`overflow-hidden transition-shadow duration-200 ${hasStock ? 'hover:shadow-md hover:border-primary/50' : 'opacity-60'}`}>
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex flex-col mb-1 sm:mb-2">
                  <h3 className="font-bold text-sm md:text-base break-words">{producto.nombre}</h3>
                  <span className="font-bold text-primary text-sm md:text-base">{formatCurrency(producto.precio)}</span>
                </div>
                
                {producto.categoria && (
                  <Badge 
                    className="mb-1 sm:mb-2 inline-flex text-xs md:text-sm"
                    style={{ 
                      backgroundColor: producto.categoria.color || '#888888',
                      color: '#ffffff'
                    }}
                  >
                    {producto.categoria.nombre}
                  </Badge>
                )}
                
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-4 line-clamp-1 md:line-clamp-2">
                  {producto.descripcion}
                </p>
                
                <div className="flex justify-between items-center">
                  {!hasStock && (
                    <Badge variant="destructive" className="px-1 py-0 text-xs sm:px-2 sm:py-1 sm:text-sm">
                      Sin stock
                    </Badge>
                  )}
                  <div className="ml-auto">
                    {hasStock ? (
                      <PlusCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default ProductosList;