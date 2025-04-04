import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Tag,
  ChevronsUpDown
} from 'lucide-react';

interface ComboComponente {
  id: number;
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  stock_actual: number;
  disponible: boolean;
}

interface Combo {
  id: number;
  nombre: string;
  precio: number;
  codigo: string;
  categoria: {
    id: number;
    nombre: string;
    color: string;
  } | null;
  componentes: ComboComponente[];
  activo: boolean;
  disponible: boolean;
}

interface CombosIndexProps {
  combos: Combo[];
}

export default function CombosIndex({ combos }: CombosIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filtrar combos según el término de búsqueda
  const filteredCombos = combos.filter(combo => 
    combo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    combo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (combo.categoria && combo.categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Manejar la eliminación de un combo
  const handleDeleteCombo = () => {
    if (!selectedCombo) return;
    
    router.delete(route('menu.combos.destroy', selectedCombo.id), {
      onSuccess: () => {
        toast({
          title: "Combo eliminado",
          description: `El combo "${selectedCombo.nombre}" ha sido eliminado correctamente.`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedCombo(null);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo eliminar el combo. Intente nuevamente.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <DashboardLayout>
      <Head title="Gestión de Combos" />
      
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Combos</h1>
            <p className="text-muted-foreground">
              Administra los combos y sus componentes
            </p>
          </div>
          
          <Link href={route('menu.combos.create')}>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Combo
            </Button>
          </Link>
        </div>
        
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Lista de Combos</CardTitle>
            <CardDescription>
              {filteredCombos.length} {filteredCombos.length === 1 ? 'combo encontrado' : 'combos encontrados'}
            </CardDescription>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, código o categoría..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Disponibilidad</TableHead>
                    <TableHead>Componentes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombos.length > 0 ? (
                    filteredCombos.map((combo) => (
                      <TableRow key={combo.id}>
                        <TableCell className="font-medium">{combo.nombre}</TableCell>
                        <TableCell>{combo.codigo}</TableCell>
                        <TableCell>
                          {combo.categoria ? (
                            <Badge 
                              style={{ backgroundColor: combo.categoria.color + '20', color: combo.categoria.color, borderColor: combo.categoria.color + '30' }}
                              variant="outline"
                            >
                              {combo.categoria.nombre}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin categoría</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">S/ {Number(combo.precio).toFixed(2)}</TableCell>
                        <TableCell>
                          {combo.activo ? (
                            <Badge variant="default">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {combo.disponible ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                              Sin stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCombo(combo);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            {combo.componentes.length} items
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={route('menu.combos.edit', combo.id)}>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedCombo(combo);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No se encontraron combos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para ver detalles del combo */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Combo</DialogTitle>
            <DialogDescription>
              Información detallada sobre el combo y sus componentes
            </DialogDescription>
          </DialogHeader>
          
          {selectedCombo && (
            <>
              <div className="grid gap-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                    <p className="font-medium">{selectedCombo.nombre}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Código</h3>
                    <p>{selectedCombo.codigo}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Categoría</h3>
                    <p>
                      {selectedCombo.categoria ? selectedCombo.categoria.nombre : 'Sin categoría'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Precio</h3>
                    <p className="font-medium">S/ {Number(selectedCombo.precio).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Componentes</h3>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCombo.componentes.map((componente) => (
                        <TableRow key={componente.id}>
                          <TableCell className="font-medium">{componente.nombre}</TableCell>
                          <TableCell className="text-right">{componente.cantidad}</TableCell>
                          <TableCell className="text-right">S/ {Number(componente.precio_unitario).toFixed(2)}</TableCell>
                          <TableCell className="text-right">S/ {(componente.cantidad * componente.precio_unitario).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {componente.disponible ? (
                              <span className="text-green-600">
                                {componente.stock_actual} <span className="text-xs">(Suficiente)</span>
                              </span>
                            ) : (
                              <span className="text-red-600">
                                {componente.stock_actual} <span className="text-xs">(Insuficiente)</span>
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Cerrar
                </Button>
                <Link href={route('menu.combos.edit', selectedCombo.id)}>
                  <Button variant="default">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Combo
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el combo 
              {selectedCombo && <strong> "{selectedCombo.nombre}"</strong>} y todos sus componentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCombo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
} 