import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Printer, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { router } from "@inertiajs/react";
import { formatCurrency } from '@/lib/utils';

interface OrdenItem {
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
}

interface OrdenDetalle {
  id: number;
  numero_orden: string;
  estado: string;
  subtotal: number;
  total: number;
  pagado: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
  items: OrdenItem[];
  mesa?: {
    id: number;
    numero: number;
  } | null;
}

interface OrdenDetailsDialogProps {
  orden: OrdenDetalle | null;
  isOpen: boolean;
  onClose: () => void;
}

// Componente para mostrar el estado de la orden
const EstadoBadge = ({ estado }: { estado: string }) => {
  const getVariant = () => {
    switch (estado) {
      case 'pendiente': return 'outline';
      case 'en_proceso': return 'secondary';
      case 'lista': return 'default';
      case 'entregada': return 'default';
      case 'cancelada': return 'destructive';
      default: return 'outline';
    }
  };

  const getText = () => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'lista': return 'Lista';
      case 'entregada': return 'Entregada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  return (
    <Badge variant={getVariant()}>
      {getText()}
    </Badge>
  );
};

export default function OrdenDetailsDialog({ orden, isOpen, onClose }: OrdenDetailsDialogProps) {
  if (!orden) return null;

  const handleModificarOrden = () => {
    if (orden.mesa) {
      router.visit(route('ordenes.nueva', orden.mesa.id));
    }
  };

  const handleCobrarOrden = () => {
    if (orden.mesa) {
      router.visit(route('facturacion.crear', { mesa_id: orden.mesa.id }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-full sm:max-w-[550px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Detalles de la Orden</DialogTitle>
        </DialogHeader>
        
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Número de Orden</p>
              <p className="font-medium">{orden.numero_orden}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mesa</p>
              <p className="font-medium">
                {orden.mesa ? `Mesa ${orden.mesa.numero}` : 'Sin mesa'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {orden.created_at && format(new Date(orden.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">
                <EstadoBadge estado={orden.estado} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pago</p>
              <p className="font-medium">
                {orden.pagado ? 'Pagado' : 'Pendiente'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium">{formatCurrency(orden.total)}</p>
            </div>
            {orden.user && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Atendido por</p>
                <p className="font-medium">{orden.user.name}</p>
              </div>
            )}
          </div>
          
          {/* Vista móvil: mostrar productos como tarjetas */}
          <div className="block sm:hidden mb-4">
            <p className="font-medium mb-2">Productos</p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {orden.items.map((item, idx) => (
                  <div key={idx} className="border border-border rounded-md p-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="font-medium">{item.producto.nombre}</div>
                        {item.producto.categoria && (
                          <span className="text-xs text-muted-foreground">
                            {item.producto.categoria.nombre}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(item.subtotal)}</div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.cantidad} × {formatCurrency(item.precio_unitario)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Vista desktop: mostrar productos como tabla */}
          <div className="hidden sm:block mb-4">
            <p className="font-medium mb-2">Productos</p>
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orden.items.length > 0 ? (
                    orden.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.producto.nombre}
                          {item.producto.categoria && (
                            <span className="text-xs text-muted-foreground block">
                              {item.producto.categoria.nombre}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>${formatCurrency(item.precio_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay productos en esta orden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              className="w-full bg-indigo-100 border-indigo-200 hover:bg-indigo-200 text-indigo-700"
              onClick={handleModificarOrden}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Modificar Orden
            </Button>
            
            {!orden.pagado && orden.estado === 'entregada' && (
              <Button
                variant="outline"
                className="w-full bg-green-100 border-green-200 hover:bg-green-200 text-green-700"
                onClick={handleCobrarOrden}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Cobrar Orden
              </Button>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <a href={route('facturacion.boleta', orden.id)} target="_blank" rel="noopener noreferrer">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 