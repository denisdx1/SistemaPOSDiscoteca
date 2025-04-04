import React, { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
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
  FilterIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

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

export default function Mesas({ mesas }: PageProps) {
  const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
  const userRole = auth.user.role;
  const isAdmin = userRole === 'administrador';
  
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
            {isAdmin && (
              <Button className="self-start" onClick={handleAddMesa}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Agregar Mesa
              </Button>
            )}
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
