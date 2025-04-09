import React, { useState, useEffect, useRef } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon, 
  SearchIcon, 
  LayoutGridIcon,
  ListIcon,
  FilterIcon,
  RefreshCcw,
  Coffee
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";

// Componentes
import TablaPiso from "./components/TablaPiso";
import MesaForm from "./components/MesaForm";
import MesaDialog from "./components/MesaDialog";
import DeleteMesaDialog from "./components/DeleteMesaDialog";
import NuevaOrden from "@/pages/mesas/NuevaOrden";

// Importar el tipo Mesa desde el archivo compartido
import { Mesa } from "@/types/mesa";

interface PageProps {
  mesas: {
    data: Mesa[];
    links: any[];
    total: number;
    current_page: number;
    last_page: number;
  };
}

export default function Mesas({ mesas: initialMesas }: PageProps) {
  const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
  const userRole = auth.user.role;
  const isAdmin = userRole === 'administrador';
  
  // Estado para almacenar las mesas que se actualizarán en tiempo real
  const [mesas, setMesas] = useState<PageProps['mesas']>(initialMesas);
  
  // Estados para controlar el sistema de polling
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Indicador visual de actualización
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastPollingTime, setLastPollingTime] = useState<Date | null>(null);
  
  // Estado para el filtro de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el filtro de ubicación
  const [ubicacionFilter, setUbicacionFilter] = useState<string>('');
  
  // Estado para el filtro de estado
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  
  // Estado para el modo de visualización (grid o lista)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Estado para controlar formularios y diálogos
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mesaToEdit, setMesaToEdit] = useState<Mesa | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mesaToDelete, setMesaToDelete] = useState<Mesa | null>(null);
  
  // Ubicaciones disponibles (extraídas de las mesas)
  const ubicaciones = Array.from(new Set(mesas.data.map(mesa => mesa.ubicacion)));
  
  // Función para detectar si es un dispositivo móvil
  const detectMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile =
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        userAgent,
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        userAgent.substr(0, 4),
      );

    setIsMobileDevice(isMobile);
    console.log('📱 Detección de dispositivo:', isMobile ? 'MÓVIL' : 'ESCRITORIO');
    return isMobile;
  };

  // Función para realizar polling manual
  const fetchLatestMesas = () => {
    setIsPolling(true);
    console.log('🔄 Ejecutando polling para obtener mesas actualizadas');

    // Utilizamos router.reload() para obtener los datos más recientes
    router.reload({
      only: ['mesas'],
      onSuccess: (page: any) => {
        if (page.props.mesas) {
          console.log('✅ Datos actualizados recibidos del servidor:', page.props.mesas.data.length, 'mesas');
          setMesas(page.props.mesas as PageProps['mesas']);
          setLastPollingTime(new Date());

          // Mostrar notificación de éxito (solo si no es un polling automático)
          if (!pollingIntervalRef.current) {
            toast({
              title: 'Mesas actualizadas',
              description: `Se han cargado ${page.props.mesas.data.length} mesas`,
            });
          }
        }
        setIsPolling(false);
      },
      onError: (errors) => {
        console.error('❌ Error al actualizar desde el servidor:', errors);

        // Mostrar notificación de error
        toast({
          title: 'Error al actualizar',
          description: 'No se pudieron obtener las mesas. Reintentando...',
          variant: 'destructive',
        });

        // Programar reconexión y nueva actualización
        scheduleReconnect();
        setIsPolling(false);
      }
    });
  };

  // Función para configurar el polling automático
  const setupPolling = () => {
    // Limpiar cualquier intervalo existente
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Crear nuevo intervalo (cada 5 segundos en móvil, 10 segundos en escritorio)
    const pollingInterval = isMobileDevice ? 5000 : 5000;
    console.log(`⏱️ Configurando polling automático cada ${pollingInterval / 1000} segundos`);

    pollingIntervalRef.current = setInterval(() => {
      console.log('⏱️ Ejecutando polling programado');
      fetchLatestMesas();
    }, pollingInterval);
  };

  // Función para detener el polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('⏱️ Deteniendo polling automático');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Programar una reconexión en caso de error
  const scheduleReconnect = () => {
    // Cancelar cualquier reconexión pendiente
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Programar una nueva reconexión después de 5 segundos
    console.log('🔄 Programando reconexión en 5 segundos...');
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Intentando reconexión programada');
      fetchLatestMesas();
    }, 5000);
  };

  // Inicializar todo al cargar el componente
  useEffect(() => {
    console.log('🔄 Inicializando sistema de actualizaciones en tiempo real (polling)');
    detectMobileDevice();
    setupPolling();
    fetchLatestMesas();

    // Limpiar al desmontar
    return () => {
      console.log('🧹 Limpiando recursos');
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Actualizar el polling si cambia el tipo de dispositivo
  useEffect(() => {
    setupPolling();
  }, [isMobileDevice]);

  // Función para refrescar manualmente
  const handleRefresh = () => {
    console.log('🔄 Refrescando manualmente');
    toast({
      title: 'Actualizando...',
      description: 'Obteniendo las últimas mesas',
    });
    fetchLatestMesas();
  };

  // Función para abrir el formulario de creación de mesa
  const handleAddMesa = () => {
    setMesaToEdit(null);
    setIsFormOpen(true);
  };
  
  // Función para abrir el formulario de edición de mesa
  const handleEditMesa = (mesa: Mesa) => {
    setMesaToEdit(mesa);
    setIsFormOpen(true);
    setSelectedMesa(null);
  };
  
  // Función para abrir el diálogo de confirmación de eliminación
  const handleDeleteClick = (mesa: Mesa) => {
    setMesaToDelete(mesa);
    setIsDeleteDialogOpen(true);
    setSelectedMesa(null);
  };
  
  // Función para seleccionar una mesa
  const handleSelectMesa = (mesa: Mesa) => {
    setSelectedMesa(mesa);
  };

  // Filtrar mesas
  const mesasFiltradas = mesas.data.filter(mesa => {
    // Filtro de búsqueda
    const matchesSearch = 
      searchTerm === '' || 
      mesa.numero.toString().includes(searchTerm) || 
      mesa.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mesa.notas && mesa.notas.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro de ubicación
    const matchesUbicacion = ubicacionFilter === '' || mesa.ubicacion === ubicacionFilter;
    
    // Filtro de estado
    const matchesEstado = estadoFilter === '' || mesa.estado === estadoFilter;
    
    return matchesSearch && matchesUbicacion && matchesEstado;
  });
  
  // Función para crear una orden sin mesa
  const handleCreateOrderWithoutMesa = () => {
    window.location.href = '/ordenes/nueva';
  };

  return (
    <>
      <Head title="Mesas" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
              <p className="text-muted-foreground">
                Gestiona las mesas de tu local y su disponibilidad
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="mr-2 text-sm text-muted-foreground hidden md:block">
                {lastPollingTime && (
                  <span>
                    Última actualización: {lastPollingTime.toLocaleTimeString()}
                    {isPolling && <span className="ml-2 animate-pulse text-primary">●</span>}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPolling}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleCreateOrderWithoutMesa}
                className="self-start"
              >
                <Coffee className="mr-2 h-4 w-4" />
                Crear Orden sin Mesa
              </Button>
              {isAdmin && (
                <Button className="self-start" onClick={handleAddMesa}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Agregar Mesa
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Control de Mesas</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={viewMode === 'grid' ? 'bg-muted' : ''}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGridIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={viewMode === 'list' ? 'bg-muted' : ''}
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {mesas.total} mesas registradas
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="col-span-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por número, ubicación o notas..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ubicacion" className="sr-only">Ubicación</Label>
                  <select 
                    id="ubicacion"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={ubicacionFilter}
                    onChange={(e) => setUbicacionFilter(e.target.value)}
                  >
                    <option value="">Todas las ubicaciones</option>
                    {ubicaciones.map((ubicacion) => (
                      <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="estado" className="sr-only">Estado</Label>
                  <select 
                    id="estado"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="disponible">Disponible</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="reservada">Reservada</option>
                  </select>
                </div>
              </div>
              
              {/* Vista Grid - Tabla de Piso */}
              {viewMode === 'grid' && (
                <TablaPiso 
                  mesas={mesasFiltradas} 
                  onSelectMesa={handleSelectMesa} 
                />
              )}
              
              {/* Vista List - Tabla tradicional */}
              {viewMode === 'list' && (
                <div className="border rounded-md">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">Mesa</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Capacidad</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Ubicación</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Estado</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Activa</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Usuario</th>
                          {isAdmin && (
                            <th className="py-3 px-4 text-right text-sm font-medium">Acciones</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mesasFiltradas.length > 0 ? (
                          mesasFiltradas.map((mesa) => (
                            <tr key={mesa.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleSelectMesa(mesa)}>
                              <td className="py-3 px-4 text-sm">Mesa {mesa.numero}</td>
                              <td className="py-3 px-4 text-sm">{mesa.capacidad} personas</td>
                              <td className="py-3 px-4 text-sm">{mesa.ubicacion}</td>
                              <td className="py-3 px-4 text-sm">
                                <Badge 
                                  variant="outline" 
                                  className={`${mesa.estado === 'disponible' ? 'bg-green-100 text-green-800' : mesa.estado === 'ocupada' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}
                                >
                                  <span className="capitalize">{mesa.estado}</span>
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <Badge variant={mesa.activa ? "default" : "outline"}>
                                  {mesa.activa ? "Activa" : "Inactiva"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {mesa.estado === 'ocupada' && mesa.orden?.user ? (
                                  <div className="text-sm">
                                    {mesa.orden.user.name}
                                    <div className="text-xs text-muted-foreground">
                                      {mesa.orden.numero_orden}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="py-3 px-4 text-sm text-right">
                                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={(e) => { e.stopPropagation(); handleEditMesa(mesa); }}>
                                    Editar
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteClick(mesa); }}>
                                    Eliminar
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={isAdmin ? 7 : 6} className="py-6 text-center text-muted-foreground">
                              No se encontraron mesas con los filtros seleccionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Formulario para añadir/editar mesa */}
          {isAdmin && (
            <MesaForm 
              isOpen={isFormOpen} 
              onClose={() => setIsFormOpen(false)} 
              mesa={mesaToEdit} 
            />
          )}
          
          {/* Diálogo de mesa seleccionada */}
          <MesaDialog 
            isOpen={!!selectedMesa} 
            onClose={() => setSelectedMesa(null)} 
            mesa={selectedMesa} 
            onEdit={isAdmin ? handleEditMesa : undefined}
            onDelete={isAdmin ? handleDeleteClick : undefined}
          />
          
          {/* Diálogo de confirmación de eliminación */}
          {isAdmin && (
            <DeleteMesaDialog 
              isOpen={isDeleteDialogOpen} 
              onClose={() => setIsDeleteDialogOpen(false)} 
              mesa={mesaToDelete} 
            />
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
