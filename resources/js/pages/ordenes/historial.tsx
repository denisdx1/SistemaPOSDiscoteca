import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Orden } from '@/types/orden';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Eye,
  FileText,
  Printer,
  Filter,
  Check,
  X,
  Clock,
  Activity,
  ShoppingBag,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface HistorialProps {
  ordenes: {
    data: Orden[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
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

const PagadoBadge = ({ pagado }: { pagado: boolean }) => (
  pagado ? (
    <Badge variant="default" className="flex items-center">
      <Check className="w-3 h-3 mr-1" />
      Pagado
    </Badge>
  ) : (
    <Badge variant="outline" className="flex items-center">
      <Clock className="w-3 h-3 mr-1" />
      Pendiente
    </Badge>
  )
);

const Historial: React.FC<HistorialProps> = ({ ordenes: initialOrdenes }) => {
  const [ordenes, setOrdenes] = useState(initialOrdenes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ordenToDelete, setOrdenToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const handleSearch = () => {
    const params: Record<string, any> = { page: 1 };
    
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    if (selectedEstado && selectedEstado !== 'todos') {
      params.estado = selectedEstado;
    }
    
    router.get(route('ordenes.history'), params, {
      preserveState: true,
      only: ['ordenes'],
      onSuccess: (page) => {
        setOrdenes(page.props.ordenes as typeof initialOrdenes);
      }
    });
  };
  
  const handlePageChange = (page: number) => {
    const params: Record<string, any> = { page };
    
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    if (selectedEstado && selectedEstado !== 'todos') {
      params.estado = selectedEstado;
    }
    
    router.get(route('ordenes.history'), params, {
      preserveState: true,
      only: ['ordenes'],
      onSuccess: (page) => {
        setOrdenes(page.props.ordenes as typeof initialOrdenes);
      }
    });
  };
  
  const handleVerDetalles = (orden: Orden) => {
    setSelectedOrden(orden);
    setIsDialogOpen(true);
  };
  
  const handleUpdateStatus = async (ordenId: number, nuevoEstado: string) => {
    try {
      await axios.patch(route('ordenes.update-status', ordenId), {
        estado: nuevoEstado
      });
      
      // Actualizar la lista de órdenes
      router.reload({ only: ['ordenes'] });
      
      // Si es la orden seleccionada, actualizarla también
      if (selectedOrden && selectedOrden.id === ordenId) {
        setSelectedOrden({
          ...selectedOrden,
          estado: nuevoEstado as any
        });
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    }
  };
  
  const handleMarkAsPaid = async (ordenId: number) => {
    try {
      await axios.patch(route('ordenes.mark-as-paid', ordenId));
      
      // Actualizar la lista de órdenes
      router.reload({ only: ['ordenes'] });
      
      // Si es la orden seleccionada, actualizarla también
      if (selectedOrden && selectedOrden.id === ordenId) {
        setSelectedOrden({
          ...selectedOrden,
          pagado: true
        });
      }
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
    }
  };

  const openDeleteConfirmation = (ordenId: number) => {
    setOrdenToDelete(ordenId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteOrden = async () => {
    if (!ordenToDelete) return;
    
    setIsDeleting(true);
    
    try {
      console.log(`Intentando eliminar orden ID: ${ordenToDelete}`);
      const response = await axios.delete(route('ordenes.destroy', ordenToDelete));
      
      if (response.data.success) {
        // Cerrar el diálogo de confirmación
        setIsDeleteDialogOpen(false);
        
        // Actualizar localmente el estado de órdenes para mostrar el cambio inmediatamente
        setOrdenes({
          ...ordenes,
          data: ordenes.data.filter(orden => orden.id !== ordenToDelete),
          total: ordenes.total - 1
        });
        
        // Si es la orden seleccionada, cerrar el diálogo de detalles
        if (selectedOrden && selectedOrden.id === ordenToDelete) {
          setIsDialogOpen(false);
        }
        
        // Mostrar mensaje de éxito con toast
        toast({
          title: "Orden eliminada",
          description: "La orden ha sido eliminada permanentemente",
          variant: "default",
        });
      } else {
        throw new Error(response.data.message || 'Error desconocido al eliminar la orden');
      }
    } catch (error: any) {
      console.error('Error al eliminar la orden:', error);
      
      let errorMessage = 'No se pudo eliminar la orden. Inténtalo nuevamente.';
      
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        errorMessage = error.response.data.message || 'Error en la respuesta del servidor';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar error con toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Historial de Órdenes" />
      
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Historial de Órdenes</h1>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/3">
                <Input
                  placeholder="Buscar por número o mesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="w-full sm:w-1/3">
                <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="lista">Lista</SelectItem>
                    <SelectItem value="entregada">Entregada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Número</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No se encontraron órdenes
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordenes.data.map((orden) => (
                      <TableRow key={orden.id}>
                        <TableCell className="font-medium">{orden.numero_orden}</TableCell>
                        <TableCell>
                          {orden.mesa ? `Mesa ${orden.mesa.numero}` : 'Sin mesa'}
                        </TableCell>
                        <TableCell>
                          {orden.created_at && format(new Date(orden.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <EstadoBadge estado={orden.estado} />
                        </TableCell>
                        <TableCell>
                          <PagadoBadge pagado={orden.pagado} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(orden.total)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerDetalles(orden)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {!orden.pagado && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsPaid(orden.id!)}
                                title="Marcar como pagada"
                                className="text-green-600"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {orden.estado === 'cancelada' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  openDeleteConfirmation(orden.id!);
                                }}
                                title="Eliminar orden"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Ver boleta"
                            >
                              <a href={route('facturacion.boleta', orden.id)} target="_blank" rel="noopener noreferrer">
                                <Printer className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginación */}
            {ordenes.last_page > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {ordenes.data.length} de {ordenes.total} órdenes
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={ordenes.current_page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(ordenes.current_page - 1)}
                    disabled={ordenes.current_page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm">
                    Página {ordenes.current_page} de {ordenes.last_page}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(ordenes.current_page + 1)}
                    disabled={ordenes.current_page === ordenes.last_page}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(ordenes.last_page)}
                    disabled={ordenes.current_page === ordenes.last_page}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
                  <div className="mt-1">
                    <PagadoBadge pagado={selectedOrden.pagado} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrency(selectedOrden.total)}</p>
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
                      {selectedOrden.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.producto.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{formatCurrency(item.precio_unitario)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  {!selectedOrden.pagado && (
                    <Button
                      onClick={() => handleMarkAsPaid(selectedOrden.id!)}
                      variant="outline"
                      className="flex items-center"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como pagada
                    </Button>
                  )}
                  
                  {selectedOrden.estado === 'cancelada' && (
                    <Button
                      onClick={() => {
                        openDeleteConfirmation(selectedOrden.id!);
                      }}
                      variant="destructive"
                      className="flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar orden
                    </Button>
                  )}
                  
                  <Button
                    asChild
                    variant="outline"
                  >
                    <a href={route('facturacion.boleta', selectedOrden.id)} target="_blank" rel="noopener noreferrer">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir boleta
                    </a>
                  </Button>
                </div>
                
                {/* Botones de cambio de estado */}
                {(['pendiente', 'en_proceso', 'lista'].includes(selectedOrden.estado)) && (
                  <Select 
                    value={selectedOrden.estado} 
                    onValueChange={(value) => handleUpdateStatus(selectedOrden.id!, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_proceso">En proceso</SelectItem>
                      <SelectItem value="lista">Lista</SelectItem>
                      <SelectItem value="entregada">Entregada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmación para eliminar orden */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta orden permanentemente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Al eliminar esta orden, se borrarán todos sus detalles y registros asociados de la base de datos.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrden}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Historial; 