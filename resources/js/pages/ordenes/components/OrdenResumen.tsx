import React, { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemOrden, Mesa } from '@/types/orden';
import { Trash2, Minus, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';

interface OrdenResumenProps {
  items: ItemOrden[];
  mesas: Mesa[];
  selectedMesa: number | null;
  onSelectMesa: (mesaId: number | null) => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  subtotal: number;
  total: number;
  onSubmit: () => void;
  isProcessing: boolean;
  isMesaFixed?: boolean;
  children?: ReactNode;
}

const OrdenResumen: React.FC<OrdenResumenProps> = ({
  items,
  mesas,
  selectedMesa,
  onSelectMesa,
  onRemoveItem,
  onUpdateQuantity,
  subtotal,
  total,
  onSubmit,
  isProcessing,
  isMesaFixed = false,
  children,
}) => {
  const mesasDisponibles = mesas.filter(m => m.estado === 'disponible' || (selectedMesa && m.id === selectedMesa));
  
  const selectedMesaInfo = selectedMesa ? mesas.find(m => m.id === selectedMesa) : null;

  // Depuración para verificar los items recibidos
  

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Resumen de Orden</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        <div>
          <Label htmlFor="mesa-select">Mesa</Label>
          {isMesaFixed && selectedMesaInfo ? (
            <div className="p-2 border rounded-md bg-muted/20">
              <p className="font-medium">Mesa {selectedMesaInfo.numero} ({selectedMesaInfo.capacidad} pers.) - {selectedMesaInfo.ubicacion}</p>
            </div>
          ) : (
            <Select
              value={selectedMesa?.toString() || 'none'}
              onValueChange={(value) => onSelectMesa(value !== 'none' ? parseInt(value) : null)}
            >
              <SelectTrigger id="mesa-select">
                <SelectValue placeholder="Seleccionar mesa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin mesa</SelectItem>
                {mesasDisponibles.map((mesa) => (
                  <SelectItem key={mesa.id} value={mesa.id.toString()}>
                    Mesa {mesa.numero} ({mesa.capacidad} pers.) - {mesa.ubicacion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Productos ({items.length})</h3>
          
          {!items || items.length === 0 ? (
            <div className="text-center py-6 border rounded-md bg-muted/30">
              <p className="text-sm text-muted-foreground">No hay productos seleccionados</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-500px)] min-h-[200px]">
              <div className="space-y-2">{
                items.map((item, index) => {
                  // Verificar si es un complemento gratuito
                  const esComplemento = item.es_complemento_gratuito === true;
                  
                  // Si es un complemento gratuito, buscar el producto principal al que está vinculado
                  const productoPrincipal = esComplemento && item.complemento_de
                    ? items.find(i => i.producto && i.producto.id === item.complemento_de)?.producto.nombre
                    : null;
                    
                  console.log("Renderizando item:", item.producto?.nombre, "índice:", index);
                    
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 border rounded-md hover:bg-accent/10 ${
                        esComplemento ? 'ml-4 mt-0 border-dashed bg-muted/20' : ''
                      }`}
                    >
                      <div className="flex-grow">
                        <h4 className="font-medium">
                          {item.producto?.nombre || "Producto sin nombre"}
                          {esComplemento && (
                            <span className="ml-2 text-sm text-muted-foreground">(Gratis)</span>
                          )}
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.precio_unitario)} x {item.cantidad}
                          {esComplemento && productoPrincipal && (
                            <span className="ml-2 text-xs italic">Complemento de {productoPrincipal}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(index, item.cantidad - 1)}
                            disabled={item.cantidad <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-8 text-center">{item.cantidad}</span>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(index, item.cantidad + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            console.log('Eliminando item en índice:', index);
                            onRemoveItem(index);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              }</div>
            </ScrollArea>
          )}
        </div>
        
        {children}
      </CardContent>
      
      <CardFooter className="flex-col items-stretch space-y-4 pt-6 border-t">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        
        <Button 
          onClick={onSubmit}
          disabled={isProcessing || items.length === 0}
          className="w-full"
        >
          {isProcessing ? 'Procesando...' : 'Confirmar Orden'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrdenResumen; 