import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Orden } from '@/types/orden';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import {
  Clock,
  Activity,
  Check,
  X,
  ShoppingBag,
  Eye,
  Printer,
  ArrowRight,
  RefreshCcw,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface GestionOrdenesProps {
  ordenes: Orden[];
}

const EstadoBadge = ({ estado }: { estado: string }) => {
  const getVariant = () => {
    switch (estado) {
      case 'pendiente':
        return { variant: 'outline', icon: <Clock className="w-3 h-3 mr-1" />, text: 'Pendiente' };
      case 'en_proceso':
        return { variant: 'secondary', icon: <Activity className="w-3 h-3 mr-1" />, text: 'En proceso' };
      case 'lista':
        return { variant: 'default', icon: <Check className="w-3 h-3 mr-1" />, text: 'Lista' };
      case 'entregada':
        return { variant: 'success', icon: <ShoppingBag className="w-3 h-3 mr-1" />, text: 'Entregada' };
      case 'cancelada':
        return { variant: 'destructive', icon: <X className="w-3 h-3 mr-1" />, text: 'Cancelada' };
      default:
        return { variant: 'outline', icon: null, text: estado };
    }
  };

  const { variant, icon, text } = getVariant();
  return (
    <Badge variant={variant as any} className="flex items-center">
      {icon}
      {text}
    </Badge>
  );
};

const GestionOrdenes: React.FC<GestionOrdenesProps> = ({ ordenes }) => {
  const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
  const userRole = auth.user.role;
  const isMesero = userRole === 'mesero';
  
  const [selectedTab, setSelectedTab] = useState('todas');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Filtrar órdenes según la pestaña seleccionada
  const filteredOrdenes = selectedTab === 'todas' 
    ? ordenes 
    : ordenes.filter(orden => orden.estado === selectedTab);
  
  const handleVerDetalles = (orden: Orden) => {
    setSelectedOrden(orden);
    setIsDialogOpen(true);
  };
  
  const handleUpdateStatus = async (ordenId: number, nuevoEstado: string) => {
    setIsUpdatingStatus(true);
    
    try {
      // Si estamos cambiando a estado "lista", verificamos si ya está pagada la orden
      if (nuevoEstado === 'lista') {
        const orden = ordenes.find(o => o.id === ordenId);
        
        if (orden && !orden.pagado) {
          toast({
            title: "¡Atención!",
            description: "La orden no ha sido cobrada. Una vez que la orden esté pagada, la mesa podrá ser desocupada.",
            variant: "destructive",
          });
        }
      }
      
      await axios.patch(route('ordenes.update-status', ordenId), {
        estado: nuevoEstado
      });
      
      // Mostrar mensaje de éxito
      toast({
        title: "Estado actualizado",
        description: `La orden ha sido actualizada a "${getEstadoText(nuevoEstado)}"`,
      });
      
      // Recargar la página para obtener datos actualizados
      router.reload();
      
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la orden",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'lista': return 'Lista';
      case 'entregada': return 'Entregada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };
  
  const getNextState = (currentState: string) => {
    switch (currentState) {
      case 'pendiente': return 'en_proceso';
      case 'en_proceso': return 'lista';
      case 'lista': return 'entregada';
      default: return currentState;
    }
  };
  
  const getNextStateAction = (currentState: string) => {
    switch (currentState) {
      case 'pendiente': return 'Iniciar preparación';
      case 'en_proceso': return 'Marcar como lista';
      case 'lista': return 'Entregar orden';
      default: return 'Actualizar';
    }
  };
  
  const getNextStateIcon = (currentState: string) => {
    switch (currentState) {
      case 'pendiente': return <Activity className="h-4 w-4 mr-2" />;
      case 'en_proceso': return <Check className="h-4 w-4 mr-2" />;
      case 'lista': return <ShoppingBag className="h-4 w-4 mr-2" />;
      default: return <ArrowRight className="h-4 w-4 mr-2" />;
    }
  };
  
  const handleRefresh = () => {
    router.reload();
  };

  const handleMarkAsPaid = async (ordenId: number) => {
    try {
      await axios.patch(route('ordenes.mark-as-paid', ordenId));
      
      // Mostrar mensaje de éxito
      toast({
        title: "Orden cobrada",
        description: "La orden ha sido marcada como pagada y cambiada a estado pendiente para preparación",
      });
      
      // Recargar la página para obtener datos actualizados
      router.reload();
      
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
      
      toast({
        title: "Error",
        description: "No se pudo marcar la orden como pagada",
        variant: "destructive",
      });
    }
  };

  // Función para determinar si el usuario puede cambiar el estado de una orden
  const canUpdateOrderStatus = (currentState: string) => {
    // Si es mesero, solo puede cambiar de "lista" a "entregada"
    if (isMesero) {
      return currentState !== 'pendiente';
    }
    
    // Administradores y bartenders pueden cambiar todos los estados
    return true;
  };

  return (
    <DashboardLayout>
      <Head title="Gestión de Órdenes Pagadas" />
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Órdenes Pagadas</h1>
            <p className="text-muted-foreground">Gestione las órdenes ya pagadas que están en proceso de preparación</p>
          </div>
          
          <Button variant="outline" onClick={handleRefresh} className="flex items-center">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        <Tabs defaultValue="todas" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="todas">
              Todas ({ordenes.length})
            </TabsTrigger>
            <TabsTrigger value="pendiente">
              Pendientes ({ordenes.filter(o => o.estado === 'pendiente').length})
            </TabsTrigger>
            <TabsTrigger value="en_proceso">
              En proceso ({ordenes.filter(o => o.estado === 'en_proceso').length})
            </TabsTrigger>
            <TabsTrigger value="lista">
              Listas ({ordenes.filter(o => o.estado === 'lista').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-0">
            {filteredOrdenes.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">No hay órdenes {selectedTab !== 'todas' ? `en estado "${getEstadoText(selectedTab)}"` : ''}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrdenes.map((orden) => (
                  <Card key={orden.id} className={`
                    ${orden.estado === 'pendiente' ? 'border-orange-200' : ''}
                    ${orden.estado === 'en_proceso' ? 'border-blue-200' : ''}
                    ${orden.estado === 'lista' ? 'border-green-200' : ''}
                    ${orden.estado === 'entregada' ? 'border-emerald-400' : ''}
                  `}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{orden.numero_orden}</CardTitle>
                          <CardDescription>
                            {orden.mesa ? `Mesa ${orden.mesa.numero}` : 'Sin mesa'}
                          </CardDescription>
                        </div>
                        <EstadoBadge estado={orden.estado} />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span>{orden.created_at && format(new Date(orden.created_at), 'dd/MM/yy HH:mm', { locale: es })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-medium">{formatCurrency(orden.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Items:</span>
                          <span>{orden.items?.length || 0} productos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Creado por:</span>
                          <span>{orden.user?.name || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-1">Productos principales:</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {orden.items && orden.items.length > 0 ? (
                            <>
                              {orden.items.slice(0, 3).map((item, index) => (
                                <li key={index}>
                                  {item.cantidad}x {item.producto.nombre}
                                </li>
                              ))}
                              {orden.items.length > 3 && (
                                <li className="text-muted-foreground">
                                  + {orden.items.length - 3} más...
                                </li>
                              )}
                            </>
                          ) : (
                            <li className="text-muted-foreground">No hay productos</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVerDetalles(orden)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </Button>
                      
                      {orden.estado !== 'entregada' && orden.estado !== 'cancelada' && canUpdateOrderStatus(orden.estado) && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(orden.id!, getNextState(orden.estado))}
                          disabled={isUpdatingStatus}
                        >
                          {getNextStateIcon(orden.estado)}
                          {getNextStateAction(orden.estado)}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de detalles de orden */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
          </DialogHeader>
          
          {selectedOrden && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Orden</p>
                  <p className="font-medium">{selectedOrden.numero_orden}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mesa</p>
                  <p className="font-medium">
                    {selectedOrden.mesa ? `Mesa ${selectedOrden.mesa.numero}` : 'Sin mesa'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {selectedOrden.created_at && format(new Date(selectedOrden.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <EstadoBadge estado={selectedOrden.estado} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pago</p>
                  <p className="font-medium">
                    {selectedOrden.pagado ? 'Pagado' : 'Pendiente'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrency(selectedOrden.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creado por</p>
                  <p className="font-medium">{selectedOrden.user?.name || 'N/A'}</p>
                </div>
              </div>
              
              {selectedOrden.notas && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="p-2 bg-muted rounded">{selectedOrden.notas}</p>
                </div>
              )}
              
              <div className="mb-4">
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
                      {selectedOrden.items && selectedOrden.items.length > 0 ? (
                        selectedOrden.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.producto.nombre}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatCurrency(item.precio_unitario)}</TableCell>
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
              
              <div className="flex justify-between">
                <Button
                  asChild
                  variant="outline"
                >
                  <a href={route('facturacion.boleta', selectedOrden.id)} target="_blank" rel="noopener noreferrer">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir boleta
                  </a>
                </Button>
                
                {selectedOrden.estado !== 'entregada' && selectedOrden.estado !== 'cancelada' && canUpdateOrderStatus(selectedOrden.estado) && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedOrden.id!, getNextState(selectedOrden.estado));
                      setIsDialogOpen(false);
                    }}
                    disabled={isUpdatingStatus}
                  >
                    {getNextStateIcon(selectedOrden.estado)}
                    {getNextStateAction(selectedOrden.estado)}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GestionOrdenes; 