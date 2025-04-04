import React from 'react';
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryStockTable } from './components/InventoryStockTable';
import MovementHistoryTable from './components/MovementHistoryTable';
import { Button } from '@/components/ui/button';
import { InventoryMovementForm } from './components/InventoryMovementForm';
import ProductForm from './components/ProductForm';
import { ArrowUpIcon, ArrowDownIcon, ArrowDownUp, SearchIcon, PlusIcon, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import DeleteDialog from '@/components/DeleteDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Inventario() {
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [searchQuery, setSearchQuery] = useState('');
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  const handleOpenMovementForm = (type: 'entrada' | 'salida' | 'ajuste') => {
    setMovementType(type);
    setIsMovementFormOpen(true);
  };

  const handleCloseMovementForm = () => {
    setIsMovementFormOpen(false);
  };

  const handleMovementSuccess = () => {
    window.location.reload();
  };

  const handleOpenProductForm = () => {
    setProductToEdit(null); // Reset product to edit when creating new
    setIsProductFormOpen(true);
  };

  const handleCloseProductForm = () => {
    setIsProductFormOpen(false);
    setProductToEdit(null); // Clear product to edit when closing
  };

  const handleProductSuccess = () => {
    window.location.reload();
  };

  // Handlers for product deletion
  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      router.delete(`/menu/productos/${productToDelete.id}`, {
        onSuccess: () => {
          toast({
            title: "Producto eliminado",
            description: "El producto ha sido eliminado correctamente.",
          });
          setIsDeleteDialogOpen(false);
          setProductToDelete(null);
          window.location.reload();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "No se pudo eliminar el producto.",
            variant: "destructive"
          });
        }
      });
    }
  };

  return (
    <>
      <Head title="Inventario" />

      <div className="space-y-6 px-2 sm:px-4">
        {/* Título y botones - layout móvil optimizado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Gestión de Inventario</h1>
          
          {/* Botones en pantallas medianas y grandes */}
          <div className="hidden sm:flex gap-2">
            <Button 
              variant="outline" 
              className="gap-1"
              onClick={() => handleOpenMovementForm('entrada')}
            >
              <ArrowDownIcon className="h-4 w-4" />
              <span>Entrada</span>
            </Button>
            <Button 
              variant="outline" 
              className="gap-1"
              onClick={() => handleOpenMovementForm('salida')}
            >
              <ArrowUpIcon className="h-4 w-4" />
              <span>Salida</span>
            </Button>
            <Button 
              variant="outline" 
              className="gap-1"
              onClick={() => handleOpenMovementForm('ajuste')}
            >
              <ArrowDownUp className="h-4 w-4" />
              <span>Ajuste</span>
            </Button>
            <Button 
              variant="default" 
              className="gap-1"
              onClick={handleOpenProductForm}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </Button>
          </div>
          
          {/* Menú desplegable para pantallas móviles */}
          <div className="flex sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between items-center">
                  <span>Acciones</span>
                  <Menu className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => handleOpenMovementForm('entrada')}>
                  <ArrowDownIcon className="h-4 w-4 mr-2 text-green-500" />
                  <span>Registrar Entrada</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenMovementForm('salida')}>
                  <ArrowUpIcon className="h-4 w-4 mr-2 text-red-500" />
                  <span>Registrar Salida</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenMovementForm('ajuste')}>
                  <ArrowDownUp className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Registrar Ajuste</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenProductForm}>
                  <PlusIcon className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Nuevo Producto</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg">Control de Inventario</CardTitle>
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="stock" className="w-full">
              <TabsList className="mb-4 w-full grid grid-cols-2">
                <TabsTrigger value="stock">Stock Actual</TabsTrigger>
                <TabsTrigger value="movements">Historial</TabsTrigger>
              </TabsList>
              <TabsContent value="stock" className="overflow-x-auto">
                <InventoryStockTable 
                  searchQuery={searchQuery}
                  onEditProduct={(product) => {
                    setProductToEdit(product);
                    setIsProductFormOpen(true);
                  }}  
                  onDeleteProduct={(product) => handleDeleteClick(product)}
                />
              </TabsContent>
              <TabsContent value="movements" className="overflow-x-auto">
                <MovementHistoryTable searchQuery={searchQuery} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de movimiento de inventario */}
      <InventoryMovementForm
        isOpen={isMovementFormOpen}
        onClose={handleCloseMovementForm}
        onSuccess={handleMovementSuccess}
        type={movementType}
      />

      {/* Formulario de producto */}
      <ProductForm
        isOpen={isProductFormOpen}
        onClose={handleCloseProductForm}
        onSuccess={handleProductSuccess}
        productToEdit={productToEdit}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Producto"
        description={`¿Estás seguro de que deseas eliminar el producto ${productToDelete?.nombre}? Esta acción no se puede deshacer.`}
      />
    </>
  );
}

Inventario.layout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
