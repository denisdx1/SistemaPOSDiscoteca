import React, { useState, useEffect, useRef } from 'react';
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
  CreditCard,
  Clock as ClockIcon,
  User as UserIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface GestionOrdenesProps {
  ordenes: Orden[];
  bartenders?: { id: number; name: string }[];
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

const GestionOrdenes: React.FC<GestionOrdenesProps> = ({ ordenes: initialOrdenes, bartenders = [] }) => {
  const { auth } = usePage<{ auth: { user: { role: string, id: number } } }>().props;
  const userRole = auth.user.role;
  const userId = auth.user.id;
  const isMesero = userRole === 'mesero';
  const isBartender = userRole === 'bartender';
  
  const [selectedTab, setSelectedTab] = useState('todas');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Estado para almacenar las órdenes que se actualizarán en tiempo real
  const [ordenes, setOrdenes] = useState<Orden[]>(initialOrdenes);
  
  // Cambiar de un solo estado a un objeto que mapea IDs de orden a estados de actualización
  const [updatingOrdersStatus, setUpdatingOrdersStatus] = useState<Record<number, boolean>>({});
  
  // Estado para almacenar los bartenders que están actualizando asignación
  const [updatingBartenderAssignment, setUpdatingBartenderAssignment] = useState<Record<number, boolean>>({});
  
  // Para controlar el polling
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para los cronómetros de órdenes
  const [cronometros, setCronometros] = useState<Record<number, number>>({});
  const cronometrosIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función para actualizar los cronómetros
  const actualizarCronometros = () => {
    setCronometros(prevCronometros => {
      const nuevosEstados = { ...prevCronometros };
      
      ordenes.forEach(orden => {
        // Si la orden está en proceso, incrementar su cronómetro
        if (orden.estado === 'en_proceso') {
          nuevosEstados[orden.id!] = (nuevosEstados[orden.id!] || 0) + 1;
        }
        // Si la orden acaba de entrar en proceso, iniciar su cronómetro
        else if (orden.estado === 'pendiente') {
          nuevosEstados[orden.id!] = 0;
        }
        // Para otros estados, mantener el último valor
      });
      
      return nuevosEstados;
    });
  };
  
  // Formatear segundos a formato mm:ss
  const formatearTiempo = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Configurar cronómetro que se actualiza cada segundo
  useEffect(() => {
    // Inicializar cronómetros para órdenes existentes
    const iniciales: Record<number, number> = {};
    ordenes.forEach(orden => {
      iniciales[orden.id!] = orden.estado === 'en_proceso' ? (cronometros[orden.id!] || 0) : 0;
    });
    setCronometros(iniciales);
    
    // Configurar intervalo para actualizar cronómetros
    cronometrosIntervalRef.current = setInterval(() => {
      actualizarCronometros();
    }, 1000);
    
    return () => {
      if (cronometrosIntervalRef.current) {
        clearInterval(cronometrosIntervalRef.current);
      }
    };
  }, [ordenes]);
  
  // Función para detectar si es un dispositivo móvil
 
  
  // Función para realizar polling manual
  const fetchLatestOrders = () => {
    console.log("🔄 Ejecutando polling para obtener órdenes actualizadas");
    
    axios.get(route('ordenes.gestion.data'))
      .then(response => {
        if (response.data.success) {
          console.log("✅ Datos actualizados recibidos del servidor:", response.data.ordenes.length, "órdenes");
            
          // Asegurar que el campo pagado se establezca correctamente para todas las órdenes
          const ordenesConEstadoPagadoFijo = response.data.ordenes.map((orden: any) => {
            // Convertir items a array si es un objeto
            if (orden.items && !Array.isArray(orden.items) && typeof orden.items === 'object') {
              try {
                orden.items = Object.values(orden.items);
                console.log(`✅ Conversión de items a array para orden ${orden.numero_orden} en polling`);
              } catch (error) {
                console.error(`Error al convertir items a array en polling:`, error);
              }
            }
            
            // Si el campo pagado es undefined o si sabemos que debe estar pagada (basado en el estado)
            if (orden.pagado === undefined || orden.estado === 'en_proceso' || orden.estado === 'lista' || orden.estado === 'entregada') {
              console.log(`📝 Forzando estado pagado=true para orden ${orden.id} (${orden.numero_orden}), estado: ${orden.estado}`);
              return {
                ...orden,
                pagado: true
              };
            }
            return orden;
          });
          
          // Filtrar órdenes si el usuario es bartender (mostrar solo las asignadas a él)
          const ordenesFiltradasPorRol = isBartender 
            ? ordenesConEstadoPagadoFijo.filter((orden: any) => orden.bartender_id === userId)
            : ordenesConEstadoPagadoFijo;
          
          // Si es bartender, hacer logging de las órdenes y sus productos para depuración
          if (isBartender) {
            console.log("🍸 Órdenes filtradas para bartender:", ordenesFiltradasPorRol.length);
            ordenesFiltradasPorRol.forEach((orden: any) => {
              console.log(`Orden #${orden.numero_orden}, items: ${orden.items?.length || 0}, tipo: ${Array.isArray(orden.items) ? 'array' : typeof orden.items}`);
              // Verificar que orden.items sea un array antes de usar forEach
              if (orden.items && Array.isArray(orden.items)) {
                orden.items.forEach((item: any) => {
                  console.log(`  - ${item.cantidad}x ${item.producto.nombre} (${item.producto.categoria?.nombre || 'Sin categoría'})`);
                });
              } else if (orden.items && typeof orden.items === 'object') {
                console.log(`  ⚠️ items es un objeto:`, orden.items);
                // Intenta mostrar las propiedades del objeto
                Object.keys(orden.items).forEach(key => {
                  const item = (orden.items as Record<string, any>)[key];
                  console.log(`  Propiedad ${key}:`, item);
                  if (item && item.producto) {
                    console.log(`    - ${item.cantidad}x ${item.producto.nombre} (${item.producto.categoria?.nombre || 'Sin categoría'})`);
                  }
                });
              } else {
                console.log(`  ⚠️ items no es un array ni objeto:`, typeof orden.items, orden.items);
              }
            });
          }
          
          // Actualizar el estado con los datos procesados y filtrados
          setOrdenes(ordenesFiltradasPorRol);
          
          // Mostrar notificación de éxito
          toast({
            title: "Órdenes actualizadas",
            description: `Se han cargado ${ordenesFiltradasPorRol.length} órdenes`,
          });
          
          console.log("🔄 Órdenes actualizadas:", ordenesFiltradasPorRol.length);
        }
      })
      .catch(error => {
        console.error("❌ Error al actualizar desde el servidor:", error);
        
        // Mostrar notificación de error
        toast({
          title: "Error al actualizar",
          description: "No se pudieron obtener las órdenes. Reintentando...",
          variant: "destructive",
        });
        
        // Programar nueva actualización después de un tiempo
        setTimeout(() => fetchLatestOrders(), 5000);
      });
  };
  
  // Función para configurar el polling automático
  const setupPolling = () => {
    // Limpiar cualquier intervalo existente
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Crear nuevo intervalo (cada 3 segundos en móvil, 7 segundos en escritorio)
    const pollingInterval = isMobileDevice ? 3000 : 7000;
    console.log(`⏱️ Configurando polling automático cada ${pollingInterval/1000} segundos`);
    
    pollingIntervalRef.current = setInterval(() => {
      console.log("⏱️ Ejecutando polling programado");
      fetchLatestOrders();
    }, pollingInterval);
  };
  
  // Función para detener el polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("⏱️ Deteniendo polling automático");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };
  
  // Configurar polling al inicio
  useEffect(() => {
    // Detectar tipo de dispositivo
    
    
    // Configurar polling automático
      setupPolling();
    
    // Limpiar al desmontar
    return () => {
      console.log("🧹 Limpiando temporizadores");
      
      // Detener polling
      stopPolling();
    };
  }, [userRole]); // Solo depender del rol de usuario
  
  // Cuando se inicializa el componente, filtrar las órdenes iniciales si es un bartender
  useEffect(() => {
    // Si el usuario es un bartender, filtrar sus órdenes al inicio
    if (isBartender) {
      // Asegurarnos de no perder ningún producto al filtrar
      const ordenesFiltradas = initialOrdenes
        .filter(orden => orden.bartender_id === userId)
        .map(orden => {
          // Nos aseguramos de mantener TODOS los items sin ningún filtro adicional
          // Si items es un objeto y no un array, lo convertimos a array
          if (orden.items && !Array.isArray(orden.items)) {
            console.log(`⚠️ Orden ${orden.numero_orden}: items es un objeto, convirtiendo a array`);
            // Verificar si es un objeto iterable
            if (typeof orden.items === 'object') {
              try {
                orden.items = Object.values(orden.items);
                console.log(`✅ Conversión exitosa para orden ${orden.numero_orden}, ahora items es un array de ${orden.items.length} elementos`);
              } catch (error) {
                console.error(`Error al convertir items a array:`, error);
              }
            }
          }
          return orden;
        });
      
      setOrdenes(ordenesFiltradas);
      console.log(`🔍 Mostrando solo órdenes para el bartender (ID: ${userId}):`, ordenesFiltradas.length);
      
      // Log detallado para depuración
      ordenesFiltradas.forEach(orden => {
        console.log(`Orden #${orden.numero_orden} - Items: ${orden.items?.length || 0}`);
        // Verificar que orden.items sea un array antes de usar forEach
        if (orden.items && Array.isArray(orden.items)) {
          orden.items.forEach(item => {
            console.log(`  - ${item.cantidad}x ${item.producto.nombre} (${item.producto.categoria?.nombre || 'Sin categoría'})`);
          });
        } else if (orden.items && typeof orden.items === 'object') {
          console.log(`  ⚠️ items es un objeto:`, orden.items);
          // Intenta mostrar las propiedades del objeto
          Object.keys(orden.items).forEach(key => {
            const item = (orden.items as Record<string, any>)[key];
            console.log(`  Propiedad ${key}:`, item);
            if (item && item.producto) {
              console.log(`    - ${item.cantidad}x ${item.producto.nombre} (${item.producto.categoria?.nombre || 'Sin categoría'})`);
            }
          });
        } else {
          console.log(`  ⚠️ items no es un array ni objeto:`, typeof orden.items, orden.items);
        }
      });
    }
  }, []);
  
  // Filtrar órdenes según la pestaña seleccionada
  const filteredOrdenes = selectedTab === 'todas' 
    ? ordenes 
    : ordenes.filter(orden => orden.estado === selectedTab);
  
  const handleVerDetalles = (orden: Orden) => {
    setSelectedOrden(orden);
    setIsDialogOpen(true);
  };
  
  const handleUpdateStatus = async (ordenId: number, nuevoEstado: string) => {
    // Encontrar la orden en el estado actual
    const orden = ordenes.find(o => o.id === ordenId);
    
    // Verificar si la orden está pagada antes de continuar
    if (!orden?.pagado) {
      // Mostrar alerta si la orden no está pagada
      toast({
        title: "Orden no pagada",
        description: "Este pedido aún no ha sido pagado. No se puede cambiar su estado.",
        variant: "destructive",
      });
      return; // Detener la ejecución
    }
    
    // Establecer el estado de carga solo para esta orden específica
    setUpdatingOrdersStatus(prev => ({
      ...prev,
      [ordenId]: true
    }));
    
    try {
      const response = await axios.patch(route('ordenes.update-status', ordenId), {
        estado: nuevoEstado
      });
      
      if (response.data.success) {
        // Actualizar el estado local
        setOrdenes(prevOrdenes => 
          prevOrdenes.map(orden => 
            orden.id === ordenId ? { ...orden, estado: nuevoEstado as "pendiente" | "en_proceso" | "lista" | "entregada" | "cancelada" } : orden
          )
        );
        
        // Mostrar mensaje de éxito con información del estado
        toast({
          title: "Estado actualizado",
          description: `La orden ha sido marcada como "${getEstadoText(nuevoEstado)}"`,
        });
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la orden",
        variant: "destructive",
      });
    } finally {
      // Restablecer el estado de carga para esta orden
      setUpdatingOrdersStatus(prev => ({
        ...prev,
        [ordenId]: false
      }));
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
    // Mostrar toast de carga
    toast({
      title: "Actualizando órdenes",
      description: "Obteniendo las órdenes más recientes...",
    });

    // Reutilizar la función de actualización
    fetchLatestOrders();
  };

  const handleMarkAsPaid = async (ordenId: number) => {
    try {
      const response = await axios.patch(route('ordenes.mark-as-paid', ordenId));
      
      // Obtener los datos de la orden actualizada desde la respuesta si están disponibles
      const ordenActualizada = response.data.orden;
      
      // Mostrar mensaje de éxito
      toast({
        title: "Orden cobrada",
        description: "La orden ha sido marcada como pagada y cambiada a estado pendiente para preparación",
      });
      
      // Si la respuesta incluye la orden actualizada, actualizarla localmente
      if (ordenActualizada) {
        // Actualizar el estado local para reflejar el cambio
        setOrdenes(prevOrdenes => 
          prevOrdenes.map(orden => 
            orden.id === ordenId 
              ? { ...orden, pagado: true, estado: 'pendiente' as 'pendiente' } 
              : orden
          )
        );
        
        console.log("💲 Orden marcada como pagada localmente:", ordenId);
      } else {
        // Si no tenemos los datos actualizados, recargar la página como fallback
        console.log("⚠️ No se recibieron datos actualizados, recargando página");
        setTimeout(() => {
          router.reload();
        }, 300);
      }
      
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

  const handleChangeBartender = async (ordenId: number, bartenderId: string) => {
    // Establecer el estado de carga para esta orden específica
    setUpdatingBartenderAssignment(prev => ({
      ...prev,
      [ordenId]: true
    }));
    
    try {
      const response = await axios.patch(route('ordenes.assign-bartender', ordenId), {
        bartender_id: bartenderId === 'null' ? null : bartenderId
      });
      
      if (response.data.success) {
        // Actualizar el estado local preservando los productos
        fetchLatestOrders(); // Forzar actualización completa desde el servidor
        
        // Mostrar mensaje de éxito
        toast({
          title: "Bartender actualizado",
          description: bartenderId === 'null' 
            ? "Se ha quitado la asignación de bartender" 
            : `Se ha asignado un nuevo bartender a la orden`,
        });
      }
    } catch (error) {
      console.error('Error al asignar bartender:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el bartender a la orden",
        variant: "destructive",
      });
    } finally {
      // Restablecer el estado de carga
      setUpdatingBartenderAssignment(prev => ({
        ...prev,
        [ordenId]: false
      }));
    }
  };

  // Funciones de utilidad para el manejo del tiempo
  const formatHour = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateTimePercentage = (startTimeStr: string, timeLimit: number) => {
    const startTime = new Date(startTimeStr);
    const currentTime = new Date();
    const elapsedMinutes = (currentTime.getTime() - startTime.getTime()) / (1000 * 60);
    return Math.min(100, (elapsedMinutes / timeLimit) * 100);
  };

  const calculateElapsedTime = (startTimeStr: string) => {
    const startTime = new Date(startTimeStr);
    const currentTime = new Date();
    const elapsedMinutes = Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    if (elapsedMinutes < 60) {
      return `${elapsedMinutes} min`;
    } else {
      const hours = Math.floor(elapsedMinutes / 60);
      const mins = elapsedMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <DashboardLayout>
      <Head title="Gestión de Órdenes" />
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestión de Órdenes</h1>
            <p className="text-muted-foreground mt-1">
              Administración de órdenes en preparación
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              className="flex items-center bg-white border shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="todas" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4 bg-gray-50 p-1 border rounded-md dark:bg-gray-800 dark:border-gray-700">
            <TabsTrigger value="todas" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
              Todas ({ordenes.length})
            </TabsTrigger>
            <TabsTrigger value="pendiente" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
              Pendientes ({ordenes.filter(o => o.estado === 'pendiente').length})
            </TabsTrigger>
            <TabsTrigger value="en_proceso" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
              En proceso ({ordenes.filter(o => o.estado === 'en_proceso').length})
            </TabsTrigger>
            <TabsTrigger value="lista" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
              Listas ({ordenes.filter(o => o.estado === 'lista').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-0">
            {filteredOrdenes.length === 0 ? (
              <div className="text-center py-10 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                <p className="text-gray-500 dark:text-gray-400">No hay órdenes {selectedTab !== 'todas' ? `en estado "${getEstadoText(selectedTab)}"` : ''}</p>
              </div>
            ) : (
              <div className={isBartender ? "flex flex-row flex-wrap gap-2 justify-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                {filteredOrdenes.map((orden) => (
                  isBartender ? (
                    <div
                      key={orden.id}
                      className={`relative flex flex-col min-w-[240px] max-w-[300px] w-[320px] rounded-lg border-2 landscape:h-[200px] overflow-hidden shadow-md mx-2 my-3 ${
                        orden.estado === 'pendiente'
                          ? 'border-blue-300 dark:border-blue-900'
                          : orden.estado === 'en_proceso'
                          ? 'border-amber-300 dark:border-amber-900'
                          : orden.estado === 'lista'
                          ? 'border-emerald-300 dark:border-emerald-900'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex flex-row h-full landscape:h-auto">
                        {/* Sección izquierda: usuario y tiempo */}
                        <div className="w-2/5 p-3 bg-gray-50 dark:bg-gray-800 landscape:w-1/3 flex flex-col landscape:justify-center">
                          <div className="flex items-center mb-2 text-sm landscape:mb-1 landscape:text-xs">
                            <UserIcon className="h-4 w-4 mr-1.5 text-gray-400 landscape:h-3 landscape:w-3 landscape:mr-1" />
                            <span className="font-medium text-gray-600 dark:text-gray-200 text-sm landscape:text-xs truncate">
                              {orden.user?.name || "Usuario"}
                            </span>
                          </div>

                          <div className="mb-2 text-sm landscape:mb-1">
                            <div className="flex items-center landscape:text-xs">
                              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400 landscape:h-3 landscape:w-3 landscape:mr-1" />
                              <span className="font-medium text-gray-600 dark:text-gray-300 text-sm landscape:text-xs">
                                {orden.created_at ? formatHour(orden.created_at) : "Hora no disponible"}
                              </span>
                            </div>
                          </div>

                          {orden.estado === 'en_proceso' && orden.hora_inicio && (
                            <div className="mt-1">
                              <div className="flex justify-between text-xs landscape:text-[9px] mb-1">
                                <span>{orden.hora_inicio ? formatHour(orden.hora_inicio.toString()) : ''}</span>
                                <span>{orden.hora_inicio ? calculateElapsedTime(orden.hora_inicio.toString()) : ''}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 landscape:h-1">
                                <div 
                                  className="bg-amber-500 h-1.5 landscape:h-1 rounded-full" 
                                  style={{ 
                                    width: `${calculateTimePercentage(orden.hora_inicio.toString(), 15)}%`,
                                    backgroundColor: calculateTimePercentage(orden.hora_inicio.toString(), 15) > 80 ? '#ef4444' : '#f59e0b'
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sección derecha: productos */}
                        <div className="w-3/5 p-3 landscape:w-2/3 dark:bg-gray-900">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium landscape:text-sm dark:text-gray-200">
                              Productos ({orden.items ? (Array.isArray(orden.items) ? orden.items.length : Object.keys(orden.items).length) : 0})
                            </h4>
                          </div>
                          
                          <ul className="space-y-2 landscape:space-y-1">
                            {orden.items && (
                              (() => {
                                // Manejar el caso cuando items es un array
                                if (Array.isArray(orden.items)) {
                                  return orden.items.slice(0, 6).map((item, index) => (
                                    <li key={index} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-1.5 text-sm landscape:pb-1">
                                      <div className="flex items-center gap-2 landscape:gap-1.5">
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 font-medium text-xs landscape:w-5 landscape:h-5 landscape:text-[11px]">
                                          {item.cantidad}
                                        </span>
                                        <span className="font-medium text-sm landscape:text-xs truncate max-w-[150px] dark:text-gray-200">
                                          {item.producto.nombre}
                                          <span className="text-xs ml-1 text-gray-500 dark:text-gray-400 landscape:text-[10px] landscape:ml-0.5">
                                            ({item.producto.categoria?.nombre || 'Sin categoría'})
                                          </span>
                                        </span>
                                      </div>
                                    </li>
                                  ));
                                } 
                                // Manejar el caso cuando items es un objeto
                                else if (typeof orden.items === 'object') {
                                  const itemsArray = Object.values(orden.items);
                                  return itemsArray.slice(0, 6).map((item: any, index) => (
                                    <li key={index} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-1.5 text-sm landscape:pb-1">
                                      <div className="flex items-center gap-2 landscape:gap-1.5">
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 font-medium text-xs landscape:w-5 landscape:h-5 landscape:text-[11px]">
                                          {item.cantidad}
                                        </span>
                                        <span className="font-medium text-sm landscape:text-xs truncate max-w-[150px] dark:text-gray-200">
                                          {item.producto.nombre}
                                          <span className="text-xs ml-1 text-gray-500 dark:text-gray-400 landscape:text-[10px] landscape:ml-0.5">
                                            ({item.producto.categoria?.nombre || 'Sin categoría'})
                                          </span>
                                        </span>
                                      </div>
                                    </li>
                                  ));
                                } 
                                return <li className="text-gray-500 dark:text-gray-400 text-sm landscape:text-xs">Formato de productos no reconocido</li>;
                              })()
                            ) || (
                              <li className="text-gray-500 dark:text-gray-400 text-sm landscape:text-xs">No hay productos</li>
                            )}
                            {orden.items && (
                              (Array.isArray(orden.items) && orden.items.length > 6) || 
                              (typeof orden.items === 'object' && Object.keys(orden.items).length > 6)
                            ) && (
                              <li className="text-xs text-center text-gray-500 dark:text-gray-400 italic pt-1">
                                {(Array.isArray(orden.items) ? orden.items.length : Object.keys(orden.items).length) - 6} productos más...
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Vista normal para otros roles
                    <Card key={orden.id} className={`
                      overflow-hidden shadow-sm 
                      ${orden.estado === 'pendiente' ? 'border-blue-100 dark:border-blue-800' : ''}
                      ${orden.estado === 'en_proceso' ? 'border-amber-100 dark:border-amber-800' : ''}
                      ${orden.estado === 'lista' ? 'border-emerald-100 dark:border-emerald-800' : ''}
                      ${orden.estado === 'entregada' ? 'border-gray-200 dark:border-gray-700' : ''}
                    `}>
                      <CardHeader className="py-3 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{orden.numero_orden}</div>
                            <div className="text-xs flex items-center gap-1">
                              <span className="text-gray-500 dark:text-gray-400">{orden.created_at && format(new Date(orden.created_at), 'HH:mm', { locale: es })}</span>
                            <EstadoBadge estado={orden.estado} />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {orden.mesa ? `Mesa ${orden.mesa.numero}` : 'Sin mesa'} {orden.created_at && format(new Date(orden.created_at), 'HH:mm', { locale: es })}
                            </div>
                          </div>
                          </div>
                        </CardHeader>
                        
                      <CardContent className="p-0">
                        <div className="p-3 border-b dark:border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Por:</span> <span className="dark:text-gray-300">{orden.user?.name || 'admin'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium dark:text-gray-300">
                                {formatCurrency(orden.total)}
                            </div>
                              <Badge variant={orden.pagado ? "default" : "destructive"} className="text-xs">
                                {orden.pagado ? 'Pagado' : 'No pagado'}
                              </Badge>
                            </div>
                            </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Bartender:</span> 
                          </div>
                            <select 
                              className="text-sm border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" 
                              value={orden.bartender_id || ''}
                              onChange={(e) => {
                                const bartenderId = e.target.value === '' ? null : parseInt(e.target.value);
                                
                                // Establecer el estado de carga para esta orden
                                setUpdatingOrdersStatus(prev => ({
                                  ...prev,
                                  [orden.id!]: true
                                }));
                                
                                // Realizar la llamada a la API
                                axios.patch(route('ordenes.assign-bartender', orden.id), {
                                  bartender_id: bartenderId
                                })
                                .then(response => {
                                  if (response.data.success) {
                                    // Actualizar el estado local
                                    fetchLatestOrders(); // Forzar actualización completa desde el servidor
                                    
                                    // Mostrar mensaje de éxito
                                    toast({
                                      title: "Bartender actualizado",
                                      description: bartenderId ? "Se ha asignado un nuevo bartender" : "Se ha quitado el bartender asignado",
                                    });
                                  }
                                })
                                .catch(error => {
                                  console.error('Error al asignar bartender:', error);
                                  toast({
                                    title: "Error",
                                    description: "No se pudo asignar el bartender",
                                    variant: "destructive",
                                  });
                                })
                                .finally(() => {
                                  // Restablecer el estado de carga
                                  setUpdatingOrdersStatus(prev => ({
                                    ...prev,
                                    [orden.id!]: false
                                  }));
                                });
                              }}
                              disabled={updatingOrdersStatus[orden.id!] || false}
                            >
                              <option value="">Sin asignar</option>
                              {bartenders.map(bartender => (
                                <option key={bartender.id} value={bartender.id.toString()}>
                                  {bartender.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Productos</h4>
                          <ul className="space-y-2">
                            {orden.items && orden.items.length > 0 ? (
                              orden.items.map((item, index) => (
                                <li key={index} className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 text-xs">
                                      {item.cantidad}
                                    </span>
                                    <span className="dark:text-gray-300">
                                      {item.producto.nombre}
                                      {item.producto.categoria && item.producto.categoria.nombre !== 'Tragos' && isBartender && (
                                        <span className="text-xs ml-1 text-gray-500 dark:text-gray-400">
                                          ({item.producto.categoria.nombre})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-500 dark:text-gray-400 text-sm">No hay productos</li>
                              )}
                            </ul>
                          </div>
                        </CardContent>
                        
                      <CardFooter className="px-3 py-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex flex-col space-y-2 w-full">
                          {/* Primera fila de botones: Ver Detalles y Cobrar (2 columnas) */}
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleVerDetalles(orden)}
                              className="w-full text-xs px-2"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Ver Detalles
                            </Button>
                            
                            {!orden.pagado && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => window.location.href = `/facturacion/crear?orden_id=${orden.id}`}
                                className="w-full text-xs px-2 bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                Cobrar
                              </Button>
                            )}
                          </div>
                          
                          {/* Segunda fila: Botón de estado (ocupa todo el ancho) */}
                          {orden.estado !== 'entregada' && orden.estado !== 'cancelada' && canUpdateOrderStatus(orden.estado) && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(orden.id!, getNextState(orden.estado))}
                              disabled={updatingOrdersStatus[orden.id!] || false || !orden.pagado}
                              title={!orden.pagado ? "Este pedido aún no está pagado" : ""}
                              className={`
                                w-full text-xs
                                ${orden.estado === 'pendiente' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                ${orden.estado === 'en_proceso' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                ${orden.estado === 'lista' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                              `}
                            >
                              {getNextStateIcon(orden.estado)}
                              {getNextStateAction(orden.estado)}
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  )
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de detalles de orden */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Detalles de la Orden</DialogTitle>
          </DialogHeader>
          
          {selectedOrden && (
            <div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Número de Orden</p>
                  <p className="font-medium dark:text-gray-200">{selectedOrden.numero_orden}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mesa</p>
                  <p className="font-medium dark:text-gray-200">
                    {selectedOrden.mesa ? `Mesa ${selectedOrden.mesa.numero}` : 'Sin mesa'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium dark:text-gray-200">
                    {selectedOrden.created_at && format(new Date(selectedOrden.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <div className="mt-0.5">
                    <EstadoBadge estado={selectedOrden.estado} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pago</p>
                  <p className="font-medium dark:text-gray-200">
                    {selectedOrden.pagado ? 'Pagado' : 'Pendiente'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-medium dark:text-gray-200">{formatCurrency(selectedOrden.total)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Creado por</p>
                  <p className="font-medium dark:text-gray-200">{selectedOrden.user?.name || 'N/A'}</p>
                </div>
              </div>
              
              {selectedOrden.notas && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="p-1.5 bg-muted rounded text-sm">{selectedOrden.notas}</p>
                </div>
              )}
              
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Productos</p>
                <ScrollArea className="h-[150px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-1.5">Producto</TableHead>
                        <TableHead className="py-1.5">Cant.</TableHead>
                        <TableHead className="py-1.5">Precio</TableHead>
                        <TableHead className="text-right py-1.5">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrden.items && selectedOrden.items.length > 0 ? (
                        selectedOrden.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="py-1.5">{item.producto.nombre}</TableCell>
                            <TableCell className="py-1.5">{item.cantidad}</TableCell>
                            <TableCell className="py-1.5">{formatCurrency(item.precio_unitario)}</TableCell>
                            <TableCell className="text-right py-1.5">{formatCurrency(item.subtotal)}</TableCell>
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
              
              <div className="flex justify-between pt-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <a href={route('facturacion.boleta', selectedOrden.id)} target="_blank" rel="noopener noreferrer">
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir boleta
                  </a>
                </Button>
                
                {selectedOrden.estado !== 'entregada' && selectedOrden.estado !== 'cancelada' && canUpdateOrderStatus(selectedOrden.estado) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(selectedOrden.id!, getNextState(selectedOrden.estado));
                      setIsDialogOpen(false);
                    }}
                    disabled={updatingOrdersStatus[selectedOrden.id!] || false || !selectedOrden.pagado}
                    title={!selectedOrden.pagado ? "Este pedido aún no está pagado" : ""}
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
