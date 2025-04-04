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
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Extiende la interfaz Window para incluir Echo
declare global {
  interface Window {
    Echo: any;
  }
}

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

const GestionOrdenes: React.FC<GestionOrdenesProps> = ({ ordenes: initialOrdenes }) => {
  const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
  const userRole = auth.user.role;
  const isMesero = userRole === 'mesero';
  
  const [selectedTab, setSelectedTab] = useState('todas');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Estado para almacenar las órdenes que se actualizarán en tiempo real
  const [ordenes, setOrdenes] = useState<Orden[]>(initialOrdenes);
  
  // Cambiar de un solo estado a un objeto que mapea IDs de orden a estados de actualización
  const [updatingOrdersStatus, setUpdatingOrdersStatus] = useState<Record<number, boolean>>({});
  
  // Estados para controlar el sistema de WebSockets y polling
  const [websocketConnected, setWebsocketConnected] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const echoInstanceRef = useRef<any>(null);
  
  // Función para detectar si es un dispositivo móvil
  const detectMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || 
                    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));
    
    setIsMobileDevice(isMobile);
    console.log("📱 Detección de dispositivo:", isMobile ? "MÓVIL" : "ESCRITORIO");
    return isMobile;
  };
  
  // Función para realizar polling manual
  const fetchLatestOrders = () => {
    console.log("🔄 Ejecutando polling para obtener órdenes actualizadas");
    
    axios.get(route('ordenes.gestion.data'))
      .then(response => {
        if (response.data.success) {
          console.log("✅ Datos actualizados recibidos del servidor:", response.data.ordenes.length, "órdenes");
            
          // Asegurar que el campo pagado se establezca correctamente para todas las órdenes
          const ordenesConEstadoPagadoFijo = response.data.ordenes.map((orden: any) => {
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
          
          // Actualizar el estado con los datos procesados
          setOrdenes(ordenesConEstadoPagadoFijo);
          
          // Mostrar notificación de éxito
          toast({
            title: "Órdenes actualizadas",
            description: `Se han cargado ${ordenesConEstadoPagadoFijo.length} órdenes`,
          });
          
          console.log("🔄 Órdenes actualizadas con estado de pago forzado:", ordenesConEstadoPagadoFijo.length);
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
        
        // Programar reconexión y nueva actualización
        scheduleReconnect();
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
  
  // Función para configurar la conexión WebSocket
  const setupWebSocketConnection = () => {
    if (!window.Echo) {
      console.error("❌ Echo no está disponible");
      return;
    }
    
    try {
      console.log("📡 Iniciando conexión WebSocket al canal 'ordenes'");
      
      // Almacenar la instancia de Echo para poder desconectarla después
      if (echoInstanceRef.current) {
        echoInstanceRef.current.leaveChannel('ordenes');
      }
      
      // Crear nueva conexión
      const channel = window.Echo.channel('ordenes');
      echoInstanceRef.current = window.Echo;
      
      // Escuchar evento con el punto
      channel.listen('.orden.updated', (data: any) => {
        console.log("🔔 Evento recibido con .orden.updated:", data);
        handleOrdenUpdated(data);
      });
      
      // Escuchar también sin el punto por si acaso
      channel.listen('orden.updated', (data: any) => {
        console.log("🔔 Evento recibido con orden.updated:", data);
        handleOrdenUpdated(data);
      });
      
      // Marcar como conectado
      setWebsocketConnected(true);
      console.log("✅ Conexión WebSocket establecida");
      
      // Si estamos en un dispositivo móvil, configurar también el polling como respaldo
      if (isMobileDevice) {
        setupPolling();
      }
    } catch (error) {
      console.error("❌ Error al configurar WebSocket:", error);
      setWebsocketConnected(false);
      
      // Configurar reconexión automática
      scheduleReconnect();
      
      // Siempre configurar polling como fallback en caso de error
      setupPolling();
    }
  };
  
  // Función para programar una reconexión
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    console.log("🔄 Programando reconexión WebSocket en 5 segundos");
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("🔄 Intentando reconexión WebSocket...");
      setupWebSocketConnection();
    }, 5000);
  };
  
  // Detectar dispositivo y configurar conexiones al inicio
  useEffect(() => {
    // Detectar tipo de dispositivo
    const isMobile = detectMobileDevice();
    
    // Configurar WebSockets
    setupWebSocketConnection();
    
    // Si es móvil, también configurar polling como respaldo
    if (isMobile) {
      setupPolling();
    }
    
    // Limpiar al desmontar
    return () => {
      console.log("🧹 Limpiando conexiones y temporizadores");
      
      // Detener polling
      stopPolling();
      
      // Limpiar timeout de reconexión
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Desconectar WebSocket
      if (echoInstanceRef.current) {
        try {
          echoInstanceRef.current.leaveChannel('ordenes');
          console.log("🔌 Desconexión de WebSocket completada");
        } catch (error) {
          console.error("❌ Error al desconectar WebSocket:", error);
        }
      }
    };
  }, [userRole]); // Solo depender del rol de usuario
  
  // Función para manejar nuevas órdenes o actualizaciones
  const handleOrdenUpdated = (data: any) => {
    // Verificar si hay un objeto data anidado
    console.log("🔍 Analizando datos recibidos:", data);
    
    // Resetear contador de reconexión ya que hemos recibido un evento
    setWebsocketConnected(true);
    
    // Usar data directamente o desde el interior si está anidado
    const ordenData = data.data || data;
    console.log("📦 Datos completos de orden:", ordenData);
    console.log("💰 Estado de pago recibido:", ordenData.pagado, typeof ordenData.pagado);
    
    // Mostrar notificación de actualización
    toast({
      title: "Actualización recibida",
      description: `Se ha detectado un cambio en la orden #${ordenData.id || 'desconocida'}`,
      variant: "default",
    });
    
    // Ignorar completamente los datos del WebSocket y forzar actualización desde el servidor
    console.log("🔄 Ignorando datos WebSocket y forzando actualización completa desde el servidor");
    setTimeout(() => fetchLatestOrders(), 500); // Pequeño delay para evitar múltiples llamadas simultáneas
  };
  
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

  return (
    <DashboardLayout>
      <Head title="Gestión de Órdenes" />
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Órdenes</h1>
            <p className="text-muted-foreground mt-1">
              Administración de órdenes en preparación
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white border rounded-md px-3 py-1.5 shadow-sm">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${websocketConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-sm text-gray-600">{websocketConnected ? 'Conectado' : 'Desconectado'}</span>
              {isMobileDevice && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">Modo móvil</span>}
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              className="flex items-center bg-white border shadow-sm hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="todas" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4 bg-gray-50 p-1 border rounded-md">
            <TabsTrigger value="todas" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Todas ({ordenes.length})
            </TabsTrigger>
            <TabsTrigger value="pendiente" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Pendientes ({ordenes.filter(o => o.estado === 'pendiente').length})
            </TabsTrigger>
            <TabsTrigger value="en_proceso" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              En proceso ({ordenes.filter(o => o.estado === 'en_proceso').length})
            </TabsTrigger>
            <TabsTrigger value="lista" className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Listas ({ordenes.filter(o => o.estado === 'lista').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-0">
            {filteredOrdenes.length === 0 ? (
              <div className="text-center py-10 border rounded-lg bg-gray-50">
                <p className="text-gray-500">No hay órdenes {selectedTab !== 'todas' ? `en estado "${getEstadoText(selectedTab)}"` : ''}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrdenes.map((orden) => (
                  <Card key={orden.id} className={`
                    overflow-hidden shadow-sm 
                    ${orden.estado === 'pendiente' ? 'border-blue-100' : ''}
                    ${orden.estado === 'en_proceso' ? 'border-amber-100' : ''}
                    ${orden.estado === 'lista' ? 'border-emerald-100' : ''}
                    ${orden.estado === 'entregada' ? 'border-gray-200' : ''}
                  `}>
                    {userRole === 'bartender' ? (
                      // Diseño minimalista mejorado para el rol de bartender
                      <>
                        <CardHeader className="pb-2 pt-2 border-b" style={{ background: '#f8f9fa', borderColor: '#e9ecef' }}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-lg font-semibold text-gray-800">{orden.numero_orden}</div>
                              <div className="text-sm text-gray-600">
                                {orden.user?.name || 'Sin asignar'}
                              </div>
                            </div>
                            <Badge variant={orden.pagado ? "default" : "destructive"} className="text-xs px-2 py-1 rounded-md">
                              {orden.pagado ? 'PAGADO' : 'NO PAGADO'}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-0 bg-white">
                          <ul className="divide-y divide-gray-100">
                            {orden.items && orden.items.length > 0 ? (
                              orden.items.map((item, index) => (
                                <li key={index} className="px-4 py-3 flex justify-between items-center">
                                  <div className="font-medium text-gray-700">
                                    <span className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs mr-2">
                                      {item.cantidad}x
                                    </span>
                                    {item.producto.nombre}
                                  </div>
                                  <Button
                                    size="sm"
                                    className={`
                                      ${orden.estado === 'pendiente' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                                      ${orden.estado === 'en_proceso' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                                      ${orden.estado === 'lista' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}
                                      transition-colors duration-200
                                    `}
                                    onClick={() => handleUpdateStatus(orden.id!, getNextState(orden.estado))}
                                    disabled={updatingOrdersStatus[orden.id!] || false || !orden.pagado}
                                    title={!orden.pagado ? "Este pedido aún no está pagado" : ""}
                                  >
                                    {orden.estado === 'pendiente' && 'Preparar'}
                                    {orden.estado === 'en_proceso' && 'Listo'}
                                    {orden.estado === 'lista' && 'Entregar'}
                                  </Button>
                                </li>
                              ))
                            ) : (
                              <li className="px-4 py-3 text-gray-500 text-center">
                                No hay tragos en esta orden
                              </li>
                            )}
                          </ul>
                        </CardContent>
                      </>
                    ) : (
                      // Diseño original para otros roles
                      <>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{orden.numero_orden}</CardTitle>
                              <CardDescription>
                                {orden.mesa ? `Mesa ${orden.mesa.numero}` : 'Sin mesa'}
                                <Badge variant={orden.pagado ? "default" : "destructive"} className="ml-2 text-[10px]">
                                  {orden.pagado ? 'PAGADO' : 'NO PAGADO'}
                                </Badge>
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
                              disabled={updatingOrdersStatus[orden.id!] || false || !orden.pagado}
                              title={!orden.pagado ? "Este pedido aún no está pagado" : ""}
                            >
                              {getNextStateIcon(orden.estado)}
                              {getNextStateAction(orden.estado)}
                            </Button>
                          )}
                        </CardFooter>
                      </>
                    )}
                  </Card>
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
                  <p className="font-medium">{selectedOrden.numero_orden}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mesa</p>
                  <p className="font-medium">
                    {selectedOrden.mesa ? `Mesa ${selectedOrden.mesa.numero}` : 'Sin mesa'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">
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
                  <p className="font-medium">
                    {selectedOrden.pagado ? 'Pagado' : 'Pendiente'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrency(selectedOrden.total)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Creado por</p>
                  <p className="font-medium">{selectedOrden.user?.name || 'N/A'}</p>
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